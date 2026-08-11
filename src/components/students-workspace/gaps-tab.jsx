/**
 * MediXO EduX — Students Workspace · Tab 4: Skill Gaps & Mastery.
 * Skill gaps (preserved), learning gaps with suggested resources, weak
 * chapters and topic difficulty — all derived from the foundation.
 */

import { motion } from 'framer-motion'
import { BookOpen, Database, Lightbulb, ListChecks, Target } from 'lucide-react'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/shared/chart-card'
import { Badge, Button, Card, useToast } from '@/components/ui'
import { WorkspaceSection } from '@/components/teaching-workspace/shared'

const SEVERITY_VARIANT = { Critical: 'danger', High: 'warning', Medium: 'secondary' }

function StudentsGapsTab({ data }) {
  const s = data.derived.students ?? {}
  const ti = data.derived.teachingInsights ?? {}
  const toast = useToast()

  return (
    <div>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Skill gaps" value={String((s.skillGaps ?? []).length)} sub="across courses" icon="Target" gradient="from-rose-500 to-red-500" />
        <StatCard index={1} label="Learning gaps" value={String((ti.learningGaps ?? []).length)} sub="with resources" icon="BookOpen" gradient="from-indigo-500 to-blue-500" />
        <StatCard index={2} label="Weak chapters" value={String((ti.weakChapters ?? []).length)} sub="flagged for revision" icon="AlertTriangle" gradient="from-amber-500 to-orange-500" />
        <StatCard index={3} label="Average understanding" value={ti.averageUnderstanding != null ? `${ti.averageUnderstanding}%` : '—'} sub="outcome attainment" icon="BrainCircuit" gradient="from-emerald-500 to-teal-500" />
      </div>

      {/* Skill gaps (preserved) + learning gaps */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top skill gaps" subtitle="Where the class struggles most" actions={<Badge variant="danger" size="sm">{s.skillGaps?.length ?? 0}</Badge>}>
          <div className="space-y-4">
            {(s.skillGaps ?? []).map((g, i) => (
              <div key={g.skill}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{g.skill}</span>
                  <span className="font-bold text-rose-500">{g.gap}% gap · {g.students} students</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${g.gap}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-5 w-full" onClick={() => toast.info('Remediation plan', 'AI built a 3-session remediation plan covering all four gaps.')}>
            <Lightbulb className="h-3.5 w-3.5" /> Generate remediation plan
          </Button>
        </ChartCard>

        <ChartCard title="Learning gaps" subtitle="Where understanding breaks down — with suggested resources">
          <div className="space-y-3">
            {(ti.learningGaps ?? []).map((g) => (
              <div key={g.chapter} className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{g.chapter}</p>
                  <Badge variant={SEVERITY_VARIANT[g.severity] ?? 'secondary'} size="sm">{g.gap}%</Badge>
                </div>
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${g.gap}%` }} />
                </div>
                <p className="mt-1.5 text-[10.5px] text-slate-400">
                  <Target className="mr-1 inline h-3 w-3" />{g.students} students affected
                  {(g.resources ?? []).length > 0 && <span className="ml-2">· resources: {g.resources.map((r) => r.type).join(' · ')}</span>}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Weak chapters + topic difficulty */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Weak chapters" subtitle="From class signals + PYQ frequency" actions={<Badge variant="danger" size="sm">{ti.weakChapters?.length ?? 0}</Badge>}>
          <div className="space-y-3">
            {(ti.weakChapters ?? []).slice(0, 6).map((w) => (
              <div key={w.chapter} className="rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{w.chapter}</p>
                  <div className="flex items-center gap-1.5">
                    {w.affectedStudents != null && <Badge variant="secondary" size="sm">{w.affectedStudents} students</Badge>}
                    <Badge variant={SEVERITY_VARIANT[w.severity] ?? 'secondary'} size="sm">{w.severity}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${w.gap}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{w.gap}% gap</span>
                </div>
                <p className="mt-1.5 text-[10.5px] text-slate-400">{w.source} · {w.action?.label}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Topic difficulty" subtitle="Question-bank mix per topic (easy → hard)">
          <div className="space-y-2.5">
            {(ti.topicDifficulty ?? []).map((t) => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="w-32 truncate text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">{t.topic}</span>
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="bg-emerald-400" style={{ width: `${(t.easy / Math.max(t.total, 1)) * 100}%` }} />
                  <span className="bg-indigo-400" style={{ width: `${(t.medium / Math.max(t.total, 1)) * 100}%` }} />
                  <span className="bg-rose-400" style={{ width: `${(t.hard / Math.max(t.total, 1)) * 100}%` }} />
                </div>
                <Badge variant={t.difficultyScore >= 2.4 ? 'danger' : t.difficultyScore >= 2 ? 'warning' : 'secondary'} size="sm">{t.difficultyScore.toFixed(1)}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Easy</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400" /> Medium</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Hard</span>
            <span className="ml-auto">Difficulty score 1–3</span>
          </div>
        </ChartCard>
      </div>

      {/* Mastery callout */}
      <WorkspaceSection title="Mastery map" subtitle="How to close the gaps before the midsem" icon={Database}>
        <div className="flex flex-wrap items-start gap-3 rounded-3xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-5 ring-1 ring-indigo-500/15">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            <span className="font-bold text-indigo-600 dark:text-indigo-300">Suggested sequence:</span> start with {ti.weakChapters?.[0]?.chapter ?? 'the top gap'} ({ti.weakChapters?.[0]?.gap ?? '—'}% gap, {ti.weakChapters?.[0]?.affectedStudents ?? '—'} students affected), pair it with the {ti.learningGaps?.[0]?.chapter ?? 'top learning gap'} resources, then run a {ti.revisionPriority?.[0]?.topic ?? 'revision topic'} drill before the midsem.
          </p>
        </div>
      </WorkspaceSection>
    </div>
  )
}

export { StudentsGapsTab }
export default StudentsGapsTab
