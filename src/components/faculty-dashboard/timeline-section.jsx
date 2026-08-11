/**
 * MediXO EduX — Faculty Command Center · 5. Teaching Timeline.
 * The beautiful activity timeline — lectures, assignments, attendance,
 * papers, assessments, announcements, revision sessions.
 */

import { CalendarCheck2, CheckCircle2, ClipboardList, FileCheck2, FileText, Megaphone, Presentation, Repeat, Zap } from 'lucide-react'
import { Timeline } from '@/components/shared/timeline'
import { ChartCard } from '@/components/shared/chart-card'
import { Badge, Button } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const TYPE_ICON = {
  lecture: { Icon: Presentation, cls: 'from-indigo-500 to-blue-500' },
  attendance: { Icon: CalendarCheck2, cls: 'from-emerald-500 to-teal-500' },
  assignment: { Icon: FileText, cls: 'from-violet-500 to-purple-500' },
  evaluation: { Icon: CheckCircle2, cls: 'from-emerald-500 to-teal-500' },
  revision: { Icon: Repeat, cls: 'from-amber-500 to-orange-500' },
  paper: { Icon: FileCheck2, cls: 'from-sky-500 to-cyan-500' },
  quiz: { Icon: Zap, cls: 'from-fuchsia-500 to-pink-500' },
  exam: { Icon: ClipboardList, cls: 'from-rose-500 to-red-500' },
  announcement: { Icon: Megaphone, cls: 'from-slate-500 to-slate-600' },
}

function DashboardTimeline({ data }) {
  const events = data.derived.dashboard?.timeline ?? []

  return (
    <ChartCard
      title="Teaching timeline"
      subtitle="Your latest activity — lectures, papers, assessments & announcements"
      className="h-full"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link to="/faculty/teaching?tab=timeline">Full timeline <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      }
    >
      <Timeline
        items={events.map((e) => {
          const meta = TYPE_ICON[e.type] ?? { Icon: FileText, cls: 'from-slate-500 to-slate-600' }
          return {
            title: e.title,
            date: formatDate(e.date, 'EEE, MMM d'),
            badge: (
              <Badge variant="secondary" size="sm" className="gap-1">
                <meta.Icon className="h-3 w-3" /> {e.typeLabel ?? e.type}
              </Badge>
            ),
            description: e.description,
            dotClass: `bg-gradient-to-br ${meta.cls}`,
          }
        })}
      />
      {events.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No teaching activity yet.</p>}
    </ChartCard>
  )
}

export { DashboardTimeline }
export default DashboardTimeline
