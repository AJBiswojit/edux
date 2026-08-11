/**
 * Faculty — Student Profile · Question evidence / detail / intervention.
 * EvidenceQuestionCard · QuestionDetailDialog · InterventionRecommendationCard.
 * These operate at the individual-question level (canonical attempt rows) and
 * are reused by the Chapter Intelligence and Question Analysis panels.
 */
import { Link } from 'react-router-dom'
import { BookOpen, BrainCircuit, CheckCircle2, Target, X } from 'lucide-react'
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import {
  resolveEvidenceQuestions,
  generateAiObservation,
  generateWhyFlagged,
} from '@/intelligence/faculty/engine/ground-level-intelligence'

function EvidenceQuestionCard({ row, allRows }) {
  const LETTERS = ['A', 'B', 'C', 'D']
  const evidence = resolveEvidenceQuestions([row])[0]
  const whyFlags = generateWhyFlagged(evidence, allRows)

  return (
    <div className="rounded-2xl border border-slate-200/70 p-3.5 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={row.status === 'Correct' ? 'success' : row.status === 'Incorrect' ? 'danger' : 'warning'} size="sm">{row.status}</Badge>
        <Badge variant="outline" size="sm">{row.difficulty ?? 'Medium'}</Badge>
        <Badge variant="secondary" size="sm">{row.type ?? 'MCQ'}</Badge>
        {row.id && <Badge variant="secondary" size="sm">{row.id}</Badge>}
        <span className="ml-auto text-[10px] font-medium text-slate-400">{row.examName} · {row.date}</span>
      </div>
      {row.text && <p className="mt-2 text-[12px] leading-relaxed text-slate-700 dark:text-slate-200">{row.text}</p>}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px]">
        <span className="text-slate-500">Student answer: <span className="font-bold text-slate-700 dark:text-slate-200">{typeof row.selected === 'number' ? LETTERS[row.selected] : row.selected ?? '—'}</span></span>
        <span className="text-slate-500">Correct answer: <span className="font-bold text-emerald-600">{typeof row.correctAnswer === 'number' ? LETTERS[row.correctAnswer] : row.correctAnswer ?? '—'}</span></span>
        <span className="text-slate-500">Time: <span className="font-bold">{row.timeSpent}s</span></span>
        <span className="text-slate-500">Answer changes: <span className="font-bold">{row.answerChanges ?? 0}</span></span>
        <span className="text-slate-500">Revisits: <span className="font-bold">{row.revisits ?? 0}</span></span>
        <span className="text-slate-500">Marked for review: <span className="font-bold">{row.markedForReview ? 'Yes' : 'No'}</span></span>
      </div>
      {whyFlags.length > 0 && (
        <div className="mt-2 rounded-xl bg-amber-50/70 p-2 dark:bg-amber-500/5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Why Flagged</p>
          <ul className="mt-1 space-y-0.5">
            {whyFlags.map((f, i) => <li key={i} className="text-[10.5px] text-amber-800 dark:text-amber-300">• {f}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function QuestionDetailDialog({ row, open, onClose, allRows }) {
  if (!row) return null
  const LETTERS = ['A', 'B', 'C', 'D']
  const evidence = resolveEvidenceQuestions([row])[0]
  const observation = generateAiObservation(evidence)
  const whyFlags = generateWhyFlagged(evidence, allRows ?? [])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Question Detail
            <Badge variant={row.status === 'Correct' ? 'success' : row.status === 'Incorrect' ? 'danger' : 'warning'} size="sm">{row.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {row.text && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Question</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">{row.text}</p>
            </div>
          )}
          {row.options?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Options</p>
              <div className="mt-1 space-y-1">
                {row.options.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] ${i === row.correctAnswer ? 'bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : i === row.selected && row.status === 'Incorrect' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    <span className="font-bold">{LETTERS[i]}.</span> {opt}
                    {i === row.correctAnswer && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                    {i === row.selected && row.status === 'Incorrect' && <X className="ml-auto h-3.5 w-3.5 text-rose-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-[11px] dark:bg-slate-800/60">
            <div><span className="text-slate-400">Student Answer:</span> <span className="font-bold">{typeof row.selected === 'number' ? LETTERS[row.selected] : row.selected ?? '—'}</span></div>
            <div><span className="text-slate-400">Correct Answer:</span> <span className="font-bold text-emerald-600">{typeof row.correctAnswer === 'number' ? LETTERS[row.correctAnswer] : row.correctAnswer ?? '—'}</span></div>
            <div><span className="text-slate-400">Time Spent:</span> <span className="font-bold">{row.timeSpent}s</span></div>
            <div><span className="text-slate-400">Answer Changes:</span> <span className="font-bold">{row.answerChanges ?? 0}</span></div>
            <div><span className="text-slate-400">Revisit Count:</span> <span className="font-bold">{row.revisits ?? 0}</span></div>
            <div><span className="text-slate-400">Marked for Review:</span> <span className="font-bold">{row.markedForReview ? 'Yes' : 'No'}</span></div>
            <div><span className="text-slate-400">Difficulty:</span> <span className="font-bold">{row.difficulty ?? '—'}</span></div>
            <div><span className="text-slate-400">Question Type:</span> <span className="font-bold">{row.type ?? 'MCQ'}</span></div>
            <div><span className="text-slate-400">Subject:</span> <span className="font-bold">{row.subject}</span></div>
            <div><span className="text-slate-400">Chapter:</span> <span className="font-bold">{row.chapter}</span></div>
            <div><span className="text-slate-400">Topic:</span> <span className="font-bold">{row.topic ?? '—'}</span></div>
            <div><span className="text-slate-400">Assessment:</span> <span className="font-bold">{row.examName}</span></div>
            <div><span className="text-slate-400">Date:</span> <span className="font-bold">{row.date}</span></div>
            <div><span className="text-slate-400">Question ID:</span> <span className="font-bold">{row.id}</span></div>
          </div>
          {observation && (
            <div className="rounded-xl bg-indigo-50/70 p-3 dark:bg-indigo-500/5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                <BrainCircuit className="h-3 w-3" /> AI Observation
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-indigo-900 dark:text-indigo-200">{observation}</p>
            </div>
          )}
          {whyFlags.length > 0 && (
            <div className="rounded-xl bg-amber-50/70 p-3 dark:bg-amber-500/5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Why This Question Is Evidence</p>
              <ul className="mt-1 space-y-0.5">
                {whyFlags.map((f, i) => <li key={i} className="text-[11px] text-amber-800 dark:text-amber-300">• {f}</li>)}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InterventionRecommendationCard({ intervention }) {
  if (!intervention) return null
  return (
    <div className="rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white p-5 dark:border-indigo-500/30 dark:from-indigo-500/5 dark:via-blue-500/5 dark:to-transparent">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
        <Target className="h-3.5 w-3.5" /> AI Recommended Intervention
      </p>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Concept</p>
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{intervention.concept}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Issue</p>
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{intervention.issueType}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Priority</p>
            <Badge variant={intervention.priority === 'High' ? 'danger' : intervention.priority === 'Critical' ? 'danger' : 'warning'} size="sm">{intervention.priority}</Badge>
          </div>
        </div>

        {intervention.evidence.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Evidence</p>
            <ul className="mt-1 space-y-0.5">
              {intervention.evidence.map((e, i) => <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300">• {e}</li>)}
            </ul>
          </div>
        )}

        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Recommended Action</p>
          <p className="mt-0.5 text-[12px] text-slate-700 dark:text-slate-200">{intervention.recommendedAction}</p>
        </div>

        <div className="rounded-xl bg-white/60 p-3 dark:bg-slate-800/40">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Practice Plan</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.questionCount} questions</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.difficultyProgression}</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.concept}</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{intervention.practiceConfig.practiceType}</span>
          </div>
        </div>

        {intervention.whyExplanation && (
          <div className="rounded-xl bg-amber-50/80 p-3 dark:bg-amber-500/5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Why This Intervention?</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">{intervention.whyExplanation}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="default"><Target className="h-3 w-3" /> Create Intervention</Button>
          <Link to={`/faculty/question-intelligence?subject=${encodeURIComponent(intervention.subject ?? '')}&chapter=${encodeURIComponent(intervention.chapter ?? '')}`}>
            <Button size="sm" variant="outline"><BookOpen className="h-3 w-3" /> View Question Bank</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export { EvidenceQuestionCard, QuestionDetailDialog, InterventionRecommendationCard }
export default { EvidenceQuestionCard, QuestionDetailDialog, InterventionRecommendationCard }
