/**
 * Faculty — Student Profile · Time & Behaviour, Trends, Academic DNA panels.
 * Pure presentational — every value read directly from the 360 bundle
 * (`s360.question.time`, `s360.question.behaviour`, `s360.question.errors`,
 * `s360.longitudinal`, `s360.strengthsWeaknesses`). No re-computation.
 */
import { BrainCircuit } from 'lucide-react'
import { Badge, Card } from '@/components/ui'

function TimeBehaviourPanel({ s360 }) {
  const t = s360?.question?.time ?? {}
  const b = s360?.question?.behaviour ?? {}
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Time intelligence</h3>
        <p className="mt-0.5 text-xs text-slate-400">Calculated from actual question timing</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
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
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Avg time by subject</p>
          {(t.bySubject ?? []).map((s) => (
            <div key={s.subject} className="flex items-center gap-2 text-[11.5px]">
              <span className="w-24 truncate font-semibold text-slate-600 dark:text-slate-300">{s.subject}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(100, (s.avgTime / 150) * 100)}%` }} />
              </div>
              <span className="w-10 text-right font-bold text-slate-700 dark:text-slate-200">{s.avgTime}s</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Behaviour intelligence</h3>
        <p className="mt-0.5 text-xs text-slate-400">Observable exam behaviour only — no emotion/motivation inferences</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { label: 'Answer changes', value: String(b.answerChanges ?? 0) },
            { label: 'Revisits', value: String(b.revisits ?? 0) },
            { label: 'Skipped', value: String(b.skipped ?? 0) },
            { label: 'Marked review', value: String(b.markedForReview ?? 0) },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{m.value}</p>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Error intelligence</p>
          {(s360?.question?.errors ?? []).map((e) => (
            <div key={e.category} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[12px] dark:bg-slate-800/60">
              <span className="font-semibold text-slate-600 dark:text-slate-300">{e.category}</span>
              <span className="ml-auto font-bold text-slate-800 dark:text-slate-100">{e.count} · {e.percentage}%</span>
            </div>
          ))}
          {!(s360?.question?.errors ?? []).length && <p className="text-[11px] text-slate-400">No error data yet.</p>}
        </div>
      </Card>
    </div>
  )
}

function TrendsPanel({ s360, domain }) {
  const series = (s360?.longitudinal?.series ?? []).filter((s) => (domain === 'Competitive' ? s.examMode !== 'University' : s.examMode === 'University'))
  const issues = (s360?.longitudinal?.issues ?? []).filter((i) => (domain === 'Competitive' ? i.domain !== 'university' : i.domain === 'university'))
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Performance trend — {domain}</h3>
        <p className="mt-0.5 text-xs text-slate-400">Accuracy · attempt rate across assessments (from actual attempts)</p>
        {series.length ? (
          <div className="mt-4 space-y-2.5">
            {series.map((s) => (
              <div key={s.attemptId} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-4 py-2.5 dark:border-slate-800">
                <span className="w-40 truncate text-[12px] font-bold text-slate-700 dark:text-slate-200">{s.shortTitle ?? s.examName}</span>
                <span className="text-[10.5px] font-medium text-slate-400">{s.date}</span>
                <span className={`ml-auto font-bold ${s.accuracy >= 75 ? 'text-emerald-600' : s.accuracy >= 55 ? 'text-amber-600' : 'text-rose-500'}`}>{s.accuracy}%</span>
                <span className="w-16 text-right text-[11px] font-semibold text-slate-400">{s.attemptRate}% att.</span>
              </div>
            ))}
          </div>
        ) : <p className="py-8 text-center text-xs text-slate-400">No {domain} assessments yet.</p>}
      </Card>
      <Card className="p-5">
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Persistent vs resolved issues — {domain}</h3>
        <p className="mt-0.5 text-xs text-slate-400">Classified from the chapter trend logic (Phase 2) — each with evidence</p>
        {issues.length ? (
          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {issues.map((i) => (
              <div key={`${i.subject}-${i.chapter}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${i.type === 'Persistent weakness' ? 'bg-rose-500' : i.type === 'Resolved issue' ? 'bg-emerald-500' : i.type === 'Improving issue' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-bold text-slate-800 dark:text-slate-100">
                    {i.chapter} <Badge variant={i.type === 'Persistent weakness' ? 'danger' : i.type === 'Resolved issue' ? 'success' : i.type === 'Improving issue' ? 'info' : 'warning'} size="sm">{i.type}</Badge>
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">
                    {i.accuracy}% accuracy · {i.avgTime}s avg · {i.evidence?.attempts ?? 0} attempts · {i.evidence?.questions ?? 0} questions · {i.evidence?.incorrect ?? 0} incorrect
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-6 text-center text-xs text-slate-400">No tracked issues yet.</p>}
      </Card>
    </div>
  )
}

function DnaPanel({ s360, domain }) {
  const sw = s360?.strengthsWeaknesses
  const pools = domain === 'Competitive'
    ? { strengths: [...(sw?.competitive?.JEE?.strengths ?? []), ...(sw?.competitive?.NEET?.strengths ?? [])], weaknesses: [...(sw?.competitive?.JEE?.weaknesses ?? []), ...(sw?.competitive?.NEET?.weaknesses ?? [])] }
    : sw?.university ?? { strengths: [], weaknesses: [] }
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
        <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> AI Academic DNA — {domain}
      </h3>
      <p className="mt-0.5 text-xs text-slate-400">Reused from the Student AI Academic DNA engine — no duplicate calculation · every insight traceable to questions</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Strengths</p>
          <div className="space-y-2">
            {(pools.strengths ?? []).slice(0, 6).map((s) => (
              <div key={`dna-st-${s.chapter}`} className="rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{s.chapter} <span className="font-medium text-emerald-700 dark:text-emerald-300">{s.accuracy}%</span></p>
                <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">Evidence: {s.evidence?.attempts ?? 0} attempts · {s.evidence?.questions ?? 0} questions · {s.evidence?.incorrect ?? 0} incorrect</p>
              </div>
            ))}
            {!(pools.strengths ?? []).length && <p className="text-[11px] text-slate-400">No strengths yet.</p>}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Weaknesses</p>
          <div className="space-y-2">
            {(pools.weaknesses ?? []).slice(0, 6).map((w) => (
              <div key={`dna-wk-${w.chapter}`} className="rounded-xl bg-rose-50/60 p-3 dark:bg-rose-500/5">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{w.chapter} <span className="font-medium text-rose-600 dark:text-rose-300">{w.accuracy}%</span></p>
                <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">Evidence: {w.evidence?.attempts ?? 0} attempts · {w.evidence?.questions ?? 0} questions · {w.evidence?.incorrect ?? 0} incorrect · {w.evidence?.skipped ?? 0} skipped</p>
              </div>
            ))}
            {!(pools.weaknesses ?? []).length && <p className="text-[11px] text-slate-400">No weaknesses flagged.</p>}
          </div>
        </div>
      </div>
    </Card>
  )
}

export { TimeBehaviourPanel, TrendsPanel, DnaPanel }
export default { TimeBehaviourPanel, TrendsPanel, DnaPanel }
