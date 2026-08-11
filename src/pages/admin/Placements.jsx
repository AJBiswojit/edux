import { motion } from 'framer-motion'
import { Briefcase, Building2, CalendarDays, TrendingUp } from 'lucide-react'
import { useAdminPlacements } from '@/services'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { BarCompare } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Card, Button, useToast } from '@/components/ui'

function Placements() {
  const { data, isLoading, isError, refetch } = useAdminPlacements()
  const toast = useToast()

  if (isLoading) return <DashboardSkeleton cards={4} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Management · Placements"
        title="Placement intelligence"
        description="Offers, CTC trends and branch health — the placement season at a glance."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Placements' }]}
        actions={<Badge variant="gradient" className="px-3 py-1"><Briefcase className="h-3 w-3" /> Season 2026-27 live</Badge>}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Offers by company" className="min-w-0" subtitle="Top recruiters · season to date">
          <BarCompare
            data={data.companyWise ?? []}
            xKey="company"
            height={260}
            series={[{ key: 'offers', name: 'Offers', color: '#6366f1' }]}
          />
        </ChartCard>

        <ChartCard title="Placement rate by branch" className="min-w-0" subtitle="% of registered students placed">
          <BarCompare
            data={data.branchWise ?? []}
            xKey="branch"
            height={260}
            series={[{ key: 'placed', name: 'Placed %', color: '#10b981' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Average CTC trend" className="min-w-0" subtitle="By placement year">
          <BarCompare
            data={(data.salaryTrend ?? []).map((s) => ({ year: s.year, ctc: parseFloat(s.avg.replace('₹', '')) }))}
            xKey="year"
            height={220}
            series={[{ key: 'ctc', name: 'Avg CTC (LPA)', color: '#f59e0b' }]}
          />
        </ChartCard>

        <ChartCard title="Top offers" className="min-w-0" subtitle="Highest CTCs this season">
          <div className="space-y-2.5">
            {(data.companyWise ?? []).slice(0, 5).map((c, i) => (
              <motion.div key={c.company} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{c.company}</p>
                  <p className="text-[11px] text-slate-400">{c.offers} offers</p>
                </div>
                <Badge variant="success">{c.ctc}</Badge>
              </motion.div>
            ))}
          </div>
        </ChartCard>

        <Card className="p-6">
          <p className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <CalendarDays className="h-4 w-4 text-indigo-500" /> Upcoming drives
          </p>
          <div className="mt-4 space-y-2.5">
            {data.drives.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
                  <span className="text-[9px] font-bold leading-none">{d.date.split('-').slice(1).join('/')}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{d.company} — {d.role}</p>
                  <p className="text-[11px] text-slate-400">{d.positions} positions</p>
                </div>
                <Badge variant="warning" size="sm">{d.stage}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toast.success('Drive scheduled', 'Add recruiter details to publish the job card.')}>
            <TrendingUp className="h-3.5 w-3.5" /> Schedule drive
          </Button>
        </Card>
      </div>
    </div>
  )
}

export { Placements }
export default Placements
