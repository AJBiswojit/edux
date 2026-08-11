/**
 * Exams (legacy deep-link page) — keeps the /student/exams route working.
 * Reuses the shared Examination Intelligence components.
 */

import { useState } from 'react'
import { CalendarDays, ClipboardList, FileText } from 'lucide-react'
import { useExams } from '@/services'
import { useAdmitCard } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, useToast } from '@/components/ui'
import { UpcomingExamCard, ExamDetailsDialog } from '@/components/exam-workspace'
import { formatDate, formatRelative } from '@/utils/format'

/* Past-results table — preserved here and reused by any page needing it. */
export function PastResultsTable({ items }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-slate-400">No completed exams yet.</p>
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exam</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
              <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Score</th>
              <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Grade</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">{e.title}</td>
                <td className="px-5 py-4 text-slate-400">{formatDate(e.date)}</td>
                <td className="px-5 py-4 text-center font-bold text-slate-800 dark:text-slate-100">{e.score}<span className="text-slate-300 dark:text-slate-600">/{e.maxMarks}</span></td>
                <td className="px-5 py-4 text-center"><Badge variant="success">{e.grade}</Badge></td>
                <td className="px-5 py-4 text-right text-[11px] font-medium text-slate-400">{formatRelative(e.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Exams() {
  const { data, isLoading, isError, refetch } = useExams()
  const { data: admitData } = useAdmitCard()
  const [selected, setSelected] = useState(null)
  const toast = useToast()
  const items = data?.items ?? []
  const upcoming = items.filter((e) => e.status === 'Upcoming')
  const past = items.filter((e) => e.status === 'Completed')

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const handleAddToPlanner = (exam) => {
    toast.success(exam.inPlanner ? 'Already in planner' : 'Added to planner', exam.inPlanner
      ? 'Revision sessions are already scheduled for this exam.'
      : 'AI has scheduled revision sessions for this exam.')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Academics · Exams"
        title="Examinations"
        description="Upcoming midsems, past results and hall-ticket status — all in one place."
        breadcrumbs={[{ label: 'Student' }, { label: 'Exams' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><CalendarDays className="h-3 w-3" /> Midsems: Aug 19–23</Badge>}
      />

      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-indigo-500" />
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Upcoming ({upcoming.length})</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {upcoming.map((e, i) => (
          <div key={e.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-up">
            <UpcomingExamCard
              exam={e}
              onViewDetails={() => setSelected(e)}
              onAddToPlanner={() => handleAddToPlanner(e)}
            />
          </div>
        ))}
      </div>

      <div className="mb-4 mt-10 flex items-center gap-2">
        <FileText className="h-4 w-4 text-emerald-500" />
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Past results</h2>
      </div>
      <PastResultsTable items={past} />

      <ExamDetailsDialog
        exam={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        admit={admitData}
        onDownload={() => toast.success('Downloading…', `admit-card-${selected?.id}.pdf saved.`)}
      />
    </div>
  )
}

export { Exams, UpcomingExamCard, ExamDetailsDialog }
export default Exams
