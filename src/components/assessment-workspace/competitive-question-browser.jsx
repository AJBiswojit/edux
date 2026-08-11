/**
 * Assessment Workspace — Competitive Question Browser (Phase 29).
 * Shared by Question Intelligence (Competitive mode) and PYQ Intelligence
 * (competitive PYQ records). Displays ACTUAL questions with:
 * search · filters (exam/subject/chapter/topic/year/difficulty/type) ·
 * pagination · question cards (options, answer reveal, explanation) ·
 * detail dialog with full metadata + "View in Question Bank" where the
 * question carries a bankId.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ChevronLeft, ChevronRight, Eye, Search, Sparkles, Target } from 'lucide-react'
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectItem } from '@/components/ui'
import { cn } from '@/utils/cn'

const DIFF_STYLE = { Easy: 'success', Medium: 'warning', Hard: 'danger' }
const PAGE_SIZE = 8

export function QuestionDetailDialog({ question, open, onOpenChange, onViewInBank }) {
  if (!question) return null
  const pyq = question.pyq ?? {}
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white"><Target className="h-4 w-4" /></span>
            {question.subject} · {question.chapter}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="gradient" size="sm">{question.exam} {question.year}{question.session ? ` · ${question.session}` : ''}</Badge>
            <Badge variant={DIFF_STYLE[question.difficulty] ?? 'secondary'} size="sm">{question.difficulty}</Badge>
            <Badge variant="outline" size="sm">{question.questionType}</Badge>
            {question.isPyq && <Badge variant="warning" size="sm">PYQ</Badge>}
            <Badge variant="secondary" size="sm">+{question.marks} / −{question.negativeMarks}</Badge>
          </div>

          <p className="rounded-2xl bg-slate-50 p-4 text-[14px] font-semibold leading-relaxed text-slate-800 dark:bg-slate-800/60 dark:text-slate-100">{question.question}</p>

          <div className="grid gap-2">
            {question.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isAnswer = letter === question.answer
              return (
                <div key={letter} className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3', isAnswer ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10' : 'border-slate-100 dark:border-slate-800')}>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold', isAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>{letter}</span>
                  <p className={cn('text-[13px]', isAnswer ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300')}>{opt}</p>
                  {isAnswer && <Badge variant="success" size="sm" className="ml-auto">Correct</Badge>}
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> Explanation
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{question.explanation}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
            {[
              { label: 'Topic', value: question.topic },
              { label: 'Source', value: question.source === 'demo' ? 'Demo corpus' : question.source },
              { label: 'Paper', value: pyq.session ?? '—' },
              { label: 'Bank linked', value: question.bankId ? 'Yes' : 'No' },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                <p className="mt-0.5 truncate font-semibold text-slate-700 dark:text-slate-200">{m.value}</p>
              </div>
            ))}
          </div>

          {onViewInBank && (
            <Button className="w-full" onClick={onViewInBank}>
              <BookOpen className="h-4 w-4" /> View in Question Bank
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CompetitiveQuestionBrowser({
  questions = [], title = 'Competitive questions', subtitle,
  exams = [], defaultExam = null, showExamFilter = true, badge = null,
  defaultSubject = null, defaultChapter = null, defaultQuery = null,
}) {
  const [exam, setExam] = useState(defaultExam ?? (exams[0] ?? 'All'))
  const [subject, setSubject] = useState(defaultSubject ?? 'All')
  const [chapter, setChapter] = useState(defaultChapter ?? 'All')
  const [topic, setTopic] = useState('All')
  const [year, setYear] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [type, setType] = useState('All')
  const [query, setQuery] = useState(defaultQuery ?? '')
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState(null)

  const examList = exams.length ? exams : [...new Set(questions.map((q) => q.exam))]
  const effectiveExam = exam === 'All' && examList.length === 1 ? examList[0] : exam

  const subjects = useMemo(() => [...new Set(questions.filter((q) => effectiveExam === 'All' || q.exam === effectiveExam).map((q) => q.subject))], [questions, effectiveExam])
  const chapters = useMemo(() => [...new Set(questions.filter((q) => (effectiveExam === 'All' || q.exam === effectiveExam) && (subject === 'All' || q.subject === subject)).map((q) => q.chapter))], [questions, effectiveExam, subject])
  const topics = useMemo(() => [...new Set(questions.filter((q) => (effectiveExam === 'All' || q.exam === effectiveExam) && (subject === 'All' || q.subject === subject) && (chapter === 'All' || q.chapter === chapter)).map((q) => q.topic))], [questions, effectiveExam, subject, chapter])
  const years = useMemo(() => [...new Set(questions.filter((q) => (effectiveExam === 'All' || q.exam === effectiveExam)).map((q) => q.year))].sort(), [questions, effectiveExam])
  const types = useMemo(() => [...new Set(questions.map((q) => q.questionType))], [questions])

  const filtered = useMemo(() => questions.filter((q) => {
    if (effectiveExam !== 'All' && q.exam !== effectiveExam) return false
    if (subject !== 'All' && q.subject !== subject) return false
    if (chapter !== 'All' && q.chapter !== chapter) return false
    if (topic !== 'All' && q.topic !== topic) return false
    if (year !== 'All' && q.year !== year) return false
    if (difficulty !== 'All' && q.difficulty !== difficulty) return false
    if (type !== 'All' && q.questionType !== type) return false
    if (query && !`${q.question} ${q.chapter} ${q.topic}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  }), [questions, effectiveExam, subject, chapter, topic, year, difficulty, type, query])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const resetPage = (fn) => (v) => { fn(v); setPage(0) }
  const select = (value, list, fallback) => (list.includes(value) ? value : fallback)

  const filterRow = (label, value, onChange, options, placeholder) => (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <Select value={value} onValueChange={onChange} placeholder={placeholder}>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </Select>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-bold text-slate-900 dark:text-white">{title}</p>
          <p className="text-[11.5px] text-slate-400">{subtitle ?? `${filtered.length} questions · ${effectiveExam === 'All' ? 'JEE + NEET' : effectiveExam}`}</p>
        </div>
        {badge}
      </div>

      {/* filters */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-sm md:grid-cols-4 xl:grid-cols-8 dark:border-slate-800 dark:bg-slate-900">
        {showExamFilter && examList.length > 1 && filterRow('Exam', effectiveExam, resetPage(setExam), ['All', ...examList], 'Exam')}
        {filterRow('Subject', subject, (v) => { setSubject(select(v, subjects, 'All')); setChapter('All'); setTopic('All'); setPage(0) }, ['All', ...subjects], 'Subject')}
        {filterRow('Chapter', chapter, (v) => { setChapter(select(v, chapters, 'All')); setTopic('All'); setPage(0) }, ['All', ...chapters], 'Chapter')}
        {filterRow('Topic', topic, resetPage((v) => setTopic(select(v, topics, 'All'))), ['All', ...topics], 'Topic')}
        {filterRow('Year', year, resetPage(setYear), ['All', ...years], 'Year')}
        {filterRow('Difficulty', difficulty, resetPage(setDifficulty), ['All', 'Easy', 'Medium', 'Hard'], 'Difficulty')}
        {filterRow('Type', type, resetPage(setType), ['All', ...types], 'Type')}
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Search</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0) }}
              placeholder="Search questions…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* list */}
      {pageRows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Not enough questions match this configuration</p>
          <p className="mt-1 text-xs text-slate-400">Broaden the filters to see matching questions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {pageRows.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % PAGE_SIZE) * 0.03 }}>
              <div className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="gradient" size="sm">{q.exam === 'JEE Main' ? 'JEE' : 'NEET'}</Badge>
                    <Badge variant="secondary" size="sm">{q.subject}</Badge>
                    {q.isPyq && <Badge variant="warning" size="sm">PYQ {q.year}</Badge>}
                    <Badge variant={DIFF_STYLE[q.difficulty] ?? 'secondary'} size="sm">{q.difficulty}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 shrink-0 px-0" onClick={() => setDetail(q)} aria-label={`View question ${q.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100">{q.question}</p>
                <p className="mt-1 text-[10.5px] font-medium text-slate-400">{q.chapter} · {q.topic} · +{q.marks} / −{q.negativeMarks}</p>
                <button onClick={() => setDetail(q)} className="mt-auto pt-2.5 text-left text-[11.5px] font-bold text-indigo-600 hover:underline dark:text-indigo-300">
                  View details →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] font-semibold text-slate-400">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <QuestionDetailDialog
        question={detail}
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
      />
    </div>
  )
}

export default CompetitiveQuestionBrowser
