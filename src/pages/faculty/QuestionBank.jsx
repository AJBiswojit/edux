import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Filter, Sparkles, Wand2 } from 'lucide-react'
import { useQuestionBank } from '@/services'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Select, SelectItem, useToast } from '@/components/ui'
const DIFF_STYLES = { Easy: 'success', Medium: 'warning', Hard: 'danger' }

/**
 * Question bank workspace (summary, filters, question list, AI generator
 * dialog). Reused by the standalone Question Bank page and the Question
 * Intelligence hub tab. Never duplicate this markup.
 * `toolbar` renders the "Generate with AI" action when embedded without a page header.
 */
export function QuestionBankContent({ toolbar = false }) {
  const { data, isLoading, isError, refetch } = useQuestionBank()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const toast = useToast()

  const questions = useMemo(() => {
    let rows = data?.questions ?? []
    if (filter !== 'All') rows = rows.filter((q) => q.difficulty === filter)
    if (query) rows = rows.filter((q) => q.text.toLowerCase().includes(query.toLowerCase()) || q.topic.toLowerCase().includes(query.toLowerCase()))
    return rows
  }, [data, filter, query])

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      {toolbar && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Your tagged question library — {data.summary.total} questions across {Object.keys(data.summary.bySubject).length} subjects.</p>
          <Button size="sm" onClick={() => setGenerateOpen(true)}>
            <Wand2 className="h-4 w-4" /> Generate with AI
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total questions', value: String(data.summary.total), color: '#6366f1' },
          { label: 'AI-generated', value: String(data.summary.aiGenerated), color: '#14b8a6' },
          { label: 'Used this term', value: String(data.summary.usedThisTerm), color: '#10b981' },
          { label: 'Flagged', value: String(data.summary.flagged), color: '#ef4444' },
          { label: 'By subject', value: Object.entries(data.summary.bySubject).map(([k, v]) => `${k}: ${v}`).join(' · '), color: '#f59e0b', small: true },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <p className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {['All', 'Easy', 'Medium', 'Hard'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
              filter === f
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions…" className="h-9 w-56 pl-9 text-xs" />
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-300">
                  <Database className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" size="sm">{q.subject}</Badge>
                    <Badge variant="outline" size="sm">{q.topic}</Badge>
                    <Badge variant={DIFF_STYLES[q.difficulty]} size="sm">{q.difficulty}</Badge>
                    <Badge variant="secondary" size="sm">{q.type}</Badge>
                    <Badge variant={q.status === 'Approved' ? 'success' : q.status === 'Flagged' ? 'danger' : 'warning'} size="sm">{q.status}</Badge>
                    <Badge variant="outline" size="sm">{q.source === 'AI' ? '🤖 AI' : '✍️ Manual'}</Badge>
                    {q.pyqFrequency > 0 && <Badge variant="gradient" size="sm">PYQ ×{q.pyqFrequency}</Badge>}
                  </div>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-700 dark:text-slate-200">{q.text}</p>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">Used {q.usage}× this term · last used {q.lastUsed}</p>
                </div>
                <div className="flex shrink-0 gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button size="sm" variant="outline" onClick={() => toast.success('Edited', 'Question updated.')}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.info('Added to exam', 'Question queued for the active exam draft.')}>Add to exam</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Generate dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-indigo-500" /> AI question generator</DialogTitle>
            <DialogDescription>Generates tagged, curriculum-mapped questions you approve before they enter the bank.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">Course</p>
                <Select defaultValue="CS501 — DSA">
                  <SelectItem value="CS501 — DSA">CS501 — DSA</SelectItem>
                  <SelectItem value="CS503 — OS">CS503 — OS</SelectItem>
                  <SelectItem value="CS505 — ML">CS505 — ML</SelectItem>
                </Select>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">Difficulty</p>
                <Select defaultValue="Medium">
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </Select>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500">Topic</p>
              <Input placeholder="e.g. Network flows, Deadlocks, Regularisation…" />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500">Question type</p>
              <Select defaultValue="Mix (MCQ + Subjective)">
                <SelectItem value="Mix (MCQ + Subjective)">Mix (MCQ + Subjective)</SelectItem>
                <SelectItem value="MCQ only">MCQ only</SelectItem>
                <SelectItem value="Subjective">Subjective</SelectItem>
                <SelectItem value="Numerical">Numerical</SelectItem>
              </Select>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/60 p-3.5 text-xs text-indigo-700 dark:bg-indigo-500/5 dark:text-indigo-300">
              <Sparkles className="h-4 w-4 shrink-0" />
              You'll review every generated question before it's added. Bloom's level and CO mapping included.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={() => { setGenerateOpen(false); toast.success('Generating…', '10 questions will be ready in about 20 seconds.') }}>
              <Wand2 className="h-4 w-4" /> Generate 10 questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function QuestionBank() {
  return (
    <div>
      <PageHeader
        eyebrow="Teaching · Question Bank"
        title="Question bank"
        description="1,254 tagged questions across your courses — AI-generated, faculty-approved, curriculum-mapped."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Question Intelligence', to: '/faculty/question-intelligence' }, { label: 'Question Bank' }]}
      />
      <QuestionBankContent toolbar />
    </div>
  )
}

export { QuestionBank }
export default QuestionBank
