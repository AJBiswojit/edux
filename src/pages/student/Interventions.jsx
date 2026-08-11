/**
 * Student — My Interventions (Phase 6).
 * Assigned interventions (prototype assignment): title, why-assigned,
 * subject/chapter, practice progress, Start Practice / Start Re-test.
 * Practice and re-test results are stored as practice attempts —
 * never as official exams. Reached from the Examinations entry strip
 * (no sidebar item).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, ClipboardList, Clock, Sparkles, Target, Timer } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, useToast } from '@/components/ui'
import { useMasterStudentProfile } from '@/services/intelligence'
import {
  useStudentInterventions, useStudentInterventionPractice, useStudentInterventionRetest,
  useSubmitInterventionAttempt,
} from '@/services/faculty-interventions'
import { InterventionPracticeRunner } from '@/components/intervention-workspace/intervention-practice-runner'

const STATUS_STYLE = {
  Assigned: 'info', 'In Progress': 'info', Completed: 'success', 'Re-test Pending': 'warning',
  Evaluating: 'warning', Resolved: 'success', Improving: 'success', Persistent: 'danger',
}
const DOMAIN_BADGE = { University: 'info', Competitive: 'gradient' }

function InterventionCard({ iv, onStartPractice, onStartRetest }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-500">{iv.subject} — {iv.chapter}</p>
          <h3 className="mt-1 text-[15px] font-bold text-slate-900 dark:text-white">{iv.title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">{iv.whyAssigned}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={DOMAIN_BADGE[iv.domain]} size="sm">{iv.domain}{iv.examFamily ? ` · ${iv.examFamily}` : ''}</Badge>
          <Badge variant={STATUS_STYLE[iv.status] ?? 'secondary'} size="sm">{iv.status}</Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary" size="sm"><Target className="h-3 w-3" /> {iv.issueType}</Badge>
        <Badge variant="secondary" size="sm"><BookOpen className="h-3 w-3" /> {iv.practiceConfig?.type}</Badge>
        {iv.practiceConfig?.duration && <Badge variant="secondary" size="sm"><Clock className="h-3 w-3" /> {iv.practiceConfig.duration} min</Badge>}
        {iv.practiceDone && iv.practiceAccuracy != null && (
          <Badge variant={iv.practiceAccuracy >= 70 ? 'success' : 'warning'} size="sm">Practice {iv.practiceAccuracy}%</Badge>
        )}
        {iv.outcome && ['Resolved', 'Improving', 'Persistent'].includes(iv.outcome) && (
          <Badge variant={iv.outcome === 'Resolved' ? 'success' : iv.outcome === 'Improving' ? 'info' : 'danger'} size="sm">{iv.outcome}</Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!iv.practiceDone && ['Assigned', 'In Progress', 'Completed', 'Re-test Pending'].includes(iv.status) && (
          <Button size="sm" onClick={onStartPractice}><Sparkles className="h-3.5 w-3.5" /> Start Practice</Button>
        )}
        {iv.retest && !iv.retestDone && ['Re-test Pending', 'Assigned', 'Completed', 'In Progress'].includes(iv.status) && (
          <Button size="sm" variant="warning" onClick={onStartRetest}><Timer className="h-3.5 w-3.5" /> Start Re-test</Button>
        )}
        {iv.retestDone && (
          <Badge variant="success" size="sm"><CheckCircle2 className="h-3 w-3" /> Re-test submitted</Badge>
        )}
        {iv.status === 'Resolved' && <Badge variant="success" size="sm">Weakness resolved 🎉</Badge>}
      </div>
      {iv.practiceRequired > 0 && (
        <p className="mt-3 text-[10.5px] font-medium text-slate-400">
          Practice: {iv.practiceDone ? 'completed' : `${iv.practiceRequired} questions`} · prototype assignment — nothing is delivered outside this prototype.
        </p>
      )}
    </Card>
  )
}

function Interventions() {
  const { data: profile } = useMasterStudentProfile()
  const studentId = profile?.id ?? 'u_stu_001'
  const { data, isLoading, isError, refetch } = useStudentInterventions(studentId)
  const toast = useToast()
  const submit = useSubmitInterventionAttempt()

  const [session, setSession] = useState(null) // { kind, iv }
  const practiceData = useStudentInterventionPractice(session?.kind === 'practice' ? session.iv.id : null)
  const retestData = useStudentInterventionRetest(session?.kind === 'retest' ? session.iv.id : null)

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const items = data?.items ?? []

  const handleSubmit = (payload) => {
    submit.mutate({ interventionId: session.iv.id, payload: { ...payload, studentId } }, {
      onSuccess: (res) => {
        toast.success(payload.kind === 'retest' ? 'Re-test submitted' : 'Practice completed',
          payload.kind === 'retest'
            ? `Effectiveness is being evaluated — outcome: ${res.status}.`
            : 'Your progress is saved. The faculty can now schedule your re-test.')
      },
    })
  }

  /* active session */
  if (session) {
    const kind = session.kind
    const qs = kind === 'retest' ? (retestData?.data?.retest?.questions ?? []) : (practiceData?.data?.questions ?? [])
    const title = kind === 'retest'
      ? (retestData?.data?.retest?.title ?? `Re-test — ${session.iv.chapter}`)
      : `Targeted Practice — ${session.iv.chapter}`
    return (
      <div>
        <button onClick={() => setSession(null)} className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <ArrowLeft className="h-3.5 w-3.5" /> My interventions
        </button>
        {kind === 'retest' && retestData?.isError ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No re-test assigned yet</p>
            <p className="mt-1 text-xs text-slate-400">The faculty will schedule a re-test after reviewing your practice.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSession(null)}>Back</Button>
          </div>
        ) : qs.length ? (
          <InterventionPracticeRunner
            questions={qs}
            title={title}
            subtitle={`${session.iv.subject} — ${session.iv.chapter}`}
            durationMinutes={kind === 'retest' ? (retestData?.data?.retest?.timeLimit ?? 20) : (practiceData?.data?.durationMinutes ?? 20)}
            kind={kind}
            onSubmit={handleSubmit}
            onCancel={() => setSession(null)}
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Loading questions…</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Student · Interventions"
        title="My Interventions"
        description="Targeted practice and re-tests assigned to you by your faculty — prototype assignments, tracked separately from official exams."
        breadcrumbs={[{ label: 'Student' }, { label: 'Examinations', to: '/student/examinations' }, { label: 'Interventions' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><ClipboardList className="h-3 w-3" /> {items.length} active</Badge>}
      />

      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((iv) => (
            <InterventionCard
              key={iv.id}
              iv={iv}
              onStartPractice={() => setSession({ kind: 'practice', iv })}
              onStartRetest={() => setSession({ kind: 'retest', iv })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No assigned interventions yet</p>
          <p className="mt-1 text-xs text-slate-400">When your faculty assigns targeted practice, it will appear here.</p>
        </div>
      )}

      <p className="mt-6 text-[11px] font-medium text-slate-400">
        Practice and re-test attempts are stored separately from official university/JEE/NEET exams — they never affect your official performance metrics. <Link to="/student/examinations" className="font-bold text-indigo-500 hover:underline">← Examinations</Link>
      </p>
    </div>
  )
}

export { Interventions }
export default Interventions
