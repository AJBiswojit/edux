import { motion } from 'framer-motion'
import { AlertTriangle, Award, Gauge, Sparkles, TrendingDown } from 'lucide-react'
import { useAdminPerformance } from '@/services'
import { useAdminAnalytics } from '@/services'
import { useAdminIntelligenceDerived } from '@/services/admin-intelligence'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { AreaTrend, BarCompare, DonutChart } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Card } from '@/components/ui'
import { EmptyState } from '@/components/shared/empty-state'

function Performance() {
  const { data, isLoading, isError, refetch } = useAdminPerformance()
  const { data: analyticsData } = useAdminAnalytics()
  const { data: intelData } = useAdminIntelligenceDerived()

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  /* Derived institution health (0–100 → /10) and CGPA — never hardcoded. */
  const healthScore = intelData?.institutionHealth?.score
  const healthLabel = healthScore != null ? (healthScore / 10).toFixed(1) : '—'
  const semesterWise = analyticsData?.semesterWise ?? []
  const avgCgpa = semesterWise.length
    ? (semesterWise.reduce((a, s) => a + s.cgpa, 0) / semesterWise.length).toFixed(1)
    : '—'
  /* At-risk trend — authoritative institution series from the intelligence
     roll-up (faculty cohort model: Mar 8.4 → Aug 5.9). */
  const riskTrend = intelData?.students?.riskTrend ?? data.atRiskTrend ?? []

  return (
    <div>
      <PageHeader
        eyebrow="Overview · Performance"
        title="Institution performance"
        description="Grade distributions, pass rates and the at-risk trend — the health of every programme."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Performance' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><Gauge className="h-3 w-3" /> Health score {healthLabel}/10</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Grade distribution" subtitle="All assessments · % of grades">
          <DonutChart data={data.gradeDistribution ?? []} height={230} centerLabel={avgCgpa} centerSub="avg CGPA" />
        </ChartCard>

        <ChartCard title="At-risk trend" subtitle="% of students flagged · institution-wide" className="lg:col-span-2">
          <AreaTrend
            data={riskTrend}
            xKey="month"
            height={230}
            series={[{ key: 'atRisk', name: 'At-risk %', color: '#f43f5e' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <ChartCard title="Pass rate by department" subtitle="Term 5 · 2026-27" className="mt-6">
        <BarCompare
          data={data.deptPassRates ?? []}
          xKey="dept"
          height={240}
          series={[{ key: 'pass', name: 'Pass rate %', color: '#6366f1' }]}
          formatter={(v) => `${v}%`}
        />
      </ChartCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <Award className="h-4 w-4 text-amber-500" /> Top students
          </p>
          <div className="mt-4 space-y-2.5">
            {(data.topStudents ?? []).length > 0 ? data.topStudents.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' : i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="text-[10.5px] text-slate-400">{s.dept}</p>
                </div>
                <Badge variant="success">{s.cgpa}</Badge>
              </div>
            )) : (
              <EmptyState compact title="No top students yet" description="Results will appear once assessments are graded." />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <TrendingDown className="h-4 w-4 text-rose-500" /> Intervention impact
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Flagged', value: String(data.interventionImpact.flagged), color: '#ef4444' },
              { label: 'Recovered', value: String(data.interventionImpact.recovered), color: '#10b981' },
              { label: 'Recovery rate', value: `${data.interventionImpact.recoveryRate}%`, color: '#6366f1' },
              { label: 'Avg recovery', value: `${data.interventionImpact.avgWeeks} wks`, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
                <p className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-medium text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-emerald-50 p-3.5 text-[11.5px] leading-relaxed text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Sparkles className="mb-1 h-3.5 w-3.5" />
            AI early-warning program: 168 of 214 flagged students recovered to healthy standing within a term.
          </div>
        </Card>

        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Focus areas
          </p>
          <div className="mt-4 space-y-3">
            {[
              { dept: 'Civil', issue: 'Pass rate 82.6% — 3 terms below target', severity: 'High' },
              { dept: 'ME', issue: 'Thermodynamics at-risk load up 12%', severity: 'Medium' },
              { dept: 'CSE', issue: 'ToC — 61% class average across sections', severity: 'Medium' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-amber-100 p-3.5 dark:border-amber-500/20">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{f.dept}</p>
                  <Badge variant={f.severity === 'High' ? 'danger' : 'warning'} size="sm">{f.severity}</Badge>
                </div>
                <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">{f.issue}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export { Performance }
export default Performance
