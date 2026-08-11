/**
 * MediXO EduX — Faculty Command Center · 1. Faculty Success Center ⭐.
 * Four premium intelligence cards — Teaching Health, Student Engagement,
 * Assessment Health, AI Teaching Insights — all derived from the foundation.
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpenCheck, HeartPulse, Sparkles, Users } from 'lucide-react'
import { ProgressRing } from '@/components/shared/progress-ring'
import { Sparkline } from '@/components/charts'
import { Badge, Card } from '@/components/ui'

const CARDS = [
  {
    key: 'teachingHealth', title: 'Teaching Health', icon: HeartPulse,
    grad: 'from-indigo-500 to-blue-500', ring: '#6366f1', sub: 'overall health',
    link: '/faculty/teaching?tab=overview',
  },
  {
    key: 'studentEngagement', title: 'Student Engagement', icon: Users,
    grad: 'from-emerald-500 to-teal-500', ring: '#10b981', sub: 'composite',
    link: '/faculty/teaching?tab=engagement',
  },
  {
    key: 'assessmentHealth', title: 'Assessment Health', icon: BookOpenCheck,
    grad: 'from-rose-500 to-red-500', ring: '#f43f5e', sub: 'health score',
    link: '/faculty/question-intelligence',
  },
  {
    key: 'aiTeachingInsights', title: 'AI Teaching Insights', icon: Sparkles,
    grad: 'from-violet-500 to-purple-500', ring: '#8b5cf6', sub: 'intelligence',
    link: '/faculty/teaching?tab=insights',
  },
]

function SuccessCard({ def, data, index }) {
  const d = data[def.key] ?? {}
  const stats =
    def.key === 'teachingHealth'
      ? [
          { label: 'Classes completed', value: String(d.classesCompleted ?? 0) },
          { label: 'Course completion', value: `${d.courseCompletion ?? 0}%` },
        ]
      : def.key === 'studentEngagement'
        ? [
            { label: 'Attendance', value: `${d.attendanceTrend?.latest ?? '—'}%` },
            { label: 'Assignment completion', value: `${d.assignmentCompletion ?? 0}%` },
            { label: 'Participation', value: `${d.participation ?? 0}%` },
          ]
        : def.key === 'assessmentHealth'
          ? [
              { label: 'Question bank', value: d.questionBankStatus ?? '—' },
              { label: 'Pending evaluations', value: String(d.pendingEvaluations ?? 0) },
              { label: 'Papers ready', value: d.paperGeneration ?? '—' },
            ]
          : [
              { label: 'Weak chapters', value: String(d.weakChaptersCount ?? 0) },
              { label: 'Revision critical', value: String(d.revisionCritical ?? 0) },
              { label: 'Weak students', value: String(d.weakStudentCount ?? 0) },
            ]

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className="group relative h-full overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${def.grad} opacity-[0.08] blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-[0.16]`} />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${def.grad} text-white shadow-md`}>
                  <def.icon className="h-3.5 w-3.5" />
                </span>
                {def.title}
              </p>
              {def.key === 'aiTeachingInsights' && (
                <p className="mt-2 max-w-[180px] truncate text-[13px] font-bold leading-snug text-slate-800 dark:text-slate-100" title={d.todaysRecommendation}>
                  {d.todaysRecommendation}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ProgressRing value={d.score ?? 0} size={72} stroke={7} color={def.ring} label={`${d.score ?? 0}`} sublabel={def.sub} />
              {def.key === 'teachingHealth' && (d.weeklyTrend ?? []).length > 1 && (
                <Sparkline data={d.weeklyTrend.map((w, i) => ({ value: w.avg ?? w.value, i }))} color={def.ring} width={64} height={30} />
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 px-2 py-2 text-center dark:bg-slate-800/50">
                <p className="truncate text-[11.5px] font-bold text-slate-800 dark:text-white" title={s.value}>{s.value}</p>
                <p className="mt-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {def.key === 'aiTeachingInsights' ? (
            <div className="mt-3.5 rounded-xl bg-violet-50/70 px-3 py-2 text-[10.5px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
              {d.alertsCount ?? 0} teaching alerts · {d.weakChaptersCount ?? 0} weak chapters · {d.revisionCritical ?? 0} revision-critical
            </div>
          ) : (
            <p className="mt-3.5 line-clamp-2 text-[10.5px] leading-relaxed text-slate-400">{d.quickSummary}</p>
          )}

          <Link to={def.link} className="mt-3.5 flex items-center gap-1 text-[11px] font-bold text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
            View details <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>
    </motion.div>
  )
}

function SuccessCenter({ data }) {
  const sc = data.derived.dashboard?.successCenter ?? {}
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((def, i) => (
        <SuccessCard key={def.key} def={def} data={sc} index={i} />
      ))}
    </div>
  )
}

export { SuccessCenter }
export default SuccessCenter
