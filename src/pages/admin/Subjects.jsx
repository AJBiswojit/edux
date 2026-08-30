import { useMemo, useState } from 'react'
import { BookOpen, Plus, Users } from 'lucide-react'
import { useAdminSubjects, useCreateAdminSubject } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, useToast } from '@/components/ui'

function Subjects() {
  const { data, isLoading, isError, refetch } = useAdminSubjects()
  const [dept, setDept] = useState('All')
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const createSubject = useCreateAdminSubject()
  const [form, setForm] = useState({ code: '', name: '' })
  const subjects = (data?.subjects ?? []).filter((s) => dept === 'All' || (s.program || s.dept || '').includes(dept))

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Subject',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-300">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
            <p className="text-[11px] text-slate-400">{s.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'program', label: 'Program', render: (s) => <Badge variant="secondary" size="sm">{s.program || s.dept || '—'}</Badge> },
    { key: 'semester', label: 'Semester', render: (s) => <span className="text-slate-500 dark:text-slate-400">{s.semester ?? '—'}</span> },
    { key: 'credits', label: 'Credits', render: (s) => <span className="font-semibold text-slate-700 dark:text-slate-200">{s.credits ?? '—'}</span> },
    {
      key: 'courses',
      label: 'Sections',
      render: (s) => (
        <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5" /> {s.courses}
        </span>
      ),
    },
    { key: 'faculty', label: 'Faculty', render: (s) => <span className="text-slate-500 dark:text-slate-400">{s.faculty ?? '—'}</span> },
    {
      key: 'passRate',
      label: 'Pass rate',
      sortable: true,
      render: (s) => <Badge variant={s.passRate == null ? 'secondary' : s.passRate >= 90 ? 'success' : s.passRate >= 85 ? 'warning' : 'danger'}>{s.passRate == null ? '—' : `${s.passRate}%`}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => <Badge variant={s.status === 'Active' ? 'success' : 'secondary'}>{s.status}</Badge>,
    },
  ], [])

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Management · Subjects"
        title="Subjects catalogue"
        description="Every subject across programs — credits, faculty and pass-rate health."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Subjects' }]}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New subject
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {['All', 'CSE', 'ECE', 'ME', 'EE', 'MBA', 'DES'].map((d) => (
          <button key={d} onClick={() => setDept(d)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${dept === d ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
            {d}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={subjects}
        searchKeys={['name', 'code', 'faculty']}
        searchPlaceholder="Search subjects…"
        pageSize={8}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New subject</DialogTitle>
            <DialogDescription>Subjects map to courses and are approved by the HOD.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject code" required><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CS507" /></Field>
              <Field label="Credits" required><Input type="number" placeholder="3" /></Field>
            </div>
            <Field label="Subject name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Cloud Computing" /></Field>
            <Field label="Program">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                <option>B.Tech CSE</option><option>B.Tech ECE</option><option>MBA</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { setOpen(false); toast.success('Subject created', 'Sent to HOD for approval.') }}>Create subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { Subjects }
export default Subjects
