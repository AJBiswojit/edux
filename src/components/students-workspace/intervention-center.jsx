/**
 * Faculty — AI Intervention Center (Phase 6).
 * The actionable lifecycle: Detect → Recommend → Approve → Plan → Assign
 * (prototype) → Student practice → Re-test (linked) → Effectiveness.
 * Faculty approval is mandatory; nothing is delivered automatically.
 * Replacements for the Phase 5 Interventions tab (same surface, deeper).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, BookOpen, CheckCircle2, ClipboardList, Clock, FileText, PencilLine, Send, Sparkles, Target, X,
} from 'lucide-react'
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Field, Input, Select, SelectItem, Textarea, useToast } from '@/components/ui'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import {
  useInterventions, useIntervention, useInterventionPractice,
  useInterventionStatus, useInterventionModify, useInterventionAssign, useCreateRetest,
  useFacultyStudentInterventions,
} from '@/services/faculty-interventions'
import { formatDate } from '@/utils/format'

const PRIORITY_STYLE = { Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'secondary' }
const STATUS_STYLE = {
  Detected: 'secondary', Recommended: 'warning', Approved: 'info', Planned: 'info',
  Assigned: 'info', 'In Progress': 'info', Completed: 'success', 'Re-test Pending': 'warning',
  Evaluating: 'warning', Resolved: 'success', Improving: 'success', Persistent: 'danger', Dismissed: 'outline',
}
const TIMELINE = ['Detected', 'Recommended', 'Approved', 'Planned', 'Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating']
const OUTCOME_STYLE = { Resolved: 'success', Improving: 'info', 'Partially Effective': 'warning', 'No Significant Change': 'secondary', Persistent: 'danger', Pending: 'secondary' }

/* ================= Detail dialog ================= */
function Timeline({ status }) {
  const idx = TIMELINE.indexOf(status)
  const doneCount = idx >= 0 ? idx + 1 : TIMELINE.length
  const isOutcome = status === 'Resolved' || status === 'Improving' || status === 'Persistent'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TIMELINE.map((step, i) => {
        const done = i < doneCount
        return (
          <div key={step} className="flex items-center gap-1.5">
            {i > 0 && <span className={`h-px w-3 ${done ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${done ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : 'bg-slate-50 text-slate-400 dark:bg-slate-800/60'}`}>
              {done ? '✓' : '○'} {step}
            </span>
          </div>
        )
      })}
      {isOutcome && <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : status === 'Improving' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>{status}</span>}
    </div>
  )
}

function EffectivenessPanel({ iv }) {
  const eff = iv?.effectiveness
  if (!eff || !eff.completed) {
    return (
      <div className="rounded-2xl border border-slate-100 p-4 text-[12px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {eff?.evidence ?? 'No re-test completed yet — completion is not effectiveness.'}
      </div>
    )
  }
  const d = eff.deltas ?? {}
  return (
    <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Prototype Intervention Effectiveness</p>
        <Badge variant={OUTCOME_STYLE[eff.outcome] ?? 'secondary'}>{eff.outcome}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Baseline accuracy', value: `${iv.baseline?.accuracy ?? 0}%` },
          { label: 'Re-test accuracy', value: `${eff.retest?.accuracy ?? 0}%` },
          { label: 'Δ accuracy', value: `${d.accuracyDelta >= 0 ? '+' : '−'}${Math.abs(d.accuracyDelta ?? 0)}pp`, tone: d.accuracyDelta >= 0 ? 'text-emerald-600' : 'text-rose-500' },
          { label: 'Δ time', value: `${d.timeDelta >= 0 ? '−' : '+'}${Math.abs(d.timeDelta ?? 0)}s`, tone: d.timeDelta >= 0 ? 'text-emerald-600' : 'text-rose-500' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
            <p className={`text-[14px] font-bold text-slate-900 dark:text-white ${m.tone ?? ''}`}>{m.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">{eff.evidence}</p>
      <p className="mt-1 text-[10px] font-medium text-slate-400">Deterministic prototype calculation — not a scientifically validated measure.</p>
    </div>
  )
}

function PracticeSetDialog({ open, onOpenChange, data }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Practice set — {data?.interventionId ? 'targeted practice' : ''}</DialogTitle></DialogHeader>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {data?.questions?.length ? data.questions.map((q) => (
            <div key={q.id} className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" size="sm">{q.id}</Badge>
                <Badge variant="outline" size="sm">{q.difficulty}</Badge>
                {q.isPyq && <Badge variant="warning" size="sm">PYQ{q.year ? ` ${q.year}` : ''}</Badge>}
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200">{q.text}</p>
            </div>
          )) : <p className="py-6 text-center text-xs text-slate-400">No questions yet.</p>}
          {data?.insufficient && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              Not enough questions match this configuration ({data.available} of {data.required}) — broadened to {data.level}.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InterventionDetailDialog({ id, open, onOpenChange }) {
  const toast = useToast()
  const { data, isLoading } = useIntervention(id)
  const { data: practiceData, refetch: refetchPractice } = useInterventionPractice(id)
  const { mutateAsync: setStatus } = useInterventionStatus()
  const { mutateAsync: modify } = useInterventionModify()
  const { mutateAsync: assign } = useInterventionAssign()
  const { mutateAsync: createRetest } = useCreateRetest()

  const [selectedIds, setSelectedIds] = useState(null)
  const [showPractice, setShowPractice] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [retestForm, setRetestForm] = useState({ title: '', difficulty: 'Medium', count: '10', timeLimit: '20', pyqPreference: 'Yes', level: 'subject' })

  if (!open) return null
  if (isLoading) return <DashboardSkeleton cards={2} />
  const iv = data?.intervention
  if (!iv) return null

  const ids = selectedIds ?? iv.studentIds ?? []
  const allIds = iv.allGroupStudentIds ?? []
  /* detail route returns retests/practiceAttempts as arrays; list route as counts */
  const retestCount = Array.isArray(iv.retests) ? (iv.retests ?? []).length : (iv.retests ?? 0)
  const practiceDoneCount = Array.isArray(iv.practiceAttempts)
    ? (iv.practiceAttempts ?? []).filter((p) => p.kind === 'practice').length
    : (iv.practiceProgress ?? 0)
  const practiceAcc = Array.isArray(iv.practiceAttempts)
    ? (() => { const ps = (iv.practiceAttempts ?? []).filter((p) => p.kind === 'practice'); return ps.length ? Math.round(ps.reduce((n, p) => n + p.accuracy, 0) / ps.length) : null })()
    : iv.practiceAccuracy

  const act = async (status, action = null) => {
    await setStatus({ groupId: iv.id, status, action })
    toast.success(status, status === 'Approved' ? 'Approved by Dr. Meera Krishnan — approval recorded.' : status === 'Dismissed' ? 'Dismissed — no action taken.' : `Intervention moved to ${status}.`)
  }

  const saveModify = async () => {
    const f = form ?? {}
    await modify({
      groupId: iv.id,
      payload: {
        title: f.title ?? iv.title,
        priority: f.priority ?? iv.priority,
        studentIds: ids,
        objectives: f.objectives ? [f.objectives] : undefined,
        practiceConfig: {
          count: Number(f.count ?? iv.practiceConfig?.count ?? 8),
          difficulty: f.difficulty ?? iv.practiceConfig?.difficulty ?? 'Medium',
          duration: Number(f.duration ?? iv.practiceConfig?.duration ?? 20),
          includePyq: f.includePyq != null ? f.includePyq === 'true' : iv.practiceConfig?.includePyq,
        },
        notes: f.notes ?? iv.notes,
      },
    })
    setEditing(false)
    toast.success('Intervention updated', `${ids.length} of ${allIds.length} students selected. Evidence was not modified.`)
  }

  const createReTest = async () => {
    try {
      const res = await createRetest({
        groupId: iv.id,
        payload: {
          title: retestForm.title || `Recovery Test — ${iv.chapter}`,
          difficulty: retestForm.difficulty,
          count: Number(retestForm.count),
          timeLimit: Number(retestForm.timeLimit),
          pyqPreference: retestForm.pyqPreference,
          level: retestForm.level,
          studentIds: ids,
        },
      })
      toast.success('Re-test created', `${res.retest?.questionCount ?? 0} questions · ${res.retest?.timeLimit} min · linked to this intervention (${res.insufficient ? `insufficient exact match — broadened to ${res.available} available` : 'questions selected from the existing bank/PYQ datasets'}).`)
    } catch (e) {
      toast.error('Could not create re-test', e?.response?.data?.message ?? 'Practice must be completed first.')
    }
  }

  const generatorLink = `/faculty/question-intelligence?tab=paper-generator&intervention=${encodeURIComponent(iv.id)}&mode=${iv.domain === 'University' ? 'University' : 'Competitive'}${iv.examFamily ? `&exam=${iv.examFamily}` : ''}&subject=${encodeURIComponent(iv.subject)}&chapter=${encodeURIComponent(iv.chapter)}&difficulty=${encodeURIComponent(retestForm.difficulty)}&count=${encodeURIComponent(retestForm.count)}&title=${encodeURIComponent(`Re-test — ${iv.chapter}`)}`

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" /> {iv.title}
              <Badge variant={PRIORITY_STYLE[iv.priority] ?? 'secondary'}>{iv.priority}</Badge>
              <Badge variant={STATUS_STYLE[iv.status] ?? 'secondary'}>{iv.status}</Badge>
              {iv.examFamily && <Badge variant="outline" size="sm">{iv.examFamily} · {iv.domain}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {/* Timeline */}
          <Timeline status={iv.status} />

          {/* Why detected */}
          <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/60 p-4 dark:border-indigo-500/25 dark:bg-indigo-500/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Why detected</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200">{iv.whyDetected}</p>
          </div>

          {/* Evidence + students */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Evidence</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Students', value: String(iv.evidence?.students ?? iv.students?.length ?? 0) },
                  { label: 'Avg acc', value: `${iv.evidence?.avgAccuracy ?? iv.baseline?.accuracy ?? 0}%` },
                  { label: 'Avg time', value: `${iv.evidence?.avgTime ?? iv.baseline?.avgTime ?? 0}s` },
                  { label: 'Incorrect', value: String(iv.evidence?.incorrect ?? iv.baseline?.incorrect ?? 0) },
                  { label: 'Questions', value: String(iv.evidence?.questions ?? 0) },
                  { label: 'Exams', value: String(iv.evidence?.affectedExams ?? 0) },
                  { label: 'Persistence', value: `${iv.evidence?.persistence ?? 1}×` },
                  { label: 'Priority', value: iv.priority },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-slate-50 p-2 text-center dark:bg-slate-800/60">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">{m.value}</p>
                    <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Students ({ids.length} of {allIds.length} selected)</p>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([...allIds])}>Select all</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(iv.students ?? []).map((s) => {
                  const sel = ids.includes(s.studentId)
                  return (
                    <button key={s.studentId} onClick={() => setSelectedIds((prev) => {
                      const cur = prev ?? iv.studentIds ?? []
                      return sel ? cur.filter((x) => x !== s.studentId) : [...cur, s.studentId]
                    })}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset transition-all ${sel ? 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30' : 'bg-slate-50 text-slate-400 ring-slate-200 line-through dark:bg-slate-800/60 dark:ring-slate-700'}`}>
                      {s.name} <span className="text-[9px]">{s.roll}</span>
                    </button>
                  )
                })}
              </div>
              {selectedIds && selectedIds.length !== (iv.studentIds ?? []).length && (
                <Button size="sm" className="mt-2" onClick={saveModify}><CheckCircle2 className="h-3 w-3" /> Save selection</Button>
              )}
              <p className="mt-2 text-[10.5px] text-slate-400">The original issue group is never modified — the intervention stores its own studentIds.</p>
            </div>
          </div>

          {/* Recommendation + objectives */}
          <div className="rounded-2xl border border-emerald-100 p-4 dark:border-emerald-500/20">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3 w-3" /> Recommended intervention
            </p>
            <p className="mt-1 text-[13px] font-bold text-slate-800 dark:text-slate-100">{iv.recommendation?.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(iv.recommendation?.actions ?? []).map((a) => <Badge key={a.label} variant="outline" size="sm">{a.label}</Badge>)}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Objectives</p>
                <ul className="mt-1 space-y-1 text-[11.5px] text-slate-600 dark:text-slate-300">
                  {(iv.objectives ?? []).map((o) => <li key={o} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{o}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expected outcome</p>
                <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-300">{iv.expectedOutcome}</p>
                <p className="mt-1 text-[10.5px] text-slate-400">Practice: {iv.practiceConfig?.type} · {iv.practiceConfig?.count} questions · {iv.practiceConfig?.duration} min · PYQ {iv.pyqPreference}</p>
              </div>
            </div>
          </div>

          {/* Modify form */}
          {editing ? (
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Modify intervention (evidence is never editable)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title"><Input defaultValue={form?.title ?? iv.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
                <Field label="Priority">
                  <Select value={form?.priority ?? iv.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                    {['Critical', 'High', 'Medium', 'Low'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Practice questions"><Input type="number" defaultValue={form?.count ?? iv.practiceConfig?.count ?? 8} onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))} /></Field>
                <Field label="Difficulty">
                  <Select value={form?.difficulty ?? iv.practiceConfig?.difficulty ?? 'Medium'} onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}>
                    {['Easy', 'Medium', 'Hard', 'Mixed'].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Duration (min)"><Input type="number" defaultValue={form?.duration ?? iv.practiceConfig?.duration ?? 20} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} /></Field>
                <Field label="Include PYQs">
                  <Select value={form?.includePyq != null ? String(form.includePyq) : String(!!iv.practiceConfig?.includePyq)} onValueChange={(v) => setForm((f) => ({ ...f, includePyq: v }))}>
                    <SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem>
                  </Select>
                </Field>
                <Field label="Faculty notes" className="sm:col-span-2"><Textarea defaultValue={iv.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={saveModify}><CheckCircle2 className="h-3.5 w-3.5" /> Save changes</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><PencilLine className="h-3.5 w-3.5" /> Modify</Button>
              {['Detected', 'Recommended', 'Approved', 'Planned', 'Assigned'].includes(iv.status) && (
                <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => act('Dismissed')}><X className="h-3.5 w-3.5" /> Dismiss</Button>
              )}
              {iv.status === 'Detected' && <Button size="sm" variant="warning" onClick={() => act('Recommended')}><Sparkles className="h-3.5 w-3.5" /> Recommend</Button>}
              {iv.status === 'Recommended' && <Button size="sm" variant="success" onClick={() => act('Approved')}><CheckCircle2 className="h-3.5 w-3.5" /> Approve intervention</Button>}
              {iv.status === 'Approved' && <Button size="sm" onClick={() => act('Planned')}><ClipboardList className="h-3.5 w-3.5" /> Mark planned</Button>}
              {iv.status === 'Planned' && <Button size="sm" variant="success" onClick={async () => { await assign({ groupId: iv.id }); toast.success('Assigned', 'Prototype assignment — students can now see this intervention.') }}><Send className="h-3.5 w-3.5" /> Assign to students</Button>}
            </div>
          )}

          {/* Practice */}
          {['Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status) && (
            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Targeted practice</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { refetchPractice(); setShowPractice(true) }}><BookOpen className="h-3.5 w-3.5" /> View practice set</Button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white">{practiceDoneCount}/{iv.practiceRequired ?? 8}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Questions done</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                  <p className={`text-[14px] font-bold ${practiceAcc != null && practiceAcc >= 70 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{practiceAcc != null ? `${practiceAcc}%` : '—'}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Practice accuracy</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                  <p className="text-[14px] font-bold text-slate-900 dark:text-white">{retestCount}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Re-tests</p>
                </div>
              </div>
            </div>
          )}

          {/* Re-test */}
          {['Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status) && (
            <div className="rounded-2xl border border-amber-100 p-4 dark:border-amber-500/20">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Clock className="h-3 w-3" /> Re-test
              </p>
              {retestCount === 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Field label="Title"><Input value={retestForm.title} onChange={(e) => setRetestForm((f) => ({ ...f, title: e.target.value }))} placeholder={`Recovery Test — ${iv.chapter}`} /></Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Difficulty">
                        <Select value={retestForm.difficulty} onValueChange={(v) => setRetestForm((f) => ({ ...f, difficulty: v }))}>
                          {['Easy', 'Medium', 'Hard', 'Mixed'].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </Select>
                      </Field>
                      <Field label="Questions"><Input type="number" value={retestForm.count} onChange={(e) => setRetestForm((f) => ({ ...f, count: e.target.value }))} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Time limit (min)"><Input type="number" value={retestForm.timeLimit} onChange={(e) => setRetestForm((f) => ({ ...f, timeLimit: e.target.value }))} /></Field>
                      <Field label="PYQ preference">
                        <Select value={retestForm.pyqPreference} onValueChange={(v) => setRetestForm((f) => ({ ...f, pyqPreference: v }))}>
                          <SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem>
                        </Select>
                      </Field>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <Button variant="success" onClick={createReTest}><ClipboardList className="h-4 w-4" /> Create Re-test</Button>
                    <Link to={generatorLink}>
                      <Button variant="outline" className="w-full"><FileText className="h-4 w-4" /> Generate with Paper Studio</Button>
                    </Link>
                    <p className="text-[10.5px] text-slate-400">Re-test targets the same subject/chapter with DIFFERENT questions from the existing bank/PYQ datasets, linked to this intervention.</p>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {(iv.retests ?? []).map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50/60 px-3 py-2 text-[12px] dark:bg-amber-500/5">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{r.title}</span>
                      <Badge variant="secondary" size="sm">{r.questionCount} questions · {r.timeLimit} min</Badge>
                      <Badge variant="outline" size="sm">linked #{r.interventionId}</Badge>
                      <span className="ml-auto text-[10.5px] text-slate-400">created {formatDate(r.createdAt, 'MMM d')}</span>
                    </div>
                  ))}
                  {['Re-test Pending', 'Evaluating'].includes(iv.status) && (
                    <p className="text-[11px] font-medium text-slate-500">Re-test assigned to students — awaiting completion for effectiveness analysis.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Effectiveness */}
          {['Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status) && <EffectivenessPanel iv={iv} />}

          {/* approvals meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] font-medium text-slate-400">
            {iv.approvedAt && <span>Approved by {iv.approvedBy ?? 'Dr. Meera Krishnan'} · {formatDate(iv.approvedAt, 'MMM d, h:mm a')}</span>}
            {iv.assignedAt && <span>Assigned {formatDate(iv.assignedAt, 'MMM d')}</span>}
            {iv.completedAt && <span>Practice completed {formatDate(iv.completedAt, 'MMM d')}</span>}
            {iv.evaluatedAt && <span>Evaluated {formatDate(iv.evaluatedAt, 'MMM d')}</span>}
          </div>
          <p className="text-[10.5px] font-medium text-slate-400">Prototype assignment — no email/SMS/push, no real delivery. Status transitions are validated (e.g. Detected → Resolved is not allowed without evidence).</p>
        </DialogContent>
      </Dialog>
      <PracticeSetDialog open={showPractice} onOpenChange={setShowPractice} data={practiceData} />
    </>
  )
}

/* ================= Center tab ================= */
/* ---------------- Student-360 scoped interventions ---------------- */
/**
 * Read-only panel for a SINGLE student's assigned/active interventions,
 * reused by the canonical Student 360 page. It reuses the same
 * /faculty/students/:id/interventions endpoint + lifecycle as the center;
 * it does NOT create a second intervention system and never assigns
 * anything automatically. The "Manage" link returns faculty to the full
 * Intervention Center.
 */
function StudentInterventionsPanel({ studentId, domain }) {
  const { data, isLoading, isError, refetch } = useFacultyStudentInterventions(studentId)
  const [selected, setSelected] = useState(null)

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const all = data?.items ?? []
  const items = domain
    ? all.filter((iv) => (domain === 'University' ? iv.domain === 'University' : iv.domain === 'Competitive' && iv.examFamily === domain))
    : all
  const sorted = [...items].sort((a, b) =>
    ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] ?? 4) - ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority] ?? 4))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Interventions for this student
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Existing practice &amp; re-test plans{domain ? ` · ${domain} only` : ''}. Faculty approval is mandatory — nothing is delivered automatically.
          </p>
        </div>
        <Link to="/faculty/my-students?view=interventions">
          <Button size="sm" variant="outline"><Sparkles className="h-3.5 w-3.5" /> Open Intervention Center</Button>
        </Link>
      </div>

      {sorted.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((iv) => (
            <button key={iv.id} onClick={() => setSelected(iv.id)}
              className="flex w-full items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/40">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iv.priority === 'Critical' || iv.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                <Target className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-white">
                  {iv.title}
                  <Badge variant={PRIORITY_STYLE[iv.priority] ?? 'secondary'} size="sm">{iv.priority}</Badge>
                  <Badge variant={STATUS_STYLE[iv.status] ?? 'secondary'} size="sm">{iv.status}</Badge>
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-slate-400">
                  {iv.subject} — {iv.chapter} · {iv.issueType}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {iv.practiceDone && iv.practiceAccuracy != null && <Badge variant="outline" size="sm">{iv.practiceAccuracy}% practice</Badge>}
                  {iv.outcome && <Badge variant={OUTCOME_STYLE[iv.outcome] ?? 'secondary'} size="sm">{iv.outcome}</Badge>}
                  <Badge variant="secondary" size="sm">{iv.examFamily ?? iv.domain}</Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No interventions for this student yet</p>
          <p className="mt-1 text-xs text-slate-400">Use a weakness’s “Suggested intervention” action or the Intervention Center to create one.</p>
        </div>
      )}

      <InterventionDetailDialog id={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  )
}

function InterventionCenterTab() {
  const { data, isLoading, isError, refetch } = useInterventions()
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const items = (data?.items ?? []).filter((i) =>
    (statusFilter === 'All' || i.status === statusFilter) &&
    (priorityFilter === 'All' || i.priority === priorityFilter))
    .sort((a, b) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority]))

  const quickFilters = [
    { label: 'Pending approval', match: (s) => s === 'Detected' || s === 'Recommended' },
    { label: 'Active', match: (s) => s === 'Assigned' || s === 'In Progress' },
    { label: 'Needs re-test', match: (s) => s === 'Completed' },
    { label: 'Effective', match: (s) => s === 'Resolved' || s === 'Improving' },
    { label: 'Persistent', match: (s) => s === 'Persistent' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">AI Intervention Center</h3>
          <p className="mt-0.5 text-xs text-slate-400">Detect → Approve → Assign → Practice → Re-test → Effectiveness. Faculty approval is mandatory; nothing is delivered automatically.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {quickFilters.map((q) => {
            const count = (data?.items ?? []).filter((i) => q.match(i.status)).length
            const active = statusFilter === q.label
            return (
              <button key={q.label} onClick={() => setStatusFilter(active ? 'All' : q.label)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${active ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
                {q.label} <span className="ml-1 opacity-60">{count}</span>
              </button>
            )
          })}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <option value="All">All statuses</option>
            {['Detected', 'Recommended', 'Approved', 'Planned', 'Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent', 'Dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <option value="All">All priorities</option>
            {['Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((i) => (
            <button key={i.id} onClick={() => setSelected(i.id)}
              className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${i.priority === 'Critical' || i.priority === 'High' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-white">
                  {i.title}
                  <Badge variant={PRIORITY_STYLE[i.priority]} size="sm">{i.priority}</Badge>
                  <Badge variant={STATUS_STYLE[i.status]} size="sm">{i.status}</Badge>
                  {i.effectiveness?.completed && i.effectiveness.outcome !== 'Pending' && (
                    <Badge variant={OUTCOME_STYLE[i.effectiveness.outcome] ?? 'secondary'} size="sm">{i.effectiveness.outcome}</Badge>
                  )}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-slate-400">
                  {i.studentIds?.length ?? 0} students · {i.issueType} · practice {i.practiceProgress ?? 0}/{i.practiceRequired ?? 8} · {i.retests ?? 0} re-test{i.retests === 1 ? '' : 's'}
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">Review →</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No interventions in this view</p>
        </div>
      )}

      <InterventionDetailDialog id={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  )
}

export { InterventionCenterTab, StudentInterventionsPanel }
export default InterventionCenterTab
