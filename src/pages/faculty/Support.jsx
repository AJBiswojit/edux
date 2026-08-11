/**
 * MediXO EduX — Faculty · Support.
 * Faculty-facing help & support: help centre, AI assistant, human support
 * tickets — reuses the shared support ticket service (mock → real backend
 * via VITE_USE_MOCK=false).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Headphones, LifeBuoy, MessageCircle, Plus } from 'lucide-react'
import { useSupportTickets, useCreateSupportTicket } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, Select, SelectItem, Textarea, useToast } from '@/components/ui'
import { formatRelative } from '@/utils/format'

const STATUS_STYLES = { Open: 'info', 'In Progress': 'warning', Resolved: 'success' }
const PRIORITY_STYLES = { High: 'danger', Medium: 'warning', Low: 'secondary' }

function Support() {
  const { data, isLoading, isError, refetch } = useSupportTickets()
  const { mutateAsync: createTicket } = useCreateSupportTicket()
  const [filter, setFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('Technical')
  const [priority, setPriority] = useState('Medium')
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const tickets = (data?.tickets ?? []).filter((t) => filter === 'All' || t.status === filter)

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (!fd.get('title')?.trim()) {
      toast.error('Almost there', 'Please describe the issue in a few words.')
      return
    }
    setSubmitting(true)
    try {
      await createTicket({ title: fd.get('title'), category, priority, detail: fd.get('detail') })
      toast.success('Ticket created ✓', 'Our support team will respond within 24 hours.')
      setOpen(false)
    } catch {
      toast.error('Could not create ticket', 'Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Faculty · Support"
        title="Help & support"
        description="24×7 knowledge base, AI assistant, and human support tickets — average first response under 6 hours."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Support' }]}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        }
      />

      {/* Help channels */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          { icon: LifeBuoy, title: 'Help centre', desc: '400+ articles on teaching tools, grading and analytics — searchable and updated weekly.', cta: 'Browse articles', color: 'from-indigo-500 to-blue-500' },
          { icon: Headphones, title: 'AI support assistant', desc: 'Instant answers to common questions, 24×7, in any language.', cta: 'Chat now', color: 'from-teal-500 to-emerald-500' },
          { icon: MessageCircle, title: 'Human support', desc: 'Escalate anytime — tickets route to the right team within minutes.', cta: 'Open a ticket', color: 'from-amber-500 to-orange-500' },
        ].map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-slate-900 dark:text-white">{c.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{c.desc}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => toast.info(c.title, 'Opening the support channel…')}>{c.cta}</Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tickets */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['All', 'Open', 'In Progress', 'Resolved'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${filter === f ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-400">{tickets.length} tickets</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tickets.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="h-full p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white">{t.title}</p>
                  <p className="mt-1 text-[11.5px] text-slate-400">{t.category} · updated {formatRelative(t.updated)}</p>
                </div>
                <Badge variant={STATUS_STYLES[t.status] ?? 'secondary'} size="sm">{t.status}</Badge>
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <Badge variant={PRIORITY_STYLES[t.priority] ?? 'secondary'} size="sm">{t.priority}</Badge>
                <Badge variant="outline" size="sm">{t.messages} messages</Badge>
                {t.satisfaction != null && <Badge variant="success" size="sm">★ {t.satisfaction}/5</Badge>}
              </div>
            </Card>
          </motion.div>
        ))}
        {tickets.length === 0 && <Card className="p-10 text-center text-xs text-slate-400 md:col-span-2">No {filter.toLowerCase()} tickets.</Card>}
      </div>

      {/* New ticket dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a support ticket</DialogTitle>
            <DialogDescription>Describe the issue — our team responds within 24 hours.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Title">
              <Input name="title" placeholder="e.g. Cannot export gradebook for CS501" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Records">Records</SelectItem>
                  <SelectItem value="How-to">How-to</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={priority} onValueChange={setPriority}>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </Select>
              </Field>
            </div>
            <Field label="Details">
              <Textarea name="detail" rows={4} placeholder="Steps to reproduce, screenshots, expected vs actual…" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Create ticket'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { Support }
export default Support
