import { motion } from 'framer-motion'
import { AlertTriangle, BarChart3, ClipboardList, FileCheck2, ShieldCheck } from 'lucide-react'
import { useAdminExamAnalytics } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { BarCompare, DonutChart } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Card, Progress } from '@/components/ui'

function ExamAnalytics() {
  const { data, isLoading, isError, refetch } = useAdminExamAnalytics()

  if (isLoading) return <DashboardSkeleton cards={4} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Analytics · Examinations"
        title="Exam analytics"
        description="Score distributions, subject performance and exam-readiness across all programmes."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Exam Analytics' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><ClipboardList className="h-3 w-3" /> 42 exams this term</Badge>}
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
        <ChartCard title="Score distribution" subtitle="All exams · % of students">
          <DonutChart
            data={(data.scoreDistribution ?? []).map((d, i) => ({ name: d.range, value: d.count, color: ['#10b981', '#34d399', '#6366f1', '#f59e0b', '#f43f5e'][i] }))}
            height={250}
            centerLabel="71.4%"
            centerSub="average"
          />
        </ChartCard>

        <ChartCard title="Average score by subject" subtitle="Current term">
          <BarCompare
            data={data.bySubject ?? []}
            xKey="subject"
            height={250}
            series={[{ key: 'avg', name: 'Average %', color: '#6366f1' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming exam readiness */}
        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <FileCheck2 className="h-4 w-4 text-emerald-500" /> Midsem readiness — Aug 19–23
          </p>
          <div className="mt-4 space-y-3.5">
            {(data.upcoming ?? []).length > 0 ? data.upcoming.map((u, i) => (
              <motion.div key={u.title} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{u.title}</span>
                    <span className="text-[10.5px] text-slate-400">{u.date} · {u.students} students</span>
                  </div>
                  <Badge variant={u.status === 'Ready' ? 'success' : u.status === 'In Review' ? 'warning' : 'secondary'}>{u.status}</Badge>
                </div>
                <Progress
                  value={u.status === 'Ready' ? 100 : u.status === 'In Review' ? 75 : 45}
                  className="mt-1.5 h-1.5"
                  gradient={u.status === 'Ready' ? 'from-emerald-500 to-teal-400' : u.status === 'In Review' ? 'from-amber-500 to-orange-400' : 'from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'}
                />
              </motion.div>
            )) : (
              <EmptyState compact title="No upcoming exams" description="Nothing scheduled — the calendar is clear." />
            )}
          </div>
        </Card>

        {/* Integrity */}
        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-indigo-500" /> Exam integrity
          </p>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Malpractice cases this term', value: '3', note: 'down from 8 last term', color: 'text-emerald-500' },
              { label: 'Seating plans generated', value: '2,400', note: 'auto-assigned · conflict-free', color: 'text-indigo-500' },
              { label: 'Question papers AI-validated', value: '42/42', note: 'difficulty + coverage checks', color: 'text-teal-500' },
              { label: 'Result disputes resolved', value: '14/14', note: 'within 48 hours', color: 'text-amber-500' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3.5 rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-300">
                  <BarChart3 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{s.label}</p>
                  <p className="text-[10.5px] text-slate-400">{s.note}</p>
                </div>
                <span className={`font-display text-lg font-bold ${s.color}`}>{s.value}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-[11.5px] leading-relaxed text-rose-600 dark:bg-rose-500/5 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            3 malpractice cases are under review — video evidence and proctor logs attached to each case file.
          </div>
        </Card>
      </div>
    </div>
  )
}

export { ExamAnalytics }
export default ExamAnalytics
