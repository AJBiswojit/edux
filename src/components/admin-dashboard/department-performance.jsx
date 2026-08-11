/**
 * MediXO EduX — Institution Command Center · Section 4: Department Performance.
 * Department health comparison with light inspect interaction (expands a row
 * for pass/attendance/placement detail) + link to the departments page.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Building2, ChevronDown, Users } from 'lucide-react'
import { ChartCard } from '@/components/shared/chart-card'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/utils/cn'

const GRADE_VARIANT = { Excellent: 'success', Good: 'info', 'At Risk': 'warning', Critical: 'danger' }

function DepartmentPerformance({ data }) {
  const depts = data.derived.departments?.list ?? []
  const [open, setOpen] = useState(null)

  return (
    <ChartCard
      title="Department performance"
      subtitle="Health score · pass rate · attendance · placement"
      className="h-full"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/departments">All departments <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      }
    >
      <div className="space-y-2">
        {depts.map((d, i) => (
          <motion.div key={d.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div className={cn('rounded-2xl border transition-all', open === d.code ? 'border-indigo-300 bg-indigo-50/40 dark:border-indigo-500/40 dark:bg-indigo-500/10' : 'border-slate-100 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-500/30')}>
              <button
                onClick={() => setOpen(open === d.code ? null : d.code)}
                aria-expanded={open === d.code}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-300">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{d.code}</p>
                    <Badge variant={GRADE_VARIANT[d.grade] ?? 'secondary'} size="sm">{d.grade}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                        style={{ width: `${d.score}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[12px] font-bold text-indigo-600 dark:text-indigo-400">{d.score}</span>
                  </div>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open === d.code && 'rotate-180')} />
              </button>

              {open === d.code && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                  <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="truncate text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">{d.name}</p>
                    <p className="mt-0.5 text-[10.5px] text-slate-400">HOD · {d.hod}</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: 'Pass rate', value: `${d.passRate}%` },
                        { label: 'Attendance', value: `${d.attendance}%` },
                        { label: 'Placement', value: `${d.placement}%` },
                        { label: 'Students', value: String(d.students) },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-slate-50 px-2.5 py-2 text-center dark:bg-slate-800/50">
                          <p className="text-[12.5px] font-bold text-slate-800 dark:text-white">{s.value}</p>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 text-[10.5px] font-medium text-slate-400">
                      <Users className="h-3 w-3" /> {d.faculty} faculty · {d.programs} programs
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </ChartCard>
  )
}

export { DepartmentPerformance }
export default DepartmentPerformance
