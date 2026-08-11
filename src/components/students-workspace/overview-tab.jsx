/**
 * MediXO EduX — Students Workspace · Tab 1: Cohort Overview.
 * Cohort KPIs, academic-health distribution, course health, attendance
 * correlation, at-risk summary and the AI summary — all derived from the
 * Faculty Intelligence Foundation.
 */

import { Link } from 'react-router-dom'
import { AlertTriangle, BarChart3, HeartPulse, Sparkles, Target, Users } from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/shared/chart-card'
import { DonutChart, AreaTrend } from '@/components/charts'
import { Badge, Card } from '@/components/ui'
import { AiSummaryCard, WorkspaceSection } from '@/components/teaching-workspace/shared'

function StudentsOverviewTab({ data }) {
  const s = data.derived.students ?? {}
  const cs = s.cohortSummary ?? {}
  const is = s.interventionStats ?? {}
  const eng = data.derived.engagementAnalytics ?? {}
  const att = data.derived.attendanceIntelligence ?? {}

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Students tracked" value={String(cs.totalStudents ?? 0)} sub={`${cs.sections?.length ?? 0} sections`} icon="Users" gradient="from-indigo-500 to-blue-500" />
        <StatCard index={1} label="Flagged for attention" value={String(is.flagged ?? 0)} sub={`${is.active ?? 0} active interventions`} icon="AlertTriangle" gradient="from-rose-500 to-red-500" />
        <StatCard index={2} label="At-risk rate" value={is.atRiskRate != null ? `${is.atRiskRate}%` : '—'} sub={is.trendReduction != null ? `down ${is.trendReduction}% since Mar` : 'cohort trend'} icon="TrendingDown" gradient="from-emerald-500 to-teal-500" />
        <StatCard index={3} label="Cohort engagement" value={cs.engagementOverall != null ? `${cs.engagementOverall}%` : '—'} sub="composite" icon="HeartPulse" gradient="from-amber-500 to-orange-500" spark={(eng.students ?? []).map((x) => x.score)} />
      </div>

      {/* Health + AI summary + at-risk */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-indigo-500" /> Academic health distribution
          </p>
          <div className="mt-2 flex items-center justify-center">
            <DonutChart
              data={(eng.distributionData ?? []).map((d) => ({ ...d }))}
              height={240}
              centerLabel={`${cs.engagementOverall ?? 0}%`}
              centerSub="avg engagement"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(eng.distributionData ?? []).map((d) => (
              <div key={d.name} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{d.name}</span>
                <span className="ml-auto text-[12px] font-bold text-slate-800 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <AiSummaryCard summary={s.summary} className="lg:col-span-1" />

        <ChartCard title="At-risk cohort trend" subtitle="Monthly at-risk rate · AI model" className="lg:col-span-1">
          <AreaTrend
            data={(is.cohortTrend ?? []).map((c) => ({ label: c.month, value: c.atRisk }))}
            xKey="label"
            height={190}
            series={[{ key: 'value', name: 'At-risk %', color: '#f43f5e' }]}
            formatter={(v) => `${v}%`}
          />
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5 text-[11.5px] font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {is.trendReduction != null ? `At-risk rate down ${is.trendReduction}% since March — interventions are working.` : 'Cohort trend tracked by the early-warning model.'}
          </div>
        </ChartCard>
      </div>

      {/* Course health + attendance correlation */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Course health" subtitle="Average, pass rate & at-risk load per course">
          <div className="space-y-4">
            {(s.courseHealth ?? []).map((c) => (
              <div key={c.course}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{c.course}</p>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                    <Badge variant="success" size="sm">{c.avg}% avg</Badge>
                    <Badge variant="info" size="sm">pass {c.passRate}%</Badge>
                    <Badge variant={c.atRisk > 8 ? 'danger' : 'warning'} size="sm">{c.atRisk} at risk</Badge>
                  </div>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="bg-gradient-to-r from-indigo-500 to-teal-400" style={{ width: `${c.avg}%` }} />
                  <span className="bg-rose-400/80" style={{ width: `${c.atRiskPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Attendance vs performance" subtitle="Class-average score by attendance bucket">
          <DonutChart
            data={(att.correlation ?? []).map((c, i) => ({ name: c.bucket, value: c.avgScore, color: ['#10b981', '#f59e0b', '#ef4444'][i] }))}
            height={210}
            centerLabel={`${att.correlationGap ?? 0} pts`}
            centerSub="gap"
          />
          {(att.correlationGap ?? 0) > 0 && (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-3.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
              Students below 75% attendance score {att.correlationGap} points lower than the 90%+ cohort — attendance is the strongest lever.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Quick actions */}
      <WorkspaceSection title="Student workflows" subtitle="Jump into the intelligence tabs" icon={Sparkles}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'At-risk & interventions', desc: `${is.active ?? 0} active · ${is.flagged ?? 0} flagged · outreach ready`, to: '/faculty/student-analytics?tab=at-risk', icon: AlertTriangle, grad: 'from-rose-500 to-red-500' },
            { label: 'Performance analytics', desc: 'Distribution, leaders & course health', to: '/faculty/student-analytics?tab=performance', icon: BarChart3, grad: 'from-indigo-500 to-blue-500' },
            { label: 'Skill gaps & mastery', desc: `${(s.skillGaps ?? []).length} gaps · remediation plan`, to: '/faculty/student-analytics?tab=gaps', icon: Target, grad: 'from-amber-500 to-orange-500' },
            { label: 'Engagement & behaviour', desc: `${(eng.students ?? []).length} students tracked`, to: '/faculty/student-analytics?tab=engagement', icon: HeartPulse, grad: 'from-emerald-500 to-teal-500' },
          ].map((act, i) => (
            <Link key={act.label} to={act.to} className="group rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30">
              <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${act.grad} text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110`}>
                <act.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[13px] font-bold leading-snug text-slate-800 dark:text-slate-100">{act.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{act.desc}</p>
            </Link>
          ))}
        </div>
      </WorkspaceSection>
    </div>
  )
}

export { StudentsOverviewTab }
export default StudentsOverviewTab
