/**
 * Faculty — Student Profile · Drilldown intelligence tabs.
 * Subject Intelligence · Subject Drilldown (chapters) · Chapter Intelligence
 * (topics) · Question Analysis (filters + detail). Shared Breadcrumb helper.
 * Fed by the 360 bundle; topic/chapter drilldown uses the ground-level
 * question-intelligence helpers (canonical attempt rows — no second engine).
 */
import { useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight, FileText, X } from 'lucide-react'
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import {
  computeSubjectDiagnostics,
  computeChapterDrilldown,
  generateInterventionRecommendation,
} from '@/intelligence/faculty/engine/ground-level-intelligence'
import { EvidenceQuestionCard, InterventionRecommendationCard, QuestionDetailDialog } from './student-evidence'

function Breadcrumb({ items, onNavigate }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-slate-50 px-3 py-2 text-[11.5px] font-semibold dark:bg-slate-800/60">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
          {item.onClick ? (
            <button onClick={item.onClick} className="text-indigo-600 hover:underline dark:text-indigo-400">{item.label}</button>
          ) : (
            <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
      {items.length > 1 && (
        <button onClick={() => onNavigate?.()} className="ml-2 flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300">
          <X className="h-2.5 w-2.5" /> Clear
        </button>
      )}
    </div>
  )
}

function SubjectIntelligencePanel({ s360, domain, onSelectSubject }) {
  const questionRows = useMemo(() => {
    return (s360?.question?.rows ?? []).filter((r) =>
      domain === 'Competitive' ? r.examMode === 'Competitive' : r.examMode === 'University'
    )
  }, [s360, domain])

  const subjects = useMemo(() => {
    const pools = domain === 'Competitive'
      ? [...(s360?.subjects?.competitive?.JEE ?? []), ...(s360?.subjects?.competitive?.NEET ?? [])]
      : s360?.subjects?.university ?? []
    return computeSubjectDiagnostics(questionRows, pools)
  }, [s360, domain, questionRows])

  if (!subjects.length) return <Card className="p-5"><p className="py-8 text-center text-xs text-slate-400">No {domain} attempts yet.</p></Card>

  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Subject Intelligence — {domain}</h3>
      <p className="mt-0.5 text-xs text-slate-400">Which subject is causing the problem? Click to drill into chapters.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s) => (
          <button key={s.subject} onClick={() => onSelectSubject(s.subject)}
            className="w-full rounded-2xl border border-slate-200/70 p-4 text-left transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:hover:border-indigo-500/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">{s.subject}</p>
              <Badge variant={s.accuracy >= 75 ? 'success' : s.accuracy >= 60 ? 'warning' : 'danger'} size="sm">
                {s.accuracy >= 75 ? 'Strong' : s.accuracy >= 60 ? 'Developing' : 'Needs Attention'}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[15px] font-bold text-slate-900 dark:text-white">{s.accuracy}%</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Accuracy</p></div>
              <div><p className="text-[15px] font-bold text-slate-900 dark:text-white">{s.attemptRate}%</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Attempt</p></div>
              <div><p className="text-[15px] font-bold text-slate-900 dark:text-white">{s.avgTime}s</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg time</p></div>
            </div>
            {/* Diagnostic info */}
            {s.diagnostics?.weakChapters?.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Weak Chapters</p>
                <div className="mt-1 space-y-0.5">
                  {s.diagnostics.weakChapters.map((c) => (
                    <p key={c.chapter} className="text-[11px] text-slate-600 dark:text-slate-300">{c.chapter} — <span className="font-bold text-rose-500">{c.accuracy}%</span></p>
                  ))}
                </div>
              </div>
            )}
            {s.diagnostics?.strongChapters?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Strongest</p>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">{s.diagnostics.strongChapters[0].chapter} — <span className="font-bold text-emerald-600">{s.diagnostics.strongChapters[0].accuracy}%</span></p>
              </div>
            )}
            {s.diagnostics?.mostConcerning && (
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Most Concerning</p>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">{s.diagnostics.mostConcerning.chapter}</p>
              </div>
            )}
            <p className="mt-3 text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">View Chapter Intelligence →</p>
          </button>
        ))}
      </div>
    </Card>
  )
}

function SubjectDrilldownPanel({ s360, domain, subject, onSelectChapter, onBack }) {
  const questionRows = useMemo(() => {
    return (s360?.question?.rows ?? []).filter((r) =>
      r.subject === subject && (domain === 'Competitive' ? r.examMode === 'Competitive' : r.examMode === 'University')
    )
  }, [s360, domain, subject])

  const chapters = useMemo(() => {
    const chapterMap = new Map()
    questionRows.forEach((r) => {
      const ch = r.chapter ?? 'General'
      if (!chapterMap.has(ch)) chapterMap.set(ch, { chapter: ch, correct: 0, incorrect: 0, skipped: 0, attempted: 0, questions: 0, time: 0, answerChanges: 0 })
      const c = chapterMap.get(ch)
      c.questions += 1
      if (r.status === 'Correct') c.correct += 1
      else if (r.status === 'Skipped') c.skipped += 1
      else c.incorrect += 1
      if (r.status !== 'Skipped') c.attempted += 1
      c.time += r.timeSpent ?? 0
      c.answerChanges += r.answerChanges ?? 0
    })
    return [...chapterMap.values()].map((c) => ({
      ...c,
      accuracy: c.attempted ? Math.round((c.correct / c.attempted) * 100) : 0,
      avgTime: c.attempted ? Math.round(c.time / c.attempted) : 0,
    })).sort((a, b) => a.accuracy - b.accuracy)
  }, [questionRows])

  const summary = useMemo(() => {
    const attempted = questionRows.filter((r) => r.status !== 'Skipped').length
    const correct = questionRows.filter((r) => r.status === 'Correct').length
    return {
      accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
      attemptRate: questionRows.length ? Math.round((attempted / questionRows.length) * 100) : 0,
      avgTime: attempted ? Math.round(questionRows.filter((r) => r.timeSpent > 0).reduce((s, r) => s + r.timeSpent, 0) / attempted) : 0,
      correct,
      incorrect: questionRows.filter((r) => r.status === 'Incorrect').length,
      skipped: questionRows.filter((r) => r.status === 'Skipped').length,
      questions: questionRows.length,
    }
  }, [questionRows])

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="rounded-lg border border-slate-200 p-1.5 hover:border-indigo-300 dark:border-slate-700">
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
        </button>
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{subject} Intelligence</h3>
          <p className="text-xs text-slate-400">Which chapter is causing the problem?</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Accuracy', value: `${summary.accuracy}%`, color: summary.accuracy >= 75 ? 'text-emerald-600' : summary.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500' },
          { label: 'Attempt Rate', value: `${summary.attemptRate}%` },
          { label: 'Avg Time', value: `${summary.avgTime}s` },
          { label: 'Correct', value: String(summary.correct), color: 'text-emerald-600' },
          { label: 'Incorrect', value: String(summary.incorrect), color: 'text-rose-500' },
          { label: 'Skipped', value: String(summary.skipped), color: 'text-amber-500' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
            <p className={`text-[14px] font-bold ${m.color ?? 'text-slate-800 dark:text-white'}`}>{m.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>

      <h4 className="mt-5 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chapter Performance</h4>
      <div className="mt-2 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {chapters.map((c) => (
          <button key={c.chapter} onClick={() => onSelectChapter(c.chapter)}
            className="w-full rounded-2xl border border-slate-200/70 p-3.5 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-indigo-500/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{c.chapter}</p>
              <span className={`text-[13px] font-bold ${c.accuracy >= 75 ? 'text-emerald-600' : c.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>{c.accuracy}%</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
              <span className="text-slate-500">{c.questions} questions</span>
              <span className="text-rose-500">{c.incorrect} incorrect</span>
              <span className="text-amber-500">{c.skipped} skipped</span>
              <span className="text-slate-500">{c.avgTime}s avg</span>
            </div>
            <p className="mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">View Topics →</p>
          </button>
        ))}
      </div>
    </Card>
  )
}

function ChapterIntelligencePanel({ s360, domain, context, onNavigate }) {
  const [selectedChapter, setSelectedChapter] = useState(context?.chapter ?? null)
  const [selectedTopic, setSelectedTopic] = useState(context?.topic ?? null)

  const questionRows = useMemo(() => {
    const rows = (s360?.question?.rows ?? []).filter((r) =>
      domain === 'Competitive' ? r.examMode === 'Competitive' : r.examMode === 'University'
    )
    if (context?.subject) return rows.filter((r) => r.subject === context.subject)
    return rows
  }, [s360, domain, context])

  const chapters = useMemo(() => {
    const chapterMap = new Map()
    questionRows.forEach((r) => {
      const ch = r.chapter ?? 'General'
      if (!chapterMap.has(ch)) chapterMap.set(ch, { chapter: ch, subject: r.subject, correct: 0, incorrect: 0, skipped: 0, attempted: 0, questions: 0, time: 0 })
      const c = chapterMap.get(ch)
      c.questions += 1
      if (r.status === 'Correct') c.correct += 1
      else if (r.status === 'Skipped') c.skipped += 1
      else c.incorrect += 1
      if (r.status !== 'Skipped') c.attempted += 1
      c.time += r.timeSpent ?? 0
    })
    return [...chapterMap.values()].map((c) => ({
      ...c,
      accuracy: c.attempted ? Math.round((c.correct / c.attempted) * 100) : 0,
      avgTime: c.attempted ? Math.round(c.time / c.attempted) : 0,
    })).sort((a, b) => a.accuracy - b.accuracy)
  }, [questionRows])

  const chapterDrilldown = useMemo(() => {
    if (!selectedChapter) return null
    return computeChapterDrilldown(questionRows, context?.subject ?? chapters.find((c) => c.chapter === selectedChapter)?.subject, selectedChapter)
  }, [questionRows, selectedChapter, context, chapters])

  const topicRows = useMemo(() => {
    if (!selectedTopic || !selectedChapter) return []
    return questionRows.filter((r) => r.chapter === selectedChapter && (r.topic ?? 'General') === selectedTopic)
  }, [questionRows, selectedChapter, selectedTopic])

  const intervention = useMemo(() => {
    if (!topicRows.length) return null
    return generateInterventionRecommendation(topicRows, {
      subject: context?.subject ?? topicRows[0]?.subject,
      chapter: selectedChapter,
      topic: selectedTopic,
    })
  }, [topicRows, selectedChapter, selectedTopic, context])

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: context?.subject ?? 'All Subjects', onClick: () => { setSelectedChapter(null); setSelectedTopic(null) } }]
    if (selectedChapter) items.push({ label: selectedChapter, onClick: () => setSelectedTopic(null) })
    if (selectedTopic) items.push({ label: selectedTopic })
    return items
  }, [context, selectedChapter, selectedTopic])

  if (!questionRows.length) return <Card className="p-5"><p className="py-8 text-center text-xs text-slate-400">No chapter data yet.</p></Card>

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Chapter Intelligence — {context?.subject ?? domain}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {!selectedChapter ? 'Which chapter is causing the problem?' : !selectedTopic ? 'Which topic is causing the problem?' : 'Which concept is causing the problem?'}
          </p>
        </div>
      </div>

      <Breadcrumb items={breadcrumbItems} onNavigate={() => { setSelectedChapter(null); setSelectedTopic(null) }} />

      {/* Chapter list */}
      {!selectedChapter && (
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {chapters.map((c) => (
            <button key={c.chapter} onClick={() => setSelectedChapter(c.chapter)}
              className="w-full rounded-2xl border border-slate-200/70 p-3.5 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-indigo-500/40">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{c.chapter}</p>
                <span className={`text-[13px] font-bold ${c.accuracy >= 75 ? 'text-emerald-600' : c.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>{c.accuracy}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
                <span className="text-slate-500">{c.questions} questions</span>
                <span className="text-rose-500">{c.incorrect} incorrect</span>
                <span className="text-amber-500">{c.skipped} skipped</span>
                <span className="text-slate-500">{c.avgTime}s avg</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Topic list (when chapter selected) */}
      {selectedChapter && !selectedTopic && chapterDrilldown && (
        <div>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Accuracy', value: `${chapterDrilldown.summary.accuracy}%`, color: chapterDrilldown.summary.accuracy >= 75 ? 'text-emerald-600' : chapterDrilldown.summary.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500' },
              { label: 'Questions', value: String(chapterDrilldown.summary.questions) },
              { label: 'Incorrect', value: String(chapterDrilldown.summary.incorrect), color: 'text-rose-500' },
              { label: 'Avg Time', value: `${chapterDrilldown.summary.avgTime}s` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                <p className={`text-[13px] font-bold ${m.color ?? 'text-slate-800 dark:text-white'}`}>{m.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Topic Intelligence</h4>
          <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {chapterDrilldown.topics.map((t) => (
              <button key={t.topic} onClick={() => setSelectedTopic(t.topic)}
                className="w-full rounded-2xl border border-slate-200/70 p-3 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-indigo-500/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{t.topic}</p>
                  <span className={`text-[12px] font-bold ${t.accuracy >= 75 ? 'text-emerald-600' : t.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>{t.accuracy}%</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-slate-500">{t.questions} questions</span>
                  <span className="text-rose-500">{t.incorrect} incorrect</span>
                  <span className="text-slate-500">{t.avgTime}s avg</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Concept / question level (when topic selected) */}
      {selectedTopic && topicRows.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Accuracy', value: `${topicRows.filter((r) => r.status !== 'Skipped').length ? Math.round((topicRows.filter((r) => r.status === 'Correct').length / topicRows.filter((r) => r.status !== 'Skipped').length) * 100) : 0}%` },
              { label: 'Questions', value: String(topicRows.length) },
              { label: 'Incorrect', value: String(topicRows.filter((r) => r.status === 'Incorrect').length), color: 'text-rose-500' },
              { label: 'Avg Time', value: `${topicRows.filter((r) => r.timeSpent > 0).length ? Math.round(topicRows.filter((r) => r.timeSpent > 0).reduce((s, r) => s + r.timeSpent, 0) / topicRows.filter((r) => r.timeSpent > 0).length) : 0}s` },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                <p className={`text-[13px] font-bold ${m.color ?? 'text-slate-800 dark:text-white'}`}>{m.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Evidence Questions */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evidence Questions</h4>
            <div className="mt-2 space-y-2">
              {topicRows.map((r, i) => (
                <EvidenceQuestionCard key={`${r.attemptId}-${r.id}-${i}`} row={r} allRows={questionRows} />
              ))}
            </div>
          </div>

          {/* AI Intervention Recommendation */}
          {intervention && intervention.issueType !== 'Strong Performance' && (
            <InterventionRecommendationCard intervention={intervention} />
          )}
        </div>
      )}
    </Card>
  )
}

function QuestionAnalysisPanel({ s360, domain, context }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [subjectFilter, setSubjectFilter] = useState(context?.subject ?? 'All')
  const [chapterFilter, setChapterFilter] = useState(context?.chapter ?? 'All')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [showDetail, setShowDetail] = useState(null)

  const allRows = useMemo(() => {
    return (s360?.question?.rows ?? []).filter((r) =>
      domain === 'Competitive' ? r.examMode === 'Competitive' : r.examMode === 'University'
    )
  }, [s360, domain])

  const filteredRows = useMemo(() => {
    let rows = allRows
    if (statusFilter !== 'All') {
      if (statusFilter === 'Slow') rows = rows.filter((r) => (r.timeSpent ?? 0) >= 90)
      else if (statusFilter === 'Answer Changed') rows = rows.filter((r) => (r.answerChanges ?? 0) >= 1)
      else if (statusFilter === 'Revisited') rows = rows.filter((r) => (r.revisits ?? 0) >= 1)
      else if (statusFilter === 'Marked for Review') rows = rows.filter((r) => r.markedForReview)
      else rows = rows.filter((r) => r.status === statusFilter)
    }
    if (subjectFilter !== 'All') rows = rows.filter((r) => r.subject === subjectFilter)
    if (chapterFilter !== 'All') rows = rows.filter((r) => r.chapter === chapterFilter)
    if (difficultyFilter !== 'All') rows = rows.filter((r) => r.difficulty === difficultyFilter)
    return rows
  }, [allRows, statusFilter, subjectFilter, chapterFilter, difficultyFilter])

  const subjects = useMemo(() => [...new Set(allRows.map((r) => r.subject).filter(Boolean))], [allRows])
  const chaptersForFilter = useMemo(() => {
    const base = subjectFilter !== 'All' ? allRows.filter((r) => r.subject === subjectFilter) : allRows
    return [...new Set(base.map((r) => r.chapter).filter(Boolean))]
  }, [allRows, subjectFilter])

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Student' }]
    if (subjectFilter !== 'All') items.push({ label: subjectFilter, onClick: () => { setChapterFilter('All') } })
    if (chapterFilter !== 'All') items.push({ label: chapterFilter })
    return items
  }, [subjectFilter, chapterFilter])

  const LETTERS = ['A', 'B', 'C', 'D']

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Question Analysis — {domain}</h3>
        <p className="mt-0.5 text-xs text-slate-400">Which exact questions prove the problem? Individual question investigation.</p>
      </div>

      {(subjectFilter !== 'All' || chapterFilter !== 'All') && (
        <Breadcrumb items={breadcrumbItems} onNavigate={() => { setSubjectFilter('All'); setChapterFilter('All') }} />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1">
          {['All', 'Correct', 'Incorrect', 'Skipped', 'Slow', 'Answer Changed', 'Revisited', 'Marked for Review'].map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${statusFilter === f ? 'bg-indigo-600 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400'}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setChapterFilter('All') }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <option value="All">All Subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <option value="All">All Chapters</option>
          {chaptersForFilter.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <p className="text-[10.5px] font-medium text-slate-400">Showing {filteredRows.length} of {allRows.length} questions</p>

      {filteredRows.length ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Q</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-center">Time</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-center">Changes</TableHead>
                <TableHead className="text-center">Revisits</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.slice(0, 60).map((r, i) => (
                <TableRow key={`${r.attemptId}-${r.id}-${i}`} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => setShowDetail(r)}>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-100">{r.questionNumber}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">{r.subject}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">{r.chapter}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">{r.topic ?? '—'}</TableCell>
                  <TableCell><Badge variant={r.difficulty === 'Easy' ? 'success' : r.difficulty === 'Medium' ? 'warning' : 'danger'} size="sm">{r.difficulty}</Badge></TableCell>
                  <TableCell className="text-center font-semibold text-slate-600 dark:text-slate-300">{r.timeSpent}s</TableCell>
                  <TableCell><Badge variant={r.status === 'Correct' ? 'success' : r.status === 'Incorrect' ? 'danger' : 'warning'} size="sm">{r.status}</Badge></TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{r.answerChanges}</TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{r.revisits}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowDetail(r) }}><FileText className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRows.length > 60 && <p className="mt-2 text-center text-[11px] text-slate-400">Showing 60 of {filteredRows.length} questions.</p>}
        </div>
      ) : <p className="py-8 text-center text-xs text-slate-400">No questions match the current filters.</p>}

      <QuestionDetailDialog row={showDetail} open={!!showDetail} onClose={() => setShowDetail(null)} allRows={allRows} />
    </Card>
  )
}

export {
  Breadcrumb,
  SubjectIntelligencePanel,
  SubjectDrilldownPanel,
  ChapterIntelligencePanel,
  QuestionAnalysisPanel,
}
export default {
  Breadcrumb,
  SubjectIntelligencePanel,
  SubjectDrilldownPanel,
  ChapterIntelligencePanel,
  QuestionAnalysisPanel,
}
