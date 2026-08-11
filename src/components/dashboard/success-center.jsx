import { motion } from 'framer-motion'
import {
  ArrowRight, Award, BrainCircuit, Briefcase, FolderOpen, GraduationCap, Sparkles, Target,
} from 'lucide-react'
import { Badge, Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, Progress } from '@/components/ui'
import { ProgressRing } from '@/components/shared/progress-ring'
import { formatDate } from '@/utils/format'

const ringColor = (v) => (v >= 85 ? '#10b981' : v >= 70 ? '#f59e0b' : '#f43f5e')

/**
 * Student Success Center — 4 premium intelligence cards (DNA · Readiness ·
 * Career · Portfolio), all values derived from the Student Intelligence
 * Foundation. Detail dialogs open from each card's CTA.
 */
function SuccessCenter({ derived, profile, datasets, dnaOpen, readinessOpen, careerOpen, portfolioOpen, onOpenChange }) {
  const h = derived.academicHealth
  const dna = derived.academicDna
  /* Phase 27.1: ONE readiness snapshot — university + competitive contexts.
     `derived.examReadiness` (university only) is kept for backward compat,
     but the Success Center reads the unified orchestration so the ring and
     dialog cover BOTH contexts. */
  const readiness = [
    ...(derived.readiness?.university ?? []),
    ...(derived.readiness?.competitive ?? []),
  ]
  const readinessByFamily = derived.readiness?.byExamFamily ?? {}
  const career = derived.careerReadiness
  const portfolio = datasets.digitalPortfolio
  const achievements = derived.achievements

  /* overall intelligence = average of the four core engine scores */
  const overallIntelligence = Math.round(
    (h.score + derived.consistencyScore + derived.confidenceIndex + derived.improvementIndex) / 4
  )

  const today = new Date().toISOString().slice(0, 10)
  const nextExam = [...readiness].sort((a, b) => new Date(a.date) - new Date(b.date)).find((r) => r.date >= today) ?? readiness[0]
  const weakCount = dna.weakConcepts.length
  const competitiveChips = Object.entries(readinessByFamily)
    .map(([family, fam]) => ({ family, score: fam?.score ?? '—' }))

  const careerSkillBase = career.skillBase
  const communication = (portfolio.skills ?? []).find((s) => s.name === 'Communication')?.level ?? 70

  const cards = [
    {
      key: 'dna',
      icon: BrainCircuit,
      grad: 'from-indigo-600 to-blue-600',
      title: 'AI Academic DNA',
      subtitle: 'Your learning fingerprint',
      ringValue: h.score,
      ringLabel: `${h.score}`,
      ringSub: 'Health',
      headline: `${overallIntelligence}`,
      headlineSub: 'Overall intelligence',
      chips: [
        { label: 'Trend', value: h.delta >= 0 ? `+${h.delta}` : `${h.delta}`, tone: h.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500' },
        { label: 'Grade', value: h.grade },
        { label: 'Consistency', value: `${derived.consistencyScore}%` },
      ],
      summary: dna.summary,
      cta: 'View Details',
    },
    {
      key: 'readiness',
      icon: Target,
      grad: 'from-teal-500 to-emerald-500',
      title: 'AI Exam Readiness',
      subtitle: nextExam ? `Next: ${nextExam.title.slice(0, 34)}…` : 'No upcoming exam',
      ringValue: nextExam?.readiness ?? 0,
      ringLabel: `${nextExam?.readiness ?? 0}`,
      ringSub: 'Readiness',
      headline: `${derived.confidenceIndex}`,
      headlineSub: 'Confidence',
      chips: [
        { label: 'Next exam', value: nextExam ? formatDate(nextExam.date, 'MMM d') : '—' },
        { label: 'JEE ready', value: competitiveChips.find((c) => c.family === 'JEE') ? `${competitiveChips.find((c) => c.family === 'JEE').score}%` : '—' },
        { label: 'NEET ready', value: competitiveChips.find((c) => c.family === 'NEET') ? `${competitiveChips.find((c) => c.family === 'NEET').score}%` : '—' },
      ],
      summary: nextExam
        ? `${nextExam.title} on ${formatDate(nextExam.date, 'MMMM d')} — AI model rates you "${nextExam.level}" (${nextExam.context === 'university' ? 'university' : `${nextExam.examFamily} competitive`}).`
        : 'No upcoming examinations scheduled.',
      cta: 'View Details',
    },
    {
      key: 'career',
      icon: Briefcase,
      grad: 'from-amber-500 to-orange-500',
      title: 'AI Career Readiness',
      subtitle: datasets.careerProfile?.careerGoal ? `Goal: ${datasets.careerProfile.careerGoal}` : 'Goal not set',
      ringValue: career.score,
      ringLabel: `${career.score}`,
      ringSub: 'Ready',
      headline: `${careerSkillBase}`,
      headlineSub: 'Technical skills',
      chips: [
        { label: 'Communication', value: `${communication}%` },
        { label: 'Projects', value: `${(portfolio.projects ?? []).length}` },
        { label: 'Trend', value: career.delta >= 0 ? `+${career.delta}` : `${career.delta}`, tone: career.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500' },
      ],
      summary: `${career.level} — ${career.nextActions?.[0] ?? 'Keep building your profile.'}`,
      cta: 'View Details',
    },
    {
      key: 'portfolio',
      icon: FolderOpen,
      grad: 'from-fuchsia-500 to-pink-500',
      title: 'AI Digital Portfolio',
      subtitle: 'Certificates · projects · skills',
      ringValue: portfolio.resumeScore ?? 60,
      ringLabel: `${portfolio.resumeScore ?? 60}`,
      ringSub: 'Complete',
      headline: `${(portfolio.certifications ?? []).length + achievements.completed}`,
      headlineSub: 'Milestones',
      chips: [
        { label: 'Certificates', value: `${(portfolio.certifications ?? []).length}` },
        { label: 'Projects', value: `${(portfolio.projects ?? []).length}` },
        { label: 'Skills', value: `${(portfolio.skills ?? []).length}` },
      ],
      summary: `Resume ${portfolio.resumeScore ?? 60}% complete · ${achievements.completed}/${achievements.total} achievements earned.`,
      cta: 'Open Portfolio',
    },
  ]

  return (
    <section id="success-center" className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" /> Student Success Center
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Your academic intelligence at a glance</h2>
        </div>
        <Badge variant="gradient" className="px-3 py-1">AI powered</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="group flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between gap-2">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.grad} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 text-right">
                  <Badge variant={c.key === 'dna' ? 'gradient' : 'secondary'} size="sm">{c.title}</Badge>
                  {c.subtitle && <p className="mt-1 truncate text-[10px] font-medium text-slate-400">{c.subtitle}</p>}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <ProgressRing value={c.ringValue} size={84} stroke={8} label={c.ringLabel} sublabel={c.ringSub} color={ringColor(c.ringValue)} />
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">{c.headline}</p>
                  <p className="text-[10.5px] font-semibold text-slate-400">{c.headlineSub}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {c.chips.map((ch) => (
                  <div key={ch.label} className="rounded-xl bg-slate-50 px-2 py-1.5 text-center dark:bg-slate-800/60">
                    <p className={`truncate text-[12.5px] font-bold text-slate-800 dark:text-slate-100 ${ch.tone ?? ''}`}>{ch.value}</p>
                    <p className="truncate text-[9px] font-medium text-slate-400">{ch.label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-3 line-clamp-2 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">{c.summary}</p>

              <div className="mt-auto pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange({ [c.key]: true })}
                >
                  {c.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ---------- Detail dialogs ---------- */}
      <Dialog open={dnaOpen} onOpenChange={(v) => onOpenChange({ dna: v })}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-indigo-500" /> AI Academic DNA</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center gap-6 rounded-3xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-5 ring-1 ring-indigo-500/15">
              <ProgressRing value={h.score} size={110} stroke={10} label={`${h.score}`} sublabel="Health" color={ringColor(h.score)} />
              <div>
                <p className="text-[15px] font-bold text-slate-900 dark:text-white">{h.grade} · {h.trend}</p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{h.factors?.map((f) => `${f.label} ${f.value}`).join(' · ')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="success">Consistency {derived.consistencyScore}%</Badge>
                  <Badge variant="info">Confidence {derived.confidenceIndex}</Badge>
                  <Badge variant="gradient">Improvement {derived.improvementIndex}</Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-500/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Strengths</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {derived.strengths.map((s) => <Badge key={s.subjectCode} variant="success">{s.subject} · {s.mastery}%</Badge>)}
                </div>
              </div>
              <div className="rounded-2xl bg-rose-50/60 p-4 dark:bg-rose-500/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Weak areas</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {derived.weaknesses.map((s) => <Badge key={s.subjectCode} variant="danger">{s.subject} · {s.mastery}%</Badge>)}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Weak concepts to fix</p>
              <div className="flex flex-wrap gap-1.5">
                {dna.weakConcepts.slice(0, 8).map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-[12px] leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <span className="font-bold text-indigo-600 dark:text-indigo-300">Summary:</span> {dna.summary}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={readinessOpen} onOpenChange={(v) => onOpenChange({ readiness: v })}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-teal-500" /> AI Exam Readiness</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {readiness.map((r) => (
              <div key={r.examId} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{r.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={r.context === 'university' ? 'secondary' : 'gradient'} size="sm">{r.context === 'university' ? 'University' : r.examFamily}</Badge>
                    <Badge variant={r.level === 'Ready' ? 'success' : r.level === 'Almost Ready' ? 'info' : r.level === 'Needs Work' ? 'warning' : 'danger'} size="sm">{r.level}</Badge>
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(r.date, 'MMM d, yyyy')}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={r.readiness} className="h-2 flex-1" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.readiness}%</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.factors.map((f) => <Badge key={f.label} variant="secondary" size="sm">{f.label}: {Math.round(f.value)}%</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={careerOpen} onOpenChange={(v) => onOpenChange({ career: v })}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-amber-500" /> AI Career Readiness</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center gap-6 rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-5 ring-1 ring-amber-500/20">
              <ProgressRing value={career.score} size={110} stroke={10} label={`${career.score}`} sublabel="Ready" color={ringColor(career.score)} />
              <div>
                <p className="text-[15px] font-bold text-slate-900 dark:text-white">{career.level} · {career.trend}</p>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">Goal: {datasets.careerProfile?.careerGoal} · {datasets.careerProfile?.targetTimeline}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Skill gaps</p>
                <div className="mt-2 space-y-2">
                  {career.gaps.map((g) => (
                    <div key={g.skill}>
                      <div className="flex justify-between text-[11.5px]"><span className="font-semibold text-slate-600 dark:text-slate-300">{g.skill}</span><span className="font-bold text-rose-500">{g.gap}% gap</span></div>
                      <Progress value={g.resolved} className="mt-1 h-1.5" gradient="from-amber-500 to-orange-400" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next actions</p>
                <ul className="mt-2 space-y-1.5">
                  {career.nextActions.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-[11.5px] text-slate-600 dark:text-slate-300">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={portfolioOpen} onOpenChange={(v) => onOpenChange({ portfolio: v })}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5 text-fuchsia-500" /> AI Digital Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center gap-6 rounded-3xl bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 p-5 ring-1 ring-fuchsia-500/20">
              <ProgressRing value={portfolio.resumeScore ?? 60} size={110} stroke={10} label={`${portfolio.resumeScore ?? 60}`} sublabel="Complete" color={ringColor(portfolio.resumeScore ?? 60)} />
              <div className="grid flex-1 grid-cols-2 gap-2">
                {[
                  { label: 'Certificates', value: (portfolio.certifications ?? []).length },
                  { label: 'Projects', value: (portfolio.projects ?? []).length },
                  { label: 'Skills', value: (portfolio.skills ?? []).length },
                  { label: 'Achievements', value: achievements.completed },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/60 px-3 py-2 text-center ring-1 ring-slate-100 dark:bg-slate-900/40 dark:ring-slate-800">
                    <p className="font-display text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    <p className="text-[9.5px] font-medium text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Skills</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(portfolio.skills ?? []).map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-[11.5px]"><span className="font-semibold text-slate-600 dark:text-slate-300">{s.name}</span><span className="font-bold text-slate-700 dark:text-slate-200">{s.level}%</span></div>
                    <Progress value={s.level} className="mt-1 h-1.5" gradient="from-fuchsia-500 to-pink-400" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"><Award className="h-3 w-3" /> Achievements ({achievements.completed}/{achievements.total})</p>
              <div className="flex flex-wrap gap-1.5">
                {achievements.completedList.map((a) => <Badge key={a.id} variant="success">{a.title}</Badge>)}
                {achievements.inProgressList.map((a) => <Badge key={a.id} variant="secondary">{a.title} · {a.progress}%</Badge>)}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-4 ring-1 ring-indigo-500/15">
              <GraduationCap className="h-5 w-5 shrink-0 text-indigo-500" />
              <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="font-bold text-indigo-600 dark:text-indigo-300">Career goal:</span> {datasets.careerProfile?.careerGoal} · target {datasets.careerProfile?.targetTimeline}.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export { SuccessCenter }
export default SuccessCenter
