import { useMemo, useState } from 'react'
import { BookOpen, Download, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { useAdminStudents, useCreateAdminStudent } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, Select, SelectItem, useToast } from '@/components/ui'

function Students() {
  const { data, isLoading, isError, refetch } = useAdminStudents()
  const [batch, setBatch] = useState('All')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form, setForm] = useState({ name: '', roll: '', email: '' })
  const createStudent = useCreateAdminStudent()
  const toast = useToast()

  const roster = (data?.students ?? []).filter((s) => batch === 'All' || s.status === batch)
  const totalStudents = data?.total ?? roster.length

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
          <p className="text-[11px] text-slate-400">{s.roll}</p>
        </div>
      ),
    },
    {
      key: 'cgpa',
      label: 'CGPA',
      sortable: true,
      render: (s) => <Badge variant={s.cgpa >= 8.5 ? 'success' : s.cgpa >= 7.5 ? 'info' : s.cgpa >= 7 ? 'warning' : 'danger'}>{s.cgpa}</Badge>,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      sortable: true,
      render: (s) => (
        <span className={`font-semibold ${s.attendance >= 90 ? 'text-emerald-600 dark:text-emerald-400' : s.attendance >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
          {s.attendance == null ? '—' : `${s.attendance}%`}
        </span>
      ),
    },
    {
      key: 'internalMarks',
      label: 'Internals',
      sortable: true,
      render: (s) => <span className="font-semibold text-slate-700 dark:text-slate-200">{s.internalMarks}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => <Badge variant={s.status === 'Excellent' ? 'success' : s.status === 'Good' ? 'info' : 'danger'}>{s.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (s) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => toast.info('Message', `Compose a message to ${s.name}.`)}><Mail className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => toast.success('Record', `${s.name} — full academic record opened.`)}><BookOpen className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => toast.info('Permissions', `${s.name} — student role.`)}><ShieldCheck className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ], [toast])

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="Management · Students"
        title="Student management"
        description={`${totalStudents.toLocaleString('en-IN')} students across programmes — academic health at a glance, drill into anyone.`}
        breadcrumbs={[{ label: 'Admin' }, { label: 'Students' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info('Export unavailable', 'Directory export is not available yet.')}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add student
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {['All', 'Excellent', 'Good', 'At Risk'].map((b) => (
          <button key={b} onClick={() => setBatch(b)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${batch === b ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
            {b}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={roster}
        searchKeys={['name', 'roll']}
        searchPlaceholder="Search students…"
        pageSize={8}
      />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>New students join via batch upload or individual invitation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="First Last" /></Field>
              <Field label="Roll number" required><Input value={form.roll} onChange={(e) => setForm((f) => ({ ...f, roll: e.target.value }))} placeholder="21CS117" /></Field>
            </div>
            <Field label="Email" required><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="student@institution.edu" /></Field>
            <Field label="Program">
              <Select defaultValue="B.Tech — Computer Science">
                <SelectItem value="B.Tech — Computer Science">B.Tech — Computer Science</SelectItem>
                <SelectItem value="B.Tech — ECE">B.Tech — ECE</SelectItem>
                <SelectItem value="MBA">MBA</SelectItem>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                await createStudent.mutateAsync({ fullName: form.name, roll: form.roll, email: form.email })
                setInviteOpen(false)
                setForm({ name: '', roll: '', email: '' })
                toast.success('Student added', 'Account persisted for this institution.')
              } catch (err) {
                toast.error('Create failed', err?.response?.data?.detail || 'Could not create student.')
              }
            }}>
              <UserPlus className="h-4 w-4" /> Add student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { Students }
export default Students
