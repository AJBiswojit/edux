/**
 * MediXO EduX — Students Workspace · Tab 2: At-Risk & Interventions.
 * Derived intervention impact, risk breakdown by category & priority,
 * the preserved AI weak-student detection table (enhanced with category
 * badges) and the model card with draft outreach.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Sparkles, Users } from 'lucide-react'
import { useWeakStudents } from '@/services/extra'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/shared/chart-card'
import { AreaTrend } from '@/components/charts'
import { Badge, Button } from '@/components/ui'
import { useToast } from '@/components/ui'
import { WorkspaceSection } from '@/components/teaching-workspace/shared'
import { cn } from '@/utils/cn'

const STATUS_VARIANT = { Active: 'danger', Monitoring: 'warning', Watchlist: 'info', Cleared: 'success' }
const CATEGORY_DOT = {
  'Low Attendance': '#f59e0b', 'Weak Performance': '#ef4444', 'Pending Assignments': '#3b82f6',
  'Low Engagement': '#94a3b8', 'Poor Quiz Results': '#e11d48', 'Academic Decline': '#f97316',
}

function StudentsAtRiskTab({ data }) {
  const { data: weakData } = useWeakStudents()
  const toast = useToast()
  const [filter, setFilter] = useState('All')
  const s = data.derived.students ?? {}
  const is = s.interventionStats ?? {}
  const rb = s.riskBreakdown ?? {}

  const detections = (weakData?.detections ?? []).filter((d) => filter === 'All' || d.status === filter)
  const categories = rb.byCategory ?? []

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Flagged this term" value={String(is.flagged ?? 0)} sub={`${is.cleared ?? 0} recovered`} icon="Users" gradient="from-rose-500 to-red-500" />
        <StatCard index={1} label="Active interventions" value={String(is.active ?? 0)} sub="intervene this week" icon="AlertTriangle" gradient="from-amber-500 to-orange-500" />
        <StatCard index={2} label="Monitoring" value={String((is.monitoring ?? 0) + (is.watchlist ?? 0))} sub={`${is.watchlist ?? 0} watchlist`} icon="Eye" gradient="from-sky-500 to-cyan-500" />
        <StatCard index={3} label="Model accuracy" value={`${is.model?.accuracy ?? '—'}%`} sub={`${is.model?.features ?? 0} signals · ${is.model?.version ?? '—'}`} icon="BrainCircuit" gradient="from-violet-500 to-purple-500" />
      </div>

      {/* Category + priority breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Intervention categories" subtitle="Auto-categorised by dominant risk signal">
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-[12px] font-semibold">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_DOT[c.category] ?? '#94a3b8' }} />
                    {c.category}
                  </span>
                  <span className="text-slate-800 dark:text-slate-100">{c.count} students · top risk {c.topRisk}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.count / Math.max(is.flagged ?? 1, 1)) * 100}%`, background: CATEGORY_DOT[c.category] ?? '#94a3b8' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Priority mix" subtitle="Critical → Low across the flagged cohort">
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(rb.byPriority ?? {})).map(([prio, count]) => (
              <div key={prio} className="rounded-2xl border border-slate-100 p-4 text-center dark:border-slate-800">
                <p className={`font-display text-xl font-bold ${prio === 'Critical' ? 'text-rose-500' : prio === 'High' ? 'text-amber-500' : prio === 'Medium' ? 'text-sky-500' : 'text-slate-400'}`}>{count}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{prio}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-rose-50 p-3.5 dark:bg-rose-500/5">
            <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span><span className="font-bold text-slate-800 dark:text-slate-100">Model insight:</span> 24 behavioural signals — attendance, submission timing, quiz velocity, engagement depth and social patterns. Cohort at-risk rate is {is.atRiskRate}%, down from 8.4% in March.</span>
            </p>
          </div>
        </ChartCard>
      </div>

      {/* Cohort trend */}
      <div className="mt-6">
        <ChartCard title="At-risk rate trend" subtitle="Monthly · AI early-warning model">
          <AreaTrend
            data={(is.cohortTrend ?? []).map((c) => ({ label: c.month, value: c.atRisk }))}
            xKey="label"
            height={200}
            series={[{ key: 'value', name: 'At-risk %', color: '#f43f5e' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      {/* Detection table (preserved + enhanced) */}
      <WorkspaceSection title="AI weak-student detection" subtitle={`Model ${is.model?.version ?? '—'} · ${is.model?.accuracy ?? '—'}% accuracy · trained ${is.model?.lastTrained ?? '—'}`} icon={Sparkles}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {['All', 'Active', 'Monitoring', 'Watchlist', 'Cleared'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all',
                filter === f
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                  : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              )}
            >
              {f}
              <span className="ml-1.5 opacity-60">{f === 'All' ? detections.length : (weakData?.detections ?? []).filter((d) => d.status === f).length}</span>
            </button>
          ))}
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => toast.success('Outreach drafted', 'Personalised messages for all active-risk students are ready for review.')}>
            <Sparkles className="h-3.5 w-3.5" /> Draft outreach
          </Button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Student</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Course</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Risk</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Category</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Detected signals</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recommended action</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d, i) => {
                  const attn = (data.derived.attentionStudents?.items ?? []).find((a) => a.id === d.id)
                  return (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{d.name}</p>
                        <p className="text-[11px] text-slate-400">{d.roll}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{d.course}</td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className={`font-display text-lg font-bold ${d.risk >= 85 ? 'text-rose-500' : d.risk >= 65 ? 'text-amber-500' : 'text-slate-400'}`}>{d.risk}%</span>
                          <span className="text-[9px] font-semibold text-slate-300 dark:text-slate-600">({d.confidence}% conf.)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {attn ? (
                          <Badge variant="warning" size="sm">{attn.category}</Badge>
                        ) : (
                          <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex max-w-[240px] flex-wrap gap-1">
                          {d.signals.map((sig) => <Badge key={sig} variant="outline" size="sm">{sig}</Badge>)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] text-slate-600 dark:text-slate-300">{d.recommended}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge variant={STATUS_VARIANT[d.status] ?? 'secondary'}>{d.status}</Badge>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-violet-600/10 to-indigo-500/10 p-5 ring-1 ring-violet-500/15">
          <p className="text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">Next step:</span> {s.recommendations?.[0]?.reason ?? 'Review the flagged cohort and schedule check-ins.'}
          </p>
          <Button size="sm" variant="outline" onClick={() => toast.success('Check-ins scheduled', '1:1 check-in slots opened for the critical cohort.')}>
            <Sparkles className="h-3.5 w-3.5" /> Schedule check-ins
          </Button>
        </div>
      </WorkspaceSection>
    </div>
  )
}

export { StudentsAtRiskTab }
export default StudentsAtRiskTab
