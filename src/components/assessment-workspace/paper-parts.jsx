/**
 * MediXO EduX — Assessment Workspace · shared paper components.
 * Single source for paper cards, status badges, preview / delete dialogs —
 * reused by the standalone AI Question Paper Generator page and the
 * Assessment Intelligence Workspace tabs (generator + paper library).
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, CheckCircle2, Copy, Download, FileText, Pencil, Printer, Shuffle,
  Send, Trash2, History, RefreshCw, Archive, Users,
} from 'lucide-react'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, Select, SelectItem, useToast } from '@/components/ui'
import { usePaperShare } from '@/services/extra'
import { useFacultyRoster } from '@/services'
import { formatDate } from '@/utils/format'

export const STATUS_STYLES = { Ready: 'success', Draft: 'secondary', 'In Review': 'warning' }
export const DIFF_STYLES = { Easy: 'success', Medium: 'warning', Hard: 'danger' }
export const MODE_STYLES = { University: 'info', Competitive: 'gradient' }

/* ---------- Status badge ---------- */
export function PaperStatusBadge({ status }) {
  return <Badge variant={STATUS_STYLES[status] ?? 'secondary'}>{status}</Badge>
}

/* ---------- Paper meta chips ---------- */
export function PaperMetaChips({ paper }) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.questions} questions</span>
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.totalMarks} marks</span>
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.duration} min</span>
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">CO coverage {paper.coverage}%</span>
      {paper.examType && <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.examType}</span>}
      {paper.retest && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Intervention re-test</span>}
      {paper.sets > 1 && <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{paper.sets} sets</span>}
    </div>
  )
}

/* ---------- Paper card (full management) ---------- */
export function PaperCard({
  paper, index = 0,
  onView, onEdit, onDuplicate, onDelete,
  onRegenerate, onArchive, onVersions, onShare,
}) {
  const toast = useToast()
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className={`group h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift ${paper.archived ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-md shadow-indigo-500/25">
              <BookOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                {paper.course} · {paper.id}
                {paper.mode && <span className="ml-1.5 text-slate-400">· {paper.mode}</span>}
              </p>
              <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{paper.title}</h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PaperStatusBadge status={paper.status} />
            {paper.examType && <Badge variant={MODE_STYLES[paper.mode] ?? 'secondary'} size="sm">{paper.examType}</Badge>}
          </div>
        </div>

        <PaperMetaChips paper={paper} />

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] font-medium text-slate-400">
          <span>Created {formatDate(paper.created ?? paper.generated, 'MMM d, yyyy')}</span>
          <span>· Modified {formatDate(paper.modified ?? paper.generated, 'MMM d, yyyy')}</span>
          <span>· {paper.faculty ?? 'Dr. Meera Krishnan'}</span>
          <span>· {paper.downloads ?? 0} export{paper.downloads === 1 ? '' : 's'}</span>
        </div>

        {/* Primary actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {onView && (
            <Button size="sm" className="flex-1" onClick={() => onView(paper)}>View</Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(paper)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
          {onDuplicate && (
            <Button size="sm" variant="outline" onClick={() => onDuplicate(paper)}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
          )}
          {onRegenerate && (
            <Button size="sm" variant="outline" onClick={() => onRegenerate(paper)}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          )}
          {onVersions && (
            <Button size="sm" variant="outline" onClick={() => onVersions(paper)}>
              <History className="h-3.5 w-3.5" /> v{paper.versions ?? 1}
            </Button>
          )}
          {onShare && (
            <Button size="sm" variant="outline" className="border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500/40 dark:text-teal-300 dark:hover:bg-teal-500/10" onClick={() => onShare(paper)}>
              <Send className="h-3.5 w-3.5" /> Share
            </Button>
          )}
        </div>

        {/* Export + lifecycle actions */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800 sm:grid-cols-4">
          <Button size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => toast.success('Exporting…', `${paper.title} exported as PDF.`)}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => toast.success('Exporting…', `${paper.title} exported as DOCX.`)}>
            <FileText className="h-3.5 w-3.5" /> DOCX
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => toast.success('Printing…', `${paper.title} sent to print.`)}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <div className="flex min-w-0 gap-1">
            {onArchive && (
              <Button size="sm" variant="ghost" className="h-8 min-w-0 flex-1 truncate px-2 text-[11px] text-slate-400" onClick={() => onArchive(paper)}>
                <Archive className="h-3.5 w-3.5 shrink-0" /> {paper.archived ? 'Restore' : 'Archive'}
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="h-8 w-8 shrink-0 px-0 text-[11px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={() => onDelete(paper)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/* ---------- Paper preview dialog ----------
   Renders the SELECTED paper ONLY: questions come from `paper.questionList`
   (each paper owns its own list — never a shared/global template). The
   marking scheme and answer key are DERIVED from that same list, so the
   preview can never show another paper's content. */
export function PaperPreviewDialog({ open, onOpenChange, paper, onPublish }) {
  const toast = useToast()
  const questions = Array.isArray(paper?.questionList) ? paper.questionList : []
  const hasQuestions = questions.length > 0

  /* marking scheme derived from the paper's own questions */
  const schemeByType = {}
  questions.forEach((q) => {
    const t = q.type ?? 'Question'
    const m = q.marks ?? 0
    if (!schemeByType[t]) schemeByType[t] = { marks: m, count: 0 }
    schemeByType[t].count += 1
    schemeByType[t].marks = m
  })
  const negative = /−1|negative/i.test(paper?.negativeMarking ?? '') ? 1 : 0
  const markingScheme = Object.entries(schemeByType).map(([type, s]) => ({ type, marks: s.marks, negative, count: s.count }))

  /* answer key derived from the paper's own questions */
  const answerKey = questions.map((q, i) => ({
    q: i + 1,
    id: q.id,
    type: q.type ?? 'Question',
    answer: `${q.answer ?? '—'}${q.options?.length && /^[A-D]$/i.test(String(q.answer)) ? ` — ${q.options[String(q.answer).charCodeAt(0) - 65] ?? ''}` : ''}`,
  }))

  const paperId = paper?.paperCode ?? paper?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" /> {paper?.title}
          </DialogTitle>
          <DialogDescription>
            {paper?.course ? `${paper.course} · ` : ''}{paper?.totalMarks} marks · {paper?.duration} min · {questions.length || paper?.questions || 0} questions · created {formatDate(paper?.created ?? paper?.generated, 'MMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>
        {/* Paper identity — always visible so the correct paper is unmistakable */}
        <div className="-mt-1 mb-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="gradient" size="sm">{paperId}</Badge>
          <Badge variant={MODE_STYLES[paper?.mode] ?? 'secondary'} size="sm">{paper?.mode ?? 'University'}</Badge>
          {paper?.exam && <Badge variant="outline" size="sm">{paper.exam}</Badge>}
          {paper?.subject && <Badge variant="outline" size="sm">{paper.subject}</Badge>}
          {paper?.examType && <Badge variant="outline" size="sm">{paper.examType}</Badge>}
          {paper?.paperType && paper?.paperType !== paper?.examType && <Badge variant="outline" size="sm">{paper.paperType}</Badge>}
        </div>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto scrollbar-thin pr-1">
          {hasQuestions ? questions.map((q, qi) => (
            <div key={q.id ?? qi} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{q.no ?? qi + 1}</span>
                <Badge variant="secondary" size="sm">{q.type}</Badge>
                <Badge variant={DIFF_STYLES[q.difficulty]} size="sm">{q.difficulty}</Badge>
                <Badge variant="outline" size="sm">{q.bloom}</Badge>
                {q.chapter && <Badge variant="outline" size="sm">{q.chapter}{q.topic ? ` · ${q.topic}` : ''}</Badge>}
                {q.isPyq && <Badge variant="warning" size="sm">PYQ{q.pyqYear ? ` ${q.pyqYear}` : ''}</Badge>}
                <span className="ml-auto text-[11px] font-bold text-slate-400">{q.marks} marks</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{q.text}</p>
              {q.options?.length > 0 && (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <span key={oi} className="rounded-lg bg-slate-50 px-3 py-1.5 text-[12px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">({String.fromCharCode(65 + oi)}) {o}</span>
                  ))}
                </div>
              )}
            </div>
          )) : (
            <p className="py-8 text-center text-xs text-slate-400">No questions stored for this paper yet — open it in the Question Paper Studio to add questions.</p>
          )}
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Marking scheme</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {markingScheme.slice(0, 6).map((m) => (
                <Badge key={m.type} variant="outline" size="sm">{m.type}: +{m.marks}/−{m.negative}</Badge>
              ))}
              {markingScheme.length === 0 && <span className="text-[11px] text-slate-400">—</span>}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Answer key</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {answerKey.length} answers included · derived from this paper's questions.
            </p>
            {answerKey.length > 0 && (
              <div className="mt-1.5 max-h-24 space-y-0.5 overflow-y-auto scrollbar-thin rounded-xl bg-slate-50 p-2 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                {answerKey.slice(0, 12).map((a) => (
                  <p key={a.q}><span className="font-bold text-slate-600 dark:text-slate-300">Q{a.q}</span> ({a.type}) · {a.answer}</p>
                ))}
                {answerKey.length > 12 && <p className="text-[10px] text-slate-400">… and {answerKey.length - 12} more</p>}
              </div>
            )}
            <Button size="sm" variant="ghost" className="mt-1 p-0 text-indigo-600 dark:text-indigo-300" onClick={() => toast.success('Answer key', 'Answer key downloaded as PDF.')}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Download answer key
            </Button>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success('Exporting…', 'Paper exported as PDF.')}><Download className="h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={() => toast.success('Exporting…', 'Paper exported as DOCX.')}><FileText className="h-4 w-4" /> DOCX</Button>
          <Button variant="outline" onClick={() => toast.success('Printing…', 'Paper sent to print.')}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={() => toast.success('Shuffled', 'Question order randomised.')}><Shuffle className="h-4 w-4" /> Shuffle</Button>
          <Button onClick={() => { if (onPublish) onPublish(); else toast.success('Published 🎉', `${paper?.title} published to students.`) }}><Send className="h-4 w-4" /> Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Delete confirmation dialog ---------- */
export function PaperDeleteDialog({ open, onOpenChange, paper, onConfirm, deleting = false }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !deleting && onOpenChange?.(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" /> Delete generated paper?
          </DialogTitle>
          <DialogDescription>
            This permanently removes <span className="font-bold text-slate-700 dark:text-slate-200">{paper?.title}</span> ({paper?.id}) from your papers. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-[12px] leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300">
          {paper?.questions} questions · {paper?.totalMarks} marks · {paper?.duration} min · created {formatDate(paper?.created ?? paper?.generated, 'MMM d, yyyy')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Delete permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PaperCard


/* ---------- Share paper dialog (Phase 29) ----------
   Prototype sharing to students: audience selection (Entire class / Selected
   students / Batch / Course group) with recipient multi-picks from the
   faculty roster, optional message, then a persisted share record. Clearly
   labelled prototype behavior — no real notification is delivered. */
export function SharePaperDialog({ paper, open, onOpenChange, onShared }) {
  const toast = useToast()
  const { data: rosterData } = useFacultyRoster()
  const { mutateAsync: sharePaper } = usePaperShare()
  const [audience, setAudience] = useState('Entire class')
  const [selected, setSelected] = useState([])
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)

  const roster = rosterData?.students ?? rosterData?.items ?? []
  const toggle = (name) => setSelected((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))
  const selectAll = () => setSelected((prev) => (prev.length === roster.length ? [] : roster.map((r) => r.name)))

  const handleShare = async () => {
    if (audience !== 'Entire class' && selected.length === 0) {
      toast.error('Choose recipients', 'Select at least one student, or switch to "Entire class".')
      return
    }
    setSharing(true)
    try {
      const res = await sharePaper({
        id: paper.id,
        payload: { audience, recipients: audience === 'Entire class' ? roster.map((r) => r.name) : selected, message },
      })
      if (res?.ok) {
        toast.success('Paper shared successfully', `"${paper.title}" sent to ${audience === 'Entire class' ? 'the entire class' : `${selected.length} students`} (prototype).`)
        onShared?.(res.share)
        onOpenChange(false)
        setMessage('')
      }
    } catch {
      toast.error('Could not share', 'Please try again.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-teal-500" /> Share paper to students</DialogTitle>
          <DialogDescription>{paper?.title} · {paper?.mode ?? 'University'} · {paper?.totalMarks} marks · prototype sharing (no real notification is delivered).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {['Entire class', 'Selected students', 'Batch', 'Course group'].map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-all ${audience === a ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25' : 'border border-slate-200 text-slate-500 hover:border-teal-300 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {audience !== 'Entire class' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recipients ({selected.length})</p>
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={selectAll}>{selected.length === roster.length ? 'Clear all' : 'Select all'}</Button>
              </div>
              <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto scrollbar-thin sm:grid-cols-2">
                {roster.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.name)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[12px] font-semibold transition-all ${selected.includes(r.name) ? 'border-teal-300 bg-teal-50/60 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300' : 'border-slate-100 text-slate-600 hover:border-teal-200 dark:border-slate-800 dark:text-slate-300'}`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{r.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{r.roll}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Optional message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="e.g. Attempt this paper before Friday — answers will be discussed in class."
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm shadow-sm outline-none transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
            />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleShare} disabled={sharing} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:brightness-110">
            {sharing ? 'Sharing…' : (<><Send className="h-4 w-4" /> Share paper</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
/* ================================================================== */
/* Question Paper Studio — review components (Phase 30)               */
/* ================================================================== */

/* ---------- Question Edit dialog ----------
   Frontend-only editing of a generated paper's question (in-memory state;
   NOT persisted to a backend — the brief is explicit). */
export function QuestionEditDialog({ question, open, onOpenChange, onSave, isUniversity }) {
  const [draft, setDraft] = useState(null)
  useEffect(() => { if (question) setDraft({ ...question }) }, [question])
  const toast = useToast()
  if (!draft) return null
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const save = () => {
    if (!draft.text?.trim()) { toast.error('Question text required', 'Add the question before saving.'); return }
    onSave?.(draft)
    toast.success('Question updated', 'The paper review now reflects your edit (in-memory).')
    onOpenChange(false)
  }
  const optionInput = (i) => (
    <Input
      value={draft.options?.[i] ?? ''}
      onChange={(e) => {
        const opts = [...(draft.options ?? ['', '', '', ''])]
        opts[i] = e.target.value
        set('options', opts)
      }}
      placeholder={`Option ${String.fromCharCode(65 + i)}`}
      className="h-9 text-sm"
    />
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5 text-indigo-500" /> Edit question</DialogTitle>
          <DialogDescription>Update the question for this generated paper — changes apply to the current in-memory paper only (prototype).</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Question text" required>
            <textarea
              value={draft.text}
              onChange={(e) => set('text', e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm shadow-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
            />
          </Field>
          {draft.options?.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  {optionInput(i)}
                  <Button
                    size="sm"
                    variant={draft.answer === String.fromCharCode(65 + i) ? 'default' : 'outline'}
                    className={draft.answer === String.fromCharCode(65 + i) ? 'shrink-0 bg-emerald-600 hover:bg-emerald-700' : 'shrink-0'}
                    onClick={() => set('answer', String.fromCharCode(65 + i))}
                  >
                    {draft.answer === String.fromCharCode(65 + i) ? 'Answer ✓' : 'Answer'}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Marks"><Input type="number" min={1} value={String(draft.marks ?? 2)} onChange={(e) => set('marks', Number(e.target.value) || 2)} /></Field>
            <Field label="Difficulty">
              <Select value={draft.difficulty ?? 'Medium'} onValueChange={(v) => set('difficulty', v)}>
                {['Easy', 'Medium', 'Hard'].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={draft.type ?? 'MCQ'} onValueChange={(v) => set('type', v)}>
                {['MCQ', 'Assertion Reason', 'Case Based', 'Integer', 'Numerical', 'Short Answer', 'Long Answer', 'Subjective'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Chapter"><Input value={draft.chapter ?? ''} onChange={(e) => set('chapter', e.target.value)} /></Field>
            <Field label="Topic"><Input value={draft.topic ?? ''} onChange={(e) => set('topic', e.target.value)} /></Field>
            {isUniversity && (
              <>
                <Field label="CO">
                  <Select value={draft.co ?? 'CO1'} onValueChange={(v) => set('co', v)}>
                    {['CO1', 'CO2', 'CO3', 'CO4'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </Select>
                </Field>
                <Field label="Bloom level">
                  <Select value={draft.bloom ?? 'Understand'} onValueChange={(v) => set('bloom', v)}>
                    {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </Select>
                </Field>
              </>
            )}
            {draft.isPyq && <Field label="PYQ"><Input value={`${draft.pyqYear ?? ''}${draft.isPyq ? ' · PYQ' : ''}`} disabled /></Field>}
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}><CheckCircle2 className="h-4 w-4" /> Save question</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Question Replace dialog ----------
   Finds alternative questions from the SAME foundation matching the
   current question's constraints (subject/chapter/difficulty/type/PYQ). */
export function QuestionReplaceDialog({ question, pool, open, onOpenChange, onUse }) {
  const toast = useToast()
  if (!question) return null
  const alternatives = (pool ?? [])
    .filter((q) => q.id !== question.id)
    .filter((q) => {
      if (question.subject && q.subject !== question.subject) return false
      if (question.chapter && q.chapter !== question.chapter) return false
      if (question.difficulty && q.difficulty !== question.difficulty) return false
      if (question.type && q.type !== question.type && q.questionType !== question.type) return false
      return true
    })
    .slice(0, 3)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-indigo-500" /> Replace question</DialogTitle>
          <DialogDescription>Alternatives satisfying the current constraints (subject · chapter · difficulty · type) from the question foundation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {alternatives.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No alternative questions match these constraints</p>
              <p className="mt-1 text-xs text-slate-400">Broaden the difficulty or type to see more options.</p>
            </div>
          )}
          {alternatives.map((alt, i) => (
            <div key={alt.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={DIFF_STYLES[alt.difficulty] ?? 'secondary'} size="sm">{alt.difficulty}</Badge>
                <Badge variant="secondary" size="sm">{alt.chapter}</Badge>
                <Badge variant="outline" size="sm">{alt.topic ?? alt.chapter}</Badge>
                {alt.isPyq && <Badge variant="warning" size="sm">PYQ {alt.year ?? ''}</Badge>}
                {alt.questionType && <Badge variant="secondary" size="sm">{alt.questionType}</Badge>}
              </div>
              <p className="mt-2 line-clamp-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100">{alt.question ?? alt.text}</p>
              <Button size="sm" className="mt-3" onClick={() => { onUse?.(alt); toast.success('Question replaced', 'The review now uses the alternative question.'); onOpenChange(false) }}>
                Use this question
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Paper Quality panel ----------
   All metrics derived from the ACTUAL generated questions (never hardcoded). */
export function PaperQualityPanel({ questions, planned, scopeChapters = [] }) {
  const n = questions.length
  if (!n) return null
  const byDiff = {}
  questions.forEach((q) => { byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1 })
  const pct = (k) => Math.round(((byDiff[k] ?? 0) / n) * 100)
  const actual = [pct('Easy'), pct('Medium'), pct('Hard')]
  const plannedArr = planned ?? [30, 50, 20]
  const diffOk = actual.every((v, i) => Math.abs(v - plannedArr[i]) <= 15)

  const chapters = [...new Set(questions.map((q) => q.chapter).filter(Boolean))]
  const chapterCoverage = scopeChapters.length ? Math.round((chapters.filter((c) => scopeChapters.includes(c)).length / scopeChapters.length) * 100) : (chapters.length ? 100 : 0)

  const cos = [...new Set(questions.map((q) => q.co).filter(Boolean))]
  const coCoverage = cos.length ? Math.round((cos.length / 4) * 100) : 0

  const blooms = [...new Set(questions.map((q) => q.bloom).filter(Boolean))]
  const bloomCoverage = blooms.length ? Math.round((blooms.length / 6) * 100) : 0

  const pyqCount = questions.filter((q) => q.isPyq).length
  const pyqCoverage = Math.round((pyqCount / n) * 100)

  const typeDist = {}
  questions.forEach((q) => { const t = q.type ?? q.questionType ?? 'Question'; typeDist[t] = (typeDist[t] ?? 0) + 1 })

  const row = (label, ok, value, detail) => (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
        <CheckCircle2 className={`h-3.5 w-3.5 ${ok ? 'text-emerald-500' : 'text-amber-500'}`} /> {label}
      </p>
      <p className="text-right">
        <span className="block text-[12px] font-bold text-slate-800 dark:text-slate-100">{value}</span>
        {detail && <span className="block text-[9.5px] text-slate-400">{detail}</span>}
      </p>
    </div>
  )

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-white">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Paper Quality
      </p>
      <p className="mt-0.5 text-[11px] text-slate-400">Derived live from the {n} questions in this paper.</p>
      <div className="mt-3 space-y-1.5">
        {row('Difficulty', diffOk, `${actual.join(' / ')}`, `planned ${plannedArr.join(' / ')}`)}
        {row('Chapter coverage', chapterCoverage >= 80, `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}${scopeChapters.length ? ` / ${scopeChapters.length}` : ''}`, scopeChapters.length ? `${chapterCoverage}% of scope` : 'all in scope')}
        {row('CO coverage', coCoverage >= 75, coCoverage ? `${coCoverage}%` : '—', cos.length ? cos.join(' · ') : 'university papers only')}
        {row('Bloom coverage', bloomCoverage >= 50, bloomCoverage ? `${bloomCoverage}%` : '—', blooms.length ? blooms.join(' · ') : 'university papers only')}
        {row('PYQ coverage', true, `${pyqCoverage}%`, `${pyqCount} of ${n} questions from PYQ records`)}
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Question types</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {Object.entries(typeDist).map(([t, c]) => <Badge key={t} variant="secondary" size="sm">{t} ×{c}</Badge>)}
        </div>
      </div>
    </div>
  )
}

/* ---------- Print / Preview dialog ----------
   Exam-paper style preview (institution header, instructions, sections by
   type) + a Print action (browser print — no fake PDF). */
export function PaperPrintPreview({ paper, open, onOpenChange }) {
  if (!paper) return null
  const questionList = Array.isArray(paper?.questionList) ? paper.questionList : Array.isArray(paper?.questions) ? paper.questions : []
  const sections = {}
  questionList.forEach((q) => {
    const t = q.type ?? q.questionType ?? 'Question'
    sections[t] = sections[t] ?? []
    sections[t].push(q)
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Printer className="h-5 w-5 text-indigo-500" /> Paper preview</DialogTitle>
          <DialogDescription>Exam-style preview — use the browser Print dialog (prototype; no PDF is generated).</DialogDescription>
        </DialogHeader>
        <div id="paper-print-area" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
          <div className="border-b-2 border-slate-900 pb-4 text-center dark:border-slate-100">
            <p className="text-[15px] font-bold tracking-wide">{paper.institution ?? 'Meridian Institute of Technology'}</p>
            <p className="mt-1 text-[13px] font-bold uppercase tracking-widest">{paper.paperType ?? paper.examType ?? 'Examination'}</p>
            <p className="mt-1 text-[12px] font-semibold">{paper.subject ?? paper.course ?? ''}{paper.mode === 'Competitive' && paper.exam ? ` · ${paper.exam}` : ''}</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {paper.mode === 'University' ? `${paper.program ?? 'B.Tech — CSE'} · Semester ${paper.semester ?? '5'}` : `${paper.exam ?? ''} · ${paper.paperType ?? ''}`} · Duration: {paper.duration} minutes · Maximum Marks: {paper.totalMarks}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Instructions</p>
            <ul className="mt-1.5 grid gap-1 text-[11.5px] text-slate-600 dark:text-slate-300 sm:grid-cols-2">
              {(paper.instructions ?? ['Answer all required questions.', 'Read each question carefully.']).map((ins) => <li key={ins} className="flex items-start gap-1.5">• {ins}</li>)}
            </ul>
          </div>
          {Object.entries(sections).map(([type, qs]) => (
            <div key={type} className="mt-5">
              <p className="border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:border-slate-700">Section · {type} ({qs.length})</p>
              <div className="mt-2 space-y-3">
                {qs.map((q, i) => (
                  <div key={q.id} className="text-[12.5px] leading-relaxed">
                    <p><span className="font-bold">{i + 1}.</span> {q.text} <span className="text-slate-400">[{q.marks} marks]</span></p>
                    {q.options?.length && (
                      <div className="mt-1 grid gap-0.5 sm:grid-cols-2">
                        {q.options.map((opt, j) => <p key={j} className="text-[11.5px] text-slate-600 dark:text-slate-300">{String.fromCharCode(65 + j)}. {opt}</p>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-6 border-t border-slate-200 pt-3 text-center text-[10.5px] text-slate-400 dark:border-slate-700">— End of paper — · Demo-generated paper (prototype)</p>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Share history (Phase 30) ----------
   Shows prototype share records for a paper from localStorage — never
   invents delivery/read statuses. */
export function ShareHistoryList({ paperId }) {
  const [shares, setShares] = useState([])
  useEffect(() => {
    try {
      const all = JSON.parse(window.localStorage.getItem('aurora_faculty_paper_shares') || '[]')
      setShares(all.filter((s) => s.paperId === paperId).slice(0, 4))
    } catch { setShares([]) }
  }, [paperId])
  if (!shares.length) return null
  return (
    <div className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Share history</p>
      <div className="mt-2 space-y-2">
        {shares.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11.5px] dark:bg-slate-800/60">
            <p className="font-semibold text-slate-600 dark:text-slate-300">Shared with: <span className="font-bold text-slate-800 dark:text-slate-100">{s.audience}</span></p>
            <p className="text-slate-400">Students: <span className="font-bold text-slate-700 dark:text-slate-200">{s.recipients?.length ?? 0}</span></p>
            <p className="text-slate-400">Shared: <span className="font-semibold">{s.sharedAt ? new Date(s.sharedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</span></p>
            <Badge variant="secondary" size="sm">Prototype shared</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
