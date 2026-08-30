/**
 * AI Exam Conducting Agent — LIVE exam interface.
 *
 * Timer · question card · options · question navigator · mark-for-review ·
 * prev/next · submit · real-time intelligence strip · subtle AI Exam Agent
 * indicator · Demo Monitoring simulation (deterministic, varied behaviour).
 *
 * Every tracked value (attempted / correct / incorrect / skipped / pace /
 * time efficiency / pressure) is DERIVED from the interaction record via
 * computeLiveExamStats — the UI never hardcodes a metric.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, ChevronDown, ChevronUp,
  Clock, FastForward, Flag, FlagOff, ListChecks, Pause, Play, Send, Sparkles, X,
} from 'lucide-react'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui'
import {
  buildDemoSimulationPlan, computeLiveExamStats, demoTimeScale, formatClock, formatPace,
} from '@/intelligence/engine/exam-agent.js'
import { cn } from '@/utils/cn'
import { QUESTION_OPTION_LABELS } from '@/constants/ui'
import { AgentChip, ExamTypeBadge, PacePill } from './exam-agent-shared'

const LETTERS = QUESTION_OPTION_LABELS

const DIFF_STYLES = { Easy: 'success', Medium: 'warning', Hard: 'danger' }

function statusOf(interaction) {
  if (!interaction || !interaction.visited) return 'not-visited'
  if (interaction.selected != null && interaction.markedForReview) return 'answered-review'
  if (interaction.markedForReview) return 'review'
  if (interaction.selected != null) return 'answered'
  return 'visited'
}

const NAV_STYLES = {
  'not-visited': 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700',
  visited: 'bg-white text-slate-500 ring-1 ring-inset ring-dashed ring-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700',
  answered: 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/30',
  review: 'bg-amber-400 text-amber-950 shadow-md shadow-amber-500/30',
  'answered-review': 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white ring-2 ring-inset ring-amber-400',
}

const LEGEND = [
  { key: 'answered', dot: 'bg-gradient-to-br from-indigo-600 to-blue-600', label: 'Answered' },
  { key: 'review', dot: 'bg-amber-400', label: 'Marked for review' },
  { key: 'answered-review', dot: 'bg-gradient-to-br from-indigo-600 to-blue-600 ring-2 ring-inset ring-amber-400', label: 'Answered + review' },
  { key: 'visited', dot: 'bg-white ring-1 ring-dashed ring-slate-300', label: 'Visited' },
  { key: 'not-visited', dot: 'bg-slate-100', label: 'Not visited' },
]

function MiniStat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800/60">
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn('mt-0.5 text-[13px] font-bold text-slate-800 dark:text-slate-100', accent)}>{value}</p>
    </div>
  )
}

function ExamAgentLive({ exam, mode, onExit, onComplete }) {
  const isDemo = mode === 'demo'
  const duration = exam.durationMinutes * 60
  const scale = useMemo(() => demoTimeScale(exam), [exam])

  const [current, setCurrent] = useState(0)
  const [version, setVersion] = useState(0)
  const [remaining, setRemaining] = useState(duration)
  const [paused, setPaused] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(isDemo)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [finished, setFinished] = useState(false)
  const [log, setLog] = useState([])

  const interactionsRef = useRef({})
  const startedAtRef = useRef(Date.now())
  const startedAtIsoRef = useRef(new Date().toISOString())
  const qStartedAtRef = useRef(Date.now())
  const currentRef = useRef(0)
  const elapsedRef = useRef(0)
  const cursorRef = useRef(0)
  const submitLockRef = useRef(false)
  const pausedRef = useRef(paused)
  const finishedRef = useRef(false)
  const scheduleRef = useRef([])
  const onCompleteRef = useRef(onComplete)
  const finalizeRef = useRef(() => {})
  const applyEventRef = useRef(() => {})

  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  /* ---------------- interaction helpers ---------------- */
  const touch = useCallback((qid) => {
    if (!interactionsRef.current[qid]) {
      interactionsRef.current[qid] = {
        selected: null, timeSpent: 0, visits: 0, answerChanges: 0, markedForReview: false,
        visited: false, firstViewedAt: new Date().toISOString(), lastViewedAt: new Date().toISOString(),
      }
    } else {
      /* lastViewedAt — refreshed on every interaction with the question */
      interactionsRef.current[qid].lastViewedAt = new Date().toISOString()
    }
    return interactionsRef.current[qid]
  }, [])

  const accumulateCurrent = useCallback(() => {
    const q = exam.questions[currentRef.current]
    if (!q) return
    const it = touch(q.id)
    const now = Date.now()
    it.timeSpent += (now - qStartedAtRef.current) / 1000
    qStartedAtRef.current = now
  }, [exam, touch])

  const goTo = useCallback((i) => {
    if (finishedRef.current) return
    const next = Math.min(Math.max(i, 0), exam.questions.length - 1)
    accumulateCurrent()
    const it = touch(exam.questions[next].id)
    it.visits += 1
    it.visited = true
    currentRef.current = next
    setCurrent(next)
    qStartedAtRef.current = Date.now()
    setVersion((v) => v + 1)
  }, [accumulateCurrent, exam, touch])

  const selectOption = useCallback((idx) => {
    if (finishedRef.current) return
    const q = exam.questions[currentRef.current]
    const it = touch(q.id)
    if (it.selected != null && it.selected !== idx) it.answerChanges += 1
    if (it.selected === idx) return
    it.selected = idx
    it.visited = true
    it.visits = Math.max(it.visits, 1)
    setVersion((v) => v + 1)
  }, [exam, touch])

  const toggleReview = useCallback(() => {
    if (finishedRef.current) return
    const q = exam.questions[currentRef.current]
    const it = touch(q.id)
    it.markedForReview = !it.markedForReview
    it.visited = true
    setVersion((v) => v + 1)
  }, [exam, touch])

  /* ---------------- demo simulation schedule ---------------- */
  const schedule = useMemo(() => {
    if (!isDemo) return []
    const plan = buildDemoSimulationPlan(exam)
    let t = 0
    const visits = plan.visits.map((v) => {
      const ev = {
        kind: 'visit', qIndex: v.qIndex, dwell: v.dwell, answer: v.answer,
        skip: v.skip, markReview: v.markReview, change: v.change, start: t,
      }
      t += v.dwell
      return ev
    })
    const revisits = plan.revisits.map((r) => {
      const ev = { kind: 'revisit', qIndex: r.qIndex, dwell: r.dwell, answer: r.answer, start: t }
      t += r.dwell
      return ev
    })
    return [...visits, ...revisits]
  }, [isDemo, exam])
  useEffect(() => { scheduleRef.current = schedule }, [schedule])

  const pushLog = useCallback((qIndex, text, atSeconds) => {
    setLog((l) => [...l.slice(-39), { t: formatClock(atSeconds), q: qIndex + 1, text }])
  }, [])

  const applyEvent = useCallback((ev) => {
    const q = exam.questions[ev.qIndex]
    if (!q) return
    const it = touch(q.id)
    it.visited = true
    it.visits += 1
    it.timeSpent += ev.dwell
    const t = Math.round(elapsedRef.current)
    if (ev.kind === 'revisit') {
      if (ev.answer != null) {
        it.selected = ev.answer
        pushLog(ev.qIndex, `Revisited — answered (${LETTERS[ev.answer]})`, t)
      } else {
        pushLog(ev.qIndex, 'Revisited — left unanswered', t)
      }
    } else if (ev.skip) {
      pushLog(ev.qIndex, 'Skipped', t)
    } else {
      it.selected = ev.answer
      if (ev.change) {
        it.answerChanges = 1
        pushLog(ev.qIndex, `Answer changed → (${LETTERS[ev.answer]})`, t)
      } else {
        pushLog(ev.qIndex, `Answered (${LETTERS[ev.answer]})`, t)
      }
    }
    if (ev.markReview) {
      it.markedForReview = true
      pushLog(ev.qIndex, 'Marked for review', t)
    }
  }, [exam, pushLog, touch])
  useEffect(() => { applyEventRef.current = applyEvent }, [applyEvent])

  /* ---------------- finalize (manual submit / time-up / demo end) ---------------- */
  const finalize = useCallback(() => {
    if (submitLockRef.current) return
    submitLockRef.current = true
    accumulateCurrent()
    const elapsed = isDemo ? elapsedRef.current : Math.max(0, (Date.now() - startedAtRef.current) / 1000)
    onCompleteRef.current({
      interactions: interactionsRef.current,
      elapsedSeconds: Math.round(elapsed),
      completedAt: new Date().toISOString(),
      startedAt: startedAtIsoRef.current,
    })
  }, [accumulateCurrent, isDemo])
  useEffect(() => { finalizeRef.current = finalize }, [finalize])

  /* ---------------- manual ticker (real clock) ---------------- */
  useEffect(() => {
    if (isDemo) return undefined
    const id = setInterval(() => {
      const rem = Math.max(0, duration - (Date.now() - startedAtRef.current) / 1000)
      setRemaining(rem)
      if (rem <= 0) finalizeRef.current()
    }, 500)
    return () => clearInterval(id)
  }, [duration, isDemo])

  /* ---------------- demo ticker (accelerated clock) ---------------- */
  useEffect(() => {
    if (!isDemo) return undefined
    const id = setInterval(() => {
      if (pausedRef.current || finishedRef.current) return
      elapsedRef.current += 0.5 * scale
      const elapsed = elapsedRef.current
      setRemaining(Math.max(0, duration - elapsed))
      const events = scheduleRef.current
      while (cursorRef.current < events.length && events[cursorRef.current].start <= elapsed) {
        applyEventRef.current(events[cursorRef.current])
        cursorRef.current += 1
      }
      const active = [...events].reverse().find((e) => e.start <= elapsed && elapsed < e.start + e.dwell)
      if (active && active.qIndex !== currentRef.current) {
        currentRef.current = active.qIndex
        setCurrent(active.qIndex)
      }
      if (cursorRef.current >= events.length && !finishedRef.current) {
        finishedRef.current = true
        setFinished(true)
        setTimeout(() => finalizeRef.current(), 1400)
      }
      setVersion((v) => v + 1)
    }, 500)
    return () => clearInterval(id)
  }, [duration, isDemo, scale])

  /* ---------------- finish now (demo control) ---------------- */
  const finishNow = useCallback(() => {
    if (finishedRef.current) return
    const events = scheduleRef.current
    while (cursorRef.current < events.length) {
      applyEventRef.current(events[cursorRef.current])
      cursorRef.current += 1
    }
    if (events.length) {
      const last = events[events.length - 1]
      elapsedRef.current = Math.max(elapsedRef.current, last.start + last.dwell)
      currentRef.current = last.qIndex
      setCurrent(last.qIndex)
    }
    setRemaining(Math.max(0, duration - elapsedRef.current))
    finishedRef.current = true
    setFinished(true)
    setTimeout(() => finalizeRef.current(), 1200)
  }, [duration])

  /* ---------------- derived live stats ---------------- */
  const elapsed = isDemo ? elapsedRef.current : Math.max(0, duration - remaining)
  const live = computeLiveExamStats({ exam, interactions: interactionsRef.current, elapsedSeconds: elapsed })
  const question = exam.questions[current]
  const qInteraction = interactionsRef.current[question.id]
  const answeredCount = exam.questions.filter((qq) => interactionsRef.current[qq.id]?.selected != null).length
  const reviewCount = exam.questions.filter((qq) => interactionsRef.current[qq.id]?.markedForReview).length
  const progressPct = exam.questions.length ? Math.round((answeredCount / exam.questions.length) * 100) : 0
  const timeLow = remaining <= 60
  const timeWarn = remaining <= 300 && !timeLow

  return (
    <div className="mx-auto max-w-6xl">
      {/* ================= Top bar ================= */}
      <div className="sticky top-0 z-40 -mx-4 mb-4 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onExit}
              aria-label="Exit exam"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{exam.shortTitle}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <ExamTypeBadge type={exam.type} className="px-2 py-0 text-[10px]" />
                <button
                  onClick={() => setInsightsOpen((o) => !o)}
                  aria-expanded={insightsOpen}
                  className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 transition-opacity hover:opacity-80"
                  title="Toggle live AI analysis"
                >
                  <AgentChip pulse={!finished} label="AI Exam Agent" />
                  {insightsOpen ? <ChevronUp className="h-3 w-3 text-indigo-400" /> : <ChevronDown className="h-3 w-3 text-indigo-400" />}
                </button>
                {isDemo && <Badge variant="warning" size="sm"><Sparkles className="h-2.5 w-2.5" /> Demo Monitoring</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3.5 py-2 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
              <Clock className={cn('h-4 w-4', timeLow ? 'text-rose-500' : timeWarn ? 'text-amber-500' : 'text-slate-400')} />
              <span className={cn(
                'font-mono text-lg font-bold tabular-nums tracking-tight',
                timeLow ? 'animate-pulse text-rose-600 dark:text-rose-400' : timeWarn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              )}>
                {formatClock(remaining)}
              </span>
            </div>
            <Button size="sm" variant={finished ? 'secondary' : 'default'} disabled={finished} onClick={() => setConfirmOpen(true)}>
              <Send className="h-3.5 w-3.5" /> Submit
            </Button>
          </div>
        </div>
        {/* progress */}
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ================= Question column ================= */}
        <div className="min-w-0 space-y-4">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                Question {current + 1} <span className="font-medium text-slate-400">of {exam.questions.length}</span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="info" size="sm">{question.subject}</Badge>
                <Badge variant="secondary" size="sm">{question.chapter} · {question.topic}</Badge>
                <Badge variant={DIFF_STYLES[question.difficulty] ?? 'secondary'} size="sm">{question.difficulty}</Badge>
                <Badge variant="outline" size="sm">+{question.marks}{question.negativeMarks > 0 ? ` / −${question.negativeMarks}` : ''}</Badge>
              </div>
            </div>

            <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-800 dark:text-slate-100">{question.question}</p>

            <div className="mt-5 grid gap-2.5">
              {question.options.map((opt, i) => {
                const selected = qInteraction?.selected === i
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(i)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200',
                      selected
                        ? 'border-indigo-500 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-500/40 dark:border-indigo-400 dark:bg-indigo-500/10'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold transition-colors',
                      selected
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}>
                      {LETTERS[i]}
                    </span>
                    <span className="min-w-0 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">{opt}</span>
                    {selected && <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <Button variant={qInteraction?.markedForReview ? 'secondary' : 'outline'} size="sm" onClick={toggleReview} className={qInteraction?.markedForReview ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300' : ''}>
                {qInteraction?.markedForReview ? <Flag className="h-3.5 w-3.5" /> : <FlagOff className="h-3.5 w-3.5" />}
                {qInteraction?.markedForReview ? 'Marked for review' : 'Mark for review'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={current === 0 || finished} onClick={() => goTo(current - 1)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={current === exam.questions.length - 1 || finished} onClick={() => goTo(current + 1)}>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* time-up warning (manual, subtle) */}
          <AnimatePresence>
            {!isDemo && timeWarn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[12px] font-semibold text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" /> Less than 5 minutes left — lock in your remaining answers.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= Side column ================= */}
        <div className="min-w-0 space-y-4">
          {/* Real-time intelligence (subtle, collapsible) */}
          <AnimatePresence initial={false}>
            {insightsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-3xl border border-indigo-200/60 bg-white shadow-card dark:border-indigo-500/25 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 px-4 py-2.5 dark:border-indigo-500/15">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                    <BrainCircuit className="h-3.5 w-3.5" /> Live analysis
                  </p>
                  <PacePill pace={live.pace} compact />
                </div>
                <div className="p-3.5">
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="Attempted" value={`${live.attempted}/${live.total}`} />
                    <MiniStat label="Correct" value={live.correct} accent="text-emerald-600 dark:text-emerald-400" />
                    <MiniStat label="Incorrect" value={live.incorrect} accent="text-rose-600 dark:text-rose-400" />
                    <MiniStat label="Skipped" value={live.skipped} accent="text-amber-600 dark:text-amber-400" />
                    <MiniStat label="Accuracy" value={live.attempted ? `${live.accuracy}%` : '—'} />
                    <MiniStat label="Avg / Q" value={live.visited ? formatPace(live.avgTimePerQuestion) : '—'} />
                  </div>
                  <div className="mt-3 space-y-1.5 rounded-2xl bg-slate-50 p-3 text-[11.5px] font-medium text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <div className="flex items-center justify-between gap-2">
                      <span>Required pace</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{live.requiredPace ? formatPace(live.requiredPace) : '—'}/q</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Current pace</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{live.visited ? formatPace(live.currentPace) : '—'}/q</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Time efficiency</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{live.timeEfficiency}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Remaining</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatClock(live.remainingTime)} · {live.remainingQuestions} questions</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-500" style={{ width: `${Math.min(100, progressPct)}%` }} />
                  </div>
                  <p className="mt-2 text-[10.5px] font-medium leading-relaxed text-slate-400">
                    Derived live from your interactions — updated every second. Full question intelligence appears in the AI report after submission.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question navigator */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <ListChecks className="h-3.5 w-3.5" /> Question navigator
            </p>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {exam.questions.map((qq, i) => {
                const st = statusOf(interactionsRef.current[qq.id])
                return (
                  <button
                    key={qq.id}
                    onClick={() => goTo(i)}
                    aria-label={`Go to question ${i + 1}${st === 'answered' ? ' (answered)' : st === 'review' ? ' (marked for review)' : ''}`}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-xl text-[12px] font-bold transition-all',
                      NAV_STYLES[st],
                      i === current && 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {LEGEND.map((l) => (
                <span key={l.key} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className={cn('h-2.5 w-2.5 rounded-full', l.dot)} /> {l.label}
                </span>
              ))}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[10.5px] font-medium leading-relaxed text-slate-400 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-300">{answeredCount} answered</span> · {reviewCount} marked for review · {exam.questions.length - answeredCount} pending
            </p>
          </div>

          {/* Demo monitoring panel */}
          {isDemo && (
            <div className="rounded-3xl border border-amber-200/70 bg-white p-4 shadow-card dark:border-amber-500/25 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Demo Monitoring
                </p>
                <div className="flex gap-1.5">
                  <Button size="icon-sm" variant="outline" onClick={() => setPaused((p) => !p)} disabled={finished} aria-label={paused ? 'Resume demo' : 'Pause demo'}>
                    {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={finishNow} disabled={finished}>
                    <FastForward className="h-3.5 w-3.5" /> Finish now
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-400">
                A simulated student is taking this paper with varied timing and answer patterns. Watch the feed below.
              </p>
              <div className="mt-2.5 max-h-44 space-y-1 overflow-y-auto rounded-2xl bg-slate-950 p-3 font-mono text-[10.5px] leading-relaxed dark:bg-black/60">
                {log.length === 0 && <p className="text-slate-500">Waiting for the student to start…</p>}
                {log.map((entry, i) => (
                  <p key={i} className="text-slate-400">
                    <span className="text-slate-600">[{entry.t}]</span> Q{entry.q} · <span className="text-slate-200">{entry.text}</span>
                  </p>
                ))}
                {finished && <p className="text-amber-400">▸ Auto-submitting the paper…</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= Submit confirmation ================= */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit {exam.shortTitle}?</DialogTitle>
            <DialogDescription>
              The AI Exam Agent will analyse your attempt and generate the performance report. You cannot change answers after submission.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{live.attempted}</p>
              <p className="text-[10.5px] font-semibold text-slate-400">Answered</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-center dark:bg-amber-500/10">
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{reviewCount}</p>
              <p className="text-[10.5px] font-semibold text-amber-600/70 dark:text-amber-300/70">Marked for review</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-center dark:bg-rose-500/10">
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{exam.questions.length - live.attempted}</p>
              <p className="text-[10.5px] font-semibold text-rose-600/70 dark:text-rose-300/70">Unanswered</p>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep attempting</Button>
            <Button onClick={() => { setConfirmOpen(false); finalize() }}>
              <Send className="h-4 w-4" /> Submit exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ExamAgentLive }
export default ExamAgentLive
