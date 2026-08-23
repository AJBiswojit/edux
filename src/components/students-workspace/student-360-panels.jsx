/**
 * Faculty — Student 360 canonical intelligence panels (Phase 4 consolidation).
 *
 * ONE canonical presentation surface for the 360 bundle produced by
 * computeStudent360() (canonical attempts → engine → s360 → UI). Every
 * panel is a PURE consumer of the pre-derived s360 data — no second
 * engine, no re-computation, no fabricated evidence.
 *
 * Panels (one per canonical tab):
 *   OverviewPanel          — KPI summary + AI summary + exam history
 *   StrengthsPanel         — evidence-driven strengths, click → questions
 *   WeaknessesPanel        — actionable weaknesses + suggested intervention
 *   TimeBehaviourPanel     — time + observable behaviour (no psychology)
 *   ErrorsPanel            — Careless / Time-related / Unattempted / Unclassified
 *   TrendsPanel            — per-assessment progression + issue statuses
 *   ComparisonPanel        — first vs latest (context-isolated)
 *   DnaPanel               — Academic DNA evidence (reuses engine pools)
 *   SimilarIssuesPanel     — Phase 5 groups containing THIS student
 *
 * Subject / Chapter / Question Analysis live in student-intelligence-tabs
 * (they carry the drill-down state machine); Interventions lives in
 * intervention-center. This file only owns the read-only 360 panels.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowUpRight, BookOpen, BrainCircuit, CheckCircle2,
  ClipboardList, FileText, Layers, Target, Timer,
  TrendingUp, Users,
} from 'lucide-react'
import {
  Badge, Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Table,
  TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui'
import { ChartCard } from '@/components/shared/chart-card'
import { StatCard } from '@/components/shared/stat-card'
import { AreaTrend, BarCompare, DonutChart } from '@/components/charts'
import { useWeakTopicQuestions } from '@/services/faculty-students'
import { QUESTION_OPTION_LABELS } from '@/constants/ui'
import { ExamHistoryTable } from './student-exam-history'
import { generateInterventionRecommendation } from '@/intelligence/faculty/engine/ground-level-intelligence'

const LETTERS = QUESTION_OPTION_LABELS
const DOMAIN_CONTEXT = { University: 'University', JEE: 'JEE', NEET: 'NEET' }

const TREND_STYLE = { improving: 'success', declining: 'danger', stable: 'secondary', new: 'info' }
const ISSUE_TONE = {
  'Persistent weakness': 'danger', 'Resolved issue': 'success', 'Improving issue': 'info',
  'Declining area': 'warning', 'Strong area': 'success', 'Developing area': 'secondary',
}
const RESULT_STYLE = { Correct: 'success', Incorrect: 'danger', Skipped: 'warning' }

const matchesContext = (item, context) => context === 'University'
  ? item.examMode === 'University'
  : item.examMode === 'Competitive' && item.examFamily === context

/* Domain → the s360 sub-pool (subjects/chapters are stored university vs
   competitive[family]; strengths/weaknesses and question rows are the same). */
export function domainPool(s360, domain, key) {
  if (!s360) return []
  const bucket = s360[key]
  if (!bucket) return []
  return domain === 'University' ? (bucket.university ?? []) : (bucket.competitive?.[domain] ?? [])
}

export function domainSwPool(s360, domain) {
  if (!s360) return { strengths: [], weaknesses: [] }
  const sw = s360.strengthsWeaknesses
  return domain === 'University'
    ? (sw?.university ?? { strengths: [], weaknesses: [] })
    : (sw?.competitive?.[domain] ?? { strengths: [], weaknesses: [] })
}

/* ================= Evidence line ================= */
function EvidenceLine({ evidence }) {
  return (
    <p className="mt-1 text-[10.5px] font-medium text-slate-400">
      Evidence: {evidence?.attempts ?? 0} attempt{(evidence?.attempts ?? 0) === 1 ? '' : 's'} ·{' '}
      {evidence?.questions ?? 0} questions · {evidence?.incorrect ?? 0} incorrect ·{' '}
      {evidence?.skipped ?? 0} skipped{evidence?.avgTime ? ` · ${evidence.avgTime}s avg` : ''}
    </p>
  )
}

/* ================= Canonical question-evidence dialog ================= */
function QuestionEvidenceDialog({ open, onOpenChange, subject, chapter, domain, mode, s360 }) {
  const { data } = useWeakTopicQuestions(subject, chapter)

  /* Always derive canonical attempt evidence first — the dialog must never
     be empty when question-level evidence exists. */
  const canonicalEvidence = useMemo(() => {
    const rows = (s360?.question?.rows ?? []).filter((r) =>
      r.subject === subject && r.chapter === chapter && matchesContext(r, domain))
    if (mode === 'strength') return rows.filter((r) => r.status === 'Correct')
    if (mode === 'weakness') return rows.filter((r) => r.status !== 'Correct')
    return rows
  }, [s360, subject, chapter, domain, mode])

  const hasAny = canonicalEvidence.length > 0 || (data?.items?.length ?? 0) > 0
  const titleMode = mode === 'strength' ? 'Strength evidence' : mode === 'weakness' ? 'Weakness evidence' : 'Evidence questions'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titleMode} — {chapter} ({subject})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {canonicalEvidence.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Student Evidence — {canonicalEvidence.length} question(s)
              </p>
              {canonicalEvidence.map((r, i) => (
                <div key={`${r.attemptId}-${r.id}-${i}`} className="mb-2 rounded-2xl border border-indigo-100 p-3.5 dark:border-indigo-500/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={RESULT_STYLE[r.status] ?? 'secondary'} size="sm">{r.status}</Badge>
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
                    <span className="text-slate-500">Revisits: <span className="font-bold">{r.revisits ?? 0}</span></span>
                    <span className="text-slate-500">Review: <span className="font-bold">{r.markedForReview ? 'Yes' : 'No'}</span></span>
                  </div>
                  {r.observation && <p className="mt-1.5 text-[10px] italic text-slate-400">{r.observation}</p>}
                </div>
              ))}
            </div>
          )}

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

          {!hasAny && (
            <p className="py-6 text-center text-xs text-slate-400">No question-level evidence available.</p>
          )}
          {canonicalEvidence.length > 0 && !(data?.items?.length) && (
            <p className="text-center text-[10px] italic text-slate-400">Question Bank record unavailable — showing canonical attempt evidence.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ================= Overview ================= */
function OverviewPanel({ s360, studentId, domain }) {
  const o = s360.overview
  const domainAttempts = useMemo(
    () => (s360.attempts ?? []).filter((a) => matchesContext(a, domain)),
    [s360, domain])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <StatCard index={0} label="Latest accuracy" value={o.latestAccuracy != null ? `${o.latestAccuracy}%` : '—'} sub={`avg ${o.avgAccuracy ?? 0}%`} icon="Crosshair" gradient="from-indigo-500 to-blue-500" />
        <StatCard index={1} label="Attempt rate" value={`${o.attemptRate}%`} sub="avg across attempts" icon="ListChecks" gradient="from-emerald-500 to-teal-500" />
        <StatCard index={2} label="Time efficiency" value={`${o.timeEfficiency}%`} sub="avg across attempts" icon="Timer" gradient="from-amber-500 to-orange-500" />
        <StatCard index={3} label="Exams completed" value={String(o.examsCompleted)} sub={`trend ${o.trend}`} icon="ClipboardList" gradient="from-violet-500 to-purple-500" />
      </div>

      <div className="rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600/10 via-blue-600/5 to-teal-500/10 p-5 ring-1 ring-indigo-500/15 dark:border-indigo-500/25">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
          <BrainCircuit className="h-3.5 w-3.5" /> AI Academic Summary
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">{s360.aiSummary}</p>
      </div>

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

      {/* Exam history — domain-scoped; preserves the deep link into attempt analysis */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
              <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Exam history — {domain}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">Canonical ExamAgent attempts (demo excluded) · “View Analysis” opens the dedicated attempt route.</p>
          </div>
          <Badge variant="gradient">{domainAttempts.length} exam(s)</Badge>
        </div>
        {domainAttempts.length ? (
          <div className="mt-4"><ExamHistoryTable attempts={domainAttempts} studentId={studentId} /></div>
        ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} exam history yet.</p>}
      </Card>
    </div>
  )
}

/* ================= Strengths ================= */
function StrengthCard({ s, onEvidence }) {
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
      <div className="mt-2">
        <Button size="sm" variant="outline" onClick={() => onEvidence(s)}><FileText className="h-3 w-3" /> View evidence questions</Button>
      </div>
    </div>
  )
}

function StrengthsPanel({ s360, domain }) {
  const [active, setActive] = useState(null)
  const pool = domainSwPool(s360, domain)
  const strengths = pool.strengths ?? []
  return (
    <ChartCard title={`Strengths — ${domain}`} subtitle="Evidence-driven: accuracy · speed · trend (from actual attempts)" actions={<Badge variant="success"><TrendingUp className="h-3 w-3" /> {strengths.length} strong</Badge>}>
      {strengths.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {strengths.map((s) => <StrengthCard key={`st-${s.chapter}-${s.subject}`} s={s} onEvidence={setActive} />)}
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} strengths detected yet — complete more assessments.</p>}
      <QuestionEvidenceDialog open={!!active} onOpenChange={(v) => !v && setActive(null)} subject={active?.subject} chapter={active?.chapter} domain={domain} mode="strength" s360={s360} />
    </ChartCard>
  )
}

/* ================= Weaknesses ================= */
function WeaknessCard({ w, onEvidence, onSuggestion }) {
  const rows = useMemo(() => w, [w])
  return (
    <div className="rounded-2xl border border-rose-100 p-3.5 dark:border-rose-500/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{rows.chapter}</p>
        <Badge variant="danger" size="sm">{rows.accuracy}% accuracy</Badge>
        {rows.highTime && <Badge variant="warning" size="sm">{rows.avgTime}s avg</Badge>}
        <Badge variant={rows.priority === 'High' ? 'danger' : 'warning'} size="sm">{rows.priority} priority</Badge>
        {rows.trend && <Badge variant={TREND_STYLE[rows.trend] ?? 'secondary'} size="sm">{rows.trend}</Badge>}
      </div>
      <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{rows.reason}</p>
      <EvidenceLine evidence={rows.evidence} />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onEvidence(rows)}><FileText className="h-3 w-3" /> Evidence questions</Button>
        <Button size="sm" variant="ghost" onClick={() => onSuggestion(rows)}><Target className="h-3 w-3" /> Suggested intervention</Button>
        <Link to={`/faculty/question-intelligence?tab=question-intelligence&subject=${encodeURIComponent(rows.subject)}&chapter=${encodeURIComponent(rows.chapter)}`}>
          <Button size="sm" variant="ghost"><BookOpen className="h-3 w-3" /> Related questions</Button>
        </Link>
      </div>
    </div>
  )
}

function SuggestedInterventionDialog({ open, onOpenChange, weakness, domain, s360 }) {
  /* Derive a recommendation from the EXISTING Phase 5/6 ground-level engine,
     using this weakness's actual question rows. No new engine, no auto-assign. */
  const recommendation = useMemo(() => {
    if (!weakness) return null
    const rows = (s360?.question?.rows ?? []).filter((r) =>
      r.subject === weakness.subject && r.chapter === weakness.chapter && matchesContext(r, domain))
    return generateInterventionRecommendation(rows, { subject: weakness.subject, chapter: weakness.chapter })
  }, [weakness, s360, domain])

  if (!weakness) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-indigo-500" /> Suggested intervention — {weakness.chapter}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
            Derived from the existing intervention intelligence. Faculty must explicitly approve/create an intervention — nothing is assigned automatically.
          </p>
          {weakness && recommendation && recommendation.issueType !== 'Strong Performance' ? (
            <div className="rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white p-4 dark:border-indigo-500/30 dark:from-indigo-500/5 dark:via-blue-500/5 dark:to-transparent">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Issue</p><p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{recommendation.issueType}</p></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Priority</p><Badge variant={recommendation.priority === 'High' || recommendation.priority === 'Critical' ? 'danger' : 'warning'} size="sm">{recommendation.priority}</Badge></div>
                <div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Concept</p><p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{recommendation.concept}</p></div>
              </div>
              {recommendation.evidence?.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-slate-600 dark:text-slate-300">
                  {recommendation.evidence.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              <p className="mt-2 text-[12px] text-slate-700 dark:text-slate-200">{recommendation.recommendedAction}</p>
              {recommendation.whyExplanation && <p className="mt-2 rounded-xl bg-amber-50/80 p-2 text-[11px] leading-relaxed text-amber-800 dark:bg-amber-500/5 dark:text-amber-200">{recommendation.whyExplanation}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <Link to="/faculty/my-students?view=interventions"><Button size="sm"><Target className="h-3 w-3" /> Open Intervention Center</Button></Link>
                <Link to={`/faculty/question-intelligence?tab=question-intelligence&subject=${encodeURIComponent(weakness.subject)}&chapter=${encodeURIComponent(weakness.chapter)}`}><Button size="sm" variant="outline"><BookOpen className="h-3 w-3" /> Question Bank / PYQs</Button></Link>
              </div>
            </div>
          ) : <p className="py-4 text-center text-xs text-slate-400">{recommendation ? 'Performance is strong for this chapter — no intervention needed.' : 'No question-level evidence available to derive a recommendation.'}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function WeaknessesPanel({ s360, domain }) {
  const [evidence, setEvidence] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const pool = domainSwPool(s360, domain)
  const weaknesses = pool.weaknesses ?? []
  return (
    <ChartCard title={`Priority weaknesses — ${domain}`} subtitle="Low accuracy / high time across assessments; each has question evidence" actions={<Badge variant="danger"><AlertTriangle className="h-3 w-3" /> {weaknesses.length} flagged</Badge>}>
      {weaknesses.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {weaknesses.map((w) => <WeaknessCard key={`wk-${w.chapter}-${w.subject}`} w={w} onEvidence={setEvidence} onSuggestion={setSuggestion} />)}
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} weaknesses flagged — excellent.</p>}
      <QuestionEvidenceDialog open={!!evidence} onOpenChange={(v) => !v && setEvidence(null)} subject={evidence?.subject} chapter={evidence?.chapter} domain={domain} mode="weakness" s360={s360} />
      <SuggestedInterventionDialog open={!!suggestion} onOpenChange={(v) => !v && setSuggestion(null)} weakness={suggestion} domain={domain} s360={s360} />
    </ChartCard>
  )
}

/* ================= Time & Behaviour ================= */
function TimeBehaviourPanel({ s360, domain }) {
  const q = s360.question.byContext?.[domain] ?? s360.question
  const t = q.time ?? {}
  const b = q.behaviour ?? {}
  const timeData = (t.bySubject ?? []).map((s) => ({ label: s.subject?.slice(0, 12) ?? '', avgTime: s.avgTime }))
  const diffData = (t.byDifficulty ?? []).map((d) => ({ label: d.difficulty, avgTime: d.avgTime }))
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Time intelligence" subtitle="Average time per question · fastest · slowest (observable)" actions={<Badge variant="gradient"><Timer className="h-3 w-3" /> {t.avgTime ?? 0}s avg</Badge>}>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Avg / question', value: `${t.avgTime ?? 0}s` },
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
        {timeData.length > 0 && (
          <div className="mt-3">
            <BarCompare data={timeData} xKey="label" height={200} series={[{ key: 'avgTime', name: 'Avg time (s)', color: '#f59e0b' }]} formatter={(v) => `${v}s`} />
          </div>
        )}
        {diffData.length > 1 && (
          <div className="mt-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">By difficulty</p>
            <BarCompare data={diffData} xKey="label" height={180} series={[{ key: 'avgTime', name: 'Avg time (s)', color: '#6366f1' }]} formatter={(v) => `${v}s`} />
          </div>
        )}
      </ChartCard>
      <ChartCard title="Behaviour intelligence" subtitle="Observable exam behaviour only — no emotion/motivation inferences">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Answer changes', value: String(b.answerChanges ?? 0) },
            { label: 'Revisits', value: String(b.revisits ?? 0) },
            { label: 'Skipped', value: String(b.skipped ?? 0) },
            { label: 'Marked for review', value: String(b.markedForReview ?? 0) },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</p>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {(b.revisits ?? 0) >= 3 && (b.answerChanges ?? 0) >= 3
            ? 'Student frequently revisits and changes answers on difficult questions — typically on slow or incorrect attempts.'
            : (b.skipped ?? 0) >= 3
              ? 'Several questions were skipped after viewing — worth reviewing time allocation.'
              : 'No strong behavioural pattern detected yet.'}
        </p>
      </ChartCard>
    </div>
  )
}

/* ================= Errors ================= */
function ErrorsPanel({ s360, domain }) {
  const q = s360.question.byContext?.[domain] ?? s360.question
  const errors = q.errors ?? []
  const total = q.errorTotal ?? 0
  const ALLOWED = ['Careless', 'Time-related', 'Unattempted', 'Unclassified']
  const safeErrors = errors.filter((e) => ALLOWED.includes(e.category))
  return (
    <ChartCard title={`Error intelligence — ${domain}`} subtitle="Observable categories only — otherwise Unclassified (no fabricated causes)" actions={<Badge variant="gradient">{total} errors</Badge>}>
      {safeErrors.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DonutChart data={safeErrors.map((e, i) => ({ name: e.category, value: e.count, color: ['#f43f5e', '#f59e0b', '#8b5cf6', '#94a3b8'][i % 4] }))} height={200} centerLabel={String(total)} centerSub="errors" />
          <div className="space-y-2">
            {safeErrors.map((e) => (
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
  const series = useMemo(() => (s360.longitudinal?.series ?? []).filter((s) => matchesContext(s, domain)), [s360, domain])
  const issues = useMemo(() => (s360.longitudinal?.issues ?? []).filter((i) => domain === 'University' ? i.domain === 'university' : i.domain === domain), [s360, domain])
  const chartData = series.map((s) => ({ label: s.shortTitle ?? s.examName ?? s.examId, accuracy: s.accuracy, attemptRate: s.attemptRate, avgTime: s.avgTime }))
  return (
    <div className="space-y-4">
      <ChartCard title={`Performance trend — ${domain}`} subtitle="Accuracy · attempt rate across assessments (first → latest)" actions={<Badge variant="gradient">{series.length} assessments</Badge>}>
        {chartData.length > 1 ? (
          <AreaTrend data={chartData} xKey="label" height={220} series={[
            { key: 'accuracy', name: 'Accuracy (%)', color: '#6366f1' },
            { key: 'attemptRate', name: 'Attempt rate (%)', color: '#14b8a6' },
          ]} formatter={(v) => `${v}%`} />
        ) : <p className="py-8 text-center text-xs text-slate-400">Need at least 2 {domain} attempts to plot a trend.</p>}
      </ChartCard>
      <ChartCard title="Persistent vs resolved issues" subtitle="Classified from the Phase 2 chapter trend logic — each with evidence">
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
        ) : <p className="py-6 text-center text-xs text-slate-400">No tracked {domain} issues yet.</p>}
      </ChartCard>
    </div>
  )
}

/* ================= Comparison ================= */
function ComparisonPanel({ s360, domain }) {
  const c = s360.comparisonByContext?.[domain] ?? null
  if (!c) {
    return (
      <ChartCard title={`First vs latest — ${domain}`} subtitle="Two attempts of the same context required">
        <p className="py-8 text-center text-xs text-slate-400">Need at least 2 {domain} attempts to compare.</p>
      </ChartCard>
    )
  }
  return (
    <ChartCard title="First vs latest comparison" subtitle={`${c.examA.date} → ${c.examB.date} · ${domain}-only`} actions={<Badge variant="gradient"><Layers className="h-3 w-3" /> Δ</Badge>}>
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

/* ================= Academic DNA ================= */
function DnaPanel({ s360, domain }) {
  const pool = domainSwPool(s360, domain)
  return (
    <ChartCard title={`AI Academic DNA — ${domain}`} subtitle="Reused from the Student Academic DNA engine (no duplicate calculation) · evidence-clickable" actions={<Badge variant="gradient"><BrainCircuit className="h-3 w-3" /> DNA</Badge>}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Strength evidence</p>
          <div className="space-y-2">
            {(pool.strengths ?? []).slice(0, 6).map((s) => (
              <div key={`dna-st-${s.chapter}-${s.subject}`} className="rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.chapter} <span className="font-medium text-emerald-700 dark:text-emerald-300">{s.accuracy}%</span></p>
                <EvidenceLine evidence={s.evidence} />
              </div>
            ))}
            {!(pool.strengths ?? []).length && <p className="text-[11px] text-slate-400">No strengths yet.</p>}
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400"><AlertTriangle className="h-3.5 w-3.5" /> Weakness evidence</p>
          <div className="space-y-2">
            {(pool.weaknesses ?? []).slice(0, 6).map((w) => (
              <div key={`dna-wk-${w.chapter}-${w.subject}`} className="rounded-xl bg-rose-50/60 p-3 dark:bg-rose-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{w.chapter} <span className="font-medium text-rose-600 dark:text-rose-300">{w.accuracy}%</span></p>
                <EvidenceLine evidence={w.evidence} />
              </div>
            ))}
            {!(pool.weaknesses ?? []).length && <p className="text-[11px] text-slate-400">No weaknesses flagged.</p>}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}

/* ================= Similar Issues (Phase 5, this-student scoped) ================= */
function SimilarIssuesPanel({ studentId, domain, similarIssues }) {
  const groups = useMemo(() => {
    const all = similarIssues?.groups ?? []
    const isDomain = (g) => domain === 'University'
      ? g.domain === 'University'
      : g.domain === 'Competitive' && g.examFamily === domain
    return all.filter((g) => isDomain(g) && (g.students ?? []).some((s) => s.studentId === studentId))
  }, [similarIssues, studentId, domain])

  return (
    <ChartCard title={`Similar issues — ${domain}`} subtitle="Phase 5 groups containing this student (domain-isolated; prototype similarity score)" actions={<Badge variant="gradient"><Users className="h-3 w-3" /> {groups.length} group(s)</Badge>}>
      {groups.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g) => {
            const me = (g.students ?? []).find((s) => s.studentId === studentId)
            return (
              <div key={g.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{g.subject} — {g.chapter}</p>
                  <Badge variant={g.priority === 'Critical' || g.priority === 'High' ? 'danger' : 'warning'} size="sm">{g.priority}</Badge>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">{g.issueType} · {g.examFamily ?? g.domain}</p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">{g.whyDetected}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px] text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{g.studentCount} students</span>
                  {me && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">You: {me.accuracy}%</span>}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{g.avgAccuracy}% avg</span>
                  {g.persistent && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">Persistent</span>}
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">→ {g.recommendation?.title}</p>
              </div>
            )
          })}
        </div>
      ) : <p className="py-6 text-center text-xs text-slate-400">No {domain} similar-issue groups include this student yet.</p>}
    </ChartCard>
  )
}

export {
  OverviewPanel, StrengthsPanel, WeaknessesPanel, TimeBehaviourPanel, ErrorsPanel,
  TrendsPanel, ComparisonPanel, DnaPanel, SimilarIssuesPanel,
}
export default {
  OverviewPanel, StrengthsPanel, WeaknessesPanel, TimeBehaviourPanel, ErrorsPanel,
  TrendsPanel, ComparisonPanel, DnaPanel, SimilarIssuesPanel,
}
