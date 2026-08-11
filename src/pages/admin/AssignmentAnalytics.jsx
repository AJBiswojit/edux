import { motion } from 'framer-motion'
import { AlertTriangle, FileCheck2, Sparkles } from 'lucide-react'
import { useAdminAssignmentAnalytics } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { AreaTrend, BarCompare } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Card, Progress } from '@/components/ui'

function AssignmentAnalytics() {
  const { data, isLoading, isError, refetch } = useAdminAssignmentAnalytics()

  if (isLoading) return <DashboardSkeleton cards={4} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Analytics · Assignments"
        title="Assignment analytics"
        description="Submission behaviour, on-time rates and AI-grading coverage across the institution."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Assignment Analytics' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><Sparkles className="h-3 w-3" /> 184 assignments this term</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 p-5 text-white shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{k.value}</p>
            <p className={`text-[11px] font-bold ${k.up ? 'text-emerald-300' : 'text-rose-300'}`}>{k.delta}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Submission rate by department" subtitle="% of expected submissions received">
          <BarCompare
            data={data.byDept ?? []}
            xKey="dept"
            height={240}
            series={[{ key: 'submitted', name: 'Submitted %', color: '#6366f1' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>

        <ChartCard title="Assignments published per month" subtitle="Institution-wide">
          <AreaTrend
            data={data.monthly ?? []}
            xKey="month"
            height={240}
            series={[{ key: 'assignments', name: 'Assignments', color: '#10b981' }]}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Plagiarism screening
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-display text-xl font-bold text-slate-800 dark:text-white">{data.plagiarismFlags.total}</p>
              <p className="text-[9px] font-medium text-slate-400">Flags total</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
              <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.plagiarismFlags.resolved}</p>
              <p className="text-[9px] font-medium text-slate-400">Resolved</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
              <p className="font-display text-xl font-bold text-amber-600 dark:text-amber-400">{data.plagiarismFlags.underReview}</p>
              <p className="text-[9px] font-medium text-slate-400">In review</p>
            </div>
          </div>
          <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-center text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {data.plagiarismFlags.trend} vs last term
          </p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <FileCheck2 className="h-4 w-4 text-indigo-500" /> Grading turnaround
          </p>
          <div className="mt-4 space-y-4">
            {[
              { label: 'AI pre-graded within 1 hour', pct: 64, note: 'Faculty review averages 3.2 days' },
              { label: 'Faculty-graded within 7 days', pct: 78, note: 'Target ≥ 90%' },
              { label: 'Feedback with comments', pct: 92, note: 'Rubric attached' },
              { label: 'On-time submissions', pct: 88, note: 'Up 2.4 pts this term' },
            ].map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{s.label}</span>
                  <span className="font-bold text-slate-500 dark:text-slate-300">{s.pct}% <span className="text-[10px] font-medium text-slate-400">· {s.note}</span></span>
                </div>
                <Progress value={s.pct} className="mt-1.5 h-2" gradient={s.pct >= 85 ? 'from-emerald-500 to-teal-400' : s.pct >= 60 ? 'from-indigo-500 to-blue-400' : 'from-amber-500 to-orange-400'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export { AssignmentAnalytics }
export default AssignmentAnalytics
