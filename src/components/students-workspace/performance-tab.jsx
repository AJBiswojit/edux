/**
 * MediXO EduX — Students Workspace · Tab 3: Performance Analytics.
 * Score distribution, course health, top performers, attendance-vs-
 * performance correlation and distribution insights — derived from the
 * foundation.
 */

import { motion } from 'framer-motion'
import { Award, BarChart3, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/shared/chart-card'
import { BarCompare, DonutChart } from '@/components/charts'
import { Badge, Card } from '@/components/ui'
import { WorkspaceSection } from '@/components/teaching-workspace/shared'

function StudentsPerformanceTab({ data }) {
  const s = data.derived.students ?? {}
  const att = data.derived.attendanceIntelligence ?? {}
  const eff = data.derived.teachingEffectiveness ?? {}

  const distribution = s.scoreDistribution ?? []
  const totalDist = distribution.reduce((a, d) => a + d.count, 0) || 1
  const topBand = distribution[0]?.count ?? 0
  const bottomBand = distribution[distribution.length - 1]?.count ?? 0

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Cohort average" value={eff.avgScore != null ? `${eff.avgScore}%` : '—'} sub="across courses" icon="BarChart3" gradient="from-indigo-500 to-blue-500" />
        <StatCard index={1} label="Pass rate" value={eff.passRate != null ? `${eff.passRate}%` : '—'} sub="term to date" icon="Award" gradient="from-emerald-500 to-teal-500" />
        <StatCard index={2} label="Top band (90–100)" value={`${topBand} students`} sub={`${Math.round((topBand / totalDist) * 100)}% of cohort`} icon="TrendingUp" gradient="from-amber-500 to-orange-500" />
        <StatCard index={3} label="Below 60 band" value={`${bottomBand} students`} sub="needs support" icon="AlertTriangle" gradient="from-rose-500 to-red-500" />
      </div>

      {/* Distribution + course health */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Score distribution" subtitle="Internals + assignments · all courses">
          <BarCompare
            data={distribution.map((d) => ({ label: d.range, count: d.count }))}
            xKey="label"
            height={250}
            series={[{ key: 'count', name: 'Students', color: '#6366f1' }]}
            formatter={(v) => `${v} students`}
          />
        </ChartCard>

        <ChartCard title="Course health" subtitle="Average & pass rate per course">
          <BarCompare
            data={(s.courseHealth ?? []).map((c) => ({ label: c.course, avg: c.avg, passRate: c.passRate, atRisk: c.atRisk }))}
            xKey="label"
            height={250}
            series={[
              { key: 'avg', name: 'Class avg %', color: '#6366f1' },
              { key: 'passRate', name: 'Pass rate %', color: '#10b981' },
            ]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      {/* Top performers + attendance correlation */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top performers" subtitle="Class leaders this term" actions={<Badge variant="gradient" size="sm"><Award className="h-3 w-3" /> Leaders</Badge>}>
          <div className="space-y-2.5">
            {(s.topPerformers ?? []).map((st, i) => (
              <motion.div key={st.name} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-md">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{st.name}</p>
                  <p className="text-[10.5px] text-slate-400">Attendance {st.attendance}% · trend {st.trend}</p>
                </div>
                <Badge variant="success">{st.avg}%</Badge>
              </motion.div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Attendance vs performance" subtitle="Score by attendance bucket">
          <DonutChart
            data={(att.correlation ?? []).map((c, i) => ({ name: c.bucket, value: c.avgScore, color: ['#10b981', '#f59e0b', '#ef4444'][i] }))}
            height={220}
            centerLabel={`${att.correlationGap ?? 0} pts`}
            centerSub="gap"
          />
          {(att.correlationGap ?? 0) > 0 && (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-3.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
              Attendance is a strong performance signal — the below-75% cohort scores {att.correlationGap} points lower than the 90%+ cohort.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Distribution insight */}
      <WorkspaceSection title="Distribution insight" subtitle="Derived from the score bands" icon={BarChart3}>
        <Card className="p-6">
          <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-bold text-indigo-600 dark:text-indigo-300">AI take:</span>{' '}
            {Math.round((topBand / totalDist) * 100)}% of the cohort sits in the top band (90–100) while {Math.round((bottomBand / totalDist) * 100)}% score below 60 — the middle band is healthy but the tail needs targeted remediation, starting with the skill-gap analysis in the next tab.
          </p>
        </Card>
      </WorkspaceSection>
    </div>
  )
}

export { StudentsPerformanceTab }
export default StudentsPerformanceTab
