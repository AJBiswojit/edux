import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck2, CheckCircle2, ClipboardList, Sparkles, Users } from 'lucide-react'
import { useFacultyAttendance, useFacultyRoster } from '@/services'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { AreaTrend } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, useToast } from '@/components/ui'

function Attendance() {
  const { data, isLoading, isError, refetch } = useFacultyAttendance()
  const { data: rosterData } = useFacultyRoster()
  const [marking, setMarking] = useState(null)
  const [marked, setMarked] = useState({})
  const toast = useToast()

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const roster = rosterData?.students ?? []

  return (
    <div>
      <PageHeader
        eyebrow="Teaching · Attendance"
        title="Attendance"
        description="Mark classes in minutes, spot trends, and keep every cohort above the 75% threshold."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Attendance' }]}
        actions={
          <Button size="sm" onClick={() => toast.info('Bulk mark', 'Use the class sheet to mark a whole lecture at once.')}>
            <ClipboardList className="h-4 w-4" /> New class sheet
          </Button>
        }
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Average attendance', value: `${data.summary.avgAttendance}%`, grad: 'from-emerald-500 to-teal-500', sub: 'across all courses' },
          { label: 'Best class', value: data.summary.highestClass, grad: 'from-indigo-500 to-blue-500', sub: '94.4% this week' },
          { label: 'Needs attention', value: data.summary.lowestClass, grad: 'from-amber-500 to-orange-500', sub: '89.7% this week' },
          { label: 'Students below 75%', value: String(data.summary.studentsBelow75), grad: 'from-rose-500 to-red-500', sub: '14 flagged · 4 critical' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-3xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
            <p className="mt-1 truncate font-display text-xl font-bold">{s.value}</p>
            <p className="text-[11px] text-white/70">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Weekly attendance" subtitle="All courses · last 8 weeks" className="lg:col-span-2">
          <AreaTrend
            data={data.weeklyTrend ?? []}
            xKey="week"
            height={230}
            series={[{ key: 'pct', name: 'Attendance', color: '#14b8a6' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>

        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-rose-500" /> Below 75% threshold
          </p>
          <div className="mt-4 space-y-2.5">
            {data.studentsBelowThreshold.map((s) => (
              <div key={s.roll} className="flex items-center gap-3 rounded-2xl border border-rose-100 p-3 dark:border-rose-500/20">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                  <p className="text-[10.5px] text-slate-400">{s.roll} · {s.classes} classes missed</p>
                </div>
                <span className={`text-sm font-bold ${s.attendance < 75 ? 'text-rose-500' : 'text-amber-500'}`}>{s.attendance}%</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toast.success('Notices drafted', 'AI drafted personalised notices for 14 students — review before sending.')}>
            <Sparkles className="h-4 w-4" /> Draft notices with AI
          </Button>
        </Card>
      </div>

      {/* Class records */}
      <h2 className="mb-4 mt-8 text-[15px] font-bold text-slate-900 dark:text-white">Recent class records</h2>
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Course</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Topic</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Present</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">%</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.classes.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-100">{c.course} <span className="text-slate-400">· {c.section}</span></td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-300">{c.topic}</td>
                  <td className="px-5 py-3.5 text-slate-400">{c.date}</td>
                  <td className="px-5 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-200">{c.present}/{c.total}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`font-bold ${c.pct >= 90 ? 'text-emerald-500' : c.pct >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>{c.pct}%</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setMarking(c); setMarked({}) }}>
                      {c.status === 'Marked' ? 'Edit' : 'Mark'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marking dialog */}
      <Dialog open={!!marking} onOpenChange={(v) => !v && setMarking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark attendance — {marking?.course} ({marking?.section})</DialogTitle>
            <DialogDescription>{marking?.date} · {marking?.topic}. Tap students to toggle present/absent.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-3">
            {roster.slice(0, 15).map((s) => {
              const isPresent = marked[s.id] ?? true
              return (
                <button
                  key={s.id}
                  onClick={() => setMarked((m) => ({ ...m, [s.id]: !isPresent }))}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200 ${
                    isPresent ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/5' : 'border-rose-200 bg-rose-50/60 dark:border-rose-500/25 dark:bg-rose-500/5'
                  }`}
                >
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${isPresent ? 'text-emerald-500' : 'text-rose-400'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.roll}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarking(null)}>Cancel</Button>
            <Button onClick={() => {
              toast.success('Attendance saved ✓', `${marking?.course} marked for ${marking?.date}.`)
              setMarking(null)
            }}>
              <CalendarCheck2 className="h-4 w-4" /> Save attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { Attendance }
export default Attendance
