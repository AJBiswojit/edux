/**
 * Faculty — Student Profile → 360° Student Intelligence (Phase 4+).
 * Extended with ground-level question intelligence:
 *   Student → Subject → Chapter → Topic → Concept → Questions
 *   → Question Attempt Details → Evidence → AI Intervention Recommendation
 *
 * Existing tabs preserved: Overview · Examinations · Subject Intelligence ·
 * Chapter Intelligence · Question Analysis · Time & Behaviour · Trends ·
 * Academic DNA
 *
 * Key improvements:
 *   · Subject Intelligence: diagnostic info + weak/strong chapters + drilldown
 *   · Chapter Intelligence: topic → concept drilldown (clickable)
 *   · Question Analysis: filters + breadcrumb + automatic context filtering
 *   · Evidence Questions: always uses canonical attempt data (not only QB)
 *   · AI Intervention Recommendation: evidence-based, specific
 */
import { useMemo, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, BrainCircuit,
  CheckCircle2, ChevronRight, ClipboardList, Crosshair, FileText, Filter,
  LayoutDashboard, Layers, ListChecks, LineChart, Minus, Sparkles, Target,
  Timer, TrendingDown, TrendingUp, X,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger, TabsContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Student360Panels } from '@/components/students-workspace/student-360-panels'
import { useFacultyStudent360 } from '@/services/faculty-students'
import { useFacultyStudentInterventions } from '@/services/faculty-interventions'
import { formatDate } from '@/utils/format'
import {
  aggregateTopicIntelligence,
  computeSubjectDiagnostics,
  computeChapterDrilldown,
  resolveEvidenceQuestions,
  generateAiObservation,
  generateWhyFlagged,
  generateInterventionRecommendation,
} from '@/intelligence/faculty/engine/ground-level-intelligence'

const STATUS_STYLES = { Strong: 'success', Improving: 'info', Stable: 'secondary', 'Needs Attention': 'danger', 'No exams': 'outline' }
const DOMAIN_BADGE = { University: 'info', Competitive: 'gradient' }
const FAMILY_BADGE = { JEE: 'warning', NEET: 'success' }
const TREND_STYLE = { improving: 'success', declining: 'danger', stable: 'secondary', new: 'info' }

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'exams', label: 'Examinations', icon: ClipboardList },
  { id: 'subjects', label: 'Subject Intelligence', icon: Layers },
  { id: 'chapters', label: 'Chapter Intelligence', icon: ListChecks },
  { id: 'questions', label: 'Question Analysis', icon: FileText },
  { id: 'time', label: 'Time & Behaviour', icon: Timer },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'dna', label: 'Academic DNA', icon: BrainCircuit },
]

/* ================================================================== */
/* Exam History Table                                                  */
/* ================================================================== */
function ExamHistoryTable({ attempts, studentId }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[820px]">
        <TableHeader>
          <TableRow>
            <TableHead>Exam</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Accuracy</TableHead>
            <TableHead className="text-center">Attempt rate</TableHead>
            <TableHead className="text-center">Time eff.</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{a.examName ?? a.examId}</p>
                <p className="text-[10.5px] font-medium text-slate-400">{a.shortTitle}{a.mock ? ' · sample' : ''}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={DOMAIN_BADGE[a.examMode]} size="sm">{a.examMode}</Badge>
                  {a.examFamily && <Badge variant={FAMILY_BADGE[a.examFamily]} size="sm">{a.examFamily}</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-[11.5px] font-medium text-slate-500">{formatDate(a.date, 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-center font-bold text-slate-800 dark:text-slate-100">{a.score}<span className="text-[10px] font-medium text-slate-400">/{a.maxScore ?? '—'}</span></TableCell>
              <TableCell className={`text-center font-bold ${a.accuracy >= 75 ? 'text-emerald-600 dark:text-emerald-400' : a.accuracy >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>{a.accuracy}%</TableCell>
              <TableCell className="text-center text-[12px] font-semibold text-slate-500">{a.attemptRate}%</TableCell>
              <TableCell className="text-center text-[12px] font-semibold text-slate-500">{a.timeEfficiency != null ? `${a.timeEfficiency}%` : '—'}</TableCell>
              <TableCell className="text-right">
                <Link to={`/faculty/my-students/${studentId}/exams/${a.id}`}>
                  <Button size="sm" variant="outline"><FileText className="h-3.5 w-3.5" /> View Analysis</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ================================================================== */
/* Breadcrumb Navigation                                              */
/* ================================================================== */
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

/* ================================================================== */
/* SUBJECT INTELLIGENCE (enhanced with diagnostics)                   */
/* ================================================================== */
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

/* ================================================================== */
/* SUBJECT DRILLDOWN — Chapter Performance                            */
/* ================================================================== */
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

/* ================================================================== */
/* CHAPTER INTELLIGENCE (with topic drilldown)                        */
/* ================================================================== */
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

/* ================================================================== */
/* Evidence Question Card                                              */
/* ================================================================== */
function EvidenceQuestionCard({ row, allRows }) {
  const LETTERS = ['A', 'B', 'C', 'D']
  const evidence = resolveEvidenceQuestions([row])[0]
  const whyFlags = generateWhyFlagged(evidence, allRows)

  return (
    <div className="rounded-2xl border border-slate-200/70 p-3.5 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={row.status === 'Correct' ? 'success' : row.status === 'Incorrect' ? 'danger' : 'warning'} size="sm">{row.status}</Badge>
        <Badge variant="outline" size="sm">{row.difficulty ?? 'Medium'}</Badge>
        <Badge variant="secondary" size="sm">{row.type ?? 'MCQ'}</Badge>
        {row.id && <Badge variant="secondary" size="sm">{row.id}</Badge>}
        <span className="ml-auto text-[10px] font-medium text-slate-400">{row.examName} · {row.date}</span>
      </div>
      {row.text && <p className="mt-2 text-[12px] leading-relaxed text-slate-700 dark:text-slate-200">{row.text}</p>}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
        <span className="text-slate-500">Student answer: <span className="font-bold text-slate-700 dark:text-slate-200">{typeof row.selected === 'number' ? LETTERS[row.selected] : row.selected ?? '—'}</span></span>
        <span className="text-slate-500">Correct answer: <span className="font-bold text-emerald-600">{typeof row.correctAnswer === 'number' ? LETTERS[row.correctAnswer] : row.correctAnswer ?? '—'}</span></span>
        <span className="text-slate-500">Time: <span className="font-bold">{row.timeSpent}s</span></span>
        <span className="text-slate-500">Answer changes: <span className="font-bold">{row.answerChanges ?? 0}</span></span>
        <span className="text-slate-500">Revisits: <span className="font-bold">{row.revisits ?? 0}</span></span>
        <span className="text-slate-500">Marked for review: <span className="font-bold">{row.markedForReview ? 'Yes' : 'No'}</span></span>
      </div>
      {whyFlags.length > 0 && (
        <div className="mt-2 rounded-xl bg-amber-50/70 p-2 dark:bg-amber-500/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Why Flagged</p>
          <ul className="mt-1 space-y-0.5">
            {whyFlags.map((f, i) => <li key={i} className="text-[10.5px] text-amber-800 dark:text-amber-300">• {f}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/* Question Detail Dialog                                             */
/* ================================================================== */
function QuestionDetailDialog({ row, open, onClose, allRows }) {
  if (!row) return null
  const LETTERS = ['A', 'B', 'C', 'D']
  const evidence = resolveEvidenceQuestions([row])[0]
  const observation = generateAiObservation(evidence)
  const whyFlags = generateWhyFlagged(evidence, allRows ?? [])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Question Detail
            <Badge variant={row.status === 'Correct' ? 'success' : row.status === 'Incorrect' ? 'danger' : 'warning'} size="sm">{row.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {row.text && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Question</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">{row.text}</p>
            </div>
          )}
          {row.options?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Options</p>
              <div className="mt-1 space-y-1">
                {row.options.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] ${i === row.correctAnswer ? 'bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : i === row.selected && row.status === 'Incorrect' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    <span className="font-bold">{LETTERS[i]}.</span> {opt}
                    {i === row.correctAnswer && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                    {i === row.selected && row.status === 'Incorrect' && <X className="ml-auto h-3.5 w-3.5 text-rose-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-[11px] dark:bg-slate-800/60">
            <div><span className="text-slate-400">Student Answer:</span> <span className="font-bold">{typeof row.selected === 'number' ? LETTERS[row.selected] : row.selected ?? '—'}</span></div>
            <div><span className="text-slate-400">Correct Answer:</span> <span className="font-bold text-emerald-600">{typeof row.correctAnswer === 'number' ? LETTERS[row.correctAnswer] : row.correctAnswer ?? '—'}</span></div>
            <div><span className="text-slate-400">Time Spent:</span> <span className="font-bold">{row.timeSpent}s</span></div>
            <div><span className="text-slate-400">Answer Changes:</span> <span className="font-bold">{row.answerChanges ?? 0}</span></div>
            <div><span className="text-slate-400">Revisit Count:</span> <span className="font-bold">{row.revisits ?? 0}</span></div>
            <div><span className="text-slate-400">Marked for Review:</span> <span className="font-bold">{row.markedForReview ? 'Yes' : 'No'}</span></div>
            <div><span className="text-slate-400">Difficulty:</span> <span className="font-bold">{row.difficulty ?? '—'}</span></div>
            <div><span className="text-slate-400">Question Type:</span> <span className="font-bold">{row.type ?? 'MCQ'}</span></div>
            <div><span className="text-slate-400">Subject:</span> <span className="font-bold">{row.subject}</span></div>
            <div><span className="text-slate-400">Chapter:</span> <span className="font-bold">{row.chapter}</span></div>
            <div><span className="text-slate-400">Topic:</span> <span className="font-bold">{row.topic ?? '—'}</span></div>
            <div><span className="text-slate-400">Assessment:</span> <span className="font-bold">{row.examName}</span></div>
            <div><span className="text-slate-400">Date:</span> <span className="font-bold">{row.date}</span></div>
            <div><span className="text-slate-400">Question ID:</span> <span className="font-bold">{row.id}</span></div>
          </div>
          {observation && (
            <div className="rounded-xl bg-indigo-50/70 p-3 dark:bg-indigo-500/5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                <BrainCircuit className="h-3 w-3" /> AI Observation
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-indigo-900 dark:text-indigo-200">{observation}</p>
            </div>
          )}
          {whyFlags.length > 0 && (
            <div className="rounded-xl bg-amber-50/70 p-3 dark:bg-amber-500/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Why This Question Is Evidence</p>
              <ul className="mt-1 space-y-0.5">
                {whyFlags.map((f, i) => <li key={i} className="text-[11px] text-amber-800 dark:text-amber-300">• {f}</li>)}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ================================================================== */
/* AI Intervention Recommendation Card                                */
/* ================================================================== */
function InterventionRecommendationCard({ intervention }) {
  if (!intervention) return null
  return (
    <div className="rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white p-5 dark:border-indigo-500/30 dark:from-indigo-500/5 dark:via-blue-500/5 dark:to-transparent">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
        <Target className="h-3.5 w-3.5" /> AI Recommended Intervention
      </p>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Concept</p>
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{intervention.concept}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Issue</p>
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{intervention.issueType}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Priority</p>
            <Badge variant={intervention.priority === 'High' ? 'danger' : intervention.priority === 'Critical' ? 'danger' : 'warning'} size="sm">{intervention.priority}</Badge>
          </div>
        </div>

        {intervention.evidence.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Evidence</p>
            <ul className="mt-1 space-y-0.5">
              {intervention.evidence.map((e, i) => <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300">• {e}</li>)}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Recommended Action</p>
          <p className="mt-0.5 text-[12px] text-slate-700 dark:text-slate-200">{intervention.recommendedAction}</p>
        </div>

        <div className="rounded-xl bg-white/60 p-3 dark:bg-slate-800/40">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Practice Plan</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.questionCount} questions</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.difficultyProgression}</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.concept}</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.practiceType}</span>
          </div>
        </div>

        {intervention.whyExplanation && (
          <div className="rounded-xl bg-amber-50/80 p-3 dark:bg-amber-500/5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Why This Intervention?</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">{intervention.whyExplanation}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="default"><Target className="h-3 w-3" /> Create Intervention</Button>
          <Link to={`/faculty/question-intelligence?subject=${encodeURIComponent(intervention.subject ?? '')}&chapter=${encodeURIComponent(intervention.chapter ?? '')}`}>
            <Button size="sm" variant="outline"><BookOpen className="h-3 w-3" /> View Question Bank</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* QUESTION ANALYSIS (with filters + breadcrumb + auto context)       */
/* ================================================================== */
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

/* ================================================================== */
/* TIME & BEHAVIOUR PANEL                                             */
/* ================================================================== */
function TimeBehaviourPanel({ s360 }) {
  const t = s360?.question?.time ?? {}
  const b = s360?.question?.behaviour ?? {}
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Time intelligence</h3>
        <p className="mt-0.5 text-xs text-slate-400">Calculated from actual question timing</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            { label: 'Avg / question', value: `${t.avgTime ?? 0}s` },
            { label: 'Avg correct', value: t.timeByCorrect != null ? `${t.timeByCorrect}s` : '—' },
            { label: 'Avg incorrect', value: t.timeByIncorrect != null ? `${t.timeByIncorrect}s` : '—' },
            { label: 'Fastest', value: t.fastest ? `${t.fastest.time}s` : '—' },
            { label: 'Slowest', value: t.slowest ? `${t.slowest.time}s` : '—' },
            { label: 'Slowest topic', value: t.slowest?.topic ?? '—' },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
              <p className="mt-0.5 truncate text-[14px] font-bold text-slate-800 dark:text-slate-100">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Avg time by subject</p>
          {(t.bySubject ?? []).map((s) => (
            <div key={s.subject} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-24 truncate font-semibold text-slate-600 dark:text-slate-300">{s.subject}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(100, (s.avgTime / 150) * 100)}%` }} />
              </div>
              <span className="w-10 text-right font-bold text-slate-700 dark:text-slate-200">{s.avgTime}s</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Behaviour intelligence</h3>
        <p className="mt-0.5 text-xs text-slate-400">Observable exam behaviour only — no emotion/motivation inferences</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Answer changes', value: String(b.answerChanges ?? 0) },
            { label: 'Revisits', value: String(b.revisits ?? 0) },
            { label: 'Skipped', value: String(b.skipped ?? 0) },
            { label: 'Marked review', value: String(b.markedForReview ?? 0) },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</p>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Error intelligence</p>
          {(s360?.question?.errors ?? []).map((e) => (
            <div key={e.category} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[12px] dark:bg-slate-800/60">
              <span className="font-semibold text-slate-600 dark:text-slate-300">{e.category}</span>
              <span className="ml-auto font-bold text-slate-800 dark:text-slate-100">{e.count} · {e.percentage}%</span>
            </div>
          ))}
          {!(s360?.question?.errors ?? []).length && <p className="text-[11px] text-slate-400">No error data yet.</p>}
        </div>
      </Card>
    </div>
  )
}

/* ================================================================== */
/* TRENDS PANEL                                                       */
/* ================================================================== */
function TrendsPanel({ s360, domain }) {
  const series = (s360?.longitudinal?.series ?? []).filter((s) => (domain === 'Competitive' ? s.examMode !== 'University' : s.examMode === 'University'))
  const issues = (s360?.longitudinal?.issues ?? []).filter((i) => (domain === 'Competitive' ? i.domain !== 'university' : i.domain === 'university'))
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Performance trend — {domain}</h3>
        <p className="mt-0.5 text-xs text-slate-400">Accuracy · attempt rate across assessments (from actual attempts)</p>
        {series.length ? (
          <div className="mt-4 space-y-2.5">
            {series.map((s) => (
              <div key={s.attemptId} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <span className="w-40 truncate text-[12px] font-bold text-slate-700 dark:text-slate-200">{s.shortTitle ?? s.examName}</span>
                <span className="text-[10.5px] font-medium text-slate-400">{s.date}</span>
                <span className={`ml-auto font-bold ${s.accuracy >= 75 ? 'text-emerald-600' : s.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>{s.accuracy}%</span>
                <span className="w-16 text-right text-[11px] font-semibold text-slate-400">{s.attemptRate}% att.</span>
              </div>
            ))}
          </div>
        ) : <p className="py-8 text-center text-xs text-slate-400">No {domain} assessments yet.</p>}
      </Card>
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Persistent vs resolved issues — {domain}</h3>
        <p className="mt-0.5 text-xs text-slate-400">Classified from the chapter trend logic (Phase 2) — each with evidence</p>
        {issues.length ? (
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {issues.map((i) => (
              <div key={`${i.subject}-${i.chapter}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${i.type === 'Persistent weakness' ? 'bg-rose-500' : i.type === 'Resolved issue' ? 'bg-emerald-500' : i.type === 'Improving issue' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                    {i.chapter} <Badge variant={i.type === 'Persistent weakness' ? 'danger' : i.type === 'Resolved issue' ? 'success' : i.type === 'Improving issue' ? 'info' : 'warning'} size="sm">{i.type}</Badge>
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">
                    {i.accuracy}% accuracy · {i.avgTime}s avg · {i.evidence?.attempts ?? 0} attempts · {i.evidence?.questions ?? 0} questions · {i.evidence?.incorrect ?? 0} incorrect
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-6 text-center text-xs text-slate-400">No tracked issues yet.</p>}
      </Card>
    </div>
  )
}

/* ================================================================== */
/* DNA PANEL                                                          */
/* ================================================================== */
function DnaPanel({ s360, domain }) {
  const sw = s360?.strengthsWeaknesses
  const pools = domain === 'Competitive'
    ? { strengths: [...(sw?.competitive?.JEE?.strengths ?? []), ...(sw?.competitive?.NEET?.strengths ?? [])], weaknesses: [...(sw?.competitive?.JEE?.weaknesses ?? []), ...(sw?.competitive?.NEET?.weaknesses ?? [])] }
    : sw?.university ?? { strengths: [], weaknesses: [] }
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
        <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> AI Academic DNA — {domain}
      </h3>
      <p className="mt-0.5 text-xs text-slate-400">Reused from the Student AI Academic DNA engine — no duplicate calculation · every insight traceable to questions</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Strengths</p>
          <div className="space-y-2">
            {(pools.strengths ?? []).slice(0, 6).map((s) => (
              <div key={`dna-st-${s.chapter}`} className="rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.chapter} <span className="font-medium text-emerald-700 dark:text-emerald-300">{s.accuracy}%</span></p>
                <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">Evidence: {s.evidence?.attempts ?? 0} attempts · {s.evidence?.questions ?? 0} questions · {s.evidence?.incorrect ?? 0} incorrect</p>
              </div>
            ))}
            {!(pools.strengths ?? []).length && <p className="text-[11px] text-slate-400">No strengths yet.</p>}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Weaknesses</p>
          <div className="space-y-2">
            {(pools.weaknesses ?? []).slice(0, 6).map((w) => (
              <div key={`dna-wk-${w.chapter}`} className="rounded-xl bg-rose-50/60 p-3 dark:bg-rose-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{w.chapter} <span className="font-medium text-rose-600 dark:text-rose-300">{w.accuracy}%</span></p>
                <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">Evidence: {w.evidence?.attempts ?? 0} attempts · {w.evidence?.questions ?? 0} questions · {w.evidence?.incorrect ?? 0} incorrect · {w.evidence?.skipped ?? 0} skipped</p>
              </div>
            ))}
            {!(pools.weaknesses ?? []).length && <p className="text-[11px] text-slate-400">No weaknesses flagged.</p>}
          </div>
        </div>
      </div>
    </Card>
  )
}

/* ================================================================== */
/* MAIN STUDENT PROFILE COMPONENT                                     */
/* ================================================================== */
function StudentProfile() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useFacultyStudent360(studentId)
  const [tab, setTab] = useState('overview')
  const [domain, setDomain] = useState(null)
  const [examFilter, setExamFilter] = useState('All')
  const [family, setFamily] = useState('All')
  const { data: studentIvData } = useFacultyStudentInterventions(studentId)

  /* drilldown state for subject → chapter */
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [chapterContext, setChapterContext] = useState(null)
  const [questionContext, setQuestionContext] = useState(null)

  const activeDomain = useMemo(() => {
    if (domain) return domain
    return data?.defaultDomain ?? 'University'
  }, [domain, data])

  const history = useMemo(() => {
    let items = data?.attempts ?? []
    if (examFilter !== 'All') items = items.filter((a) => a.examMode === examFilter)
    if (family !== 'All') items = items.filter((a) => a.examFamily === family)
    return items
  }, [data, examFilter, family])

  const handleSubjectSelect = useCallback((subject) => {
    setSelectedSubject(subject)
  }, [])

  const handleChapterSelect = useCallback((chapter) => {
    setChapterContext({ subject: selectedSubject, chapter })
    setTab('chapters')
  }, [selectedSubject])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const s = data?.student ?? {}
  const o = data?.overview ?? {}
  const atts = data?.attempts ?? []
  const latest = atts[0] ?? null

  return (
    <div>
      <button onClick={() => navigate('/faculty/my-students')} className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <ArrowLeft className="h-3.5 w-3.5" /> My Students
      </button>

      <PageHeader
        eyebrow="Faculty · Students · 360° Intelligence"
        title={`${s.name ?? 'Student'} — 360° Academic Intelligence`}
        description={`Roll ${s.roll} · ${s.batchName ?? '—'} — every insight derived from canonical exam attempts (demo excluded).`}
        breadcrumbs={[{ label: 'Faculty' }, { label: 'My Students', to: '/faculty/my-students' }, { label: s.name ?? 'Profile' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {data?.uniCount > 0 && data?.compCount > 0 && (
              <div className="flex rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                {['University', 'Competitive'].map((d) => (
                  <button key={d} onClick={() => setDomain(d)}
                    className={`rounded-xl px-3.5 py-1.5 text-[11.5px] font-bold transition-all ${activeDomain === d ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            )}
            <Badge variant={STATUS_STYLES[data?.status] ?? 'secondary'} className="px-3 py-1">{data?.status}</Badge>
          </div>
        }
      />

      {/* Identity header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/20">
        <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-lg font-bold ring-1 ring-white/25">
              {s.name?.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
                <span>{s.roll}</span>·<span>ID {s.id}</span>·<span>{s.batchName}</span>
              </p>
              <h2 className="mt-1 text-xl font-bold">{s.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={DOMAIN_BADGE[s.domain]} size="sm">{s.domain}</Badge>
                {s.examFamily && <Badge variant={FAMILY_BADGE[s.examFamily]} size="sm">{s.examFamily} · {data?.batch?.examLabel ?? ''}</Badge>}
                {s.domain === 'University' ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">
                    {s.program} · {s.course} · Sem {s.semester} · Sec {s.section}
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">
                    {data?.batch?.examLabel ?? s.examFamily} · {s.academicSession}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-white/20">{s.academicSession}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Exams', value: String(o.examsCompleted ?? atts.length) },
              { label: 'Latest accuracy', value: o.latestAccuracy != null ? `${o.latestAccuracy}%` : '—' },
              { label: 'Attempt rate', value: `${o.attemptRate ?? 0}%` },
              { label: 'Time efficiency', value: `${o.timeEfficiency ?? 0}%` },
              { label: 'Δ score', value: o.improvementDelta != null ? `${o.improvementDelta >= 0 ? '+' : ''}${o.improvementDelta}` : '—' },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
                <p className="font-display text-lg font-bold">{m.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/70">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data?.attention && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 dark:border-rose-500/25 dark:bg-rose-500/5">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
          <div>
            <p className="text-[13px] font-bold text-rose-800 dark:text-rose-200">Needs attention</p>
            <p className="mt-0.5 text-[12px] text-rose-700/80 dark:text-rose-300/80">{data.attentionReason ?? 'Derived from declining performance or low accuracy in recent exams.'}</p>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v !== 'subjects') setSelectedSubject(null); if (v !== 'chapters') setChapterContext(null) }} className="mt-6">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start sm:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}><t.icon className="h-3.5 w-3.5" /> {t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ============ Overview ============ */}
        <TabsContent value="overview">
          <Student360Panels s360={data} studentId={studentId} domain={activeDomain} />
        </TabsContent>

        {/* ============ Examinations ============ */}
        <TabsContent value="exams">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                  <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Exam history
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">From canonical ExamAgent attempts — demo attempts excluded · official faculty history</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {['All', 'University', 'Competitive'].map((f) => (
                  <button key={f} onClick={() => { setExamFilter(f); setFamily('All') }}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all ${examFilter === f ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
                    {f === 'All' ? 'All' : f}
                  </button>
                ))}
                {examFilter === 'Competitive' && ['All', 'JEE', 'NEET'].map((f) => (
                  <button key={f} onClick={() => setFamily(f)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${family === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
                    {f === 'All' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            {history.length ? (
              <div className="mt-4"><ExamHistoryTable attempts={history} studentId={studentId} /></div>
            ) : <p className="py-8 text-center text-xs text-slate-400">No exam history for this filter.</p>}
          </Card>
        </TabsContent>

        {/* ============ Subject Intelligence ============ */}
        <TabsContent value="subjects">
          {selectedSubject ? (
            <SubjectDrilldownPanel s360={data} domain={activeDomain} subject={selectedSubject}
              onSelectChapter={handleChapterSelect} onBack={() => setSelectedSubject(null)} />
          ) : (
            <SubjectIntelligencePanel s360={data} domain={activeDomain} onSelectSubject={handleSubjectSelect} />
          )}
        </TabsContent>

        {/* ============ Chapter Intelligence ============ */}
        <TabsContent value="chapters">
          <ChapterIntelligencePanel s360={data} domain={activeDomain} context={chapterContext}
            onNavigate={(ctx) => setChapterContext(ctx)} />
        </TabsContent>

        {/* ============ Question Analysis ============ */}
        <TabsContent value="questions">
          <QuestionAnalysisPanel s360={data} domain={activeDomain} context={questionContext} />
        </TabsContent>

        {/* ============ Time & Behaviour ============ */}
        <TabsContent value="time">
          <TimeBehaviourPanel s360={data} />
        </TabsContent>

        {/* ============ Trends ============ */}
        <TabsContent value="trends">
          <TrendsPanel s360={data} domain={activeDomain} />
        </TabsContent>

        {/* ============ Academic DNA ============ */}
        <TabsContent value="dna">
          <DnaPanel s360={data} domain={activeDomain} />
        </TabsContent>
      </Tabs>

      {/* Interventions (Phase 6) */}
      {(studentIvData?.items ?? []).length > 0 && (
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                <ClipboardList className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Interventions
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">Assigned targeted practice & re-tests (prototype)</p>
            </div>
            <Link to="/faculty/my-students" className="text-[11.5px] font-bold text-indigo-600 hover:underline dark:text-indigo-300">Manage in Intervention Center →</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(studentIvData?.items ?? []).map((iv) => (
              <Link key={iv.id} to="/faculty/my-students" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:border-teal-300 dark:border-slate-700 dark:text-slate-200">
                <Target className="h-3.5 w-3.5 text-teal-500" />
                {iv.title}
                <Badge variant={iv.status === 'Resolved' ? 'success' : iv.status === 'Improving' ? 'info' : iv.status === 'Persistent' ? 'danger' : 'secondary'} size="sm">{iv.status}</Badge>
                {iv.practiceDone && iv.practiceAccuracy != null && <Badge variant="outline" size="sm">{iv.practiceAccuracy}% practice</Badge>}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/faculty/my-students">
          <Button variant="outline"><ArrowLeft className="h-4 w-4" /> My Students</Button>
        </Link>
        <Link to={`/faculty/my-students/${studentId}/exams/${latest?.id ?? ''}`}>
          <Button disabled={!latest}><BrainCircuit className="h-4 w-4" /> Latest analysis <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
      <p className="mt-4 text-[11px] font-medium text-slate-400">
        Status derived deterministically from this student's exam series — every insight is traceable to actual questions.
      </p>
    </div>
  )
}

export { StudentProfile }
export default StudentProfile
