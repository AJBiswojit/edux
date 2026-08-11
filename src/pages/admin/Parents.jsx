import { useMemo, useState } from 'react'
import { HeartHandshake, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Avatar, Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, useToast } from '@/components/ui'

const PARENT_ROSTER = [
  { id: 'p1', name: 'Rajesh Sharma', email: 'rajesh.sharma@medixoedux.edu', ward: 'Aarav Sharma', wardRoll: '21CS114', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'High', status: 'Active' },
  { id: 'p2', name: 'Anita Gupta', email: 'anita.gupta@medixoedux.edu', ward: 'Ishita Gupta', wardRoll: '21CS101', program: 'B.Tech CSE', linkedAccounts: 2, engagement: 'High', status: 'Active' },
  { id: 'p3', name: 'Mahesh Verma', email: 'mahesh.verma@medixoedux.edu', ward: 'Rohan Verma', wardRoll: '21CS102', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'Medium', status: 'Active' },
  { id: 'p4', name: 'Deepa Patil', email: 'deepa.patil@medixoedux.edu', ward: 'Sneha Patil', wardRoll: '21CS103', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'High', status: 'Active' },
  { id: 'p5', name: 'Suresh Mehta', email: 'suresh.mehta@medixoedux.edu', ward: 'Karan Mehta', wardRoll: '21CS104', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'Low', status: 'Active' },
  { id: 'p6', name: 'Lakshmi Krishnan', email: 'lakshmi.krishnan@medixoedux.edu', ward: 'Divya Krishnan', wardRoll: '21CS105', program: 'B.Tech CSE', linkedAccounts: 2, engagement: 'Very High', status: 'Active' },
  { id: 'p7', name: 'Ramesh Singh', email: 'ramesh.singh@medixoedux.edu', ward: 'Aditya Singh', wardRoll: '21CS106', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'Medium', status: 'Inactive' },
  { id: 'p8', name: 'Kavitha Reddy', email: 'kavitha.reddy@medixoedux.edu', ward: 'Pooja Reddy', wardRoll: '21CS107', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'High', status: 'Active' },
  { id: 'p9', name: 'Venkat Joshi', email: 'venkat.joshi@medixoedux.edu', ward: 'Nikhil Joshi', wardRoll: '21CS108', program: 'B.Tech CSE', linkedAccounts: 2, engagement: 'Low', status: 'Active' },
  { id: 'p10', name: 'Meena Desai', email: 'meena.desai@medixoedux.edu', ward: 'Ananya Desai', wardRoll: '21CS109', program: 'B.Tech CSE', linkedAccounts: 1, engagement: 'Very High', status: 'Active' },
]

const ENGAGEMENT_STYLES = { High: 'success', 'Very High': 'success', Medium: 'info', Low: 'warning' }

function Parents() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const toast = useToast()

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Guardian',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
            <p className="text-[11px] text-slate-400">{p.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ward',
      label: 'Ward',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">{p.ward}</p>
          <p className="text-[11px] text-slate-400">{p.wardRoll} · {p.program}</p>
        </div>
      ),
    },
    {
      key: 'linkedAccounts',
      label: 'Linked',
      render: (p) => <Badge variant="secondary" size="sm">{p.linkedAccounts} account{p.linkedAccounts > 1 ? 's' : ''}</Badge>,
    },
    {
      key: 'engagement',
      label: 'Engagement',
      sortable: true,
      render: (p) => <Badge variant={ENGAGEMENT_STYLES[p.engagement]}>{p.engagement}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <Badge variant={p.status === 'Active' ? 'success' : 'secondary'}>{p.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => toast.info('Message', `Compose a message to ${p.name}.`)}><Mail className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => toast.success('Guardian view', `Opened the parent portal view for ${p.name}.`)}><HeartHandshake className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => toast.info('Permissions', `${p.name} — parent role.`)}><ShieldCheck className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ], [toast])

  return (
    <div>
      <PageHeader
        eyebrow="Management · Parents"
        title="Parent & guardian management"
        description="8,640 guardian accounts — ward links, engagement and communication health."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Parents' }]}
        actions={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite guardian
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={PARENT_ROSTER}
        searchKeys={['name', 'email', 'ward', 'wardRoll']}
        searchPlaceholder="Search guardians…"
        pageSize={8}
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'High-engagement guardians', value: '62%', note: 'opens portal weekly', color: 'text-emerald-500' },
          { label: 'Low-engagement guardians', value: '11%', note: 'onboarding campaign running', color: 'text-amber-500' },
          { label: 'Unlinked wards', value: '214', note: 'pending guardian invite', color: 'text-rose-500' },
        ].map((s, i) => (
          <div key={s.label} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{s.label}</p>
            <p className="text-[11px] text-slate-400">{s.note}</p>
          </div>
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite guardian</DialogTitle>
            <DialogDescription>Guardians receive a secure link to link their ward's account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Guardian email" required><Input type="email" placeholder="parent@email.com" /></Field>
            <Field label="Ward roll number" required><Input placeholder="21CS117" /></Field>
            <Field label="Relationship">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                <option>Parent</option><option>Guardian</option><option>Sponsor</option>
              </select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => { setInviteOpen(false); toast.success('Invitation sent ✉️', 'The guardian will receive a secure link.') }}>
              <HeartHandshake className="h-4 w-4" /> Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { Parents }
export default Parents
