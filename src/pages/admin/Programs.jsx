import { motion } from 'framer-motion'
import { Award, BookOpen, GraduationCap, IndianRupee, Plus, Users } from 'lucide-react'
import { useAdminPrograms } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, useToast } from '@/components/ui'
import { useState } from 'react'

function Programs() {
  const { data, isLoading, isError, refetch } = useAdminPrograms()
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const programs = data?.programs ?? []

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Management · Programs"
        title="Academic programs"
        description="Every degree program across the institution — intake, fees, accreditation and outcomes."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Programs' }]}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New program
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {programs.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <Badge variant={p.status === 'Active' ? 'success' : 'secondary'}>{p.status}</Badge>
              </div>
              <h3 className="mt-3.5 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">{p.name}</h3>
              <p className="mt-1 text-[11px] font-medium text-slate-400">{p.dept} · {p.duration}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <p className="flex items-center justify-center gap-1 text-sm font-bold text-slate-800 dark:text-white"><Users className="h-3 w-3 text-indigo-500" /> {p.students.toLocaleString()}</p>
                  <p className="text-[9px] font-medium text-slate-400">Students</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{p.intake}</p>
                  <p className="text-[9px] font-medium text-slate-400">Intake/yr</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">
                  <IndianRupeeIcon /> {p.fee}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Award className="h-3 w-3" /> {p.placements}% placed
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                {p.accreditations.map((a) => <Badge key={a} variant="outline" size="sm">{a}</Badge>)}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-indigo-500" /> New program</DialogTitle>
            <DialogDescription>Programs are approved by the Academic Council before activation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Program name" required><Input placeholder="e.g. B.Tech — Artificial Intelligence" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Department">
                <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                  <option>CSE</option><option>ECE</option><option>ME</option><option>MBA</option>
                </select>
              </Field>
              <Field label="Duration">
                <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                  <option>4 years</option><option>2 years</option><option>5 years</option>
                </select>
              </Field>
            </div>
            <Field label="Annual intake" required><Input type="number" placeholder="120" /></Field>
            <Field label="Annual fee (₹)" required><Input type="number" placeholder="400000" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { setOpen(false); toast.success('Program created', 'Forwarded to the Academic Council for approval.') }}>Create program</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IndianRupeeIcon() {
  return <IndianRupee className="h-3 w-3" />
}

export { Programs }
export default Programs
