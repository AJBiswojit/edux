/**
 * MediXO EduX — Assessment Workspace · Question Paper Studio (Phase 9 Backend-Ready).
 *
 * Migration: No mock/seeded question datasets. All question data flows
 * Component → Hook → Service → API Client → VITE_API_BASE_URL → real DB.
 *
 * - Question pool fetched via useFacultyQuestions (GET /faculty/question-bank)
 *   with explicit domain + examFamily isolation, never subject inference.
 * - Paper builder stores selectedQuestionIds only.
 * - Paper creation POST uses backend contract with selectedQuestionIds.
 * - Backend unavailable → empty state "Question bank unavailable" / "Connect the EduX backend"
 * - No localStorage as source of truth.
 * - No fallback to seeded/mock.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, FileText, Printer, Save, Send, SlidersHorizontal, ChevronDown, Wand2, AlertTriangle, Database,
} from 'lucide-react'
import { usePaperGeneratorBackend, usePaperCreateBackend, usePaperDeleteBackend, usePaperDuplicateBackend, usePaperRegenerateBackend, usePaperArchiveBackend } from '@/services/faculty-papers'
import { useFacultyQuestions } from '@/services/faculty-questions'
import { Badge, Button, Field, Input, Select, SelectItem, useToast } from '@/components/ui'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { useFilterCascade } from '@/hooks/use-filter-cascade'
import { buildPaperGeneratorCascade } from './paper-generator-cascade'
import {
  PaperCard, PaperPreviewDialog, PaperDeleteDialog, SharePaperDialog,
  PaperQualityPanel, PaperPrintPreview, ShareHistoryList,
  DIFF_STYLES,
} from './paper-parts'
import { formatDate } from '@/utils/format'

function Section({ n, title, subtitle, children, right }) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-[13px] font-bold text-white shadow-md shadow-indigo-500/25">{n}</span>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-[11.5px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

const DIFF_OPTIONS = ['Easy', 'Medium', 'Hard', 'Mixed']
const QTYPE_OPTIONS_UNI = ['MCQ', 'Short Answer', 'Long Answer', 'Numerical', 'Assertion Reason', 'Case Based']
const QTYPE_OPTIONS_COMP = ['MCQ', 'Integer', 'Numerical', 'Assertion Reason', 'Case Based']
const BLOOM_PRESETS = ['Balanced', 'Remember-heavy', 'Understand-heavy', 'Apply-heavy', 'Analyze-heavy', 'Evaluate-heavy', 'Create-heavy']
const WEIGHTAGE_PRESETS = ['Balanced chapters', 'Important chapters', 'Weak-unit heavy', 'Custom']
const CO_PRESETS = ['Balanced CO coverage', 'CO1–CO2 priority', 'CO3–CO4 priority', 'Custom']
const PYQ_PRESETS = ['No PYQs', 'Include PYQs', 'PYQ Balanced', 'PYQ Heavy']
const EXAM_PATTERNS = ['Standard', 'Practice', 'Mock Test']

function PaperGeneratorTab({ data: _intelData, editPaper = null, onClearEdit = null }) {
  const [searchParams] = useSearchParams()
  const toast = useToast()

  // Backend-ready paper library (no mock fallback)
  const { data: paperData, isLoading: libLoading, isError: libError, refetch: refetchLib, error: libErr } = usePaperGeneratorBackend()
  const { mutateAsync: createPaper } = usePaperCreateBackend()
  const { mutateAsync: deletePaper } = usePaperDeleteBackend()
  const { mutateAsync: duplicatePaper } = usePaperDuplicateBackend()
  const { mutateAsync: regeneratePaper } = usePaperRegenerateBackend()
  const { mutateAsync: archivePaper } = usePaperArchiveBackend()

  // Form state — domain isolation explicit
  const [domain, setDomain] = useState(() => (searchParams.get('mode') === 'Competitive' ? 'Competitive' : 'University'))
  const [examFamily, setExamFamily] = useState(() => (searchParams.get('exam') === 'NEET' ? 'NEET' : 'JEE'))
  const [title, setTitle] = useState(() => searchParams.get('title') ?? '')
  const [paperType, setPaperType] = useState('Mid Semester')
  const [program, setProgram] = useState('B.Tech — CSE')
  const [marks, setMarks] = useState(() => searchParams.get('marks') ?? '50')
  const [duration, setDuration] = useState(() => searchParams.get('duration') ?? '120')
  const [questionCount, setQuestionCount] = useState(() => searchParams.get('count') ?? 'Auto')
  const [qTypes, setQTypes] = useState(['MCQ', 'Short Answer', 'Long Answer'])
  const [difficulty, setDifficulty] = useState(() => searchParams.get('difficulty') ?? 'Mixed')
  const [questionTypeFilter, setQuestionTypeFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  // Cascade — backend-oriented, uses config only, not question pools
  const cfg = paperData?.config ?? null
  const cascadeConfig = useMemo(() => ({
    ...buildPaperGeneratorCascade({ mode: domain, exam: examFamily, cfg, bankQuestions: [], compQuestions: [] }),
    initialValues: {
      course: 'CS501 — DSA',
      subject: searchParams.get('subject') ?? 'All subjects',
      chapter: searchParams.get('chapter') ?? 'All chapters',
      topic: searchParams.get('topic') ?? 'All topics',
    },
  }), [domain, examFamily, cfg, searchParams])

  const { values: scopeValues, options: scopeOptions, apply: applyScope } = useFilterCascade(cascadeConfig)
  const { course, subject, chapter, topic } = scopeValues

  const [bloomPreset, setBloomPreset] = useState('Balanced')
  const [weightagePreset, setWeightagePreset] = useState('Balanced chapters')
  const [coPreset, setCoPreset] = useState('Balanced CO coverage')
  const [pyqPreference, setPyqPreference] = useState('Include PYQs')
  const [negativeMarking, setNegativeMarking] = useState('Enabled')
  const [examPattern, setExamPattern] = useState('Standard')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Question bank — backend only, no mock fallback
  const questionFilters = useMemo(() => ({
    domain,
    examFamily: domain === 'Competitive' ? (examFamily === 'NEET' ? 'NEET UG' : 'JEE Main') : undefined,
    subject: subject !== 'All subjects' ? subject : undefined,
    chapter: chapter !== 'All chapters' ? chapter : undefined,
    topic: topic !== 'All topics' ? topic : undefined,
    difficulty: difficulty !== 'Mixed' ? difficulty : undefined,
    questionType: questionTypeFilter !== 'All' ? questionTypeFilter : undefined,
    search: searchQuery || undefined,
    page,
    limit: 50,
  }), [domain, examFamily, subject, chapter, topic, difficulty, questionTypeFilter, searchQuery, page])

  const { data: questionData, isLoading: qLoading, isError: qError, error: qErr, refetch: refetchQuestions } = useFacultyQuestions(questionFilters)

  // Backend returns { questions: [], total, ... } or { summary, questions } depending on implementation
  const availableQuestions = useMemo(() => {
    if (!questionData) return []
    if (Array.isArray(questionData.questions)) return questionData.questions
    if (Array.isArray(questionData.items)) return questionData.items
    if (Array.isArray(questionData)) return questionData
    return []
  }, [questionData])

  const totalQuestions = questionData?.total ?? questionData?.summary?.total ?? availableQuestions.length

  // Paper builder — ID-based only
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)

  // Edit paper from library — load IDs only
  useEffect(() => {
    if (editPaper) {
      setTitle(editPaper.title ?? '')
      setDomain(editPaper.domain ?? editPaper.mode ?? 'University')
      setPaperType(editPaper.paperType ?? editPaper.examType ?? 'Mid Semester')
      applyScope({
        course: editPaper.course ? `${editPaper.course} — ${editPaper.subject ?? ''}`.trim() : 'CS501 — DSA',
        subject: editPaper.subject ?? 'All subjects',
        chapter: editPaper.chapter ?? 'All chapters',
        topic: editPaper.topic ?? 'All topics',
      })
      setExamFamily(editPaper.examFamily ?? editPaper.exam ?? 'JEE')
      setMarks(String(editPaper.totalMarks ?? 50))
      setDuration(String(editPaper.duration ?? 120))
      setQuestionCount(String(editPaper.questions ?? editPaper.questionCount ?? 'Auto'))
      setDifficulty(editPaper.difficulty ?? 'Mixed')
      // ID-based: prefer selectedQuestionIds, fallback to questionList IDs for backward compat
      if (Array.isArray(editPaper.selectedQuestionIds)) {
        setSelectedIds(editPaper.selectedQuestionIds)
      } else if (Array.isArray(editPaper.questionList)) {
        setSelectedIds(editPaper.questionList.map((q) => q.id).filter(Boolean))
      } else if (Array.isArray(editPaper.questions) && typeof editPaper.questions[0] === 'string') {
        setSelectedIds(editPaper.questions)
      }
      onClearEdit?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPaper])

  const papers = paperData?.generatedPapers ?? []

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleQType = (t) => setQTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Paper name required', 'Give the paper a name before creating.')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('Select questions', 'Pick at least one question from the backend question bank.')
      return
    }
    setSaving(true)
    try {
      const res = await createPaper({
        title: title.trim(),
        domain,
        examFamily: domain === 'Competitive' ? examFamily : null,
        mode: domain,
        exam: domain === 'Competitive' ? examFamily : null,
        course: domain === 'University' ? course : `${examFamily} · ${subject}`,
        subject,
        chapter,
        topic,
        program: domain === 'University' ? program : null,
        totalMarks: Number(marks) || 50,
        duration: Number(duration) || 120,
        difficulty,
        questions: selectedIds.length,
        selectedQuestionIds: selectedIds,
        paperType,
        examType: paperType,
        bloomPreset: domain === 'University' ? bloomPreset : null,
        weightagePreset: domain === 'University' ? weightagePreset : null,
        coPreset: domain === 'University' ? coPreset : null,
        pyqPreference: domain === 'Competitive' ? pyqPreference : null,
        negativeMarking: domain === 'Competitive' ? negativeMarking : null,
        examPattern: domain === 'Competitive' ? examPattern : null,
        coverage: 90,
        sets: 1,
        interventionId: searchParams.get('intervention') ?? null,
      })
      if (res?.ok || res?.paper) {
        toast.success('Paper saved to library', `"${title.trim()}" is now in your Paper Library.`)
        setSelectedIds([])
        refetchLib()
      } else {
        toast.error(res?.error ?? 'Could not save', res?.message ?? 'Please try again.')
      }
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Backend unavailable'
      if (String(msg).toLowerCase().includes('backend') || e?.response?.status >= 500 || !e?.response) {
        toast.error('Connect the EduX backend', 'Paper Library is unavailable — start the backend API.')
      } else {
        toast.error('Could not save', msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePaper(deleteTarget.id)
      toast.success('Paper deleted', `${deleteTarget.title} was permanently removed.`)
      setDeleteTarget(null)
      refetchLib()
    } catch {
      toast.error('Could not delete', 'Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (libLoading) return <DashboardSkeleton cards={3} />
  if (libError) {
    // Backend unavailable → empty state, not error throw
    const isBackendDown = !libErr?.response || libErr?.response?.status >= 500
    if (isBackendDown) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <Database className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Paper Library unavailable</p>
          <p className="mt-1 text-xs text-slate-400">Connect the EduX backend to manage question papers.</p>
          <p className="mt-2 text-[11px] text-slate-400">GET {`/faculty/paper-generator`} → {String(libErr?.message ?? 'Network error')}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => refetchLib()}>Retry</Button>
        </div>
      )
    }
    return <ErrorState onRetry={() => refetchLib()} />
  }

  const TYPE_OPTIONS = domain === 'Competitive' ? QTYPE_OPTIONS_COMP : QTYPE_OPTIONS_UNI

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Wand2 className="h-3.5 w-3.5" /> Question Paper Studio · Backend-Ready
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Design, select from backend bank, and publish</h2>
        </div>
        <Badge variant="gradient" className="px-3 py-1"><FileText className="h-3 w-3" /> {papers.length} papers in library</Badge>
      </div>

      {/* Section 1 */}
      <Section n={1} title="Basic details" subtitle="Domain isolation via domain+examFamily, not subject inference.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paper name" required className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={domain === 'Competitive' ? 'e.g. JEE Physics — Mechanics Mock 01' : 'e.g. Mid Semester — DSA — Paper A'} />
          </Field>
          <Field label="Domain" required className="sm:col-span-2">
            <div className="flex rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
              {['University', 'Competitive'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setDomain(m); setPaperType(m === 'University' ? 'Mid Semester' : 'Full Mock Test'); setSelectedIds([]) }}
                  className={`flex-1 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${domain === m ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  {m === 'University' ? '🏛️' : '🎯'} {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Paper type">
            <Select value={paperType} onValueChange={setPaperType}>
              {(cfg?.universityTypes && domain === 'University' ? cfg.universityTypes : cfg?.competitiveTypes && domain === 'Competitive' ? cfg.competitiveTypes : ['Mid Semester', 'End Semester', 'Full Mock Test', 'Practice Test']).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
          {domain === 'Competitive' && (
            <Field label="Exam Family">
              <div className="flex rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
                {['JEE', 'NEET'].map((e) => (
                  <button
                    key={e}
                    onClick={() => { setExamFamily(e); setSelectedIds([]); setPage(1) }}
                    className={`flex-1 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${examFamily === e ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {domain === 'University' && (
            <Field label="Program">
              <Select value={program} onValueChange={setProgram}>
                {(cfg?.programs ?? ['B.Tech — CSE', 'B.Tech — ECE', 'M.Sc — Data Science', 'MBA']).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </Select>
            </Field>
          )}
        </div>
      </Section>

      {/* Section 2 — Syllabus filters backend-oriented */}
      <Section n={2} title="Syllabus / content" subtitle={domain === 'Competitive' ? 'Domain + ExamFamily → Subject → Chapter → Topic — backend filtered.' : 'Domain → Course → Subject → Chapter → Topic — backend filtered.'}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {domain === 'University' && (
            <Field label="Course">
              <Select value={course} onValueChange={(v) => { applyScope({ course: v, subject: v.split(' ')[0] ?? 'All subjects' }); setPage(1); setSelectedIds([]) }} group="paper-generator">
                {scopeOptions.course.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </Select>
            </Field>
          )}
          <Field label="Subject">
            <Select value={subject} onValueChange={(v) => { applyScope({ subject: v }); setPage(1); setSelectedIds([]) }} group="paper-generator" disabled={domain === 'University' && !course} helper={domain === 'University' && !course ? 'Select a course first' : undefined}>
              <SelectItem value="All subjects">All subjects</SelectItem>
              {scopeOptions.subject.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Chapter">
            <Select value={chapter} onValueChange={(v) => { applyScope({ chapter: v }); setPage(1); setSelectedIds([]) }} group="paper-generator" disabled={!subject || subject === 'All subjects'} helper={!subject || subject === 'All subjects' ? 'Select a subject first' : undefined}>
              <SelectItem value="All chapters">All chapters</SelectItem>
              {scopeOptions.chapter.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Topic">
            <Select value={topic} onValueChange={(v) => { applyScope({ topic: v }); setPage(1); setSelectedIds([]) }} group="paper-generator" disabled={!chapter || chapter === 'All chapters'} helper={!chapter || chapter === 'All chapters' ? 'Select a chapter first' : undefined}>
              <SelectItem value="All topics">All topics</SelectItem>
              {scopeOptions.topic.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Search">
            <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }} placeholder="Search questions…" />
          </Field>
        </div>
      </Section>

      {/* Section 3 */}
      <Section n={3} title="Paper configuration" subtitle="Marks, duration, difficulty — backend question selection respects these.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field label="Total marks">
            <Select value={marks} onValueChange={setMarks}>
              {['20', '25', '50', '100', '180', '300', '720'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Duration (minutes)">
            <Select value={duration} onValueChange={setDuration}>
              {(cfg?.durations ?? [60, 90, 120, 150, 180]).map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
            </Select>
          </Field>
          <Field label="Question count">
            <Select value={questionCount} onValueChange={setQuestionCount}>
              {['Auto', '10', '20', '30', '40', '50'].map((c) => <SelectItem key={c} value={c}>{c === 'Auto' ? 'Auto (by marks)' : c}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setPage(1) }}>
              {DIFF_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Question Type filter (backend)">
            <Select value={questionTypeFilter} onValueChange={(v) => { setQuestionTypeFilter(v); setPage(1) }}>
              <SelectItem value="All">All types</SelectItem>
              {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
          <div className="col-span-2 lg:col-span-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Question types (paper blueprint)</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleQType(t)}
                  className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-all ${qTypes.includes(t) ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {qTypes.includes(t) ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Advanced */}
      <Section
        n={4}
        title="Advanced blueprint"
        subtitle="Bloom's taxonomy, chapter weightage, CO coverage · PYQ preference, negative marking, exam pattern"
        right={
          <button onClick={() => setAdvancedOpen(!advancedOpen)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-[11.5px] font-bold text-slate-500 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" /> {advancedOpen ? 'Hide' : 'Show'} advanced options
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
        }
      >
        {!advancedOpen ? (
          <p className="text-[12.5px] text-slate-400">Advanced blueprint controls collapsed — expand to tune Bloom's taxonomy, chapter weightage, CO coverage {domain === 'Competitive' ? 'or PYQ preference, negative marking and exam pattern.' : '.'}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domain === 'University' ? (
              <>
                <Field label="Bloom's taxonomy">
                  <Select value={bloomPreset} onValueChange={setBloomPreset}>
                    {BLOOM_PRESETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Chapter weightage">
                  <Select value={weightagePreset} onValueChange={setWeightagePreset}>
                    {WEIGHTAGE_PRESETS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Course outcome coverage">
                  <Select value={coPreset} onValueChange={setCoPreset}>
                    {CO_PRESETS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </Select>
                </Field>
              </>
            ) : (
              <>
                <Field label="PYQ preference">
                  <Select value={pyqPreference} onValueChange={setPyqPreference}>
                    {PYQ_PRESETS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Negative marking">
                  <Select value={negativeMarking} onValueChange={setNegativeMarking}>
                    <SelectItem value="Enabled">Enabled (−1 per incorrect answer)</SelectItem>
                    <SelectItem value="Disabled">Disabled</SelectItem>
                  </Select>
                </Field>
                <Field label="Exam pattern">
                  <Select value={examPattern} onValueChange={setExamPattern}>
                    {EXAM_PATTERNS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </Select>
                </Field>
              </>
            )}
          </div>
        )}
      </Section>

      {/* Question Bank — Backend only */}
      <Section n={5} title="Question bank · Backend" subtitle={`Domain: ${domain} ${domain === 'Competitive' ? `· ExamFamily: ${examFamily}` : ''} · Filters: subject, chapter, topic, difficulty, questionType, search, page — backend-oriented`}>
        {qLoading && <DashboardSkeleton cards={2} />}
        {qError && (
          <div className="rounded-3xl border border-dashed border-amber-300/70 bg-amber-50/50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/5">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="mt-3 text-sm font-bold text-amber-800 dark:text-amber-200">Question bank unavailable</p>
            <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">Connect the EduX backend to fetch questions.</p>
            <p className="mt-2 text-[11px] text-slate-400">GET /faculty/question-bank?domain={domain}&examFamily={examFamily} → {String(qErr?.message ?? 'Network error')}</p>
            <Button size="sm" variant="outline" className="mt-3 border-amber-300 text-amber-700" onClick={() => refetchQuestions()}>Retry</Button>
          </div>
        )}
        {!qLoading && !qError && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-slate-500">
                {totalQuestions} questions · {availableQuestions.length} on this page · {selectedIds.length} selected (ID-based)
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelectedIds([]) }}>Clear selection</Button>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)}>Next (p{page + 1})</Button>
              </div>
            </div>

            {availableQuestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
                <Database className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No questions match these filters</p>
                <p className="mt-1 text-xs text-slate-400">Try widening domain, examFamily, subject, chapter, difficulty or search.</p>
                <p className="mt-2 text-[11px] text-slate-400">Backend returned 0 results for {JSON.stringify(questionFilters)}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {availableQuestions.map((q) => {
                  const id = q.id ?? q._id
                  const isSelected = selectedIds.includes(id)
                  return (
                    <div key={id} className={`rounded-2xl border p-3.5 transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/5' : 'border-slate-100 bg-white hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900'}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(id)} className="mt-1 h-4 w-4 accent-indigo-600" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary" size="sm">{q.subject ?? q.subjectCode ?? '—'}</Badge>
                            {q.chapter && <Badge variant="outline" size="sm">{q.chapter}</Badge>}
                            {q.topic && <Badge variant="outline" size="sm">{q.topic}</Badge>}
                            {q.difficulty && <Badge variant={DIFF_STYLES[q.difficulty] ?? 'secondary'} size="sm">{q.difficulty}</Badge>}
                            {q.type && <Badge variant="secondary" size="sm">{q.type}</Badge>}
                            {q.questionType && <Badge variant="secondary" size="sm">{q.questionType}</Badge>}
                            {q.exam && <Badge variant="info" size="sm">{q.exam}</Badge>}
                          </div>
                          <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">{q.text ?? q.question ?? '—'}</p>
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                              {q.options.map((opt, i) => (
                                <span key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">({String.fromCharCode(65 + i)}) {opt}</span>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">ID: {id} · Domain: {q.domain ?? domain} · ExamFamily: {q.examFamily ?? examFamily ?? 'University'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div>
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{selectedIds.length} questions selected (ID-based)</p>
                <p className="text-[11px] text-slate-400">Builder stores selectedQuestionIds only — no full objects.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPrintOpen(true)}><Printer className="h-3.5 w-3.5" /> Preview</Button>
                <Button size="sm" onClick={handleCreate} disabled={saving || selectedIds.length === 0}><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : `Save Paper (${selectedIds.length})`}</Button>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Paper Library — backend only, no samplePapers fallback */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <FileText className="h-4 w-4 text-indigo-500" /> Paper Library ({papers.length}) · Backend
          </h2>
          <p className="text-[11px] font-medium text-slate-400">No samplePapers fallback — fetched from backend only.</p>
        </div>
        {papers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No question papers yet.</p>
            <p className="mt-1 text-xs text-slate-400">Select questions from the backend bank above and save your first paper.</p>
            <p className="mt-2 text-[11px] text-slate-400">GET /faculty/paper-generator → {papers.length} papers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {papers.map((p, i) => (
              <PaperCard
                key={p.id}
                paper={p}
                index={i}
                onView={() => { setSelectedPaper(p); setPreviewOpen(true) }}
                onEdit={() => {
                  setTitle(p.title)
                  setDomain(p.domain ?? p.mode ?? 'University')
                  setPaperType(p.paperType ?? p.examType ?? 'Mid Semester')
                  if (Array.isArray(p.selectedQuestionIds)) setSelectedIds(p.selectedQuestionIds)
                  else if (Array.isArray(p.questionList)) setSelectedIds(p.questionList.map((q) => q.id).filter(Boolean))
                }}
                onDuplicate={async (paper) => {
                  try {
                    const res = await duplicatePaper(paper.id)
                    if (res?.ok) { toast.success('Duplicated', `${res.paper.title} added as a copy.`); refetchLib() }
                  } catch { toast.error('Could not duplicate', 'Please try again.') }
                }}
                onDelete={setDeleteTarget}
                onRegenerate={async (paper) => {
                  try {
                    const res = await regeneratePaper(paper.id)
                    if (res?.ok) { toast.success('Regenerated ♻️', `${res.paper.title} → version v1.${res.paper.versions - 1}.`); refetchLib() }
                  } catch { toast.error('Could not regenerate', 'Please try again.') }
                }}
                onArchive={async (paper) => {
                  try {
                    const res = await archivePaper({ id: paper.id, archived: !paper.archived })
                    toast.success(paper.archived ? 'Restored' : 'Archived', `${res.paper?.title ?? paper.title} ${paper.archived ? 'restored.' : 'moved to archive.'}`)
                    refetchLib()
                  } catch { toast.error('Could not archive', 'Please try again.') }
                }}
                onVersions={(paper) => { setSelectedPaper(paper); setVersionsOpen(true) }}
                onShare={setShareTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PaperPrintPreview paper={{ title, totalMarks: Number(marks) || 50, duration: Number(duration) || 120, questions: selectedIds.length, questionList: availableQuestions.filter((q) => selectedIds.includes(q.id ?? q._id)) }} open={printOpen} onOpenChange={setPrintOpen} />
      <SharePaperDialog paper={shareTarget} open={!!shareTarget} onOpenChange={(v) => !v && setShareTarget(null)} />
      <PaperPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} paper={selectedPaper} />
      <PaperDeleteDialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)} paper={deleteTarget} onConfirm={handleDelete} deleting={deleting} />
    </div>
  )
}

export { PaperGeneratorTab }
export default PaperGeneratorTab
