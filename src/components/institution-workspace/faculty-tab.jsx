/**
 * Institution Intelligence Workspace · Tab 3: Faculty Intelligence.
 * Institution-level roll-up (admin snapshot) + faculty-level metrics
 * REUSED from the existing Faculty Intelligence Foundation service
 * (`useFacultyIntelligence`) — no second faculty engine is created.
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, Clock, HeartPulse, Users } from 'lucide-react'
import { useFacultyIntelligence } from '@/services/faculty-intelligence'
import { ChartCard } from '@/components/shared/chart-card'
import { ProgressRing } from '@/components/shared/progress-ring'
import { BarCompare } from '@/components/charts'
import { Badge, Button } from '@/components/ui'
import { DashboardSkeleton } from '@/components/shared/loading'
import { KpiStrip, WorkspaceSection } from './shared'

function FacultyTab({ data }) {
  const admin = data.derived
  const faculty = admin.faculty ?? {}
  const health = faculty.health ?? {}

  /* Reuse the existing faculty intelligence service — no duplicate engine. */
  const { data: facultyData } = useFacultyIntelligence()
  const f = useMemo(() => facultyData?.derived ?? null, [facultyData])

  if (!f) return <DashboardSkeleton cards={3} />

  const byDept = faculty.byDept ?? []
  const deptCodes = byDept.map((x) => x.code)

  return (
    <div>
      <KpiStrip
        cols={4}
        items={[
          { label: 'Faculty', value: (admin.totals?.faculty ?? 0).toLocaleString('en-IN'), sub: 'institution-wide' },
          { label: 'Faculty health', value: `${health.score ?? '—'}/100`, sub: health.grade ?? '—' },
          { label: 'Teaching satisfaction', value: `${health.teachingSatisfaction ?? '—'}/100`, sub: 'student surveys' },
          { label: 'Publications / faculty', value: (health.publicationsPerFaculty ?? '—').toFixed ? health.publicationsPerFaculty?.toFixed(1) ?? '—' : '—', sub: 'research output' },
        ]}
      />

      {/* Faculty-level metrics — from the Faculty Intelligence Foundation */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Faculty health factors" subtitle="Institution roll-up">
          <div className="flex items-center gap-4">
            <ProgressRing value={health.score ?? 0} size={104} stroke={10} color="#f59e0b" label={`${health.score ?? '—'}`} sublabel="health" />
            <div className="flex-1 space-y-2">
              {(health.factors ?? []).map((factor) => (
                <div key={factor.label}>
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">{factor.label}</span>
                    <span className="text-slate-800 dark:text-slate-100">{factor.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style={{ width: `${factor.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Teaching effectiveness" subtitle="Faculty Intelligence Foundation (reused)">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Teaching health', value: f.teachingHealth?.score ?? '—', icon: HeartPulse, tone: 'text-indigo-500' },
              { label: 'Effectiveness', value: f.teachingEffectiveness?.score ?? '—', icon: Award, tone: 'text-emerald-500' },
              { label: 'Engagement', value: `${f.studentEngagement?.score ?? '—'}%`, icon: Users, tone: 'text-teal-500' },
              { label: 'AI hours saved', value: `${f.teachingProductivity?.hoursSaved ?? '—'}h`, icon: Clock, tone: 'text-violet-500' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
                <s.icon className={`h-4 w-4 ${s.tone}`} />
                <p className="mt-1 font-display text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Faculty workload"
          subtitle="From the faculty foundation"
          className="min-w-0"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/faculty">Faculty portal <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          }
        >
          <div className="space-y-2.5">
            {[
              { label: 'Students taught', value: f.cohorts?.totalStudents ?? '—' },
              { label: 'Sections', value: f.cohorts?.sections?.length ?? '—' },
              { label: 'Weekly teaching hours', value: facultyData?.datasets?.weeklyTeachingHours ?? '—' },
              { label: 'At-risk students (faculty scope)', value: f.attentionStudents?.total ?? '—' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 text-[12px] dark:border-slate-800">
                <span className="font-semibold text-slate-600 dark:text-slate-300">{r.label}</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{r.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <WorkspaceSection title="Department-level faculty distribution" subtitle="Sample roster across departments">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Faculty by department" subtitle="Sample roster (10 of 640)" className="min-w-0">
            <BarCompare
              data={byDept.map((x) => ({ label: x.code, count: x.count }))}
              xKey="label"
              height={220}
              series={[{ key: 'count', name: 'Faculty', color: '#6366f1' }]}
              formatter={(v) => `${v}`}
            />
          </ChartCard>
          <ChartCard title="Department coverage" subtitle="Which departments have roster representation">
            <div className="flex flex-wrap gap-2 pt-1">
              {deptCodes.map((code) => (
                <Badge key={code} variant="outline" size="sm" className="px-3 py-1.5">{code}</Badge>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-indigo-50/60 p-3.5 dark:bg-indigo-500/5">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                Faculty health (institution) is driven by teaching satisfaction ({health.teachingSatisfaction ?? '—'}/100) and research output ({health.publicationsPerFaculty ?? '—'} pubs/faculty). The sample roster covers all 8 departments.
              </p>
            </div>
          </ChartCard>
        </div>
      </WorkspaceSection>
    </div>
  )
}

export { FacultyTab }
export default FacultyTab
