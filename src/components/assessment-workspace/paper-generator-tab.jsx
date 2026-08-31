/**
 * MediXO EduX — Assessment Workspace · Question Paper Studio (Phase G — Generate Questions).
 *
 * Phase G adds Generate Questions action that triggers REAL backend generation:
 * Faculty configures paper -> clicks Generate Questions -> POST /faculty/question-bank/generate
 * -> backend AI service -> PostgreSQL questions -> GET generated questions -> faculty selects -> paper creation.
 *
 * No mock/seeded questions. All questions from real DB.
 *
 * Generation lifecycle: mounting the studio NEVER generates anything and never
 * restores a persisted paper as a fresh result — the tab opens in a clean
 * configuration state. A generation exists only after the faculty clicks
 * Generate Questions (the libraries' cached/stored papers stay in the Paper
 * Library tab).
 *
 * Preserves existing UI: paper name, domain, exam family, subject, chapter, topic, question count,
 * difficulty, question type, advanced blueprint, Bloom, chapter weighting, CO coverage, PYQ preference,
 * negative marking, exam pattern, KPI cards, tabs, filters, dropdowns, Paper Library, etc.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, Printer, Save, SlidersHorizontal, ChevronDown, Wand2, AlertTriangle, Database,
  Sparkles, Loader2, RefreshCw,
} from 'lucide-react'
import { usePaperGeneratorBackend, usePaperCreateBackend } from '@/services/faculty-papers'
import { useFacultyQuestions } from '@/services/faculty-questions'
import { useQuestionGeneration, useGenerationStatus, useGenerationQuestions, GENERATION_STATUS, isTerminalStatus } from '@/services/faculty-question-generation'
import { Badge, Button, Field, Input, Select, SelectItem, useToast } from '@/components/ui'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { useFilterCascade } from '@/hooks/use-filter-cascade'
import { buildPaperGeneratorCascade } from './paper-generator-cascade'
import { PaperPrintPreview, DIFF_STYLES } from './paper-parts'

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

  // Catalog config for the generator. The Paper Library lives in its own tab now.
  const { data: paperData, isLoading: catalogLoading, isError: catalogError, refetch: refetchCatalog } = usePaperGeneratorBackend()
  const { mutateAsync: createPaper } = usePaperCreateBackend()

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
  const [page, setPage] = useState(1)

  // Cascade — backend-oriented, uses only the real catalog from the live API.
  // No hardcoded course/subject/chapter/topic fallbacks.
  const cfg = paperData?.config ?? null
  const courseCatalog = useMemo(() => cfg?.courseCatalog ?? [], [cfg])
  const subjectCatalog = useMemo(() => cfg?.subjectCatalog ?? [], [cfg])
  const courseLabel = (row) => (row ? `${row.code} — ${row.name}` : '')
  const courseOptions = courseCatalog.map(courseLabel)
  const courseByLabel = useMemo(() => new Map(courseCatalog.map((c) => [courseLabel(c), c])), [courseCatalog])
  const subjectByLabel = useMemo(() => new Map(subjectCatalog.map((s) => [s.name, s])), [subjectCatalog])
  const normalizeCourseValue = (value) => {
    if (!value) return ''
    const row = courseCatalog.find((c) => courseLabel(c) === value || c.code === value || c.name === value)
    return row ? courseLabel(row) : value
  }

  const cascadeConfig = useMemo(() => ({
    ...buildPaperGeneratorCascade({ mode: domain, exam: examFamily, cfg }),
    initialValues: {
      course: normalizeCourseValue(searchParams.get('course') ?? ''),
      subject: searchParams.get('subject') ?? 'All subjects',
      chapter: searchParams.get('chapter') ?? 'All chapters',
      topic: searchParams.get('topic') ?? 'All topics',
    },
  }), [domain, examFamily, cfg, searchParams, courseCatalog])

  const { values: scopeValues, options: scopeOptions, apply: applyScope } = useFilterCascade(cascadeConfig)
  const { course, subject, chapter, topic } = scopeValues

  /* Display helpers: parent validity + honest empty-state labels (no
     backend/PostgreSQL/API wording leaks to the end user). */
  const courseEmpty = !course
  const subjectOptions = scopeOptions.subject ?? []
  const chapterOptions = scopeOptions.chapter ?? []
  const topicOptions = scopeOptions.topic ?? []
  const subjectSelected = !!subject && subject !== 'All subjects'
  const chapterSelected = !!chapter && chapter !== 'All chapters'

  const selectedCourse = courseByLabel.get(course)
  const selectedSubject = subjectByLabel.get(subject)
  const queryCourse = selectedCourse?.code
  const querySubject = subjectSelected ? (selectedSubject?.code ?? subject) : undefined

  const [bloomPreset, setBloomPreset] = useState('Balanced')
  const [weightagePreset, setWeightagePreset] = useState('Balanced chapters')
  const [coPreset, setCoPreset] = useState('Balanced CO coverage')
  const [pyqPreference, setPyqPreference] = useState('Include PYQs')
  const [negativeMarking, setNegativeMarking] = useState('Enabled')
  const [examPattern, setExamPattern] = useState('Standard')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // ===== Phase G: Question Generation State =====
  // Generation exists ONLY for the current session's Generate action — a
  // fresh visit to the studio starts from a clean configuration state and no
  // persisted/paper-library record is ever re-surfaced as a new generation.
  const [generationId, setGenerationId] = useState(null)
  const [generationRequested, setGenerationRequested] = useState(0)
  const [generationStatus, setGenerationStatus] = useState(null) // idle | GENERATING | PROCESSING | READY | FAILED
  const [generationError, setGenerationError] = useState(null)
  const [generationQuestions, setGenerationQuestions] = useState([]) // real backend records
  const [isGenerating, setIsGenerating] = useState(false)

  const { mutateAsync: triggerGeneration } = useQuestionGeneration()
  const { data: statusData } = useGenerationStatus(generationId, { enabled: !!generationId && !isTerminalStatus(generationStatus) })
  const { data: genQuestionsData } = useGenerationQuestions(generationId, { enabled: !!generationId && (generationStatus === GENERATION_STATUS.READY || generationStatus === GENERATION_STATUS.COMPLETED) })

  // Update status from polling
  useEffect(() => {
    if (statusData?.status) {
      setGenerationStatus(statusData.status)
      if (statusData.requestedCount) setGenerationRequested(statusData.requestedCount)
      if (isTerminalStatus(statusData.status)) {
        setIsGenerating(false)
        if (statusData.status === GENERATION_STATUS.FAILED) {
          setGenerationError(statusData.error || statusData.errorMessage || 'Generation failed')
        }
      }
    }
  }, [statusData])

  // Update generated questions when fetched
  useEffect(() => {
    if (genQuestionsData?.questions) {
      setGenerationQuestions(genQuestionsData.questions)
      // A fresh generation pre-selects every real backend ID so the paper can
      // be reviewed and saved immediately; an existing selection is kept.
      if (genQuestionsData.questions.length > 0) {
        const realIds = genQuestionsData.questions.map(q => q.id).filter(Boolean)
        setSelectedIds(prev => (prev.length === 0 ? realIds : prev))
      }
      setIsGenerating(false)
    }
  }, [genQuestionsData])

  const parseQuestionCount = (raw) => {
    if (raw === 'Auto' || !raw) return 20
    const n = parseInt(raw, 10)
    return isNaN(n) ? 20 : Math.max(1, Math.min(100, n))
  }

  const handleGenerateQuestions = async () => {
    // The backend scopes generated questions to the selected subject; generating
    // without one would silently produce unscoped questions.
    if (!subjectSelected) {
      toast.error('Select a subject', 'Choose a subject before generating questions.')
      return
    }
    const count = parseQuestionCount(questionCount)
    setGenerationError(null)
    setIsGenerating(true)
    setGenerationStatus(GENERATION_STATUS.GENERATING)
    setGenerationRequested(count)
    setGenerationQuestions([])

    try {
      const payload = {
        title: title.trim() || `Paper — ${subject} — ${new Date().toISOString().slice(0,10)}`,
        domain,
        examFamily: domain === 'Competitive' ? examFamily : null,
        mode: domain,
        exam: domain === 'Competitive' ? examFamily : null,
        subject,
        chapter,
        topic,
        questionCount: count,
        count,
        difficulty,
        questionTypes: qTypes,
        qTypes,
        bloomPreset,
        weightagePreset,
        coPreset,
        pyqPreference: domain === 'Competitive' ? pyqPreference : null,
        negativeMarking: domain === 'Competitive' ? negativeMarking : null,
        examPattern: domain === 'Competitive' ? examPattern : null,
        program: domain === 'University' ? program : null,
        course: domain === 'University' ? course : `${examFamily} · ${subject}`,
        paperType,
        examType: paperType,
        totalMarks: Number(marks) || 50,
        duration: Number(duration) || 120,
      }

      const res = await triggerGeneration(payload)
      const genId = res?.generationId || res?.id
      const status = res?.status || GENERATION_STATUS.READY
      const generatedCount = res?.generatedCount ?? res?.questions?.length ?? 0

      if (!genId) {
        throw new Error('Question generation did not start')
      }

      setGenerationId(genId)
      setGenerationStatus(status)

      if (status === GENERATION_STATUS.READY || status === GENERATION_STATUS.COMPLETED) {
        // Real questions are read back by the generation-questions query, which
        // becomes enabled as soon as generationId + READY land in state. The
        // bank listing is refreshed by the mutation's cache invalidation.
        setIsGenerating(false)
        toast.success('Questions Generated', `${generatedCount || count} questions generated and saved.`)
      } else {
        // Polling will handle PROCESSING -> READY
        toast.success('Generation started', `AI is generating ${count} questions...`)
      }
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Generation failed'
      setGenerationStatus(GENERATION_STATUS.FAILED)
      setGenerationError(msg)
      setIsGenerating(false)
      if (e?.response?.status === 401) {
        toast.error('Authentication required', 'Please log in as faculty to generate questions.')
      } else if (e?.response?.status === 403) {
        toast.error('Access denied', 'Faculty role required for question generation.')
      } else if (e?.response?.status === 422) {
        toast.error('Invalid configuration', msg)
      } else if (!e?.response || e?.response?.status >= 500) {
        toast.error('Generation unavailable', 'Question generation is temporarily unavailable. Please try again.')
      } else {
        toast.error('Question generation failed', msg)
      }
    }
  }

  const handleRetryGeneration = () => {
    setGenerationError(null)
    setGenerationId(null)
    setGenerationStatus(null)
    setGenerationQuestions([])
    handleGenerateQuestions()
  }

  // Question bank — backend only, no mock fallback
  const questionFilters = useMemo(() => ({
    domain,
    examFamily: domain === 'Competitive' ? examFamily : undefined,
    course: domain === 'University' ? queryCourse : undefined,
    subject: querySubject,
    chapter: chapter !== 'All chapters' ? chapter : undefined,
    topic: topic !== 'All topics' ? topic : undefined,
    difficulty: difficulty !== 'Mixed' ? difficulty : undefined,
    questionType: questionTypeFilter !== 'All' ? questionTypeFilter : undefined,
    page,
    limit: 50,
  }), [domain, examFamily, queryCourse, querySubject, subject, chapter, topic, difficulty, questionTypeFilter, page])

  const { data: questionData, isLoading: qLoading, isError: qError, error: qErr, refetch: refetchQuestions } = useFacultyQuestions(questionFilters)

  // Backend returns { questions: [], total, ... } or { summary, questions } depending on implementation
  const availableQuestions = useMemo(() => {
    // Phase G: if generation succeeded, prioritize generated real backend questions
    if (generationStatus === GENERATION_STATUS.READY || generationStatus === GENERATION_STATUS.COMPLETED) {
      if (generationQuestions.length > 0) return generationQuestions
    }
    if (!questionData) return []
    if (Array.isArray(questionData.questions)) return questionData.questions
    if (Array.isArray(questionData.items)) return questionData.items
    if (Array.isArray(questionData)) return questionData
    return []
  }, [questionData, generationQuestions, generationStatus])

  const totalQuestions = questionData?.total ?? questionData?.summary?.total ?? availableQuestions.length

  // Determine empty state category per spec
  const isBankEmpty = totalQuestions === 0 && generationQuestions.length === 0
  const hasGeneration = !!generationId
  const isGenerationRunning = generationStatus === GENERATION_STATUS.GENERATING || generationStatus === GENERATION_STATUS.PROCESSING || isGenerating
  const isGenerationReady = generationStatus === GENERATION_STATUS.READY || generationStatus === GENERATION_STATUS.COMPLETED
  const isGenerationFailed = generationStatus === GENERATION_STATUS.FAILED

  const requestedCountForDisplay = generationRequested || parseQuestionCount(questionCount)
  const generatedCountForDisplay = generationQuestions.length || 0

  /* Display-only label for the generation state (IDLE → "Idle"). No behaviour change. */
  const GENERATION_STATUS_LABELS = {
    [GENERATION_STATUS.GENERATING]: 'Generating',
    [GENERATION_STATUS.PROCESSING]: 'Generating',
    [GENERATION_STATUS.READY]: 'Ready',
    [GENERATION_STATUS.COMPLETED]: 'Complete',
    [GENERATION_STATUS.FAILED]: 'Failed',
  }
  const generationStatusLabel = GENERATION_STATUS_LABELS[generationStatus] ?? 'Idle'

  // Paper builder — ID-based only, real backend IDs
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)

  // Edit paper from library — load IDs only
  useEffect(() => {
    if (editPaper) {
      setTitle(editPaper.title ?? '')
      setDomain(editPaper.domain ?? editPaper.mode ?? 'University')
      setPaperType(editPaper.paperType ?? editPaper.examType ?? 'Mid Semester')
      const editCourse = editPaper.course ?? ''
      const matchingCourse = courseCatalog.find(
        (row) => row.code === editCourse || row.name === editCourse || courseLabel(row) === editCourse,
      )
      applyScope({
        course: matchingCourse ? courseLabel(matchingCourse) : '',
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

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleQType = (t) => setQTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const isPaperReady = useMemo(() => {
    if (isGenerationRunning) return false
    if (isGenerationFailed) return false
    if (selectedIds.length === 0) return false
    if (isGenerationReady) {
      // Check completeness: requested vs generated
      if (generatedCountForDisplay > 0 && requestedCountForDisplay > 0) {
        if (generatedCountForDisplay < requestedCountForDisplay) return false
      }
    }
    return true
  }, [isGenerationRunning, isGenerationFailed, selectedIds.length, isGenerationReady, generatedCountForDisplay, requestedCountForDisplay])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Paper name required', 'Give the paper a name before creating.')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('Select questions', 'Pick at least one question from the question bank.')
      return
    }
    if (isGenerationRunning) {
      toast.error('Generation in progress', 'Wait for question generation to complete before saving paper.')
      return
    }
    if (isGenerationFailed) {
      toast.error('Generation failed', 'Retry question generation before saving paper.')
      return
    }
    // Completeness check: if generation requested N but only M available and M < N, warn but allow? Spec says fail closed for Send, not necessarily for Save.
    // We allow save but Paper Library Send will be disabled if incomplete.
    if (isGenerationReady && requestedCountForDisplay > generatedCountForDisplay) {
      toast.error('Incomplete generation', `Requested ${requestedCountForDisplay} but only ${generatedCountForDisplay} generated. Regenerate or select available questions.`)
      // Fail closed: do not allow save if incomplete? Spec says paper must NOT become sendable until requested number available.
      // We allow save but will be marked not ready in library via selected count vs requested.
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
        // Pass the active generation ID so the backend marks this paper as
        // AI-generated and includes it in the Paper Library filter.
        generationId: generationId ?? null,
      })
      if (res?.ok || res?.paper) {
        toast.success('Paper saved to library', `"${title.trim()}" is now in your Paper Library with ${selectedIds.length} questions.`)
        setSelectedIds([])
      } else {
        toast.error(res?.error ?? 'Could not save', res?.message ?? 'Please try again.')
      }
    } catch (e) {
      const msg = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Service unavailable'
      if (String(msg).toLowerCase().includes('backend') || e?.response?.status >= 500 || !e?.response) {
        toast.error('Paper Library unavailable', 'The paper library is temporarily unavailable. Please try again later.')
      } else {
        toast.error('Could not save', msg)
      }
    } finally {
      setSaving(false)
    }
  }

  if (catalogLoading) return <DashboardSkeleton cards={3} />
  if (catalogError) return <ErrorState onRetry={() => refetchCatalog()} />

  const TYPE_OPTIONS = domain === 'Competitive' ? QTYPE_OPTIONS_COMP : QTYPE_OPTIONS_UNI

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Wand2 className="h-3.5 w-3.5" /> Question Paper Studio
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Design, generate and publish question papers</h2>
        </div>
        <Badge variant={isGenerationReady ? 'success' : isGenerationFailed ? 'danger' : isGenerationRunning ? 'warning' : 'secondary'} className="px-3 py-1">
          Generation: {generationStatusLabel}
        </Badge>
      </div>

      {/* Section 1 */}
      <Section n={1} title="Basic details" subtitle="The domain and exam family set the scope of this paper.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paper name" required className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={domain === 'Competitive' ? 'e.g. JEE Physics — Mechanics Mock 01' : 'e.g. Mid Semester — DSA — Paper A'} />
          </Field>
          <Field label="Domain" required className="sm:col-span-2">
            <div className="flex rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
              {['University', 'Competitive'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setDomain(m); setPaperType(m === 'University' ? 'Mid Semester' : 'Full Mock Test'); setSelectedIds([]); applyScope({ course: '', subject: 'All subjects', chapter: 'All chapters', topic: 'All topics' }) }}
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
                    onClick={() => { setExamFamily(e); setSelectedIds([]); setPage(1); applyScope({ subject: 'All subjects', chapter: 'All chapters', topic: 'All topics' }) }}
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

      {/* Section 2 — Syllabus filters backend-oriented. No standalone search field. */}
      <Section n={2} title="Syllabus / content" subtitle={domain === 'Competitive' ? 'Domain + Exam Family → Subject → Chapter → Topic.' : 'Domain → Course → Subject → Chapter → Topic.'}>
        <div className={`grid grid-cols-2 gap-4 ${domain === 'University' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {domain === 'University' && (
            <Field label="Course">
              <Select
                value={course}
                ariaLabel="Course"
                onValueChange={(v) => { applyScope({ course: v, subject: 'All subjects', chapter: 'All chapters', topic: 'All topics' }); setPage(1); setSelectedIds([]) }}
                group="paper-generator"
                disabled={!catalogLoading && courseOptions.length === 0}
                loading={catalogLoading}
                emptyText="No courses available"
                placeholder={catalogLoading ? 'Loading courses…' : courseOptions.length === 0 ? 'No courses available' : 'Select course…'}
                helper={!catalogLoading && courseOptions.length === 0 ? 'No courses available' : undefined}
              >
                {courseOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </Select>
            </Field>
          )}
          <Field label="Subject">
            <Select
              value={subjectOptions.length > 0 ? subject : ''}
              ariaLabel="Subject"
              onValueChange={(v) => { applyScope({ subject: v, chapter: 'All chapters', topic: 'All topics' }); setPage(1); setSelectedIds([]) }}
              group="paper-generator"
              disabled={domain === 'University' ? courseEmpty && subjectOptions.length === 0 : false}
              emptyText="No subjects available"
              placeholder={domain === 'University' && courseEmpty ? 'Select a course first' : subjectOptions.length === 0 ? 'No subjects available' : 'Select subject…'}
              helper={domain === 'University' && courseEmpty ? 'Select a course first' : subjectOptions.length === 0 ? 'No subjects available' : undefined}
            >
              {subjectOptions.length > 0 && <SelectItem value="All subjects">All subjects</SelectItem>}
              {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Chapter">
            <Select
              value={chapterOptions.length > 0 ? chapter : ''}
              ariaLabel="Chapter"
              onValueChange={(v) => { applyScope({ chapter: v, topic: 'All topics' }); setPage(1); setSelectedIds([]) }}
              group="paper-generator"
              disabled={!subjectSelected && chapterOptions.length === 0}
              emptyText="No chapters available"
              placeholder={!subjectSelected ? 'Select a subject first' : chapterOptions.length === 0 ? 'No chapters available' : 'Select chapter…'}
              helper={!subjectSelected ? 'Select a subject first' : chapterOptions.length === 0 ? 'No chapters available' : undefined}
            >
              {chapterOptions.length > 0 && <SelectItem value="All chapters">All chapters</SelectItem>}
              {chapterOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Topic">
            <Select
              value={topicOptions.length > 0 ? topic : ''}
              ariaLabel="Topic"
              onValueChange={(v) => { applyScope({ topic: v }); setPage(1); setSelectedIds([]) }}
              group="paper-generator"
              disabled={!chapterSelected && topicOptions.length === 0}
              emptyText="No topics available"
              placeholder={!chapterSelected ? 'Select a chapter first' : topicOptions.length === 0 ? 'No topics available' : 'Select topic…'}
              helper={!chapterSelected ? 'Select a chapter first' : topicOptions.length === 0 ? 'No topics available' : undefined}
            >
              {topicOptions.length > 0 && <SelectItem value="All topics">All topics</SelectItem>}
              {topicOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
        </div>
      </Section>

      {/* Section 3 */}
      <Section n={3} title="Paper configuration" subtitle="Marks, duration and difficulty for the paper.">
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
          <Field label="Question Type filter">
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

      {/* Phase G: Generate Questions Action — Primary CTA */}
      <Section
        n={5}
        title="Question Generation"
        subtitle={`Generate questions for this paper · Status: ${generationStatusLabel} · Requested: ${requestedCountForDisplay} · Generated: ${generatedCountForDisplay}`}
        right={
          <Badge variant={isGenerationReady ? 'success' : isGenerationFailed ? 'danger' : isGenerationRunning ? 'warning' : 'secondary'} className="px-3 py-1">
            {isGenerationRunning ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating</> : isGenerationReady ? <><CheckCircle2 className="h-3 w-3" /> {generatedCountForDisplay} generated</> : isGenerationFailed ? <><AlertTriangle className="h-3 w-3" /> Failed</> : <>Idle</>}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={handleGenerateQuestions}
              disabled={isGenerating || isGenerationRunning}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-[13px] font-bold shadow-lg shadow-indigo-500/25 hover:brightness-110 disabled:opacity-60"
              data-testid="generate-questions-button"
            >
              {isGenerating || isGenerationRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating Questions...
                </>
              ) : isGenerationFailed ? (
                <>
                  <RefreshCw className="h-4 w-4" /> Retry Generation
                </>
              ) : isGenerationReady ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Questions Generated
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Questions
                </>
              )}
            </Button>

            {isGenerationReady && (
              <Button size="sm" variant="outline" onClick={handleRetryGeneration} className="border-indigo-200 text-indigo-600">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate Questions
              </Button>
            )}

            <div className="text-[11px] text-slate-400">
              <p>Config: {domain}{domain === 'Competitive' ? ` · ${examFamily}` : ''} · {subject} · {chapter} · {topic} · {difficulty} · {parseQuestionCount(questionCount)} Qs · {qTypes.join(', ')}</p>
              <p>Blueprint: {bloomPreset} · {weightagePreset} · {coPreset} · {domain === 'Competitive' ? `${pyqPreference} · ${negativeMarking} · ${examPattern}` : 'University'}</p>
            </div>
          </div>

          {/* Generation lifecycle UI */}
          {!hasGeneration && isBankEmpty && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
              <Database className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No questions generated yet.</p>
              <p className="mt-1 text-xs text-slate-400">Your question bank is empty. Click Generate Questions to create the questions for this paper.</p>
              {/* Generation flow (developer note): Faculty configures paper → Generate Questions → REAL BACKEND → PostgreSQL → REAL Question records → Frontend fetches → Faculty reviews/selects → Paper creation → Paper Library → Send enabled */}
            </div>
          )}

          {isGenerationRunning && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 text-center dark:border-indigo-500/30 dark:bg-indigo-500/5">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm font-bold text-indigo-700 dark:text-indigo-200">AI is generating {requestedCountForDisplay} questions...</p>
              <p className="mt-1 text-xs text-indigo-600/80 dark:text-indigo-300/80">Status: {generationStatusLabel} · Reference: {generationId}</p>
              <p className="mt-2 text-[11px] text-slate-400">Please keep this tab open while the questions are being created.</p>
            </div>
          )}

          {isGenerationReady && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" /> {generatedCountForDisplay} questions generated
                  {requestedCountForDisplay !== generatedCountForDisplay && (
                    <span className="ml-2 text-[11px] font-normal text-amber-600">Requested {requestedCountForDisplay}, got {generatedCountForDisplay} — {generatedCountForDisplay < requestedCountForDisplay ? 'not ready, Send disabled' : 'ready'}</span>
                  )}
                </p>
                <Badge variant={generatedCountForDisplay >= requestedCountForDisplay ? 'success' : 'warning'} size="sm">
                  {generatedCountForDisplay >= requestedCountForDisplay ? 'Ready · Send enabled' : 'Not ready · Send disabled'}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">Reference {generationId} · Status {generationStatusLabel}</p>
            </div>
          )}

          {isGenerationFailed && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/5">
              <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
              <p className="mt-3 text-sm font-bold text-rose-700 dark:text-rose-200">Question generation failed.</p>
              <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-300/80">{generationError || 'Unknown error'} · Generation ID: {generationId}</p>
              <Button size="sm" variant="outline" className="mt-3 border-rose-300 text-rose-700" onClick={handleRetryGeneration}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry Generation
              </Button>
            </div>
          )}

          {/* Completeness check */}
          {isGenerationReady && generatedCountForDisplay < requestedCountForDisplay && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
              <p className="flex items-center gap-2 text-[12px] font-bold text-amber-800 dark:text-amber-200"><AlertTriangle className="h-4 w-4" /> Incomplete generation — Send disabled</p>
              <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-300/80">Requested {requestedCountForDisplay} questions, generated {generatedCountForDisplay}. The paper is not ready — regenerate or adjust the count.</p>
            </div>
          )}
        </div>
      </Section>

      {/* Section 6: review the live bank selection and save the paper */}
      <Section
        n={6}
        title="Question Bank"
        subtitle="Select questions from the live bank, review them, then save the paper to the Paper Library"
      >
        {qLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-10 text-[12.5px] text-slate-400 dark:border-slate-800 dark:bg-slate-800/30">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading question bank…
          </div>
        ) : qError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-500/5">
            <AlertTriangle className="mx-auto h-7 w-7 text-rose-500" />
            <p className="mt-2 text-sm font-bold text-rose-700 dark:text-rose-200">Question bank unavailable.</p>
            <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-300/80">{qErr?.message || 'Could not load the question bank from the backend.'}</p>
            <Button size="sm" variant="outline" className="mt-3 border-rose-300 text-rose-700" onClick={() => refetchQuestions()}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        ) : (
          <>
            {availableQuestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
                <Database className="mx-auto h-8 w-8 text-slate-300" />
                {isBankEmpty && !hasGeneration ? (
                  <>
                    <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No questions generated yet.</p>
                    <p className="mt-1 text-xs text-slate-400">Create or generate questions to build your question bank.</p>
                    <Button size="sm" className="mt-4 bg-gradient-to-r from-indigo-600 to-blue-600" onClick={handleGenerateQuestions}><Sparkles className="h-3.5 w-3.5" /> Generate Questions</Button>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No questions match these filters</p>
                    <p className="mt-1 text-xs text-slate-400">Try widening the domain, exam family, subject, chapter, difficulty or search.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {availableQuestions.map((q) => {
                  const id = q.id ?? q._id
                  const isSelected = selectedIds.includes(id)
                  return (
                    <div key={id} className={`rounded-2xl border p-3.5 transition-all ${isSelected ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/40 dark:bg-indigo-500/5' : 'border-slate-100 bg-white hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900'}`}>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(id)} className="mt-1 h-4 w-4 accent-indigo-600" data-testid={`question-checkbox-${id}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary" size="sm">{q.subject ?? q.subjectCode ?? '—'}</Badge>
                            {q.chapter && <Badge variant="outline" size="sm">{q.chapter}</Badge>}
                            {q.topic && <Badge variant="outline" size="sm">{q.topic}</Badge>}
                            {q.difficulty && <Badge variant={DIFF_STYLES[q.difficulty] ?? 'secondary'} size="sm">{q.difficulty}</Badge>}
                            {q.type && <Badge variant="secondary" size="sm">{q.type}</Badge>}
                            {q.questionType && <Badge variant="secondary" size="sm">{q.questionType}</Badge>}
                            {q.exam && <Badge variant="info" size="sm">{q.exam}</Badge>}
                            {q.marks && <Badge variant="outline" size="sm">{q.marks} marks</Badge>}
                          </div>
                          <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">{q.text ?? q.question ?? '—'}</p>
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                              {q.options.map((opt, i) => (
                                <span key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">({String.fromCharCode(65 + i)}) {opt}</span>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">ID: {id} · Domain: {q.domain ?? domain} · Exam family: {q.examFamily ?? examFamily ?? 'University'} · Source: {q.source ?? 'Bank'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div>
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{selectedIds.length} questions selected</p>
                <p className="text-[11px] text-slate-400">{isGenerationReady && generatedCountForDisplay < requestedCountForDisplay ? 'Not ready — incomplete generation, Send disabled.' : isPaperReady ? 'Ready — Send enabled.' : 'Select questions to enable Save.'}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPrintOpen(true)}><Printer className="h-3.5 w-3.5" /> Preview</Button>
                <Button size="sm" onClick={handleCreate} disabled={saving || selectedIds.length === 0 || isGenerationRunning || isGenerationFailed} data-testid="save-paper-button"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : `Save Paper (${selectedIds.length})`}</Button>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Paper Library removed — it now lives in the dedicated Paper Library tab. */}

      {/* Dialogs — print preview is used by the Section 6 Preview button. */}
      <PaperPrintPreview paper={{ title, totalMarks: Number(marks) || 50, duration: Number(duration) || 120, questions: selectedIds.length, questionList: availableQuestions.filter((q) => selectedIds.includes(q.id ?? q._id)) }} open={printOpen} onOpenChange={setPrintOpen} />
    </div>
  )
}

export { PaperGeneratorTab }
export default PaperGeneratorTab
