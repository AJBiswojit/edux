import { motion } from 'framer-motion'
import { FilePlus2, GraduationCap, Sparkles, Users } from 'lucide-react'
import { useFacultyAssignments } from '@/services'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Progress, useToast } from '@/components/ui'

function Assignments() {
  const { data, isLoading, isError, refetch } = useFacultyAssignments()
  const toast = useToast()
  const items = data?.items ?? []

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Teaching · Assignments"
        title="Assignments & grading"
        description="Create, track and grade — with AI pre-grading that gives you a first pass on every submission."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Assignments' }]}
        actions={
          <Button size="sm" onClick={() => toast.info('New assignment', 'The AI will draft the brief once you choose a course.')}>
            <FilePlus2 className="h-4 w-4" /> Create assignment
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((a, i) => {
          const pct = a.total ? Math.round((a.submissions / a.total) * 100) : 0
          const gradedPct = a.submissions ? Math.round((a.graded / a.submissions) * 100) : 0
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">{a.course}</p>
                    <h3 className="mt-1.5 text-[16px] font-bold leading-snug text-slate-900 dark:text-white">{a.title}</h3>
                  </div>
                  <Badge variant={a.status === 'Open' ? 'warning' : 'success'}>{a.status}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{a.submissions}/{a.total}</p>
                    <p className="text-[10px] font-medium text-slate-400">Submitted</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{a.graded}</p>
                    <p className="text-[10px] font-medium text-slate-400">Graded</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                    <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{a.maxScore}</p>
                    <p className="text-[10px] font-medium text-slate-400">Max marks</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>Submission rate</span><span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="mt-1.5" />
                </div>
                {a.submissions > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>Grading progress</span><span>{gradedPct}%</span>
                    </div>
                    <Progress value={gradedPct} className="mt-1.5" gradient="from-emerald-500 to-teal-400" />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-indigo-50/60 p-3 dark:bg-indigo-500/5">
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    {a.status === 'Open' ? `Due ${a.due} · ${a.total - a.submissions} pending` : 'AI pre-graded · ready to review'}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => toast.success('Grading queue opened', `${a.graded} graded · ${a.submissions - a.graded} to review.`)}>
                    <GraduationCap className="h-3.5 w-3.5" /> Grade
                  </Button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-3xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-5 ring-1 ring-indigo-500/15">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-slate-100">Grading tips:</span> AI pre-grades every submission with rubric-based feedback and plagiarism flags.
          Your review of 34 pending DSA submissions typically takes ~40 minutes — down from 4+ hours.
        </p>
      </div>
    </div>
  )
}

export { Assignments }
export default Assignments
