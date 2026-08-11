import { motion } from 'framer-motion'
import { AlertTriangle, CalendarCheck2, TrendingUp, Users } from 'lucide-react'
import { useAdminAttendanceAnalytics } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { AreaTrend, BarCompare } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Card } from '@/components/ui'
import { EmptyState } from '@/components/shared/empty-state'

const DEPT_NAMES = {
  CSE: 'Computer Science', ECE: 'Electronics & Comm.', ME: 'Mechanical',
  EE: 'Electrical', CE: 'Civil', MBA: 'Business School', DES: 'Design & Media', MATH: 'Maths & Sciences',
}
const deptName = (code) => DEPT_NAMES[code] ?? code

function AttendanceAnalytics() {
  const { data, isLoading, isError, refetch } = useAdminAttendanceAnalytics()

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Analytics · Attendance"
        title="Attendance analytics"
        description="Institution-wide attendance health — trends, department comparisons and threshold violations."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Attendance Analytics' }]}
        actions={<Badge variant="success" className="px-3 py-1"><CalendarCheck2 className="h-3 w-3" /> Overall {data.overall}%</Badge>}
      />

      {/* Derived KPIs — computed from the dataset, never hardcoded */}
      {(() => {
        const best = [...(data.byDept ?? [])].sort((a, b) => b.pct - a.pct)[0] ?? null
        const worst = [...(data.byDept ?? [])].sort((a, b) => a.pct - b.pct)[0] ?? null
        const belowCount = (data.belowThreshold ?? []).length
        const trend = data.trend ?? []
        const delta = trend.length >= 2 ? `${(trend[trend.length - 1].pct - trend[0].pct) >= 0 ? '+' : ''}${(trend[trend.length - 1].pct - trend[0].pct).toFixed(1)} pts` : '—'
        return (
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Overall attendance', value: `${data.overall}%`, delta, icon: CalendarCheck2, color: 'text-emerald-500' },
          { label: 'Best department', value: best ? `${best.dept} ${best.pct}%` : '—', delta: best ? deptName(best.dept) : '—', icon: TrendingUp, color: 'text-indigo-500' },
          { label: 'Needs attention', value: worst ? `${worst.dept} ${worst.pct}%` : '—', delta: worst ? deptName(worst.dept) : '—', icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'Below threshold (75%)', value: `${belowCount} student${belowCount === 1 ? '' : 's'}`, delta: 'flagged for follow-up', icon: Users, color: 'text-rose-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[11px] font-medium text-slate-400">{s.label} · {s.delta}</p>
          </motion.div>
        ))}
      </div>
        )
      })()}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly attendance trend" subtitle="All departments">
          <AreaTrend
            data={data.trend ?? []}
            xKey="month"
            height={240}
            series={[{ key: 'pct', name: 'Attendance', color: '#6366f1' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>

        <ChartCard title="Attendance by department" subtitle="Current term average">
          <BarCompare
            data={data.byDept ?? []}
            xKey="dept"
            height={240}
            series={[{ key: 'pct', name: 'Attendance %', color: '#14b8a6' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="Weekly trend" subtitle="Term 5 · weeks 1–8" className="lg:col-span-1">
          <AreaTrend
            data={data.weekly ?? []}
            xKey="week"
            height={220}
            series={[{ key: 'pct', name: 'Attendance', color: '#10b981' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>

        <Card className="p-6 lg:col-span-2">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-rose-500" /> Students below the 75% threshold
          </p>
          <div className="mt-4 space-y-2.5">
            {(data.belowThreshold ?? []).length > 0 ? (
            data.belowThreshold.map((s, i) => (
              <motion.div key={s.roll} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 rounded-2xl border border-rose-100 p-3 dark:border-rose-500/20">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="text-[10.5px] text-slate-400">{s.roll} · {s.dept} · {s.classesMissed} missed</p>
                </div>
                <span className="text-sm font-bold text-rose-500">{s.attendance}%</span>
              </motion.div>
            ))
          ) : (
            <EmptyState compact title="No students below threshold" description="All cohorts are above the 75% floor." />
          )}
        </div>
          <p className="mt-4 rounded-2xl bg-amber-50 p-3.5 text-[12px] leading-relaxed text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="font-bold">Policy:</span> attendance below 75% blocks midsem eligibility. All 5 students have active AI-recommended intervention plans with weekly check-ins.
          </p>
        </Card>
      </div>
    </div>
  )
}

export { AttendanceAnalytics }
export default AttendanceAnalytics
