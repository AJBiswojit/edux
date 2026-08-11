/**
 * AI Exam Conducting Agent — Student portal page.
 *
 * Flow: Home (select exam) → Instructions → Live exam interface
 * (manual or Demo Monitoring) → AI analysis → AI Exam Performance Report.
 *
 * The report is produced by buildExamAgentReport (Student Intelligence
 * engine) from the attempt's interaction data, with a context bridge into
 * the AI Academic DNA / AI Exam Analysis foundation.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { BrainCircuit, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge } from '@/components/ui'
import { useExamAgentAttempt, useExamAgentAttempts, useExamAgentExams, useSaveExamAgentAttempt } from '@/services/exam-agent'
import { useMasterStudentProfile, useStudentIntelligence } from '@/services/intelligence'
import { buildCanonicalExamAttempt, buildExamAgentReport } from '@/intelligence'
import { ExamAgentHome, ExamAgentInstructions, ExamAgentLive, ExamAgentReport } from '@/components/exam-workspace'

const ANALYSIS_STEPS = [
  'Scoring the attempt',
  'Classifying question intelligence',
  'Building subject & chapter analysis',
  'Generating recommendations',
]

function ExamAgent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: examsData, isLoading, isError, refetch } = useExamAgentExams()
  const { data: attemptsData } = useExamAgentAttempts()
  const saveAttempt = useSaveExamAgentAttempt()
  const { data: intel } = useStudentIntelligence()
  const { data: masterProfile } = useMasterStudentProfile()

  /* Student identity — the existing master student profile (Phase 1:
     attempts must carry studentId + roll for future faculty/DNA consumers). */
  const identity = useMemo(() => ({
    studentId: masterProfile?.id ?? null,
    roll: masterProfile?.rollNo ?? null,
  }), [masterProfile])

  const exams = examsData?.items ?? []
  const attempts = attemptsData?.items ?? []

  /* attempt deep-link */
  const [viewAttemptId, setViewAttemptId] = useState(null)
  const { data: storedAttemptData } = useExamAgentAttempt(viewAttemptId)

  const [step, setStep] = useState('home') // home | instructions | live | analyzing | report
  const [selected, setSelected] = useState(null) // { exam, mode }
  const [liveKey, setLiveKey] = useState(0)
  const [report, setReport] = useState(null)
  const [analyzeStep, setAnalyzeStep] = useState(0)

  /* Intelligence foundation for the report's DNA bridge */
  const foundation = useMemo(() => {
    const derived = intel?.derived ?? {}
    return {
      academicDna: derived.academicDna,
      readinessByFamily: derived.readiness?.byExamFamily,
      universityReadiness: derived.readiness?.university,
    }
  }, [intel])

  /* Deep-link: ?exam=ID&mode=demo / ?attempt=ID */
  useEffect(() => {
    const examId = searchParams.get('exam')
    const attemptId = searchParams.get('attempt')
    if (attemptId) {
      setViewAttemptId(attemptId)
      setStep('report')
      return
    }
    if (examId && exams.length) {
      const exam = exams.find((e) => e.id === examId)
      if (exam) {
        setSelected({ exam, mode: searchParams.get('mode') === 'demo' ? 'demo' : 'manual' })
        setStep('instructions')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, exams.length])

  /* Build report from a stored attempt (history / deep link) */
  useEffect(() => {
    const stored = storedAttemptData?.attempt
    if (!stored || !exams.length || !viewAttemptId) return
    const exam = exams.find((e) => e.id === stored.examId)
    if (exam) {
      setReport(buildExamAgentReport({
        exam,
        interactions: stored.interactions ?? {},
        elapsedSeconds: stored.elapsedSeconds ?? 0,
        completedAt: stored.completedAt,
        foundation,
      }))
      setStep('report')
    }
  }, [storedAttemptData, exams, viewAttemptId, foundation])

  const handleStart = useCallback((exam, mode) => {
    setSelected({ exam, mode })
    setLiveKey((k) => k + 1)
    setStep('instructions')
  }, [])

  const handleBegin = useCallback(() => {
    setLiveKey((k) => k + 1)
    setStep('live')
  }, [])

  const handleComplete = useCallback((payload) => {
    if (!selected) return
    const rep = buildExamAgentReport({
      exam: selected.exam,
      interactions: payload.interactions,
      elapsedSeconds: payload.elapsedSeconds,
      completedAt: payload.completedAt,
      foundation,
    })
    setReport(rep)
    /* Phase 1 — save the CANONICAL ExamAttempt (identity + startedAt +
       source + denormalized exam/question snapshot + raw interactions +
       derived summary). Legacy fields are preserved inside the record for
       backward compatibility with the existing history/report flows. */
    saveAttempt.mutate(buildCanonicalExamAttempt({
      exam: selected.exam,
      interactions: payload.interactions,
      elapsedSeconds: payload.elapsedSeconds,
      completedAt: payload.completedAt,
      startedAt: payload.startedAt ?? null,
      studentId: identity.studentId,
      roll: identity.roll,
      mode: selected.mode,
      report: rep,
    }))
    setAnalyzeStep(0)
    setStep('analyzing')
  }, [foundation, identity, saveAttempt, selected])

  /* analysis animation → report */
  useEffect(() => {
    if (step !== 'analyzing') return undefined
    const id = setInterval(() => setAnalyzeStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length)), 420)
    return () => clearInterval(id)
  }, [step])
  useEffect(() => {
    if (step !== 'analyzing' || analyzeStep < ANALYSIS_STEPS.length) return undefined
    const t = setTimeout(() => setStep('report'), 400)
    return () => clearTimeout(t)
  }, [step, analyzeStep])

  const handleHome = useCallback(() => {
    setSelected(null)
    setReport(null)
    setViewAttemptId(null)
    setStep('home')
  }, [])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const counts = {
    University: exams.filter((e) => e.type === 'University').length,
    JEE: exams.filter((e) => e.type === 'JEE').length,
    NEET: exams.filter((e) => e.type === 'NEET').length,
  }

  return (
    <div>
      <PageHeader
        eyebrow="Academics · Examinations · AI Agent"
        title="AI Exam Conducting Agent"
        description="Practice exams with real-time interaction intelligence — a live timer, question-by-question tracking, and a full AI performance report with strengths, weaknesses and recommendations."
        breadcrumbs={[{ label: 'Student' }, { label: 'Examinations', to: '/student/examinations' }, { label: 'AI Exam Agent' }]}
        actions={
          <Badge variant="gradient" className="px-3 py-1">
            <Sparkles className="h-3 w-3" /> {counts.University} University · {counts.JEE} JEE · {counts.NEET} NEET
          </Badge>
        }
      />

      {step === 'home' && (
        <ExamAgentHome
          exams={exams}
          attempts={attempts}
          onStart={handleStart}
          onOpenAttempt={(id) => {
            setViewAttemptId(id)
            setStep('report')
            setSearchParams({ attempt: id }, { replace: true })
          }}
        />
      )}

      {step === 'instructions' && selected && (
        <ExamAgentInstructions
          exam={selected.exam}
          mode={selected.mode}
          onBack={handleHome}
          onStart={handleBegin}
        />
      )}

      {step === 'live' && selected && (
        <ExamAgentLive
          key={`${selected.exam.id}-${selected.mode}-${liveKey}`}
          exam={selected.exam}
          mode={selected.mode}
          onExit={handleHome}
          onComplete={handleComplete}
        />
      )}

      {step === 'analyzing' && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg rounded-3xl border border-indigo-200/60 bg-white p-8 text-center shadow-card dark:border-indigo-500/25 dark:bg-slate-900"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">AI Exam Agent is analysing your attempt</h3>
          <p className="mt-1 text-xs font-medium text-slate-400">Deriving question, subject and chapter intelligence from your interactions…</p>
          <div className="mt-6 space-y-2 text-left">
            {ANALYSIS_STEPS.map((s, i) => {
              const done = analyzeStep > i
              const active = analyzeStep === i
              return (
                <div key={s} className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold ${done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'bg-slate-50 text-slate-400 dark:bg-slate-800/60'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-slate-700" />}
                  {s}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {step === 'report' && report && (
        <ExamAgentReport
          report={report}
          mode={selected?.mode ?? (viewAttemptId ? 'manual' : 'manual')}
          onRetake={() => (selected ? setStep('instructions') : handleHome())}
          onBack={handleHome}
        />
      )}

      {step === 'report' && !report && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading attempt report…
        </div>
      )}

      {/* Breadcrumb helper */}
      <p className="mt-6 text-[11px] font-medium text-slate-300 dark:text-slate-600">
        <Link to="/student/examinations" className="transition-colors hover:text-indigo-500">← Examinations</Link>
      </p>
    </div>
  )
}

export { ExamAgent }
export default ExamAgent
