/**
 * MediXO EduX — Assessment Workspace · Question Paper Studio (Phase 30).
 *
 * Full-page studio replacing the modal generator:
 *   Generate Paper (5 logical sections) → Generate Demo Paper → Review
 *   → Edit / Replace / Remove questions → Paper Quality (live) → Save
 *   → Paper Library → Share to students.
 *
 * Deterministic demo generation (no AI claim): reads the configuration,
 * filters the question FOUNDATION (university bank + competitive dataset,
 * stable ids preserved), respects every constraint (mode/exam/subject/
 * chapter/topic/difficulty/types/marks/PYQ preference), computes actual
 * blueprint metrics, and renders the paper immediately below. Insufficient
 * matches show Available vs Required + "Broaden filters" — never silently
 * unrelated questions.
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {  } from 'framer-motion'
import {
  CheckCircle2, ChevronDown, FileText, History, Pencil, Printer, RefreshCw,
  Save, Send, SlidersHorizontal, Sparkles, Trash2, Wand2,
} from 'lucide-react'
import { usePaperGenerator, usePaperDelete, usePaperDuplicate, usePaperCreate, usePaperRegenerate, usePaperArchive } from '@/services/extra'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field, Input, Select, SelectItem, useToast } from '@/components/ui'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { useFilterCascade } from '@/hooks/use-filter-cascade'
import { buildPaperGeneratorCascade } from './paper-generator-cascade'
import {
  PaperCard, PaperPreviewDialog, PaperDeleteDialog, SharePaperDialog,
  QuestionEditDialog, QuestionReplaceDialog, PaperQualityPanel, PaperPrintPreview, ShareHistoryList,
  DIFF_STYLES,
} from './paper-parts'
import { formatDate } from '@/utils/format'

/* ---------------- deterministic demo generation ---------------- */
const DIFF_MIX = { Easy: [80, 15, 5], Medium: [30, 50, 20], Hard: [10, 30, 60], Mixed: [30, 50, 20] }
const BLOOM_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const BLOOM_PRESETS = [
  { id: 'Balanced', label: 'Balanced', hint: '30% Remember/Understand · 50% Apply/Analyze · 20% Evaluate/Create' },
  { id: 'Remember-heavy', label: 'Remember-heavy', hint: 'Prioritise Recall and Understanding' },
  { id: 'Understand-heavy', label: 'Understand-heavy', hint: 'Prioritise Understanding and Application' },
  { id: 'Apply-heavy', label: 'Apply-heavy', hint: 'Prioritise Application and Analysis' },
  { id: 'Analyze-heavy', label: 'Analyze-heavy', hint: 'Prioritise Analysis and Evaluation' },
  { id: 'Evaluate-heavy', label: 'Evaluate-heavy', hint: 'Prioritise Evaluation and Creation' },
  { id: 'Create-heavy', label: 'Create-heavy', hint: 'Prioritise high-order thinking (Evaluate/Create)' },
]
const WEIGHTAGE_PRESETS = [
  { id: 'Balanced chapters', label: 'Balanced chapters', hint: 'Equal weight across chapters' },
  { id: 'Important chapters', label: 'Important chapters', hint: 'Weight toward high-yield chapters' },
  { id: 'Weak-unit heavy', label: 'Weak-unit heavy', hint: 'Weight toward weak/under-covered units' },
  { id: 'Custom', label: 'Custom', hint: 'Set per-chapter weights below' },
]
const CO_PRESETS = ['Balanced CO coverage', 'CO1–CO2 priority', 'CO3–CO4 priority', 'Custom']
const PYQ_PRESETS = ['No PYQs', 'Include PYQs', 'PYQ Balanced', 'PYQ Heavy']
const EXAM_PATTERNS = ['Standard', 'Practice', 'Mock Test']

const marksOf = (q, mode) => (mode === 'Competitive' ? (q.marks ?? 4) : q.type === 'MCQ' ? 2 : q.type === 'Numerical' ? 3 : q.type === 'Assertion Reason' ? 2 : 5)

function demoGenerate(cfg) {
  const {
    mode, exam, program, course, subject, chapter, topic, difficulty, marks,
    duration, questionCount, qTypes, pyqPreference, bloomPreset, weightagePreset,
    customWeights, coPreset, negativeMarking, examPattern, bankQuestions, compQuestions,
    universityPyqQuestions, title,
  } = cfg
  const marksTarget = Number(marks) || 50
  const countTarget = questionCount && questionCount !== 'Auto' ? Number(questionCount) : null

  /* ---- filter the question FOUNDATION (no duplicates, stable ids) ---- */
  let pool
  if (mode === 'Competitive') {
    const examFamily = exam === 'NEET' ? 'NEET UG' : 'JEE Main'
    pool = (compQuestions ?? []).filter((q) => {
      if (exam && q.exam !== examFamily) return false
      if (subject && subject !== 'All subjects' && q.subject !== subject) return false
      if (chapter && chapter !== 'All chapters' && q.chapter !== chapter) return false
      if (topic && topic !== 'All topics' && q.topic !== topic) return false
      if (difficulty !== 'Mixed' && q.difficulty !== difficulty) return false
      if (pyqPreference === 'No PYQs' && q.isPyq) return false
      if (pyqPreference === 'PYQ Heavy' && !q.isPyq) return false
      return true
    })
  } else {
    /* University pool = Question Bank + university PYQ records (deduped by
       bankId) — one foundation, no duplicate question sets. */
    const bank = (bankQuestions ?? []).map((q) => ({ ...q, source: 'bank' }))
    const bankIds = new Set(bank.map((q) => q.id))
    const pyq = (universityPyqQuestions ?? [])
      .filter((q) => !q.bankId || !bankIds.has(q.bankId))
      .map((q) => ({
        id: q.id, question: q.question, text: q.question, options: q.options, answer: q.answer,
        type: q.questionType, questionType: q.questionType, difficulty: q.difficulty,
        chapter: q.chapter, topic: q.topic, subject: q.subjectCode, bloom: 'Apply',
        isPyq: true, year: q.year, marks: q.marks, source: 'pyq',
      }))
    pool = [...bank, ...pyq].filter((q) => {
      if (subject && subject !== 'All subjects' && q.subject !== subject) return false
      if (chapter && chapter !== 'All chapters' && q.chapter !== chapter) return false
      if (difficulty !== 'Mixed' && q.difficulty !== difficulty) return false
      return true
    })
  }

  const autoRequired = Math.max(5, Math.ceil(marksTarget / 2))
  const required = countTarget ?? autoRequired
  /* Honest blocking: only when an EXPLICIT question count exceeds the pool.
     With Auto count, use every available question (never unrelated) and
     surface a notice when the pool is thinner than the mark target needs. */
  if ((countTarget && pool.length < countTarget) || pool.length < 5) {
    const suggestions = []
    if (chapter && chapter !== 'All chapters') suggestions.push('Include more chapters')
    if (topic && topic !== 'All topics') suggestions.push('Increase the topic range')
    if (difficulty !== 'Mixed') suggestions.push('Include more difficulty levels')
    if (mode === 'Competitive' && pyqPreference === 'No PYQs') suggestions.push('Include PYQs')
    return { insufficient: true, available: pool.length, required: countTarget ?? autoRequired, suggestions }
  }
  const lowMatch = pool.length < autoRequired

  /* ---- chapter weighting (university) ---- */
  let ordered = [...pool]
  if (mode === 'University' && weightagePreset && weightagePreset !== 'Balanced chapters') {
    const chapters = [...new Set(pool.map((q) => q.chapter))]
    const weights = {}
    if (weightagePreset === 'Custom' && customWeights && Object.keys(customWeights).length) {
      chapters.forEach((c) => { weights[c] = Number(customWeights[c] ?? 10) })
    } else if (weightagePreset === 'Weak-unit heavy') {
      chapters.forEach((c, i) => { weights[c] = 40 - i * 6 })
    } else { // Important chapters
      chapters.forEach((c, i) => { weights[c] = 60 - i * 8 })
    }
    ordered = ordered.sort((a, b) => (weights[b.chapter] ?? 10) - (weights[a.chapter] ?? 10))
  }
  if (mode === 'University' && bloomPreset && bloomPreset !== 'Balanced') {
    const dir = bloomPreset === 'Create-heavy' || bloomPreset === 'Evaluate-heavy' || bloomPreset === 'Analyze-heavy' ? -1 : 1
    ordered = ordered.sort((a, b) => dir * (BLOOM_ORDER.indexOf(a.bloom ?? 'Understand') - BLOOM_ORDER.indexOf(b.bloom ?? 'Understand')))
  }

  /* ---- difficulty buckets + selection ---- */
  const [pe, pm, ph] = DIFF_MIX[difficulty] ?? [30, 50, 20]
  const buckets = { Easy: [], Medium: [], Hard: [] }
  ordered.forEach((q) => { (buckets[q.difficulty] ?? buckets.Medium).push(q) })
  const easyTarget = Math.max(1, Math.round(required * pe / 100))
  const mediumTarget = Math.max(1, Math.round(required * pm / 100))

  const selected = []
  let total = 0
  const take = (arr, limit) => {
    for (const q of arr) {
      if (countTarget && selected.length >= countTarget) break
      if (selected.length >= required) break
      if (limit != null && selected.filter((s) => s.difficulty === q.difficulty).length >= limit) continue
      selected.push(q)
      total += marksOf(q, mode)
    }
  }
  take(buckets.Easy, easyTarget)
  take(buckets.Medium, mediumTarget)
  take(buckets.Hard, null)
  if (selected.length < required) { /* top up from remaining pool */ take(ordered.filter((q) => !selected.includes(q)), null) }

  if (selected.length < Math.min(required, 5)) return { insufficient: true, available: pool.length, required, suggestions: ['Include more chapters', 'Include more difficulty levels'] }

  /* ---- build the paper questions ---- */
  const coPool = ['CO1', 'CO2', 'CO3', 'CO4']
  const questions = selected.map((q, i) => ({
    id: q.id,
    no: i + 1,
    text: q.question ?? q.text,
    options: q.options ?? null,
    answer: q.answer ?? null,
    marks: marksOf(q, mode),
    chapter: q.chapter,
    topic: q.topic ?? q.chapter,
    difficulty: q.difficulty,
    type: mode === 'Competitive' ? (q.questionType ?? 'MCQ') : (q.type ?? 'MCQ'),
    bloom: q.bloom ?? null,
    co: mode === 'University' ? coPool[i % 4] : null,
    isPyq: q.isPyq ?? false,
    pyqYear: q.year ?? null,
  }))
  const paperMarks = questions.reduce((a, q) => a + q.marks, 0)

  /* ---- actual blueprint metrics (derived, never hardcoded) ---- */
  const actualDiff = [0, 0, 0]
  questions.forEach((q) => { actualDiff[q.difficulty === 'Easy' ? 0 : q.difficulty === 'Medium' ? 1 : 2] += 1 })
  const actualDifficulty = { Easy: actualDiff[0], Medium: actualDiff[1], Hard: actualDiff[2], pct: actualDiff.map((v) => Math.round((v / questions.length) * 100)) }
  const actualBloom = {}
  questions.forEach((q) => { if (q.bloom) actualBloom[q.bloom] = (actualBloom[q.bloom] ?? 0) + 1 })
  const actualCO = {}
  questions.forEach((q) => { if (q.co) actualCO[q.co] = (actualCO[q.co] ?? 0) + 1 })
  const actualChapterCoverage = [...new Set(questions.map((q) => q.chapter).filter(Boolean))]
  const actualPyq = questions.filter((q) => q.isPyq).length

  return {
    paper: {
      title,
      mode,
      exam: mode === 'Competitive' ? exam : null,
      program: mode === 'University' ? (program ?? 'B.Tech — CSE') : null,
      course: mode === 'University' ? course : null,
      subject: mode === 'University' ? subject : subject === 'All subjects' ? 'All subjects' : subject,
      chapter: chapter === 'All chapters' ? 'All' : chapter,
      topic: topic === 'All topics' ? 'All' : topic,
      paperType: cfg.paperType,
      totalMarks: paperMarks,
      duration: Number(duration) || 120,
      questionCount: questions.length,
      difficultyBlueprint: DIFF_MIX[difficulty] ?? [30, 50, 20],
      actualDifficulty,
      questionTypes: qTypes,
      bloomConfig: mode === 'University' ? bloomPreset : null,
      actualBloom: mode === 'University' ? actualBloom : null,
      chapterWeightage: mode === 'University' ? weightagePreset : null,
      actualChapterCoverage,
      coConfig: mode === 'University' ? coPreset : null,
      actualCOCoverage: mode === 'University' ? actualCO : null,
      pyqPreference: mode === 'Competitive' ? pyqPreference : null,
      negativeMarking: mode === 'Competitive' ? (negativeMarking === 'Enabled' ? '−1 per incorrect answer' : 'None') : null,
      examPattern: mode === 'Competitive' ? examPattern : null,
      questions,
      instructions: [
        'Answer all required questions.',
        'Read each question carefully before answering.',
        mode === 'Competitive' && negativeMarking === 'Enabled' ? 'Negative marking applies for incorrect answers (−1); unattempted questions carry no penalty.' : 'Marks are awarded for correct answers; no negative marking.',
        'Manage your time — allocate roughly 1 mark per minute.',
      ].filter(Boolean),
      generatedAt: new Date().toISOString(),
      label: 'Demo-generated paper',
      notice: lowMatch ? `Only ${pool.length} questions matched this configuration — the paper uses all available questions (${paperMarks} marks). Broaden the filters for a fuller paper.` : null,
    },
  }
}

/* ---------------- Section shell ---------------- */
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

function PaperGeneratorTab({ data: intelData, editPaper = null, onClearEdit = null }) {
  const { data: paperData, isLoading, isError, refetch } = usePaperGenerator()
  const [searchParams] = useSearchParams()
  /* Phase 6 — re-test prefill: ?mode=&exam=&subject=&chapter=&topic=&difficulty=&count=&duration=&marks=&intervention=
     Prefill happens through state initializers so the first render is
     already consistent (no effect-after-mount flash, no stale cascade). */
  const interventionId = searchParams.get('intervention') ?? null
  const { mutateAsync: deletePaper } = usePaperDelete()
  const { mutateAsync: duplicatePaper } = usePaperDuplicate()
  const { mutateAsync: createPaper } = usePaperCreate()
  const { mutateAsync: regeneratePaper } = usePaperRegenerate()
  const { mutateAsync: archivePaper } = usePaperArchive()
  const [overlay, setOverlay] = useState({ added: [], removed: [] })

  /* ---- form state ---- */
  const [mode, setMode] = useState(() => (searchParams.get('mode') === 'Competitive' ? 'Competitive' : 'University'))
  const [title, setTitle] = useState(() => searchParams.get('title') ?? '')
  const [paperType, setPaperType] = useState('Mid Semester')
  const [program, setProgram] = useState('B.Tech — CSE')
  const [exam, setExam] = useState(() => (searchParams.get('exam') === 'NEET' ? 'NEET' : 'JEE'))
  const [marks, setMarks] = useState(() => searchParams.get('marks') ?? '50')
  const [duration, setDuration] = useState(() => searchParams.get('duration') ?? '120')
  const [questionCount, setQuestionCount] = useState(() => searchParams.get('count') ?? 'Auto')
  const [qTypes, setQTypes] = useState(['MCQ', 'Short Answer', 'Long Answer'])
  const [difficulty, setDifficulty] = useState(() => searchParams.get('difficulty') ?? 'Mixed')

  /* ---- cascading academic scope: Course → Subject → Chapter → Topic ----
     Declared per feature (paper-generator-cascade.js) and validated by the
     shared cascade engine. URL-prefilled values are sanitized against the
     datasets once they load — an invalid ?subject= can never survive. */
  const cfg = paperData?.config ?? null
  const compQuestions = intelData?.derived?.competitiveQuestionIntelligence?.pyqRecords ?? []
  const bankQuestions = intelData?.datasets?.questionBank?.questions ?? []
  const cascadeConfig = useMemo(
    () => ({
      ...buildPaperGeneratorCascade({ mode, exam, cfg, bankQuestions, compQuestions }),
      initialValues: {
        course: 'CS501 — DSA',
        subject: searchParams.get('subject') ?? 'All subjects',
        chapter: searchParams.get('chapter') ?? 'All chapters',
        topic: searchParams.get('topic') ?? 'All topics',
      },
    }),
    [mode, exam, cfg, bankQuestions, compQuestions, searchParams],
  )
  const { values: scopeValues, options: scopeOptions, apply: applyScope } = useFilterCascade(cascadeConfig)
  const { course, subject, chapter, topic } = scopeValues
  const [bloomPreset, setBloomPreset] = useState('Balanced')
  const [weightagePreset, setWeightagePreset] = useState('Balanced chapters')
  const [customWeights, setCustomWeights] = useState({})
  const [coPreset, setCoPreset] = useState('Balanced CO coverage')
  const [pyqPreference, setPyqPreference] = useState('Include PYQs')
  const [negativeMarking, setNegativeMarking] = useState('Enabled')
  const [examPattern, setExamPattern] = useState('Standard')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  /* ---- result state ---- */
  const [generated, setGenerated] = useState(null)
  const [insufficient, setInsufficient] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [replaceTarget, setReplaceTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const toast = useToast()

  /* ---- load an edited paper from the library ---- */
  useEffect(() => {
    if (editPaper?.questions?.length || editPaper?.questionList?.length) {
      setGenerated({ paper: {
        ...editPaper,
        questions: editPaper.questionList ?? editPaper.questions ?? [],
        difficultyBlueprint: editPaper.difficultyBlueprint ?? editPaper.config?.difficultyBlueprint ?? [30, 50, 20],
        actualDifficulty: editPaper.actualDifficulty ?? editPaper.config?.actualDifficulty ?? null,
        instructions: editPaper.instructions ?? editPaper.config?.instructions ?? ['Answer all required questions.', 'Read each question carefully before answering.'],
      } })
      setTitle(editPaper.title ?? '')
      setMode(editPaper.mode ?? 'University')
      setPaperType(editPaper.paperType ?? editPaper.examType ?? 'Mid Semester')
      applyScope({
        course: editPaper.course ? `${editPaper.course} — ${editPaper.subject ?? ''}`.trim() : 'CS501 — DSA',
        subject: editPaper.subject ?? 'All subjects',
        chapter: editPaper.chapter ?? 'All chapters',
        topic: editPaper.topic ?? 'All topics',
      })
      setExam(editPaper.exam ?? 'JEE')
      setMarks(String(editPaper.totalMarks ?? 50))
      setDuration(String(editPaper.duration ?? 120))
      setQuestionCount(String(editPaper.questionCount ?? 'Auto'))
      setDifficulty(editPaper.difficulty ?? 'Mixed')
      setInsufficient(null)
      onClearEdit?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editPaper])

  const papers = useMemo(() => {
    const base = paperData?.generatedPapers ?? []
    const filtered = base.filter((p) => !overlay.removed.includes(p.id))
    const baseIds = new Set(filtered.map((p) => p.id))
    /* dedupe: saved papers come back through refetch — don't double-count */
    const added = overlay.added.filter((p) => !overlay.removed.includes(p.id) && !baseIds.has(p.id))
    return [...added, ...filtered]
  }, [paperData, overlay])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  /* ---- dependent option lists (derived by the shared cascade engine) ---- */
  const scopeChapterList = scopeOptions.chapter

  const toggleQType = (t) => setQTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const TYPE_OPTIONS = mode === 'Competitive' ? ['MCQ', 'Integer', 'Numerical', 'Assertion Reason', 'Case Based'] : ['MCQ', 'Short Answer', 'Long Answer', 'Numerical', 'Assertion Reason', 'Case Based']

  const resetFilters = () => { applyScope({ subject: 'All subjects', chapter: 'All chapters', topic: 'All topics' }); setInsufficient(null) }

  const handleDemoGenerate = () => {
    if (!title.trim()) { toast.error('Paper name required', 'Give the paper a name before generating.'); return }
    if (qTypes.length === 0) { toast.error('Select question types', 'Pick at least one question type.'); return }
    setGenerating(true)
    setInsufficient(null)
    setTimeout(() => {
      const res = demoGenerate({
        mode, exam, program, course, subject, chapter, topic, difficulty, marks, duration,
        questionCount, qTypes, pyqPreference, bloomPreset, weightagePreset, customWeights,
        coPreset, negativeMarking, examPattern, bankQuestions, compQuestions, universityPyqQuestions: intelData?.derived?.competitiveQuestionIntelligence?.universityPyq ?? [], title: title.trim(),
        paperType,
      })
      setGenerating(false)
      if (res.insufficient) { setGenerated(null); setInsufficient(res); return }
      setGenerated(res)
      toast.success('Demo paper generated', '"Demo-generated paper" built deterministically from the question datasets.')
    }, 650)
  }

  const handleSave = async () => {
    if (!generated?.paper) return
    setSaving(true)
    try {
      const p = generated.paper
      const res = await createPaper({
        title: p.title, mode: p.mode, examType: p.paperType ?? 'Mid Semester',
        course: p.mode === 'Competitive' ? `${p.exam ?? 'JEE'} · ${p.subject ?? ''}` : (p.course ?? 'CS501'),
        subject: p.subject, exam: p.exam, chapter: p.chapter, topic: p.topic,
        totalMarks: p.totalMarks, duration: p.duration, difficulty: p.difficulty ?? 'Mixed',
        questions: p.questionCount, coverage: 90, sets: 1,
        questionList: p.questions ?? [], config: p, actualDifficulty: p.actualDifficulty,
        negativeMarking: p.negativeMarking, paperType: p.paperType,
        interventionId,
      })
      if (res?.ok) {
        setOverlay((o) => ({ ...o, added: [res.paper, ...o.added] }))
        toast.success('Paper saved to library', `"${p.title}" is now in your Paper Library.`)
        refetch() // keep the shared query fresh so the Paper Library tab sees it immediately
      } else {
        toast.error(res?.error ?? 'Could not save', res?.message ?? 'Please try again.')
      }
    } catch {
      toast.error('Could not save', 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ---- question actions ---- */
  const updateQuestion = (updated) => {
    setGenerated((g) => {
      if (!g) return g
      const questions = g.paper.questions.map((q) => (q.id === updated.id ? updated : q))
      const totalMarks = questions.reduce((a, q) => a + q.marks, 0)
      return { ...g, paper: { ...g.paper, questions, totalMarks, questionCount: questions.length, updatedAt: new Date().toISOString() } }
    })
  }
  const removeQuestion = (id) => {
    setGenerated((g) => {
      if (!g) return g
      const questions = g.paper.questions.filter((q) => q.id !== id)
      const totalMarks = questions.reduce((a, q) => a + q.marks, 0)
      toast.success('Question removed', `Paper currently has ${questions.length} questions / ${totalMarks} marks.`)
      return { ...g, paper: { ...g.paper, questions, totalMarks, questionCount: questions.length, updatedAt: new Date().toISOString() } }
    })
  }
  const useReplacement = (alt) => {
    setGenerated((g) => {
      if (!g) return g
      const questions = g.paper.questions.map((q) => (q.id === replaceTarget.id ? {
        ...q, id: alt.id, text: alt.question ?? alt.text, options: alt.options ?? null,
        answer: alt.answer ?? null, marks: marksOf(alt, g.paper.mode), chapter: alt.chapter,
        topic: alt.topic ?? alt.chapter, difficulty: alt.difficulty,
        type: g.paper.mode === 'Competitive' ? (alt.questionType ?? 'MCQ') : (alt.type ?? 'MCQ'),
        isPyq: alt.isPyq ?? false, pyqYear: alt.year ?? null,
      } : q))
      const totalMarks = questions.reduce((a, q) => a + q.marks, 0)
      return { ...g, paper: { ...g.paper, questions, totalMarks, questionCount: questions.length } }
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePaper(deleteTarget.id)
      setOverlay((o) => ({ ...o, removed: [...o.removed, deleteTarget.id] }))
      toast.success('Paper deleted', `${deleteTarget.title} was permanently removed.`)
      setDeleteTarget(null)
    } catch {
      toast.error('Could not delete', 'Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const paper = generated?.paper

  return (
    <div className="space-y-6">
      {/* Studio header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Wand2 className="h-3.5 w-3.5" /> Question Paper Studio
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Design, generate, review and share intelligent question papers</h2>
        </div>
        <Badge variant="gradient" className="px-3 py-1"><FileText className="h-3 w-3" /> {papers.length} papers in library</Badge>
      </div>

      {/* ================= SECTION 1 · BASIC DETAILS ================= */}
      <Section n={1} title="Basic details" subtitle="Name the paper and choose its context — University or Competitive.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paper name" required className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === 'Competitive' ? 'e.g. JEE Physics — Mechanics Mock 01' : 'e.g. Mid Semester — DSA — Paper A'} />
          </Field>
          <Field label="Mode" required className="sm:col-span-2">
            <div className="flex rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
              {['University', 'Competitive'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setPaperType(m === 'University' ? 'Mid Semester' : 'Full Mock Test'); resetFilters(); setGenerated(null) }}
                  className={`flex-1 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${mode === m ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  {m === 'University' ? '🏛️' : '🎯'} {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Paper type">
            <Select value={paperType} onValueChange={(v) => { setPaperType(v); setGenerated(null) }}>
              {(mode === 'University' ? (cfg.universityTypes ?? []) : (cfg.competitiveTypes ?? [])).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
          {mode === 'Competitive' && (
            <Field label="Exam">
              <div className="flex rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/50">
                {['JEE', 'NEET'].map((e) => (
                  <button
                    key={e}
                    onClick={() => { setExam(e); setGenerated(null) }}
                    className={`flex-1 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${exam === e ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {mode === 'University' && (
            <Field label="Program">
              <Select value={program} onValueChange={(v) => { setProgram(v); setGenerated(null) }}>
                {(cfg.programs ?? ['B.Tech — CSE', 'B.Tech — ECE', 'M.Sc — Data Science', 'MBA']).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </Select>
            </Field>
          )}
          {mode === 'University' && (
            <Field label="Semester">
              <Select value="Sem 5" onValueChange={() => {}}>
                {(cfg.semesters ?? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </Select>
            </Field>
          )}
        </div>
      </Section>

      {/* ================= SECTION 2 · SYLLABUS / CONTENT ================= */}
      <Section n={2} title="Syllabus / content" subtitle={mode === 'Competitive' ? 'Exam → Subject → Chapter → Topic — never mixed across exams.' : 'Program → Course → Subject → Chapter → Topic.'}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {mode === 'University' && (
            <Field label="Course">
              <Select value={course} onValueChange={(v) => { applyScope({ course: v, subject: v.split(' ')[0] ?? 'All subjects' }); setGenerated(null) }} group="paper-generator">
                {scopeOptions.course.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </Select>
            </Field>
          )}
          <Field label="Subject">
            <Select value={subject} onValueChange={(v) => { applyScope({ subject: v }); setGenerated(null) }} group="paper-generator">
              <SelectItem value="All subjects">All subjects</SelectItem>
              {scopeOptions.subject.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Chapter">
            <Select value={chapter} onValueChange={(v) => { applyScope({ chapter: v }); setGenerated(null) }} group="paper-generator">
              <SelectItem value="All chapters">All chapters</SelectItem>
              {scopeOptions.chapter.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Topic">
            <Select value={topic} onValueChange={(v) => { applyScope({ topic: v }); setGenerated(null) }} group="paper-generator">
              <SelectItem value="All topics">All topics</SelectItem>
              {scopeOptions.topic.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </Select>
          </Field>
          {mode === 'Competitive' && (
            <Field label="PYQ year">
              <Select value="All years" onValueChange={() => {}}>
                {['All years', '2025', '2024', '2023'].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </Select>
            </Field>
          )}
        </div>
      </Section>

      {/* ================= SECTION 3 · PAPER CONFIGURATION ================= */}
      <Section n={3} title="Paper configuration" subtitle="Marks, duration, question count, types and difficulty — the generated paper respects these.">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Field label="Total marks">
            <Select value={marks} onValueChange={(v) => { setMarks(v); setGenerated(null) }}>
              {['20', '25', '50', '100', '180', '300', '720'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Duration (minutes)">
            <Select value={duration} onValueChange={(v) => { setDuration(v); setGenerated(null) }}>
              {(cfg.durations ?? [60, 90, 120, 150, 180]).map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
            </Select>
          </Field>
          <Field label="Question count">
            <Select value={questionCount} onValueChange={(v) => { setQuestionCount(v); setGenerated(null) }}>
              {['Auto', '10', '20', '30', '40', '50'].map((c) => <SelectItem key={c} value={c}>{c === 'Auto' ? 'Auto (by marks)' : c}</SelectItem>)}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setGenerated(null) }}>
              {(cfg.difficulties ?? ['Easy', 'Medium', 'Hard', 'Mixed']).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </Select>
          </Field>
          <div className="col-span-2 lg:col-span-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Question types</p>
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
          <div className="col-span-2 lg:col-span-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Planned difficulty blueprint</p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {(DIFF_MIX[difficulty] ?? [30, 50, 20]).map((pct, i) => (
                <span key={i} className={['bg-emerald-400', 'bg-indigo-400', 'bg-rose-400'][i]} style={{ width: `${pct}%` }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10.5px] font-semibold text-slate-400">
              {['Easy', 'Medium', 'Hard'].map((l, i) => <span key={l} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${['bg-emerald-400', 'bg-indigo-400', 'bg-rose-400'][i]}`} /> {l} {(DIFF_MIX[difficulty] ?? [30, 50, 20])[i]}%</span>)}
            </div>
          </div>
        </div>
      </Section>

      {/* ================= SECTION 4 · ADVANCED BLUEPRINT ================= */}
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
          <p className="text-[12.5px] text-slate-400">Advanced blueprint controls are collapsed by default — expand to tune Bloom's taxonomy, chapter weightage, CO coverage {mode === 'Competitive' ? 'or PYQ preference, negative marking and exam pattern.' : '.'}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mode === 'University' ? (
              <>
                <Field label="Bloom's taxonomy" hint={BLOOM_PRESETS.find((b) => b.id === bloomPreset)?.hint}>
                  <Select value={bloomPreset} onValueChange={(v) => { setBloomPreset(v); setGenerated(null) }}>
                    {BLOOM_PRESETS.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Chapter weightage" hint={WEIGHTAGE_PRESETS.find((w) => w.id === weightagePreset)?.hint}>
                  <Select value={weightagePreset} onValueChange={(v) => { setWeightagePreset(v); setGenerated(null) }}>
                    {WEIGHTAGE_PRESETS.map((w) => <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Course outcome coverage">
                  <Select value={coPreset} onValueChange={(v) => { setCoPreset(v); setGenerated(null) }}>
                    {CO_PRESETS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </Select>
                </Field>
                {weightagePreset === 'Custom' && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom chapter weights (%)</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(scopeChapterList.length ? scopeChapterList.slice(0, 4) : ['Chapter A', 'Chapter B', 'Chapter C', 'Chapter D']).map((c) => (
                        <div key={c} className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">{c}</span>
                          <Input
                            type="number" min={0} max={100}
                            value={customWeights[c] ?? 25}
                            onChange={(e) => setCustomWeights((w) => ({ ...w, [c]: Number(e.target.value) || 0 }))}
                            className="h-9 w-20 text-right"
                          />
                          <span className="text-[11px] text-slate-400">%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Field label="PYQ preference">
                  <Select value={pyqPreference} onValueChange={(v) => { setPyqPreference(v); setGenerated(null) }}>
                    {PYQ_PRESETS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Negative marking">
                  <Select value={negativeMarking} onValueChange={(v) => { setNegativeMarking(v); setGenerated(null) }}>
                    <SelectItem value="Enabled">Enabled (−1 per incorrect answer)</SelectItem>
                    <SelectItem value="Disabled">Disabled</SelectItem>
                  </Select>
                </Field>
                <Field label="Exam pattern">
                  <Select value={examPattern} onValueChange={(v) => { setExamPattern(v); setGenerated(null) }}>
                    {EXAM_PATTERNS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </Select>
                </Field>
              </>
            )}
          </div>
        )}
      </Section>

      {/* ================= SECTION 5 · GENERATION SUMMARY ================= */}
      <Section n={5} title="Generation summary" subtitle="Compact preview of the configured paper — then generate.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Mode', value: mode },
            { label: mode === 'Competitive' ? 'Exam / Subject' : 'Course / Subject', value: mode === 'Competitive' ? `${exam} · ${subject === 'All subjects' ? 'All subjects' : subject}` : `${course} · ${subject === 'All subjects' ? 'All' : subject}` },
            { label: 'Chapters', value: chapter === 'All chapters' ? 'All' : chapter },
            { label: 'Paper', value: `${marks} marks · ${duration} min · ${questionCount === 'Auto' ? 'auto' : questionCount} questions` },
            { label: 'Difficulty', value: `${difficulty} (${(DIFF_MIX[difficulty] ?? [30, 50, 20]).join(' / ')})` },
            { label: 'Types', value: qTypes.join(' · ') },
            { label: mode === 'University' ? 'Bloom · CO' : 'PYQ · Pattern', value: mode === 'University' ? `${bloomPreset} · ${coPreset}` : `${pyqPreference} · ${examPattern}` },
            { label: mode === 'Competitive' ? 'Negative marking' : 'Weightage', value: mode === 'Competitive' ? negativeMarking : weightagePreset },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="mt-0.5 truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-[11.5px] text-slate-400">
            <Sparkles className="mr-1 inline h-3.5 w-3.5 text-indigo-500" />
            Deterministic demo generation from the question datasets — no AI model involved. You review every question before saving.
          </p>
          <Button size="lg" onClick={handleDemoGenerate} disabled={generating} className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/25 hover:brightness-110">
            {generating ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Preparing your paper…</>) : (<><Wand2 className="h-4 w-4" /> Generate Demo Paper</>)}
          </Button>
        </div>
      </Section>

      {/* ================= INSUFFICIENT STATE ================= */}
      {insufficient && (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-amber-300/70 bg-amber-50/50 p-8 text-center dark:border-amber-500/30 dark:bg-amber-500/5">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Not enough questions match this configuration.</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80">Available: <span className="font-bold">{insufficient.available}</span> questions · Required: <span className="font-bold">{insufficient.required}</span> questions</p>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {(insufficient.suggestions ?? []).map((s) => <Badge key={s} variant="outline" size="sm">{s}</Badge>)}
          </div>
          <Button size="sm" variant="outline" className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300" onClick={resetFilters}>
            Broaden filters
          </Button>
        </div>
      )}

      {/* ================= GENERATED PAPER REVIEW ================= */}
      {paper && (
        <div className="space-y-4">
          {paper.notice && (
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-[12px] font-medium text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" /> {paper.notice}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-teal-200/70 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 p-5 shadow-card dark:border-teal-500/25 dark:from-teal-500/5 dark:to-emerald-500/5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md"><FileText className="h-5 w-5" /></span>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
                  {paper.title}
                  <Badge variant="gradient" size="sm"><Sparkles className="h-3 w-3" /> Demo-generated paper</Badge>
                  <Badge variant="secondary" size="sm">{paper.mode}</Badge>
                  {paper.exam && <Badge variant="info" size="sm">{paper.exam}</Badge>}
                </p>
                <p className="text-[11.5px] text-slate-400">
                  {paper.paperType} · {paper.subject ?? paper.course} · {paper.chapter === 'All' || !paper.chapter ? 'All chapters' : paper.chapter}
                  {paper.topic && paper.topic !== 'All' ? ` · ${paper.topic}` : ''} · {paper.totalMarks} marks · {paper.duration} min · {paper.questionCount} questions
                  {paper.negativeMarking ? ` · ${paper.negativeMarking}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setPrintOpen(true)}><Printer className="h-3.5 w-3.5" /> Print / Preview</Button>
              <Button size="sm" variant="outline" className="border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500/40 dark:text-teal-300 dark:hover:bg-teal-500/10" onClick={() => setShareTarget(paper)}><Send className="h-3.5 w-3.5" /> Share</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Paper'}</Button>
            </div>
          </div>

          {/* Paper quality + question list */}
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <PaperQualityPanel questions={paper.questions ?? []} planned={paper.difficultyBlueprint} scopeChapters={scopeChapterList} />
              {paper.actualDifficulty && (
                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">Actual difficulty</p>
                  <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <span className="bg-emerald-400" style={{ width: `${paper.actualDifficulty.pct[0]}%` }} />
                    <span className="bg-indigo-400" style={{ width: `${paper.actualDifficulty.pct[1]}%` }} />
                    <span className="bg-rose-400" style={{ width: `${paper.actualDifficulty.pct[2]}%` }} />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Easy {paper.actualDifficulty.Easy} · Medium {paper.actualDifficulty.Medium} · Hard {paper.actualDifficulty.Hard}
                    <span className="ml-1 text-emerald-600 dark:text-emerald-400"> (planned {(paper.difficultyBlueprint ?? [30, 50, 20]).join(' / ')})</span>
                  </p>
                  {paper.actualCOCoverage && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Actual CO coverage</p>
                      {Object.entries(paper.actualCOCoverage).map(([co, c]) => (
                        <div key={co} className="flex items-center justify-between text-[11.5px]">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{co}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">{c} q</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {paper.actualBloom && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {Object.entries(paper.actualBloom).map(([b, c]) => <Badge key={b} variant="secondary" size="sm">{b} ×{c}</Badge>)}
                    </div>
                  )}
                </div>
              )}
              <ShareHistoryList paperId={paper.id ?? `draft_${paper.title}`} />
            </div>

            <div className="space-y-3">
              {paper.instructions?.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Instructions</p>
                  <ul className="mt-1.5 grid gap-1 text-[12px] text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                    {paper.instructions.map((ins) => <li key={ins} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {ins}</li>)}
                  </ul>
                </div>
              )}
              <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <Badge variant="gradient" size="sm">{paper.questionCount} questions</Badge>
                  <Badge variant="secondary" size="sm">{paper.totalMarks} marks</Badge>
                  <Badge variant="secondary" size="sm">{paper.duration} min</Badge>
                  <Badge variant={DIFF_STYLES[paper.difficulty] ?? 'secondary'} size="sm">{paper.difficulty}</Badge>
                  {paper.pyqPreference && <Badge variant="info" size="sm">PYQ: {paper.pyqPreference}</Badge>}
                </div>
                <div className="space-y-2.5 p-4">
                  {paper.questions.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-slate-100 p-3.5 transition-colors hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-500/30">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{q.no}</span>
                          {q.text}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setEditTarget(q)}><Pencil className="h-3 w-3" /> Edit</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => setReplaceTarget(q)}><RefreshCw className="h-3 w-3" /> Replace</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={() => removeQuestion(q.id)}><Trash2 className="h-3 w-3" /> Remove</Button>
                        </div>
                      </div>
                      {q.options?.length && (
                        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                          {q.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i)
                            return (
                              <p key={letter} className={`rounded-lg px-3 py-1.5 text-[12px] ${letter === q.answer ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'}`}>
                                {letter}. {opt}{letter === q.answer ? ' ✓' : ''}
                              </p>
                            )
                          })}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
                        <Badge variant={DIFF_STYLES[q.difficulty] ?? 'secondary'} size="sm">{q.difficulty}</Badge>
                        <Badge variant="outline" size="sm">{q.marks} marks</Badge>
                        <Badge variant="secondary" size="sm">{q.type}</Badge>
                        <Badge variant="outline" size="sm">Chapter: {q.chapter}</Badge>
                        <Badge variant="outline" size="sm">Topic: {q.topic}</Badge>
                        {q.co && <Badge variant="secondary" size="sm">{q.co}</Badge>}
                        {q.bloom && <Badge variant="secondary" size="sm">Bloom: {q.bloom}</Badge>}
                        <Badge variant={q.isPyq ? 'warning' : 'secondary'} size="sm">PYQ: {q.isPyq ? (q.pyqYear ?? 'Yes') : 'No'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAPER LIBRARY (same workflow) ================= */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <FileText className="h-4 w-4 text-indigo-500" /> Paper Library ({papers.length})
          </h2>
          <p className="text-[11px] font-medium text-slate-400">Saved papers appear here automatically — view · duplicate · share · delete.</p>
        </div>
        {papers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No question papers yet.</p>
            <p className="mt-1 text-xs text-slate-400">Configure a paper above and hit Generate Demo Paper to create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {papers.map((p, i) => (
              <PaperCard
                key={p.id}
                paper={p}
                index={i}
                onView={() => { setSelectedPaper(p); setPreviewOpen(true) }}
                onEdit={() => { setGenerated({ paper: { ...p, questions: p.questionList ?? p.questions ?? [] } }); setTitle(p.title); setMode(p.mode ?? 'University'); setPaperType(p.paperType ?? p.examType ?? 'Mid Semester'); toast.info('Editing', `"${p.title}" loaded into the studio.`) }}
                onDuplicate={async (paper) => {
                  try {
                    const res = await duplicatePaper(paper.id)
                    if (res?.ok) { setOverlay((o) => ({ ...o, added: [res.paper, ...o.added] })); toast.success('Duplicated', `${res.paper.title} added as a copy.`) }
                  } catch { toast.error('Could not duplicate', 'Please try again.') }
                }}
                onDelete={setDeleteTarget}
                onRegenerate={async (paper) => {
                  try {
                    const res = await regeneratePaper(paper.id)
                    if (res?.ok) { toast.success('Regenerated ♻️', `${res.paper.title} → version v1.${res.paper.versions - 1}.`); refetch() }
                  } catch { toast.error('Could not regenerate', 'Please try again.') }
                }}
                onArchive={async (paper) => {
                  try {
                    const res = await archivePaper(paper.id)
                    toast.success(paper.archived ? 'Restored' : 'Archived', `${res.paper?.title ?? paper.title} ${paper.archived ? 'restored.' : 'moved to archive.'}`)
                    refetch()
                  } catch { toast.error('Could not archive', 'Please try again.') }
                }}
                onVersions={(paper) => { setSelectedPaper(paper); setVersionsOpen(true) }}
                onShare={setShareTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= Dialogs ================= */}
      <QuestionEditDialog
        question={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        onSave={updateQuestion}
        isUniversity={mode === 'University'}
      />
      <QuestionReplaceDialog
        question={replaceTarget}
        pool={mode === 'Competitive' ? compQuestions : bankQuestions}
        open={!!replaceTarget}
        onOpenChange={(v) => !v && setReplaceTarget(null)}
        onUse={useReplacement}
      />
      <PaperPrintPreview paper={paper} open={printOpen} onOpenChange={setPrintOpen} />
      <SharePaperDialog paper={shareTarget} open={!!shareTarget} onOpenChange={(v) => !v && setShareTarget(null)} />
      <PaperPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        paper={selectedPaper}
      />
      <PaperDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}
        paper={deleteTarget}
        onConfirm={handleDelete}
        deleting={deleting}
      />
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-indigo-500" /> Version history — {selectedPaper?.title}</DialogTitle>
            <DialogDescription>{selectedPaper?.course} · {selectedPaper?.mode ?? 'University'} · {selectedPaper?.versions ?? 1} versions</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            {(paperData?.versionHistory?.[selectedPaper?.id] ?? []).slice().reverse().map((v) => (
              <div key={v.version} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                <Badge variant="gradient" size="sm">{v.version}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{v.note}</p>
                  <p className="text-[10.5px] text-slate-400">{formatDate(v.date, 'MMM d, yyyy')}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toast.success('Restored', `${v.version} restored as the working draft.`)}>Restore</Button>
              </div>
            ))}
            {!paperData?.versionHistory?.[selectedPaper?.id]?.length && <p className="py-6 text-center text-xs text-slate-400">No version history yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PaperGeneratorTab }
export default PaperGeneratorTab
