/**
 * Examination Intelligence Workspace — Mock Tests content.
 * University & competitive segmented control · full exam fields ·
 * attempt history · preview dialog.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, BarChart3, CalendarClock, CheckCircle2, Clock, PlayCircle, Target, Timer } from 'lucide-react'
import { useMockTests } from '@/services'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Progress } from '@/components/ui'

const CATS = [
  { id: 'All', label: 'All' },
  { id: 'University', label: 'University' },
  { id: 'Competitive', label: 'Competitive' },
]

function MockTestsContent() {
  const { data, isLoading, isError, refetch } = useMockTests()
  const [preview, setPreview] = useState(null)
  const [cat, setCat] = useState('All')

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const items = data?.items ?? []
  const completed = items.filter((t) => t.status === 'Completed')
  const avgScore = completed.length ? Math.round(completed.reduce((a, t) => a + t.score, 0) / completed.length) : 0
  const visible = cat === 'All' ? items : items.filter((t) => t.category === cat)

  return (
    <div>
      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Tests taken', value: String(completed.length), icon: BarChart3, grad: 'from-indigo-500 to-blue-500' },
          { label: 'Average score', value: `${avgScore}%`, icon: Target, grad: 'from-teal-500 to-emerald-500' },
          { label: 'Best percentile', value: '94', icon: CheckCircle2, grad: 'from-emerald-500 to-green-500' },
          { label: 'Hours simulated', value: '11.5h', icon: Timer, grad: 'from-amber-500 to-orange-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-3xl bg-gradient-to-br ${s.grad} p-5 text-white shadow-lg`}>
            <s.icon className="h-5 w-5 opacity-80" />
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] font-medium text-white/75">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Segmented control */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-xl px-4 py-2 text-[12.5px] font-bold transition-all ${cat === c.id ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300'}`}
          >
            {c.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cat === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
              {c.id === 'All' ? items.length : items.filter((t) => t.category === c.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {visible.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">{t.subjectName ?? t.subject} · {t.type}</p>
                  <h3 className="mt-1 text-[16px] font-bold text-slate-900 dark:text-white">{t.title}</h3>
                </div>
                <Badge variant={t.status === 'Completed' ? 'success' : 'info'}>{t.status}</Badge>
              </div>

              {/* full exam fields */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant={t.difficulty === 'Easy' ? 'success' : t.difficulty === 'Medium' ? 'warning' : 'danger'} size="sm">{t.difficulty}</Badge>
                <Badge variant="outline" size="sm">{t.questionCount} Qs</Badge>
                <Badge variant="outline" size="sm">{t.marks} marks</Badge>
                {t.negativeMarking && <Badge variant="outline" size="sm">{t.negativeMarking}</Badge>}
                <Badge variant="outline" size="sm">{t.duration}</Badge>
                {t.pattern && <Badge variant="secondary" size="sm">{t.pattern}</Badge>}
              </div>

              {t.status === 'Completed' ? (
                <>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="font-display text-lg font-bold text-indigo-600 dark:text-indigo-300">{t.score}%</p>
                      <p className="text-[9px] font-medium text-slate-400">Score</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{t.percentile ?? '—'}</p>
                      <p className="text-[9px] font-medium text-slate-400">Percentile</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{t.accuracy}%</p>
                      <p className="text-[9px] font-medium text-slate-400">Accuracy</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="font-display text-lg font-bold text-slate-800 dark:text-white">{t.timeUsed}</p>
                      <p className="text-[9px] font-medium text-slate-400">Time</p>
                    </div>
                  </div>

                  {/* attempt history */}
                  {(t.attempts?.length ?? 0) > 1 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Attempt history</p>
                      <div className="mt-1.5 flex gap-1.5">
                        {t.attempts.map((a) => (
                          <span key={a.date} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            {a.date.slice(5)} · {a.score}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/5">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <AlertCircle className="h-3.5 w-3.5" /> AI focus areas
                    </p>
                    <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-300">{t.weakAreas.join(' · ')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setPreview(t)}>
                    <BarChart3 className="h-4 w-4" /> View detailed analysis
                  </Button>
                </>
              ) : (
                <div className="mt-5">
                  <div className="flex items-center gap-4 text-[12px] font-medium text-slate-400">
                    <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> {t.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t.duration}</span>
                  </div>
                  <Button className="mt-5 w-full" size="sm" onClick={() => setPreview(t)}>
                    <PlayCircle className="h-4 w-4" /> Start mock test
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>
              {preview?.status === 'Scheduled' ? 'Ready when you are. Timed · auto-submits at 0:00.' : 'AI analysis of your performance.'}
            </DialogDescription>
          </DialogHeader>
          {preview?.status === 'Scheduled' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/70 p-4 dark:bg-indigo-500/5">
                <Timer className="h-5 w-5 shrink-0 text-indigo-500" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{preview.duration}</span> · {preview.questionCount} questions · {preview.marks} marks · {preview.negativeMarking ?? 'no negative marking'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-100">Before you start</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-500 dark:text-slate-400">
                  <li>Find a quiet spot — focus matters more than time</li>
                  <li>AI will generate a difficulty mix tuned to your level</li>
                  <li>You'll get a full breakdown with weak-topic drills after</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="7" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - (preview?.score ?? 0) / 100)} />
                  </svg>
                  <span className="absolute font-display text-lg font-bold text-slate-900 dark:text-white">{preview?.score}%</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Percentile {preview?.percentile ?? '—'}</p>
                  <p className="text-xs text-slate-400">Top {preview?.percentile ? 100 - preview.percentile : '—'}% of test-takers</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Accuracy</span><span>{preview?.accuracy}%</span>
                </div>
                <Progress value={preview?.accuracy} className="mt-1.5" />
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Suggested drills</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {preview?.weakAreas.join(' → ')} — the AI planner has queued 2 sessions for these this week.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
            <Button onClick={() => { setPreview(null) }}>{preview?.status === 'Scheduled' ? 'Begin test' : 'Open planner'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { MockTestsContent }
export default MockTestsContent
