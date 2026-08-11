/**
 * AI Exam Conducting Agent — Home (exam selection + attempt history).
 * Lists the 9 practice papers (3 university · 3 JEE · 3 NEET), offers
 * Start Exam (manual) and Demo Monitoring per paper, and surfaces the
 * recent attempt history persisted via the mock API.
 */
import { motion } from 'framer-motion'
import {
  Activity, BrainCircuit, ClipboardCheck, Clock, Eye, FileQuestion, ListChecks, Play, ShieldCheck, Sparkles, Timer,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { formatDate, formatRelative } from '@/utils/format'
import { EXAM_AGENT_GROUP_LABELS } from '@/mock-data/exam-agent'
import { ExamTypeBadge, AgentChip } from './exam-agent-shared'

const TYPE_ORDER = ['University', 'JEE', 'NEET']

function ExamCard({ exam, index, onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold leading-snug text-slate-900 dark:text-white">{exam.title}</p>
            {exam.subjectCode ? (
              <p className="mt-0.5 text-[11.5px] font-medium text-slate-400">{exam.subjectCode} · {exam.subject}</p>
            ) : (
              <p className="mt-0.5 text-[11.5px] font-medium text-slate-400">{exam.subject}</p>
            )}
          </div>
          <ExamTypeBadge type={exam.type} />
        </div>

        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{exam.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" size="sm"><Clock className="h-3 w-3" /> {exam.durationMinutes} min</Badge>
          <Badge variant="secondary" size="sm"><FileQuestion className="h-3 w-3" /> {exam.questions.length} questions</Badge>
          <Badge variant="secondary" size="sm"><ClipboardCheck className="h-3 w-3" /> +{exam.marksPerQuestion}
            {exam.negativeMarksPerQuestion > 0 ? ` / −${exam.negativeMarksPerQuestion}` : ' · no negative'}
          </Badge>
        </div>

        <div className="mt-4 flex flex-col gap-2 pt-1 sm:flex-row">
          <Button size="sm" className="flex-1" onClick={() => onStart(exam, 'manual')}>
            <Play className="h-3.5 w-3.5" /> Start exam
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onStart(exam, 'demo')}>
            <Sparkles className="h-3.5 w-3.5" /> Demo monitoring
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

function ExamAgentHome({ exams, attempts, onStart, onOpenAttempt }) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    ...EXAM_AGENT_GROUP_LABELS[type],
    items: (exams ?? []).filter((e) => e.type === type),
  })).filter((g) => g.items.length > 0)

  return (
    <div>
      {/* Intro banner */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/20 sm:p-8"
      >
        <div className="bg-grid mask-fade-y pointer-events-none absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <AgentChip pulse={false} label="AI Exam Conducting Agent" />
            <Badge className="bg-white/15 text-white ring-white/25"><ShieldCheck className="h-3 w-3" /> Interaction-only analysis</Badge>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">Practice exams with real-time question intelligence</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/80">
            Take a university, JEE Main or NEET UG practice paper and let the agent track every interaction —
            timing, answer changes, revisits and skips — then receive a full subject &amp; chapter analysis with
            strengths, weaknesses and recommendations. No camera, microphone or device monitoring — this agent
            analyses only how you answer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11.5px] font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20"><Timer className="h-3 w-3" /> Live timer &amp; pace</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20"><Activity className="h-3 w-3" /> Real-time tracking</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20"><BrainCircuit className="h-3 w-3" /> Question intelligence</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20"><ListChecks className="h-3 w-3" /> AI performance report</span>
          </div>
        </div>
      </motion.div>

      {/* Exam groups */}
      {grouped.map((group) => (
        <div key={group.type} className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">{group.label}</h3>
              <p className="text-xs font-medium text-slate-400">{group.sub}</p>
            </div>
            <Badge variant="secondary" size="sm">{group.items.length} paper{group.items.length === 1 ? '' : 's'}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map((exam, i) => (
              <ExamCard key={exam.id} exam={exam} index={i} onStart={onStart} />
            ))}
          </div>
        </div>
      ))}

      {/* Recent attempts */}
      {attempts?.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Recent attempts</h3>
              <p className="text-xs font-medium text-slate-400">Stored locally on this browser (prototype persistence).</p>
            </div>
            <Eye className="h-4 w-4 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="space-y-2.5">
            {attempts.slice(0, 6).map((a) => (
              <button
                key={a.id}
                onClick={() => onOpenAttempt(a.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <ClipboardCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{a.examTitle}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400">
                      {formatRelative(a.completedAt)} · {formatDate(a.completedAt, 'MMM d, h:mm a')}
                      <Badge variant={a.mode === 'demo' ? 'warning' : 'info'} size="sm">{a.mode === 'demo' ? 'Demo' : 'Manual'}</Badge>
                      <ExamTypeBadge type={a.examType} className="px-2 py-0 text-[10px]" />
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{a.summary?.score ?? 0}<span className="text-[10px] font-medium text-slate-400"> / {a.summary?.maxScore ?? 0}</span></p>
                    <p className="text-[10.5px] font-semibold text-slate-400">{a.summary?.pct ?? 0}% · accuracy {a.summary?.accuracy ?? 0}%</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    View report
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Honesty note */}
      <p className="mt-8 rounded-2xl bg-slate-50 px-4 py-3 text-[11.5px] font-medium leading-relaxed text-slate-400 dark:bg-slate-800/60">
        <span className="font-bold text-slate-500 dark:text-slate-300">Prototype note:</span> the AI Exam Agent is a frontend-only
        simulation — it analyses your attempt locally and never sends data anywhere. Attempt history is stored in this
        browser only, and no real backend, WebSocket or proctoring infrastructure is involved.
      </p>
    </div>
  )
}

export { ExamAgentHome }
export default ExamAgentHome
