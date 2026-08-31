/**
 * MediXO EduX — Assessment Workspace · Question Paper Studio.
 *
 * Generate Paper triggers the REAL deployed AI generation agent:
 * Faculty configures paper -> clicks Generate Paper
 * -> POST /faculty/question-bank/generate (complete configuration)
 * -> backend creates a generation identity and submits the job to the deployed
 *    AI agent -> backend persists the agent's real questions to PostgreSQL and
 *    links them to the generation -> GET generation/{id}/questions returns ONLY
 *    those questions -> faculty reviews/selects -> Save Paper -> status READY.
 *
 * One unified generation workflow:
 * Paper Configuration -> Generate Paper -> AI generates -> Review questions -> Save Paper -> Paper Library.
 * No separate or duplicate Question Bank section.
 *
 * Edit Paper workflow:
 * READY paper -> Faculty clicks Edit -> DRAFT -> Modify paper/questions -> Confirm Changes -> READY.
 *
 * No mock/seeded/fallback questions. Displays ONLY the questions of the
 * CURRENT generation request.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, Printer, Save, SlidersHorizontal, ChevronDown, Wand2, AlertTriangle, Database,
  Sparkles, Loader2, RefreshCw, X, Pencil,
} from 'lucide-react'
import { usePaperGeneratorBackend, usePaperCreateBackend, usePaperUpdateBackend } from '@/services/faculty-papers'
import { useQuestionGeneration, useGenerationStatus, useGenerationQuestions, useCurrentGeneration, GENERATION_STATUS, isTerminalStatus } from '@/services/faculty-question-generation'
import { Badge, Button, Field, Input, Select, SelectItem, useToast } from '@/components/ui'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { useFilterCascade } from '@/hooks/use-filter-cascade'
import { buildPaperGeneratorCascade } from './paper-generator-cascade'
import { PaperPrintPreview, DIFF_STYLES } from './paper-parts'
import { optionText } from '@/api/adapters/questions'

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
  const { mutateAsync: updatePaperBackend } = usePaperUpdateBackend()

  // Edit mode tracking
  const [editingPaperId, setEditingPaperId] = useState(null)
  const isEditing = !!editingPaperId

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

  // Cascade — backend-oriented, uses only the real catalog from the live API.
  const cfg = paperData?.config ?? null
  const courseCatalog = useMemo(() => cfg?.courseCatalog ?? [], [cfg])
  const courseLabel = (row) => (row ? `${row.code} — ${row.name}` : '')
  const courseOptions = courseCatalog.map(courseLabel)
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

  const courseEmpty = !course
  const subjectOptions = scopeOptions.subject ?? []
  const chapterOptions = scopeOptions.chapter ?? []
  const topicOptions = scopeOptions.topic ?? []
  const subjectSelected = !!subject && subject !== 'All subjects'
  const chapterSelected = !!chapter && chapter !== 'All chapters'

  const [bloomPreset, setBloomPreset] = useState('Balanced')
  const [weightagePreset, setWeightagePreset] = useState('Balanced chapters')
  const [coPreset, setCoPreset] = useState('Balanced CO coverage')
  const [pyqPreference, setPyqPreference] = useState('Include PYQs')
  const [negativeMarking, setNegativeMarking] = useState('Enabled')
  const [examPattern, setExamPattern] = useState('Standard')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // ===== Question Generation State =====
  const [generationId, setGenerationId] = useState(null)
  const [generationRequested, setGenerationRequested] = useState(0)
  const [generationStatus, setGenerationStatus] = useState(null) // idle | GENERATING | PROCESSING | READY | FAILED
  const [generationError, setGenerationError] = useState(null)
  const [generationQuestions, setGenerationQuestions] = useState([]) // real backend records
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationTriggered, setGenerationTriggered] = useState(false)
  const generationStartedInSession = useRef(false)

  // Paper builder — ID-based only, real backend IDs
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)

  const { mutateAsync: triggerGeneration } = useQuestionGeneration()
  const { data: currentGeneration } = useCurrentGeneration()
  const { data: statusData } = useGenerationStatus(generationId, { enabled: !!generationId && !isTerminalStatus(generationStatus) })
  const { data: genQuestionsData } = useGenerationQuestions(generationId, { enabled: !!generationId && (generationStatus === GENERATION_STATUS.READY || generationStatus === GENERATION_STATUS.COMPLETED) })

  // Refresh/navigation recovery — rehydrate the persisted current generation
  // identity without generating again. When no current generation exists the
  // studio stays in the clean empty state. Never overrides a generation that
  // was started in THIS session or an active edit session.
  useEffect(() => {
    if (isEditing || !currentGeneration?.id || generationStartedInSession.current) return
    if (generationId === currentGeneration.id) return
    setGenerationId(currentGeneration.id)
    setGenerationStatus(currentGeneration.status ?? null)
    setGenerationRequested(currentGeneration.requestedCount ?? 0)
    if (currentGeneration.errorMessage) setGenerationError(currentGeneration.errorMessage)
    setGenerationTriggered(false)
  }, [currentGeneration, generationId, isEditing])

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

  // Update generated questions when fetched.
  useEffect(() => {
    if (genQuestionsData?.questions) {
      setGenerationQuestions(genQuestionsData.questions)
      if (generationTriggered && genQuestionsData.questions.length > 0) {
        const realIds = genQuestionsData.questions.map(q => q.id).filter(Boolean)
        setSelectedIds(prev => (prev.length === 0 ? realIds : prev))
      }
      setIsGenerating(false)
    }
  }, [genQuestionsData, generationTriggered])

  // Edit paper from library — load details and questions
  useEffect(() => {
    if (editPaper) {
      setEditingPaperId(editPaper.id)
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

      // Load question list or IDs
      if (Array.isArray(editPaper.questionList) && editPaper.questionList.length > 0) {
        setGenerationQuestions(editPaper.questionList)
        setGenerationStatus(GENERATION_STATUS.READY)
        setSelectedIds(editPaper.questionList.map((q) => q.id ?? q.questionId).filter(Boolean))
      } else if (Array.isArray(editPaper.selectedQuestionIds) && editPaper.selectedQuestionIds.length > 0) {
        setSelectedIds(editPaper.selectedQuestionIds)
        setGenerationStatus(GENERATION_STATUS.READY)
      } else if (Array.isArray(editPaper.questions) && typeof editPaper.questions[0] === 'string') {
        setSelectedIds(editPaper.questions)
        setGenerationStatus(GENERATION_STATUS.READY)
      }
    }
  }, [editPaper, courseCatalog])

  const handleCancelEdit = () => {
    setEditingPaperId(null)
    setTitle('')
    setGenerationId(null)
    setGenerationStatus(null)
    setGenerationQuestions([])
    setSelectedIds([])
    setGenerationError(null)
    setIsGenerating(false)
    setGenerationTriggered(false)
    generationStartedInSession.current = false
    onClearEdit?.()
  }

  const parseQuestionCount = (raw) => {
    if (raw === 'Auto' || !raw) return 20
    const n = parseInt(raw, 10)
    return isNaN(n) ? 20 : Math.max(1, Math.min(100, n))
  }

  const handleGenerateQuestions = async () => {
    // Prevent accidental double clicks
    if (isGenerating || isGenerationRunning) return

    const universitySubjectMissing = domain === 'University' && !subjectSelected
    if (universitySubjectMissing || (subject !== 'All subjects' && !subjectSelected)) {
      toast.error('Select a subject', domain === 'University' ? 'Choose a course and subject before generating questions.' : 'Choose a subject before generating questions.')
      return
    }
    const count = parseQuestionCount(questionCount)
    setGenerationError(null)
    setIsGenerating(true)
    setGenerationStatus(GENERATION_STATUS.GENERATING)
    setGenerationRequested(count)
    setGenerationQuestions([])
    setSelectedIds([])
    setGenerationTriggered(true)
    generationStartedInSession.current = true

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
        setIsGenerating(false)
        toast.success('Questions Generated', `${generatedCount || count} questions generated and saved.`)
      } else {
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

  const hasGeneration = !!generationId || isEditing
  const isGenerationRunning = generationStatus === GENERATION_STATUS.GENERATING || generationStatus === GENERATION_STATUS.PROCESSING || isGenerating
  const isGenerationReady = generationStatus === GENERATION_STATUS.READY || generationStatus === GENERATION_STATUS.COMPLETED
  const isGenerationFailed = generationStatus === GENERATION_STATUS.FAILED

  // Phase 6 working set: ONLY the questions of the CURRENT generation request.
  const availableQuestions = useMemo(() => {
    if (!isGenerationReady && !isEditing) return []
    if (questionTypeFilter === 'All') return generationQuestions
    return generationQuestions.filter((q) => (q.type ?? q.questionType) === questionTypeFilter)
  }, [generationQuestions, isGenerationReady, isEditing, questionTypeFilter])

  const isBankEmpty = !hasGeneration && generationQuestions.length === 0

  const requestedCountForDisplay = generationRequested || parseQuestionCount(questionCount)
  const generatedCountForDisplay = generationQuestions.length || 0

  const GENERATION_STATUS_LABELS = {
    [GENERATION_STATUS.GENERATING]: 'Generating',
    [GENERATION_STATUS.PROCESSING]: 'Generating',
    [GENERATION_STATUS.READY]: 'Ready',
    [GENERATION_STATUS.COMPLETED]: 'Complete',
    [GENERATION_STATUS.FAILED]: 'Failed',
  }
  const generationStatusLabel = isEditing ? 'Draft' : (GENERATION_STATUS_LABELS[generationStatus] ?? 'Idle')

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleQType = (t) => setQTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const isPaperReady = useMemo(() => {
    if (isGenerationRunning) return false
    if (isGenerationFailed) return false
    if (selectedIds.length === 0) return false
    if (isGenerationReady && !isEditing) {
      if (generatedCountForDisplay > 0 && requestedCountForDisplay > 0) {
        if (generatedCountForDisplay < requestedCountForDisplay) return false
      }
    }
    return true
  }, [isGenerationRunning, isGenerationFailed, selectedIds.length, isGenerationReady, isEditing, generatedCountForDisplay, requestedCountForDisplay])

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Paper name required', 'Give the paper a name before saving.')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('Select questions', 'Pick at least one question for the paper.')
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

    setSaving(true)

    if (isEditing) {
      // Confirm Edit flow -> updates existing paper and sets status back to READY
      try {
        const res = await updatePaperBackend({
          id: editingPaperId,
          payload: {
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
            status: 'ready',
          },
        })
        if (res?.ok || res?.paper) {
          toast.success('Paper updated successfully', `"${title.trim()}" is now READY in your Paper Library with ${selectedIds.length} questions.`)
          handleCancelEdit()
        } else {
          toast.error(res?.error ?? 'Could not update', res?.message ?? 'Please try again.')
        }
      } catch (e) {
        const msg = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Could not update paper'
        toast.error('Could not update', msg)
      } finally {
        setSaving(false)
      }
      return
    }

    // Normal Save Paper flow -> persists new paper with status READY
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
        generationId: generationId ?? null,
        status: 'ready',
      })
      if (res?.ok || res?.paper) {
        toast.success('Paper saved to library', `"${title.trim()}" is now in your Paper Library with ${selectedIds.length} questions.`)
        // Reset generation workflow to clean state
        setGenerationId(null)
        setGenerationStatus(null)
        setGenerationQuestions([])
        setSelectedIds([])
        setGenerationError(null)
        setIsGenerating(false)
        setGenerationTriggered(false)
        generationStartedInSession.current = false
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
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? `Editing Paper: ${title || 'Draft Paper'}` : 'Design, generate and publish question papers'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Badge variant="warning" className="px-3 py-1">
              Editing · DRAFT
            </Badge>
          )}
          <Badge variant={isGenerationReady ? 'success' : isGenerationFailed ? 'danger' : isGenerationRunning ? 'warning' : 'secondary'} className="px-3 py-1">
            Generation: {generationStatusLabel}
          </Badge>
        </div>
      </div>

      {/* Editing Banner */}
      {isEditing && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <Pencil className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-bold">You are currently editing &ldquo;{title}&rdquo; (Status: DRAFT)</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">Modify the paper configuration or selected questions below and click &ldquo;Confirm Changes&rdquo; to save and transition status to READY.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-200">
            <X className="h-3.5 w-3.5" /> Cancel Edit
          </Button>
        </div>
      )}

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
                    onClick={() => {
                      setExamFamily(e)
                      setSelectedIds([])
                      applyScope({ subject: 'All subjects', chapter: 'All chapters', topic: 'All topics' })
                    }}
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

      {/* Section 2 — Syllabus filters */}
      <Section n={2} title="Syllabus / content" subtitle={domain === 'Competitive' ? 'Domain + Exam Family → Subject → Chapter → Topic.' : 'Domain → Course → Subject → Chapter → Topic.'}>
        <div className={`grid grid-cols-2 gap-4 ${domain === 'University' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {domain === 'University' && (
            <Field label="Course">
              <Select
                value={course}
                ariaLabel="Course"
                onValueChange={(v) => { applyScope({ course: v, subject: 'All subjects', chapter: 'All chapters', topic: 'All topics' }); setSelectedIds([]) }}
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
              onValueChange={(v) => { applyScope({ subject: v, chapter: 'All chapters', topic: 'All topics' }); setSelectedIds([]) }}
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
              onValueChange={(v) => { applyScope({ chapter: v, topic: 'All topics' }); setSelectedIds([]) }}
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
              onValueChange={(v) => { applyScope({ topic: v }); setSelectedIds([]) }}
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
            <Select value={difficulty} onValueChange={(v) => { setDifficulty(v) }}>
              {DIFF_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Question Type filter">
            <Select value={questionTypeFilter} onValueChange={(v) => { setQuestionTypeFilter(v) }}>
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

      {/* Section 5: Question Generation & Review — ONE unified workflow */}
      <Section
        n={5}
        title="Question Generation"
        subtitle={`Generate, review and save questions · Status: ${generationStatusLabel} · Requested: ${requestedCountForDisplay} · Generated: ${generatedCountForDisplay}`}
        right={
          <Badge variant={isGenerationReady ? 'success' : isGenerationFailed ? 'danger' : isGenerationRunning ? 'warning' : 'secondary'} className="px-3 py-1">
            {isGenerationRunning ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating</> : isGenerationReady ? <><CheckCircle2 className="h-3 w-3" /> {generatedCountForDisplay} generated</> : isGenerationFailed ? <><AlertTriangle className="h-3 w-3" /> Failed</> : <>Idle</>}
          </Badge>
        }
      >
        <div className="space-y-4">
          {/* Generation CTA Header */}
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

            {isGenerationReady && !isEditing && (
              <Button size="sm" variant="outline" onClick={handleRetryGeneration} className="border-indigo-200 text-indigo-600">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate Questions
              </Button>
            )}

            <div className="text-[11px] text-slate-400">
              <p>Config: {domain}{domain === 'Competitive' ? ` · ${examFamily}` : ''} · {subject} · {chapter} · {topic} · {difficulty} · {parseQuestionCount(questionCount)} Qs · {qTypes.join(', ')}</p>
            </div>
          </div>

          {/* Empty State */}
          {isBankEmpty && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
              <Database className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No questions generated yet.</p>
              <p className="mt-1 text-xs text-slate-400">Configure your paper and click Generate Paper.</p>
            </div>
          )}

          {/* Loading State */}
          {isGenerationRunning && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 text-center dark:border-indigo-500/30 dark:bg-indigo-500/5">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
              <p className="mt-3 text-sm font-bold text-indigo-700 dark:text-indigo-200">AI is generating {requestedCountForDisplay} questions...</p>
              <p className="mt-1 text-xs text-indigo-600/80 dark:text-indigo-300/80">Status: {generationStatusLabel} · Reference: {generationId}</p>
              <p className="mt-2 text-[11px] text-slate-400">Please keep this tab open while the questions are being created.</p>
            </div>
          )}

          {/* Failure State */}
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

          {/* Success / Review State */}
          {(isGenerationReady || (isEditing && generationQuestions.length > 0)) && (
            <>
              {!isEditing && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" /> {generatedCountForDisplay} questions generated
                    </p>
                    <Badge variant={generatedCountForDisplay >= requestedCountForDisplay ? 'success' : 'warning'} size="sm">
                      {generatedCountForDisplay >= requestedCountForDisplay ? 'Ready · Send enabled' : 'Not ready · Send disabled'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700/70 dark:text-emerald-300/70">Reference {generationId} · Status {generationStatusLabel}</p>
                </div>
              )}

              {availableQuestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No questions match the filter &ldquo;{questionTypeFilter}&rdquo;.</p>
                  <p className="mt-1 text-xs text-slate-400">Switch filter to &ldquo;All types&rdquo; to view all generated questions.</p>
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
                              <Badge variant="secondary" size="sm">{q.subjectName ?? q.subject ?? q.subjectCode ?? '—'}</Badge>
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
                                  <span key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-[11.5px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                    ({String.fromCharCode(65 + i)}) {optionText(opt)}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">ID: {id} · Domain: {q.domain ?? domain} · Exam family: {q.examFamily ?? examFamily ?? 'University'} · Source: {q.source ?? 'AI'}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                <div>
                  <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{selectedIds.length} questions selected</p>
                  <p className="text-[11px] text-slate-400">
                    {isEditing
                      ? 'Confirming will save changes and transition paper status to READY.'
                      : isPaperReady
                        ? 'Ready to save paper into Paper Library.'
                        : 'Select questions to enable Save.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPrintOpen(true)}>
                    <Printer className="h-3.5 w-3.5" /> Preview
                  </Button>
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-3.5 w-3.5" /> Cancel Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={saving || selectedIds.length === 0}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-500/25 hover:brightness-110"
                        data-testid="save-paper-button"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> {saving ? 'Confirming…' : `Confirm Changes (${selectedIds.length})`}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleCreate}
                      disabled={saving || selectedIds.length === 0 || isGenerationRunning || isGenerationFailed}
                      data-testid="save-paper-button"
                    >
                      <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : `Save Paper (${selectedIds.length})`}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* Dialogs */}
      <PaperPrintPreview
        paper={{
          title,
          totalMarks: Number(marks) || 50,
          duration: Number(duration) || 120,
          questions: selectedIds.length,
          questionList: availableQuestions.filter((q) => selectedIds.includes(q.id ?? q._id)),
        }}
        open={printOpen}
        onOpenChange={setPrintOpen}
      />
    </div>
  )
}

export { PaperGeneratorTab }
export default PaperGeneratorTab
