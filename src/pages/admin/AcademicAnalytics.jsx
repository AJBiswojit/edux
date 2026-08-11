import { motion } from 'framer-motion'
import { Bot, LineChart, Sparkles, TrendingUp, Users } from 'lucide-react'
import { useAdminAnalytics } from '@/services'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { AreaTrend, BarCompare, DonutChart, LineTrend } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge } from '@/components/ui'

function AcademicAnalytics() {
  const { data, isLoading, isError, refetch } = useAdminAnalytics()

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Overview · Academic Analytics"
        title="Academic analytics"
        description="Enrolment, retention, fee collection and AI adoption — the metrics that run the institution."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Academic Analytics' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><Sparkles className="h-3 w-3" /> AI narrative ready</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Retention by intake year" subtitle="First-year vs overall retention">
          <LineTrend
            data={data.retention ?? []}
            xKey="year"
            height={250}
            series={[
              { key: 'first', name: 'First-year', color: '#6366f1' },
              { key: 'overall', name: 'Overall', color: '#14b8a6' },
            ]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>

        <ChartCard title="Fee collection" subtitle="% of expected fees collected · FY 2026-27">
          <AreaTrend
            data={data.feeCollection ?? []}
            xKey="month"
            height={250}
            series={[{ key: 'collected', name: 'Collected %', color: '#10b981' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard title="Semester-wise CGPA" subtitle="Institution average">
          <AreaTrend
            data={data.semesterWise ?? []}
            xKey="sem"
            height={220}
            series={[{ key: 'cgpa', name: 'Avg CGPA', color: '#3b82f6' }]}
          />
        </ChartCard>

        <ChartCard title="AI platform usage" subtitle="Tutor + Copilot sessions / month">
          <BarCompare
            data={data.aiUsage ?? []}
            xKey="month"
            height={220}
            series={[{ key: 'sessions', name: 'Sessions', color: '#8b5cf6' }]}
            formatter={(v) => `${(v / 1000).toFixed(0)}K`}
          />
        </ChartCard>

        <ChartCard title="Gender distribution" subtitle="All programmes">
          <DonutChart data={data.genderSplit ?? []} height={220} centerLabel="12.4K" centerSub="students" />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Student satisfaction" subtitle="Annual survey · 4,100 responses">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(data.satisfaction ?? {}).map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-slate-100 p-4 text-center dark:border-slate-800">
                <p className="font-display text-2xl font-bold text-indigo-600 dark:text-indigo-300">{v}<span className="text-sm text-slate-300">/5</span></p>
                <p className="mt-1 text-[10px] font-semibold capitalize text-slate-400">{k}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-4 ring-1 ring-indigo-500/15">
            <p className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> AI narrative
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
              Digital experience (4.6) now outranks infrastructure (4.1) for the first time. First-year retention (94.8%) continues a 4-year climb — the AI early-warning program is credited for 68 recovered students this term.
            </p>
          </div>
        </ChartCard>

        <ChartCard title="Live signals" subtitle="What needs eyes this week">
          <div className="space-y-3">
            {[
              { icon: TrendingUp, color: 'text-emerald-500', title: 'CSE applications up 18%', desc: 'Strongest applicant pool in 5 years — consider an extra section for Sem 1.', tag: 'Growth' },
              { icon: Users, color: 'text-rose-500', title: 'MBA fee invoices overdue', desc: '44% of 342 pending invoices are MBA — finance team alerted.', tag: 'Action' },
              { icon: LineChart, color: 'text-amber-500', title: 'Civil pass rate dipping', desc: 'Structural Analysis at 82% — lowest in 3 terms. HOD notified.', tag: 'Watch' },
              { icon: Bot, color: 'text-violet-500', title: 'AI tutor load spiking', desc: '71K sessions in July — auto-scaling handled within SLA.', tag: 'Systems' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3.5 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <s.icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{s.title}</p>
                  <p className="mt-0.5 text-[12px] text-slate-400">{s.desc}</p>
                </div>
                <Badge variant="secondary" size="sm">{s.tag}</Badge>
              </motion.div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

export { AcademicAnalytics }
export default AcademicAnalytics
