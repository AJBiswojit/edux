import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ClipboardList, FlaskConical, FolderKanban, Timer } from 'lucide-react'
import { ChartCard } from '@/components/shared/chart-card'
import { Badge, Button, Progress } from '@/components/ui'

const TYPE_META = {
  assignment: { icon: BookOpen, label: 'Assignment', tint: 'text-indigo-500' },
  exam: { icon: ClipboardList, label: 'Exam', tint: 'text-rose-500' },
  quiz: { icon: ClipboardList, label: 'Quiz', tint: 'text-amber-500' },
  practical: { icon: FlaskConical, label: 'Practical', tint: 'text-teal-500' },
  project: { icon: FolderKanban, label: 'Project', tint: 'text-violet-500' },
  mock: { icon: Timer, label: 'Mock test', tint: 'text-emerald-500' },
}

const PRIORITY_BADGE = { Critical: 'danger', High: 'warning', Medium: 'info', Low: 'secondary' }

/**
 * Upcoming Deadlines — assignments · examinations · quizzes · practicals ·
 * projects with priority, remaining days and progress. Derived from the
 * intelligence foundation.
 */
function UpcomingDeadlines({ deadlines = [] }) {
  const visible = deadlines.slice(0, 6)

  return (
    <ChartCard
      title="Upcoming deadlines"
      subtitle="Priority · days left · progress"
      actions={
        <Link to="/student/assignments" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      }
    >
      <div className="space-y-2.5">
        {visible.map((d) => {
          const meta = TYPE_META[d.type] ?? TYPE_META.assignment
          const Icon = meta.icon
          return (
            <div key={d.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-slate-800 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-800 ${meta.tint}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{d.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant={PRIORITY_BADGE[d.priority] ?? 'secondary'} size="sm">{d.priority}</Badge>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.daysLeft <= 1 ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' : d.daysLeft <= 3 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {d.daysLeft === 0 ? 'Today' : `${d.daysLeft}d left`}
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">{meta.label} · {d.subject}</p>
                {d.progress > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={d.progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-bold text-slate-400">{d.progress}%</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {visible.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No upcoming deadlines. Enjoy the calm! 🎉</p>}
      </div>

      <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
        <Link to="/student/assignments">Open assignments <ArrowRight className="h-3.5 w-3.5" /></Link>
      </Button>
    </ChartCard>
  )
}

export { UpcomingDeadlines }
export default UpcomingDeadlines
