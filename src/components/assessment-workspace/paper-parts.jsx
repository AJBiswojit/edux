/**
 * MediXO EduX — Assessment Workspace · shared paper components (Phase 9 Backend-Ready).
 * No localStorage as source of truth. Shares via backend API only.
 *
 * PaperCard is a compact library card: View (primary) · Edit · Share · Delete.
 * PaperPreviewDialog is a read-first question-paper viewer that loads the
 * paper's real questions from the backend (AI papers via
 * /faculty/paper-generator/ai-paper/{id}; SQL papers carry questionList).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Eye, Pencil, Send, Trash2, Users, Sparkles, Loader2, AlertTriangle, FileText,
} from 'lucide-react'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, useToast } from '@/components/ui'
import { useAiPaperDetail, usePaperPublishBackend, usePaperShareBackend } from '@/services/faculty-papers'
import { useFacultyRoster } from '@/services'
import { paperSendReadiness } from '@/api/adapters/paper-send-readiness'
import { optionText } from '@/api/adapters/questions'
import { formatDate } from '@/utils/format'

export const STATUS_STYLES = { Ready: 'success', Draft: 'secondary', 'In Review': 'warning', Published: 'success' }
export const DIFF_STYLES = { Easy: 'success', Medium: 'warning', Hard: 'danger' }
export const MODE_STYLES = { University: 'info', Competitive: 'gradient' }

export function PaperStatusBadge({ status }) {
  return <Badge variant={STATUS_STYLES[status] ?? 'secondary'}>{status}</Badge>
}

/** Paper question count — authoritative numeric metadata from the paper payload. */
export function paperQuestionCount(paper) {
  return paper?.questions ?? paper?.selectedQuestionIds?.length ?? paper?.questionList?.length ?? 0
}

/**
 * Middle metadata row: question count · total marks · duration · domain.
 * Exam family is shown for Competitive papers only — University papers
 * never display competitive metadata.
 */
export function PaperMetaChips({ paper }) {
  const qCount = paperQuestionCount(paper)
  const domain = paper.domain ?? paper.mode
  return (
    <div className="mt-3.5 flex flex-wrap gap-2 text-[11px] font-medium text-slate-400">
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{qCount} questions</span>
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.totalMarks} marks</span>
      <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.duration} min</span>
      {domain && <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">{domain}</span>}
      {domain === 'Competitive' && paper.examFamily && (
        <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.examFamily}</span>
      )}
      {paper.examType && paper.examType !== 'AI Generated' && (
        <span className="rounded-full bg-slate-50 px-2.5 py-1 dark:bg-slate-800/60">{paper.examType}</span>
      )}
      {paper.retest && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Intervention re-test</span>}
    </div>
  )
}

/**
 * Paper Library card — one clear hierarchy, one compact action area.
 * Primary: View. Secondary: Edit · Share · Delete. Duplicate / versions /
 * DOCX / Print / Archive actions are intentionally absent from the card.
 */
export function PaperCard({ paper, index = 0, onView, onEdit, onDelete, onShare }) {
  const qCount = paperQuestionCount(paper)
  const send = paperSendReadiness(paper)
  const domain = paper.domain ?? paper.mode
  const isAiGenerated = paper.source === 'ai' || paper.examType === 'AI Generated' || paper.paperType === 'AI Generated'
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
                {paper.subject ?? paper.course ?? 'Question paper'}
                {domain === 'Competitive' && paper.examFamily && <span className="ml-1.5 text-slate-400">· {paper.examFamily}</span>}
              </p>
              <h3 className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{paper.title}</h3>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <PaperStatusBadge status={paper.status} />
            {isAiGenerated && (
              <Badge variant="gradient" size="sm" className="gap-1">
                <Sparkles className="h-3 w-3" /> AI Generated
              </Badge>
            )}
          </div>
        </div>

        <PaperMetaChips paper={paper} />

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-medium text-slate-400">
          <span>Created {formatDate(paper.created ?? paper.generated, 'MMM d, yyyy')}</span>
          <span>· Modified {formatDate(paper.modified ?? paper.generated, 'MMM d, yyyy')}</span>
          {paper.faculty && <span>· {paper.faculty}</span>}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
          {onView && (
            <Button size="sm" className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md shadow-indigo-500/25 hover:brightness-110" onClick={() => onView(paper)}>
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
          )}
          {onEdit ? (
            <Button size="sm" variant="outline" aria-label="Edit paper" onClick={() => onEdit(paper)}>
              <Pencil className="h-3.5 w-3.5" /><span className="hidden sm:inline">Edit</span>
            </Button>
          ) : null}
          {onShare && (
            <span className="inline-flex" title={send.canSend ? undefined : send.message}>
              <Button
                size="sm"
                variant="outline"
                disabled={!send.canSend}
                aria-label={send.canSend ? 'Share paper' : send.message}
                className="border-teal-300 text-teal-600 hover:bg-teal-50 dark:border-teal-500/40 dark:text-teal-300 dark:hover:bg-teal-500/10"
                onClick={() => { if (send.canSend) onShare(paper) }}
              >
                <Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">Share</span>
              </Button>
            </span>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" aria-label="Delete paper" className="h-8 w-8 shrink-0 px-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={() => onDelete(paper)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {onShare && !send.canSend && send.message && (
          <p className="mt-2 text-[10.5px] font-medium leading-relaxed text-slate-400">{send.message}</p>
        )}
      </Card>
    </motion.div>
  )
}

/** One option row for a viewer question — structured option records are
 *  resolved to human-readable text via the shared optionText adapter. */
function QuestionOption({ option, index, correct }) {
  const label = optionText(option)
  const key = (option && typeof option === 'object' && option.key) || String.fromCharCode(65 + index)
  const imageUrl = option && typeof option === 'object' ? option.imageUrl : null
  return (
    <div className={`rounded-lg border px-3 py-2 text-[12.5px] leading-relaxed ${correct ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'}`}>
      <span className="font-bold">{key}.</span> {label || '—'}
      {imageUrl && (
        <img src={imageUrl} alt={`Option ${key}`} className="mt-2 max-h-48 rounded-lg border border-slate-200 object-contain dark:border-slate-700" loading="lazy" />
      )}
    </div>
  )
}

/** True when the option's key matches the question's correct answer marker. */
function isCorrectOption(option, index, question) {
  const correct = question.correctOption ?? question.correctAnswer ?? question.answer
  if (correct == null || correct === '') return false
  const key = (option && typeof option === 'object' && option.key) || String.fromCharCode(65 + index)
  const token = String(correct).trim()
  return token.toUpperCase() === String(key).toUpperCase()
    || token === String(index)
    || (Number.isInteger(Number(token)) && Number(token) === index)
}

/**
 * A single question in the viewer — number, text, type/marks/difficulty
 * badges, options (structured records normalised), and — when the backend
 * provides them — the correct answer marker and explanation.
 */
function ViewerQuestion({ question, number }) {
  const options = Array.isArray(question.options) ? question.options : []
  const text = question.text ?? question.question ?? question.stem ?? ''
  const explanation = question.explanation ?? question.solution ?? null
  const showAnswers = options.some((o, i) => isCorrectOption(o, i, question)) || !!explanation
  return (
    <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-indigo-50 px-1.5 text-[11px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">Q{number}</span>
        {question.type && <Badge variant="secondary" size="sm">{question.type}</Badge>}
        {question.difficulty && <Badge variant={DIFF_STYLES[question.difficulty] ?? 'secondary'} size="sm">{question.difficulty}</Badge>}
        {question.chapter && <Badge variant="outline" size="sm">{question.chapter}{question.topic ? ` · ${question.topic}` : ''}</Badge>}
        {question.marks != null && <span className="ml-auto text-[11px] font-bold text-slate-400">{question.marks} marks</span>}
      </div>
      <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">{text}</p>
      {question.imageUrl && (
        <img src={question.imageUrl} alt="Question figure" className="mt-2 max-h-64 rounded-lg border border-slate-200 object-contain dark:border-slate-700" loading="lazy" />
      )}
      {options.length > 0 && (
        <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {options.map((o, oi) => <QuestionOption key={oi} option={o} index={oi} correct={showAnswers && isCorrectOption(o, oi, question)} />)}
        </div>
      )}
      {showAnswers && explanation && (
        <div className="mt-3 rounded-xl bg-indigo-50/60 p-3 text-[12px] leading-relaxed text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200">
          <span className="font-bold">Explanation:</span> {explanation}
        </div>
      )}
    </div>
  )
}

/**
 * Paper preview — a read-first viewer.
 *
 * Questions come from the first source that genuinely has them:
 *   1. SQL paper detail payload (paper.questionList)
 *   2. the AI-paper read-back endpoint (useAiPaperDetail) for ai_generated_papers
 * If the backend truly has zero question relationships for a paper that
 * reports a non-zero count, an honest data-inconsistency notice is shown —
 * never fabricated questions.
 */
export function PaperPreviewDialog({ open, onOpenChange, paper }) {
  const toast = useToast()
  const { mutateAsync: publishPaper, isPending: publishing } = usePaperPublishBackend()

  const aiDetail = useAiPaperDetail(open && paper?.source === 'ai' ? paper.id : null)

  const embeddedQuestions = Array.isArray(paper?.questionList) ? paper.questionList : []
  const fetchedQuestions = Array.isArray(aiDetail.data?.questions) ? aiDetail.data.questions : []
  const questions = embeddedQuestions.length > 0 ? embeddedQuestions : fetchedQuestions

  const detailLoading = open && paper?.source === 'ai' && aiDetail.isLoading
  const detailError = open && paper?.source === 'ai' && aiDetail.isError
  const selectedIds = Array.isArray(paper?.selectedQuestionIds) ? paper.selectedQuestionIds : []
  const reportedCount = paperQuestionCount(paper)
  const hasQuestions = questions.length > 0
  const qCount = hasQuestions ? questions.length : reportedCount
  const inconsistent = open && !detailLoading && !detailError && !hasQuestions && reportedCount > 0 && paper?.source !== 'ai'
  const aiInconsistent = open && paper?.source === 'ai' && !detailLoading && !detailError && !hasQuestions && reportedCount > 0

  const schemeByType = {}
  questions.forEach((q) => {
    const t = q.type ?? 'Question'
    const m = q.marks ?? 0
    if (!schemeByType[t]) schemeByType[t] = { marks: m, count: 0 }
    schemeByType[t].count += 1
    schemeByType[t].marks = m
  })
  const markingScheme = Object.entries(schemeByType).map(([type, s]) => ({ type, marks: s.marks, count: s.count }))

  const paperId = paper?.paperCode ?? paper?.id
  const domain = paper?.domain ?? paper?.mode ?? 'University'
  // Publish goes through the SQL paper lifecycle
  // (/papers/{id}/publish); ai_generated_papers are read-only records owned
  // by the AI service and are published via Share when ready.
  const canPublish = !!paper?.id && paper?.source !== 'ai' && paper?.status !== 'Published'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
            <FileText className="h-5 w-5 shrink-0 text-indigo-500" />
            <span className="min-w-0 break-words">{paper?.title}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5">
            <PaperStatusBadge status={paper?.status} />
            <Badge variant={MODE_STYLES[domain] ?? 'secondary'} size="sm">{domain}</Badge>
            {domain === 'Competitive' && paper?.examFamily && <Badge variant="outline" size="sm">{paper.examFamily}</Badge>}
            {paper?.subject && <Badge variant="outline" size="sm">{paper.subject}</Badge>}
          </DialogDescription>
        </DialogHeader>

        {/* Summary: total marks · duration · question count · created */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 p-3.5 text-center sm:grid-cols-4 dark:border-slate-800">
          <div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{paper?.totalMarks ?? '—'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total marks</p>
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{paper?.duration ?? '—'} min</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duration</p>
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{qCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Questions</p>
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">{formatDate(paper?.created ?? paper?.generated, 'MMM d, yyyy')}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</p>
          </div>
        </div>

        {/* Question area — scrollable, separated, readable */}
        <div className="max-h-[48vh] space-y-3 overflow-y-auto rounded-2xl pr-1">
          {detailLoading && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 p-8 text-[12.5px] text-slate-400 dark:border-slate-800">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
            </div>
          )}
          {detailError && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-[12px] text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>The questions for this paper could not be loaded. Please try opening the paper again.</span>
            </div>
          )}
          {!detailLoading && hasQuestions && questions.map((q, qi) => (
            <ViewerQuestion key={q.id ?? qi} question={q} number={q.no ?? qi + 1} />
          ))}
          {!detailLoading && !detailError && !hasQuestions && selectedIds.length > 0 && (
            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Question details are not available for this paper yet</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedIds.slice(0, 20).map((id) => <Badge key={id} variant="outline" size="sm">{id}</Badge>)}
                {selectedIds.length > 20 && <Badge variant="secondary" size="sm">+{selectedIds.length - 20} more</Badge>}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">These are the questions included in the paper.</p>
            </div>
          )}
          {(inconsistent || aiInconsistent) && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-[12px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This paper reports {reportedCount} question{reportedCount === 1 ? '' : 's'}, but no question records are linked to it yet.
                The paper metadata and its question list are out of sync — regenerate or re-save the paper to restore its questions.
              </span>
            </div>
          )}
          {!detailLoading && !detailError && !hasQuestions && selectedIds.length === 0 && reportedCount === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No questions in this paper yet.</p>
              <p className="mt-1 text-xs text-slate-400">Select questions from the question bank when editing this paper.</p>
            </div>
          )}
        </div>

        {markingScheme.length > 0 && (
          <div className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Marking scheme (derived from questions)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {markingScheme.slice(0, 6).map((m) => <Badge key={m.type} variant="outline" size="sm">{m.type}: {m.count} × {m.marks} marks</Badge>)}
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {paperId && <Badge variant="gradient" size="sm">{paperId}</Badge>}
          {canPublish && (
            <Button
              disabled={publishing || !hasQuestions}
              onClick={async () => {
                try {
                  await publishPaper(paper.id)
                  toast.success('Published', `${paper?.title} is now available to students.`)
                  onOpenChange?.(false)
                } catch (e) {
                  toast.error('Could not publish', e?.response?.data?.detail ?? e?.message ?? 'Could not publish this paper.')
                }
              }}
            ><Send className="h-4 w-4" /> {publishing ? 'Publishing…' : 'Publish'}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* Paper preview while building — selected live questions (ID-based builder). */
export function PaperPrintPreview({ paper, open, onOpenChange }) {
  if (!paper) return null
  const questionList = Array.isArray(paper?.questionList) ? paper.questionList : []
  const selectedIds = paper?.selectedQuestionIds ?? []
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-500" /> Paper preview</DialogTitle>
          <DialogDescription>Review the selected questions before saving.</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
          <p className="text-center text-[15px] font-bold">{paper.title}</p>
          <p className="mt-1 text-center text-[11px] text-slate-500">{paper.domain ?? paper.mode} · {paper.totalMarks} marks · {paper.duration} min · {selectedIds.length || questionList.length} questions</p>
          <div className="mt-4 space-y-2">
            {questionList.length > 0
              ? questionList.map((q, i) => (
                <div key={q.id ?? i} className="text-[12px]">
                  <p className="leading-relaxed"><span className="font-bold">{i + 1}.</span> {q.text ?? q.question} [{q.marks} marks]</p>
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="mt-1 grid gap-1 pl-5 sm:grid-cols-2">
                      {q.options.map((o, oi) => <span key={oi} className="text-slate-600 dark:text-slate-300">({String.fromCharCode(65 + oi)}) {optionText(o)}</span>)}
                    </div>
                  )}
                </div>
              ))
              : selectedIds.map((id, i) => <p key={id} className="text-[12px]"><span className="font-bold">{i + 1}.</span> {id}</p>)}
            {questionList.length === 0 && selectedIds.length === 0 && <p className="text-[11px] text-slate-400">No questions selected.</p>}
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PaperDeleteDialog({ open, onOpenChange, paper, onConfirm, deleting = false }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !deleting && onOpenChange?.(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-rose-500" /> Delete generated paper?</DialogTitle>
          <DialogDescription>This permanently removes <span className="font-bold text-slate-700 dark:text-slate-200">{paper?.title}</span>.</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-[12px] leading-relaxed text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300">
          {paperQuestionCount(paper)} questions · {paper?.totalMarks} marks · {paper?.duration} min · created {formatDate(paper?.created ?? paper?.generated, 'MMM d, yyyy')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete permanently'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* Share dialog — backend only, no localStorage */
export function SharePaperDialog({ paper, open, onOpenChange }) {
  const toast = useToast()
  const { data: rosterData } = useFacultyRoster()
  const { mutateAsync: sharePaper } = usePaperShareBackend()
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
      if (res?.ok || res?.share) {
        toast.success('Paper shared', `"${paper.title}" shared to ${audience === 'Entire class' ? 'entire class' : `${selected.length} students`}.`)
        onOpenChange(false)
        setMessage('')
        setSelected([])
      }
    } catch (e) {
      const isBackendDown = !e?.response || e?.response?.status >= 500
      if (isBackendDown) {
        toast.error('Could not share', 'Sharing is temporarily unavailable. Please try again later.')
      } else {
        toast.error('Could not share', e?.response?.data?.detail ?? e?.response?.data?.message ?? 'Please try again.')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-teal-500" /> Share paper</DialogTitle>
          <DialogDescription>{paper?.title} · {paper?.domain ?? paper?.mode ?? 'University'} · {paper?.totalMarks} marks.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Audience</p>
            <div className="flex flex-wrap gap-1.5">
              {['Entire class', 'Selected students', 'Batch', 'Course group'].map((a) => (
                <button key={a} onClick={() => setAudience(a)} className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-all ${audience === a ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25' : 'border border-slate-200 text-slate-500 hover:border-teal-300 dark:border-slate-700 dark:text-slate-400'}`}>{a}</button>
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
                  <button key={r.id} onClick={() => toggle(r.name)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[12px] font-semibold transition-all ${selected.includes(r.name) ? 'border-teal-300 bg-teal-50/60 text-teal-700 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300' : 'border-slate-100 text-slate-600 hover:border-teal-200 dark:border-slate-800 dark:text-slate-300'}`}>
                    <Users className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{r.name}</span><span className="ml-auto text-[10px] text-slate-400">{r.roll}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Optional message</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="e.g. Attempt this paper before Friday — answers will be discussed in class." className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm shadow-sm outline-none transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100" />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleShare} disabled={sharing || !paperSendReadiness(paper).canSend} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:brightness-110">{sharing ? 'Sharing…' : <><Send className="h-4 w-4" /> Share</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
