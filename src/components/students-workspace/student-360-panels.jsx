/**
 * Faculty — 360° Student Intelligence panels (Phase 4).
 * Pure presentational sections fed by the 360 bundle from
 * computeStudent360 (all values derived from canonical attempts).
 * Sections: Overview · AI summary · Strengths · Weaknesses · Subjects ·
 * Chapters · Question evidence · Time · Behaviour · Errors · Trends ·
 * Exam comparison · Persistent/Resolved issues.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowUpRight, BookOpen, BrainCircuit, CheckCircle2, Clock, Crosshair, FileText,
  Layers, ListChecks, Minus, Sparkles, Target, Timer, TrendingDown, TrendingUp,
} from 'lucide-react'
import { Badge, Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { ChartCard } from '@/components/shared/chart-card'
import { StatCard } from '@/components/shared/stat-card'
import { AreaTrend, BarCompare, DonutChart } from '@/components/charts'
import { formatDate } from '@/utils/format'
import { useWeakTopicQuestions } from '@/services/faculty-students'

const STATUS_STYLES = { Strong: 'success', Improving: 'info', Stable: 'secondary', 'Needs Attention': 'danger', 'No exams': 'outline' }
const TREND_STYLE = { improving: 'success', declining: 'danger', stable: 'secondary', new: 'info' }
const TREND_ICON = { improving: TrendingUp, declining: TrendingDown, stable: Minus, new: Sparkles }
const ISSUE_TONE = { 'Persistent weakness': 'danger', 'Resolved issue': 'success', 'Improving issue': 'info', 'Declining area': 'warning', 'Strong area': 'success', 'Developing area': 'secondary' }

/* ================= Overview ================= */
function OverviewPanel({ s360 }) {
  const o = s360.overview
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard index={0} label="Latest accuracy" value={o.latestAccuracy != null ? `${o.latestAccuracy}%` : '—'} sub={`avg ${o.avgAccuracy ?? 0}%`} icon="Crosshair" gradient="from-indigo-500 to-blue-500" />
        <StatCard index={1} label="Attempt rate" value={`${o.attemptRate}%`} sub="avg across attempts" icon="ListChecks" gradient="from-emerald-500 to-teal-500" />
        <StatCard index={2} label="Time efficiency" value={`${o.timeEfficiency}%`} sub="avg across attempts" icon="Timer" gradient="from-amber-500 to-orange-500" />
        <StatCard index={3} label="Exams completed" value={String(o.examsCompleted)} sub={`trend ${o.trend}`} icon="ClipboardList" gradient="from-violet-500 to-purple-500" />
      </div>
      {/* AI summary */}
      <div className="rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600/10 via-blue-600/5 to-teal-500/10 p-5 ring-1 ring-indigo-500/15 dark:border-indigo-500/25">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
          <BrainCircuit className="h-3.5 w-3.5" /> AI Academic Summary
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">{s360.aiSummary}</p>
      </div>
      {/* What's going well / needs attention */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[12px] font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> What is going well</p>
          <ul className="mt-2.5 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
            {(s360.strengthsWeaknesses?.topStrengths ?? []).slice(0, 4).map((s, i) => (
              <li key={i} className="flex items-start gap-2"><ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {s.chapter} — {s.accuracy}% accuracy{s.fast ? ', fast solving' : ''}</li>
            ))}
            {!(s360.strengthsWeaknesses?.topStrengths ?? []).length && <li className="text-slate-400">No strong areas detected yet.</li>}
          </ul>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[12px] font-bold text-rose-700 dark:text-rose-300"><AlertTriangle className="h-4 w-4" /> What needs attention</p>
          <ul className="mt-2.5 space-y-2 text-[12px] text-slate-600 dark:text-slate-300">
            {(s360.strengthsWeaknesses?.topWeaknesses ?? []).slice(0, 4).map((w, i) => (
              <li key={i} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" /> {w.chapter} — {w.accuracy}% accuracy{w.highTime ? ', high time consumption' : ''}</li>
            ))}
            {!(s360.strengthsWeaknesses?.topWeaknesses ?? []).length && <li className="text-slate-400">No weaknesses flagged.</li>}
          </ul>
        </Card>
      </div>
    </div>
  )
}

/* ================= Strengths / Weaknesses ================= */
function EvidenceLine({ evidence }) {
  return (
    <p className="mt-1 text-[10.5px] font-medium text-slate-400">
      Evidence: {evidence?.attempts ?? 0} attempt{(evidence?.attempts ?? 0) === 1 ? '' : 's'} · {evidence?.questions ?? 0} questions · {evidence?.incorrect ?? 0} incorrect · {evidence?.skipped ?? 0} skipped
      {evidence?.avgTime ? ` · ${evidence.avgTime}s avg` : ''}
    </p>
  )
}

function StrengthCard({ s }) {
  return (
    <div className="rounded-2xl border border-emerald-100 p-3.5 dark:border-emerald-500/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{s.chapter}</p>
        <Badge variant="success" size="sm">{s.accuracy}% accuracy</Badge>
        {s.fast && <Badge variant="outline" size="sm">Fast solving</Badge>}
        {s.trend && <Badge variant={TREND_STYLE[s.trend] ?? 'secondary'} size="sm">{s.trend}</Badge>}
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-400">{s.subject}</p>
      <EvidenceLine evidence={s.evidence} />
    </div>
  )
}

function WeaknessCard({ w, studentId, s360 }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-rose-100 p-3.5 dark:border-rose-500/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{w.chapter}</p>
        <Badge variant="danger" size="sm">{w.accuracy}% accuracy</Badge>
        {w.highTime && <Badge variant="warning" size="sm">{w.avgTime}s avg</Badge>}
        <Badge variant={w.priority === 'High' ? 'danger' : 'warning'} size="sm">{w.priority} priority</Badge>
        {w.trend && <Badge variant={TREND_STYLE[w.trend] ?? 'secondary'} size="sm">{w.trend}</Badge>}
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{w.reason}</p>
      <EvidenceLine evidence={w.evidence} />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><FileText className="h-3 w-3" /> Evidence questions</Button>
        <Link to={`/faculty/question-intelligence?tab=question-intelligence&subject=${encodeURIComponent(w.subject)}&chapter=${encodeURIComponent(w.chapter)}`}>
          <Button size="sm" variant="ghost"><BookOpen className="h-3 w-3" /> View related questions</Button>
        </Link>
      </div>
      <QuestionEvidenceDialog open={open} onOpenChange={setOpen} subject={w.subject} chapter={w.chapter} studentId={studentId} s360={s360} />
    </div>
  )
}

function QuestionEvidenceDialog({ open, onOpenChange, subject, chapter, studentId, s360 }) {
  const { data } = useWeakTopicQuestions(subject, chapter)
  const LETTERS = ['A', 'B', 'C', 'D']

  /* CRITICAL FIX: Always show canonical attempt evidence first */
  const canonicalEvidence = (s360?.question?.rows ?? []).filter((r) =>
    r.subject === subject && r.chapter === chapter &&
    (r.status === 'Incorrect' || r.status === 'Skipped' || (r.timeSpent ?? 0) >= 90 || (r.answerChanges ?? 0) >= 1)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evidence questions — {chapter} ({subject})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {/* Student Evidence (canonical attempts) */}
          {canonicalEvidence.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Student Evidence — {canonicalEvidence.length} question(s)</p>
              {canonicalEvidence.map((r, i) => (
                <div key={`${r.attemptId}-${r.id}-${i}`} className="mb-2 rounded-2xl border border-indigo-100 p-3.5 dark:border-indigo-500/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={r.status === 'Correct' ? 'success' : r.status === 'Incorrect' ? 'danger' : 'warning'} size="sm">{r.status}</Badge>
                    <Badge variant="outline" size="sm">{r.difficulty ?? 'Medium'} · {r.type ?? 'MCQ'}</Badge>
                    {r.id && <Badge variant="secondary" size="sm">{r.id}</Badge>}
                    <span className="ml-auto text-[9px] font-medium text-slate-400">{r.examName} · {r.date}</span>
                  </div>
                  {r.text && <p className="mt-2 text-[12px] leading-relaxed text-slate-700 dark:text-slate-200">{r.text}</p>}
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                    <span className="text-slate-500">Student: <span className="font-bold text-slate-700 dark:text-slate-200">{typeof r.selected === 'number' ? LETTERS[r.selected] : r.selected ?? '—'}</span></span>
                    <span className="text-slate-500">Correct: <span className="font-bold text-emerald-600">{typeof r.correctAnswer === 'number' ? LETTERS[r.correctAnswer] : r.correctAnswer ?? '—'}</span></span>
                    <span className="text-slate-500">Time: <span className="font-bold">{r.timeSpent}s</span></span>
                    <span className="text-slate-500">Changes: <span className="font-bold">{r.answerChanges ?? 0}</span></span>
                  </div>
                  <p className="mt-1.5 text-[10px] italic text-slate-400">{r.observation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Related Question Bank */}
          {data?.items?.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Related Question Bank — {data.items.length} question(s)</p>
              {data.items.map((q) => (
                <div key={q.id} className="mb-2 rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" size="sm">{q.id}</Badge>
                    <Badge variant="outline" size="sm">{q.type} · {q.difficulty}</Badge>
                    {q.status && <Badge variant={q.status === 'Approved' ? 'success' : 'warning'} size="sm">{q.status}</Badge>}
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200">{q.text}</p>
                  <p className="mt-1 text-[10.5px] font-medium text-slate-400">{q.chapter} · {q.topic}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — only when BOTH are empty */}
          {!canonicalEvidence.length && !data?.items?.length && (
            <p className="py-6 text-center text-xs text-slate-400">No evidence questions available for this chapter.</p>
          )}

          {/* Note when QB missing but canonical exists */}
          {canonicalEvidence.length > 0 && !data?.items?.length && (
            <p className="text-center text-[10px] text-slate-400 italic">Question Bank record unavailable — showing canonical attempt evidence.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StrengthsWeaknessesPanel({ s360, studentId }) {
  const sw = s360.strengthsWeaknesses
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Top strengths" subtitle="Accuracy · time efficiency · consistency (from actual attempts)" actions={<Badge variant="success"><TrendingUp className="h-3 w-3" /> {sw.topStrengths?.length ?? 0} strong</Badge>}>
        <div className="space-y-2.5">
          {(sw.topStrengths ?? []).slice(0, 6).map((s) => <StrengthCard key={`st-${s.chapter}`} s={s} />)}
          {!(sw.topStrengths ?? []).length && <p className="py-6 text-center text-xs text-slate-400">No strengths detected yet — complete more practice exams.</p>}
        </div>
      </ChartCard>
      <ChartCard title="Priority weaknesses" subtitle="Low accuracy / high time consumption across multiple assessments" actions={<Badge variant="danger"><AlertTriangle className="h-3 w-3" /> {sw.topWeaknesses?.length ?? 0} flagged</Badge>}>
        <div className="space-y-2.5">
          {(sw.topWeaknesses ?? []).slice(0, 6).map((w) => <WeaknessCard key={`wk-${w.chapter}`} w={w} studentId={studentId} s360={s360} />)}
          {!(sw.topWeaknesses ?? []).length && <p className="py-6 text-center text-xs text-slate-400">No weaknesses flagged — excellent.</p>}
        </div>
      </ChartCard>
    </div>
  )
}

/* ================= Subjects ================= */
function SubjectCard({ s }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{s.subject}</p>
        <Badge variant={s.accuracy >= 75 ? 'success' : s.accuracy >= 60 ? 'warning' : 'danger'} size="sm">
          {s.accuracy >= 75 ? 'Strong' : s.accuracy >= 60 ? 'Developing' : 'Needs Attention'}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div><p className="text-[15px] font-bold text-slate-900 dark:text-white">{s.accuracy}%</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Accuracy</p></div>
        <div><p className="text-[15px] font-bold text-slate-900 dark:text-white">{s.attemptRate}%</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Attempt</p></div>
        <div><p className="text-[15px] font-bold text-slate-900 dark:text-white">{s.avgTime}s</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg time</p></div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Badge variant="success" size="sm">{s.correct} correct</Badge>
        <Badge variant="danger" size="sm">{s.incorrect} incorrect</Badge>
        <Badge variant="warning" size="sm">{s.skipped} skipped</Badge>
        {s.strengthScore != null && <Badge variant="info" size="sm">Strength {s.strengthScore}</Badge>}
      </div>
    </div>
  )
}

function SubjectsPanel({ s360, domain }) {
  const pools = domain === 'Competitive'
    ? [...(s360.subjects.competitive?.JEE ?? []), ...(s360.subjects.competitive?.NEET ?? [])]
    : s360.subjects.university ?? []
  return (
    <ChartCard title={`Subject intelligence — ${domain}`} subtitle="Accuracy · attempt rate · avg time · correct/incorrect/skipped · strength score" actions={<Badge variant="gradient">{pools.length} subjects</Badge>}>
      {pools.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pools.map((s) => <SubjectCard key={s.subject} s={s} />)}
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} attempts yet.</p>}
    </ChartCard>
  )
}

/* ================= Chapters ================= */
function ChaptersPanel({ s360, domain }) {
  const chapters = domain === 'Competitive'
    ? [...(s360.chapters.competitive?.JEE ?? []), ...(s360.chapters.competitive?.NEET ?? [])]
    : s360.chapters.university ?? []
  return (
    <ChartCard title={`Chapter intelligence — ${domain}`} subtitle="Attempted · accuracy · avg time · trend · evidence" actions={<Badge variant="gradient">{chapters.length} chapters</Badge>}>
      {chapters.length ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Chapter</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Attempted</TableHead>
                <TableHead className="text-center">Accuracy</TableHead>
                <TableHead className="text-center">Avg time</TableHead>
                <TableHead className="text-center">Incorrect</TableHead>
                <TableHead className="text-center">Skipped</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((c) => (
                <TableRow key={`${c.subject}-${c.chapter}`}>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-100">{c.chapter}</TableCell>
                  <TableCell className="text-[11.5px] text-slate-500">{c.subject}</TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{c.attempted}/{c.questions}</TableCell>
                  <TableCell className={`text-center font-bold ${c.accuracy >= 75 ? 'text-emerald-600' : c.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>{c.accuracy}%</TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{c.avgTime}s</TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-rose-500">{c.incorrect}</TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-amber-500">{c.skipped}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.trend && <Badge variant={TREND_STYLE[c.trend] ?? 'secondary'} size="sm">{c.trend}</Badge>}
                      {c.highTime && <Badge variant="warning" size="sm">high-time</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} chapter data yet.</p>}
    </ChartCard>
  )
}

/* ================= Question evidence ================= */
const RESULT_STYLE = { Correct: 'success', Incorrect: 'danger', Skipped: 'warning' }

function QuestionsPanel({ s360, studentId, domain }) {
  const rows = (s360.question.rows ?? []).filter((r) => (domain === 'Competitive' ? r.examMode === 'Competitive' : r.examMode === 'University'))
  return (
    <ChartCard title={`Question-level evidence — ${domain}`} subtitle="Every question across attempts: time · result · answer changes · revisits · AI observation" actions={<Badge variant="gradient">{rows.length} questions</Badge>}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Q</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-center">Time</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-center">Changes</TableHead>
                <TableHead className="text-center">Revisits</TableHead>
                <TableHead className="min-w-[260px]">AI observation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 50).map((r, i) => (
                <TableRow key={`${r.attemptId}-${r.id}-${i}`}>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-100">{r.questionNumber}</TableCell>
                  <TableCell className="text-[11.5px] text-slate-500">{r.subject}</TableCell>
                  <TableCell className="text-[11.5px] text-slate-500">{r.chapter}</TableCell>
                  <TableCell><Badge variant={r.difficulty === 'Easy' ? 'success' : r.difficulty === 'Medium' ? 'warning' : 'danger'} size="sm">{r.difficulty}</Badge></TableCell>
                  <TableCell className="text-center font-semibold text-slate-600 dark:text-slate-300">{r.timeSpent}s</TableCell>
                  <TableCell><Badge variant={RESULT_STYLE[r.status] ?? 'secondary'} size="sm">{r.status}</Badge></TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{r.answerChanges}</TableCell>
                  <TableCell className="text-center text-[12px] font-semibold text-slate-600 dark:text-slate-300">{r.revisits}</TableCell>
                  <TableCell className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{r.observation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > 50 && <p className="mt-2 text-center text-[11px] text-slate-400">Showing 50 of {rows.length} questions.</p>}
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} question data yet.</p>}
    </ChartCard>
  )
}

/* ================= Time ================= */
function TimePanel({ s360 }) {
  const t = s360.question.time
  const timeData = (t.bySubject ?? []).map((s) => ({ label: s.subject.slice(0, 12), avgTime: s.avgTime }))
  const diffData = (t.byDifficulty ?? []).map((d) => ({ label: d.difficulty, avgTime: d.avgTime }))
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Time intelligence" subtitle="Average time per question · fastest · slowest" actions={<Badge variant="gradient"><Timer className="h-3 w-3" /> {t.avgTime}s avg</Badge>}>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Avg / question', value: `${t.avgTime}s` },
            { label: 'Avg correct', value: t.timeByCorrect != null ? `${t.timeByCorrect}s` : '—' },
            { label: 'Avg incorrect', value: t.timeByIncorrect != null ? `${t.timeByIncorrect}s` : '—' },
            { label: 'Fastest', value: t.fastest ? `${t.fastest.time}s` : '—' },
            { label: 'Slowest', value: t.slowest ? `${t.slowest.time}s` : '—' },
            { label: 'Slowest topic', value: t.slowest?.topic ?? '—' },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
              <p className="mt-0.5 truncate text-[14px] font-bold text-slate-800 dark:text-slate-100">{m.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {t.timeByIncorrect != null && t.timeByCorrect != null && t.timeByIncorrect > t.timeByCorrect * 1.3
            ? `Incorrect answers take ${t.timeByIncorrect}s vs ${t.timeByCorrect}s on correct ones — time pressure may be hurting accuracy.`
            : 'Average time on correct vs incorrect answers is broadly similar.'}
        </p>
      </ChartCard>
      <ChartCard title="Average time by subject" subtitle="Where the student spends time">
        {timeData.length ? <BarCompare data={timeData} xKey="label" height={200} series={[{ key: 'avgTime', name: 'Avg time (s)', color: '#f59e0b' }]} formatter={(v) => `${v}s`} /> : <p className="py-8 text-center text-xs text-slate-400">No timing data yet.</p>}
      </ChartCard>
      {diffData.length > 1 && (
        <ChartCard title="Average time by difficulty" subtitle="Seconds per question by difficulty">
          <BarCompare data={diffData} xKey="label" height={180} series={[{ key: 'avgTime', name: 'Avg time (s)', color: '#6366f1' }]} formatter={(v) => `${v}s`} />
        </ChartCard>
      )}
    </div>
  )
}

/* ================= Behaviour ================= */
function BehaviourPanel({ s360 }) {
  const b = s360.question.behaviour
  return (
    <ChartCard title="Behaviour intelligence" subtitle="Observable exam behaviour only — no inferences about emotion or motivation">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Answer changes', value: String(b.answerChanges) },
          { label: 'Revisits', value: String(b.revisits) },
          { label: 'Skipped', value: String(b.skipped) },
          { label: 'Marked for review', value: String(b.markedForReview) },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</p>
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
        {b.revisits >= 3 && b.answerChanges >= 3
          ? 'Student frequently revisits and changes answers on difficult questions — typically on slow or incorrect attempts.'
          : b.skipped >= 3
            ? 'Several questions were skipped after viewing — worth reviewing time allocation.'
            : 'No strong behavioural pattern detected yet.'}
      </p>
    </ChartCard>
  )
}

/* ================= Errors ================= */
function ErrorsPanel({ s360 }) {
  const errors = s360.question.errors ?? []
  const total = s360.question.errorTotal ?? 0
  return (
    <ChartCard title="Error intelligence" subtitle="Observable categories only — otherwise Unclassified (no fabricated causes)" actions={<Badge variant="gradient">{total} errors</Badge>}>
      {errors.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DonutChart data={errors.map((e, i) => ({ name: e.category, value: e.count, color: ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6', '#6366f1', '#94a3b8'][i % 7] }))} height={200} centerLabel={String(total)} centerSub="errors" />
          <div className="space-y-2">
            {errors.map((e) => (
              <div key={e.category} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{e.category}</span>
                <span className="ml-auto text-[13px] font-bold text-slate-800 dark:text-slate-100">{e.count} · {e.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No error data yet.</p>}
    </ChartCard>
  )
}

/* ================= Trends ================= */
function TrendsPanel({ s360, domain }) {
  const series = (s360.longitudinal.series ?? []).filter((s) => (domain === 'Competitive' ? s.examMode !== 'University' : s.examMode === 'University'))
  const chartData = series.map((s) => ({ label: s.shortTitle ?? s.examName ?? s.examId, accuracy: s.accuracy, attemptRate: s.attemptRate, avgTime: s.avgTime }))
  const issues = (s360.longitudinal.issues ?? []).filter((i) => (domain === 'Competitive' ? i.domain !== 'university' : i.domain === 'university'))
  return (
    <div className="space-y-4">
      <ChartCard title={`Performance trend — ${domain}`} subtitle="Accuracy · attempt rate · avg time across assessments" actions={<Badge variant="gradient">{series.length} assessments</Badge>}>
        {chartData.length > 1 ? (
          <AreaTrend data={chartData} xKey="label" height={220} series={[
            { key: 'accuracy', name: 'Accuracy (%)', color: '#6366f1' },
            { key: 'attemptRate', name: 'Attempt rate (%)', color: '#14b8a6' },
          ]} formatter={(v) => `${v}%`} />
        ) : <p className="py-8 text-center text-xs text-slate-400">Need at least 2 attempts to plot a trend.</p>}
      </ChartCard>
      <ChartCard title="Persistent vs resolved issues" subtitle="Classified from the chapter trend logic (Phase 2) — each with evidence">
        {issues.length ? (
          <div className="grid gap-2.5 md:grid-cols-2">
            {issues.map((i) => (
              <div key={`${i.subject}-${i.chapter}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${i.type === 'Persistent weakness' ? 'bg-rose-500' : i.type === 'Resolved issue' ? 'bg-emerald-500' : i.type === 'Improving issue' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                    {i.chapter} <Badge variant={ISSUE_TONE[i.type] ?? 'secondary'} size="sm">{i.type}</Badge>
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">
                    {i.accuracy}% accuracy · {i.avgTime}s avg · {i.evidence?.attempts ?? 0} attempts · {i.evidence?.questions ?? 0} questions
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-6 text-center text-xs text-slate-400">No tracked issues yet.</p>}
      </ChartCard>
    </div>
  )
}

/* ================= Exam comparison ================= */
function ComparisonPanel({ s360 }) {
  const c = s360.comparison
  if (!c) return null
  return (
    <ChartCard title="Exam comparison" subtitle={`${c.examA.date} → ${c.examB.date}`} actions={<Badge variant="gradient"><Layers className="h-3 w-3" /> First vs latest</Badge>}>
      <div className="overflow-x-auto">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>{c.examA.name}</TableHead>
              <TableHead>{c.examB.name}</TableHead>
              <TableHead className="text-right">Delta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.rows.map((r) => (
              <TableRow key={r.label}>
                <TableCell className="font-semibold text-slate-700 dark:text-slate-200">{r.label}</TableCell>
                <TableCell className="text-[12.5px] font-semibold text-slate-500">{r.a}</TableCell>
                <TableCell className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{r.b}</TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${r.delta === 0 ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : r.better ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'}`}>
                    {r.delta > 0 ? '+' : r.delta < 0 ? '−' : ''}{Math.abs(r.delta)}{r.unit}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  )
}

/* ================= DNA ================= */
function DnaPanel({ s360, domain }) {
  const sw = s360.strengthsWeaknesses
  const pools = domain === 'Competitive'
    ? { strengths: [...(sw.competitive?.JEE?.strengths ?? []), ...(sw.competitive?.NEET?.strengths ?? [])], weaknesses: [...(sw.competitive?.JEE?.weaknesses ?? []), ...(sw.competitive?.NEET?.weaknesses ?? [])] }
    : sw.university
  return (
    <ChartCard title={`AI Academic DNA — ${domain}`} subtitle="Reused from the Student AI Academic DNA engine (no duplicate calculation)" actions={<Badge variant="gradient"><BrainCircuit className="h-3 w-3" /> DNA</Badge>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Strengths</p>
          <div className="space-y-2">
            {(pools.strengths ?? []).slice(0, 5).map((s) => (
              <div key={`dna-st-${s.chapter}`} className="rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.chapter} <span className="font-medium text-emerald-700 dark:text-emerald-300">{s.accuracy}%</span></p>
                <EvidenceLine evidence={s.evidence} />
              </div>
            ))}
            {!(pools.strengths ?? []).length && <p className="text-[11px] text-slate-400">No strengths yet.</p>}
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400"><AlertTriangle className="h-3.5 w-3.5" /> Weaknesses</p>
          <div className="space-y-2">
            {(pools.weaknesses ?? []).slice(0, 5).map((w) => (
              <div key={`dna-wk-${w.chapter}`} className="rounded-xl bg-rose-50/60 p-3 dark:bg-rose-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{w.chapter} <span className="font-medium text-rose-600 dark:text-rose-300">{w.accuracy}%</span></p>
                <EvidenceLine evidence={w.evidence} />
              </div>
            ))}
            {!(pools.weaknesses ?? []).length && <p className="text-[11px] text-slate-400">No weaknesses flagged.</p>}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}

/* ================= Panel host ================= */
function Student360Panels({ s360, studentId, domain }) {
  return (
    <div className="space-y-6">
      <OverviewPanel s360={s360} />
      <StrengthsWeaknessesPanel s360={s360} studentId={studentId} />
      <SubjectsPanel s360={s360} domain={domain} />
      <ChaptersPanel s360={s360} domain={domain} />
      <QuestionsPanel s360={s360} studentId={studentId} domain={domain} />
      <TimePanel s360={s360} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BehaviourPanel s360={s360} />
        <ErrorsPanel s360={s360} />
      </div>
      <TrendsPanel s360={s360} domain={domain} />
      <ComparisonPanel s360={s360} />
      <DnaPanel s360={s360} domain={domain} />
    </div>
  )
}

export { Student360Panels }
export default Student360Panels
