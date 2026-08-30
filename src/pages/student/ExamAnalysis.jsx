import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, BrainCircuit, CheckCircle2, Download, FileText, ListChecks, MessageSquare,
  MinusCircle, Printer, Share2, Sparkles, Star, Target, Timer, Wand2, XCircle,
} from 'lucide-react'
import { useExamAnalysisOptions, useExamAnalysisById } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { StatCard } from '@/components/shared/stat-card'
import { AreaTrend, BarCompare, DonutChart } from '@/components/charts'
import { ProgressRing } from '@/components/shared/progress-ring'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, CardTitle, Select, SelectItem, useToast } from '@/components/ui'
import { useFilterCascade } from '@/hooks/use-filter-cascade'
import {
  buildExamAnalysisCascade,
  competitiveExamFamilies,
  examFamilyOf,
  visibleExamOptions,
} from './exam-analysis-filters'

const MASTERY_STYLES = { Strong: 'success', Average: 'info', Weak: 'warning', Critical: 'danger' }
const PRIORITY_STYLES = { Critical: 'danger', High: 'warning', Medium: 'info' }
const MISTAKE_COLORS = ['#f43f5e', '#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6', '#6366f1', '#94a3b8']

/* ------------------------------------------------------------------ */
/* Step 1 + Step 2 premium filter panel — nothing loads until Generate. */
/* Fixed-width fields, no clipped dropdowns, chips wrap, button aligned. */
/* ------------------------------------------------------------------ */
function StepField({ n, title, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-[10px] font-bold text-white">{n}</span>
        <span className="truncate">{title}</span>
        {hint && <span className="hidden truncate font-medium text-slate-400 sm:inline">· {hint}</span>}
      </div>
      {children}
    </div>
  )
}

function SelectionCard({
  options, examId, subject, context, family, availableFamilies,
  onContextChange, onFamilyChange, onExamChange, onSubjectChange,
  onGenerate, generating, hasGenerated,
}) {
  const exam = options.find((o) => o.id === examId)
  const competitive = (options ?? []).filter((o) => o.category !== 'University')
  const university = (options ?? []).filter((o) => o.category === 'University')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl border border-slate-200/70 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"
    >
      {/* decorative layers live in their own clipped container so the
          dropdowns below are never clipped by the card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="bg-grid mask-fade-y absolute inset-0 opacity-30" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 blur-3xl" />
      </div>

      <div className="relative p-6 sm:p-8">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          <Wand2 className="h-3.5 w-3.5" /> AI Exam Analysis · Workflow
        </p>
        <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Generate your exam intelligence report</h2>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          Pick an attempt and a subject (or all subjects) — the AI engine then builds the full analysis dashboard for that selection.
        </p>

        {/* Step 0 — exam context: the distinction is UNIVERSITY vs COMPETITIVE */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam context</p>
          <div className="flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {['University', 'Competitive'].map((c) => (
              <button
                key={c}
                onClick={() => onContextChange(c)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-all ${context === c ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
              >
                {c === 'University' ? '🏛️' : '🎯'} {c}
              </button>
            ))}
          </div>
          {context === 'Competitive' && availableFamilies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {['All', ...availableFamilies].map((f) => (
                <button
                  key={f}
                  onClick={() => onFamilyChange(f)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${family === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fixed-width step columns — dropdowns float above, never clipped */}
        <div className="mt-5 grid items-end gap-5 md:grid-cols-2 xl:grid-cols-[minmax(300px,380px)_minmax(300px,380px)_minmax(190px,auto)]">
          <StepField n={1} title="Select exam" hint={context === 'University' ? 'university paper' : `${family === 'NEET' ? 'NEET' : 'JEE'} paper / mock`}>
            <Select value={examId ?? ''} onValueChange={onExamChange} placeholder="Choose an exam attempt…" group="exam-analysis">
              {(options ?? []).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.category === 'University' ? '🏛️ ' : '🎯 '}{o.shortName} · {o.date}
                </SelectItem>
              ))}
            </Select>
          </StepField>

          <StepField n={2} title="Select subject" hint={exam ? 'subjects of this exam' : 'pick an exam first'}>
            <Select 
              value={subject ?? ''} 
              onValueChange={onSubjectChange} 
              placeholder={examId ? 'Choose a subject…' : 'Pick an exam first'} 
              group="exam-analysis"
              disabled={!examId}
              helper={!examId ? 'Select an exam first' : undefined}
            >
              {(exam?.subjects ?? ['All Subjects']).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </Select>
          </StepField>

          {/* Generate — same height as the fields, always bottom-aligned */}
          <div className="flex items-end md:col-span-2 xl:col-span-1">
            <Button
              size="lg"
              className="h-11 w-full px-6"
              disabled={!examId || !subject || generating}
              onClick={onGenerate}
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analysing…
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" /> {hasGenerated ? 'Regenerate analysis' : 'Generate analysis'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick-select chips — grouped by category, wrap on narrow screens */}
        <div className="mt-6 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick select</p>
          {[
            { label: 'Competitive', items: competitive },
            { label: 'University', items: university },
          ].filter((g) => g.items.length).map((g) => (
            <div key={g.label} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800">
                {g.label}
              </span>
              {g.items.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    onContextChange(g.label === 'University' ? 'University' : 'Competitive')
                    onExamChange(o.id)
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${examId === o.id && context === g.label ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400'}`}
                >
                  {o.shortName}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Full analysis dashboard (reuses every existing analysis section).   */
/* Exported for the faculty attempt-analysis view (Phase 3) — the SAME   */
/* analysis surface, never a duplicate engine/page.                      */
/* ------------------------------------------------------------------ */
export function AnalysisDashboard({ data, subject }) {
  const isAll = subject === 'All Subjects' || !subject
  const activeSubject = isAll ? null : subject

  const h = data.hero
  const qi = data.questionIntelligence
  const ti = data.timeIntelligence
  const subjectMeta = activeSubject ? (data.subjects ?? []).find((s) => s.name === activeSubject) : null

  const subjects = activeSubject ? (subjectMeta ? [subjectMeta] : []) : data.subjects
  const chapters = activeSubject ? (data.chapters ?? []).filter((c) => c.subject === activeSubject) : data.chapters
  const topics = activeSubject ? (data.topics ?? []).filter((t) => t.subject === activeSubject) : data.topics
  const questionReview = activeSubject ? (data.questionReview ?? []).filter((q) => q.subject === activeSubject) : data.questionReview
  const mistakeList = activeSubject ? (data.mistakeList ?? []).filter((m) => m.subject === activeSubject) : data.mistakeList
  const timeDistribution = activeSubject
    ? (ti.distribution ?? []).filter((d) => d.section === activeSubject)
    : ti.distribution

  /* University examination record strip — venue, hall, seat, admit card etc. */
  const isUniversity = data.meta?.pattern === 'University' || !!data.meta?.hallNumber
  const metaFields = isUniversity
    ? [
        { label: 'Course', value: data.meta.course },
        { label: 'Faculty', value: data.meta.faculty },
        { label: 'Semester · Year', value: `${data.meta.semester} · ${data.meta.academicYear}` },
        { label: 'Date · Duration', value: `${data.meta.date} · ${data.meta.duration}` },
        { label: 'Venue', value: `${data.meta.venue} · Hall ${data.meta.hallNumber}` },
        { label: 'Seat', value: data.meta.seatNumber },
        { label: 'Max / Passing marks', value: `${data.meta.totalMarks} / ${data.meta.passingMarks}` },
        { label: 'Result status', value: data.meta.resultStatus },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* University exam record */}
      {isUniversity && (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-indigo-500" /> {data.meta.examName}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={data.meta.examStatus === 'Completed' ? 'success' : 'info'} size="sm">{data.meta.examStatus}</Badge>
              <Badge variant={data.meta.admitCard === 'Issued' || data.meta.admitCard === 'Available' ? 'gradient' : 'secondary'} size="sm">Admit card: {data.meta.admitCard}</Badge>
              <Badge variant={data.meta.resultStatus === 'Declared' ? 'success' : 'warning'} size="sm">{data.meta.resultStatus}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {metaFields.map((f) => (
              <div key={f.label} className="rounded-2xl bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                <p className="mt-0.5 truncate text-[11.5px] font-bold text-slate-800 dark:text-slate-100">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject context banner */}
      {activeSubject && subjectMeta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-indigo-600/10 to-teal-500/10 p-4 ring-1 ring-indigo-500/15">
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-indigo-500" />
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              Showing <span className="font-bold text-indigo-600 dark:text-indigo-300">{activeSubject}</span> — {subjectMeta.score}/{subjectMeta.maxMarks} marks · {subjectMeta.accuracy}% accuracy
            </p>
          </div>
          <Badge variant="gradient">Subject-level analysis</Badge>
        </div>
      )}

      {/* ============ 1. Executive Summary ============ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 p-7 text-white shadow-lift sm:p-9">
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white ring-white/30">{data.meta.examId}</Badge>
              <Badge className="bg-white/15 text-white ring-white/30">{data.meta.pattern}</Badge>
              <Badge className="bg-emerald-400/90 text-emerald-950 ring-transparent">{h.badge}</Badge>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              {h.score}/{h.maxScore} marks
              {h.percentile != null
                ? <> · {h.percentile} percentile</>
                : <> · Grade {h.grade}{h.rank != null ? ` · Rank ${h.rank}` : ''}</>}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">{h.aiSummary}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">
                {h.rank != null ? `Rank ${h.rank}` : 'Not yet attempted'}{h.batchRank != null ? ` · Batch #${h.batchRank}/${h.cohortSize}` : ''}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">Grade {h.grade}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">
                <BrainCircuit className="h-3 w-3" /> Confidence {h.confidenceIndex}/100
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6">
            <ProgressRing value={h.percentage} size={140} stroke={11} color="#ffffff" track="rgba(255,255,255,0.2)" label={`${h.percentage}%`} sublabel="Score" />
            <div className="hidden flex-col gap-3 sm:flex">
              <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/20">
                <p className="font-display text-xl font-bold">{h.readinessScore}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Readiness</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/20">
                <p className="font-display text-xl font-bold">{h.healthScore}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Health</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 2. Question Intelligence ============ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Attempted', value: String(qi.attempted), delta: `${qi.attemptRatio}% attempt ratio`, up: true, icon: 'ListChecks', gradient: 'from-indigo-500 to-blue-500' },
          { label: 'Correct', value: String(qi.correct), delta: `${qi.successRate}% success rate`, up: true, icon: 'CheckCircle2', gradient: 'from-emerald-500 to-teal-500' },
          { label: 'Incorrect', value: String(qi.incorrect), delta: `${qi.guessAttempts} guess attempts`, up: false, icon: 'XCircle', gradient: 'from-rose-500 to-red-500' },
          { label: 'Skipped', value: String(qi.skipped), delta: `−${qi.negativeMarks} negative marks`, up: false, icon: 'MinusCircle', gradient: 'from-amber-500 to-orange-500' },
        ].map((k, i) => <StatCard key={k.label} {...k} index={i} />)}
      </div>

      {/* ============ 3. Subject Analysis ============ */}
      <div className="grid gap-4 md:grid-cols-3">
        {(subjects ?? []).map((s, i) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">{s.name}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">{s.score}<span className="text-sm text-slate-400">/{s.maxMarks}</span></p>
                </div>
                <ProgressRing value={s.accuracy} size={64} stroke={7} label={`${s.accuracy}%`} sublabel="" color={s.accuracy >= 70 ? '#10b981' : s.accuracy >= 55 ? '#f59e0b' : '#f43f5e'} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] font-semibold text-slate-400">
                <span className="rounded-full bg-slate-50 px-2 py-0.5 dark:bg-slate-800/60">⏱ {s.time} min</span>
                <span className="rounded-full bg-slate-50 px-2 py-0.5 dark:bg-slate-800/60">Rank #{s.rank}</span>
                <Badge variant={s.difficulty === 'Easy' ? 'success' : s.difficulty === 'Medium' ? 'warning' : 'danger'} size="sm">{s.difficulty}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50/60 p-2.5 dark:bg-emerald-500/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Strong</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-300">{s.strongAreas.join(' · ')}</p>
                </div>
                <div className="rounded-xl bg-rose-50/60 p-2.5 dark:bg-rose-500/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Weak</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-slate-600 dark:text-slate-300">{s.weakAreas.join(' · ')}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ============ 4. Chapter Intelligence ============ */}
      <ChartCard title="Chapter intelligence" subtitle={`Accuracy · marks · time · attempt rate per chapter${activeSubject ? ` (${activeSubject})` : ''}`} actions={<Badge variant="gradient"><Target className="h-3 w-3" /> Mastery tracked</Badge>}>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Chapter</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Accuracy</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Marks</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Time</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attempt</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((c) => (
                <tr key={c.chapter} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.chapter}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${c.accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : c.accuracy >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>{c.accuracy}%</span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{c.marks}</td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{c.time} min</td>
                  <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{c.attempted}%</td>
                  <td className="px-4 py-3 text-right"><Badge variant={MASTERY_STYLES[c.mastery]}>{c.mastery}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* ============ 5. Topic Intelligence + 6. Mistake Classification ============ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Topic intelligence" subtitle={`Concept mastery levels across all topics${activeSubject ? ` (${activeSubject})` : ''}`}>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span key={t.topic} className="flex items-center gap-2 rounded-2xl border border-slate-100 px-3 py-2 text-[12px] dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{t.topic}</span>
                <Badge variant={MASTERY_STYLES[t.level]} size="sm">{t.level} · {t.mastery}%</Badge>
              </span>
            ))}
          </div>
        </ChartCard>
        <div className="space-y-6">
          <ChartCard title="Mistake classification" subtitle="Every wrong question categorized by error type">
            <div className="grid gap-4 sm:grid-cols-2">
              <DonutChart
                data={data.mistakes.map((m, i) => ({ name: m.category, value: m.count, color: MISTAKE_COLORS[i % MISTAKE_COLORS.length] }))}
                height={210}
                centerLabel={`${data.mistakes.reduce((a, m) => a + m.count, 0)}`}
                centerSub="mistakes"
              />
              <div className="space-y-2">
                {data.mistakes.map((m, i) => (
                  <div key={m.category} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: MISTAKE_COLORS[i % MISTAKE_COLORS.length] }} />
                      {m.category}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
          <ChartCard title="Top mistakes to fix" subtitle="Highest-impact errors to review">
            <div className="space-y-2">
              {mistakeList.slice(0, 4).map((m) => (
                <div key={m.q} className="flex items-start gap-3 rounded-2xl border border-rose-100 p-3 dark:border-rose-500/20">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[11px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{m.q}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{m.topic} <span className="font-medium text-slate-400">· {m.subject}</span></p>
                    <p className="text-[11px] text-slate-400">{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ============ 7. Difficulty + 8. Time Intelligence ============ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Difficulty analysis" subtitle="Accuracy, attempt and time by difficulty">
          <BarCompare
            data={data.difficulty}
            xKey="level"
            height={250}
            series={[
              { key: 'accuracy', name: 'Accuracy %', color: '#10b981' },
              { key: 'attempted', name: 'Attempted', color: '#6366f1' },
              { key: 'time', name: 'Avg time (min)', color: '#f59e0b' },
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Time intelligence"
          subtitle={`Average ${ti.avgTimePerQuestion} min/question · fastest ${ti.fastestQuestion.q} (${ti.fastestQuestion.time} min) · slowest ${ti.slowestQuestion.q} (${ti.slowestQuestion.time} min) · ${ti.navigationCount} navigations`}
          actions={<Badge variant="gradient"><Timer className="h-3 w-3" /> Score {ti.timeManagementScore}/100</Badge>}
        >
          <div className="space-y-4">
            {timeDistribution.map((s) => (
              <div key={s.section}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{s.section}</span>
                  <span className="font-bold text-slate-500 dark:text-slate-300">
                    {s.used}m / {s.allocated}m
                    <span className={`ml-2 ${s.efficiency >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{s.efficiency}% eff.</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400" style={{ width: `${Math.min((s.used / s.allocated) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ============ 9. Comparison ============ */}
      <ChartCard title="Performance comparison" subtitle="Your score vs benchmarks">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: data.comparison.previousTest.label, value: `${data.comparison.previousTest.score}`, extra: `${data.comparison.previousTest.percentile}%ile` },
            { label: data.comparison.previousMonth.label, value: `${data.comparison.previousMonth.score}`, extra: `${data.comparison.previousMonth.percentile}%ile` },
            { label: data.comparison.batchAverage.label, value: `${data.comparison.batchAverage.score}`, extra: `${data.comparison.batchAverage.percentile}%ile` },
            { label: data.comparison.instituteAverage.label, value: `${data.comparison.instituteAverage.score}`, extra: `${data.comparison.instituteAverage.percentile}%ile` },
            { label: 'Top performer', value: `${data.comparison.topPerformer.score}`, extra: data.comparison.topPerformer.name },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-100 p-4 text-center dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400">{c.label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
              {c.extra && <p className="text-[10px] font-medium text-slate-400">{c.extra}</p>}
            </motion.div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(data.comparison.deltas ?? []).map((d) => (
            <span key={d.label} className={`rounded-full px-3 py-1 text-[11px] font-bold ${d.up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'}`}>
              {d.label}: {d.value}
            </span>
          ))}
        </div>
      </ChartCard>

      {/* ============ 10. AI Recommendations ============ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardTitle className="flex items-center gap-2 text-[15px]"><Sparkles className="h-4 w-4 text-indigo-500" /> AI recommendations</CardTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-rose-50/70 p-4 dark:bg-rose-500/5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Weak chapters</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{(data.recommendations.weakChapters ?? []).map((s) => <Badge key={s} variant="danger">{s}</Badge>)}</div>
            </div>
            <div className="rounded-2xl bg-indigo-50/70 p-4 dark:bg-indigo-500/5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Weak topics</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{(data.recommendations.weakTopics ?? []).map((s) => <Badge key={s} variant="info">{s}</Badge>)}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {(data.recommendations.priorityRevision ?? []).map((r) => (
              <div key={r.topic} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{r.topic}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{r.timeframe}</span>
                  <Badge variant={PRIORITY_STYLES[r.priority]}>{r.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <CardTitle className="flex items-center gap-2 text-[15px]"><FileText className="h-4 w-4 text-amber-500" /> Suggested resources</CardTitle>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Suggested PYQs</p>
                <div className="mt-1.5 space-y-1.5">
                  {(data.recommendations.suggestedPYQs ?? []).map((p) => <p key={p.title} className="flex items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300"><Star className="h-3 w-3 shrink-0 text-amber-500" />{p.title}</p>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Practice & mocks</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(data.recommendations.practiceQuestions ?? []).map((p) => <Badge key={p.title} variant="outline" size="sm">{p.title}</Badge>)}
                  {(data.recommendations.mockTests ?? []).map((m) => <Badge key={m.title} variant="outline" size="sm">{m.title}</Badge>)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recommended lectures</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(data.recommendations.lectures ?? []).map((l) => <Badge key={l.title} variant="info" size="sm">{l.title}</Badge>)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ============ 11. Prediction ============ */}
      <ChartCard
        title="AI prediction"
        subtitle="Projected outcomes based on this attempt and your trajectory"
        actions={<Badge variant={data.prediction.riskLevel === 'Low' ? 'success' : 'warning'}><AlertTriangle className="h-3 w-3" /> Risk: {data.prediction.riskLevel}</Badge>}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(data.prediction.university
            ? [
              { label: 'Expected CGPA', value: data.prediction.expectedCGPA ?? '—', color: 'text-indigo-600 dark:text-indigo-300' },
              { label: 'Expected grade', value: data.prediction.expectedGrade ?? '—', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Expected class rank', value: data.prediction.classRank != null ? `#${data.prediction.classRank}` : '—', color: 'text-teal-600 dark:text-teal-400' },
              { label: 'Target probability', value: `${data.prediction.targetProbability ?? '—'}%`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Readiness score', value: `${h.readinessScore}/100`, color: 'text-violet-600 dark:text-violet-300' },
            ]
            : [
              { label: 'Expected JEE percentile', value: data.prediction.jeePercentile ? `${data.prediction.jeePercentile}%ile` : '—', color: 'text-indigo-600 dark:text-indigo-300' },
              { label: 'Expected AIR', value: data.prediction.expectedAIR ? `#${data.prediction.expectedAIR.toLocaleString('en-IN')}` : '—', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Expected improvement', value: data.prediction.expectedImprovement ?? '—', color: 'text-teal-600 dark:text-teal-400' },
              { label: 'Target probability', value: `${data.prediction.targetProbability ?? '—'}%`, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Readiness score', value: `${h.readinessScore}/100`, color: 'text-violet-600 dark:text-violet-300' },
            ]
          ).map((p, i) => (
            <motion.div key={p.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-slate-100 p-4 text-center dark:border-slate-800">
              <p className={`font-display text-2xl font-bold ${p.color}`}>{p.value}</p>
              <p className="mt-1 text-[10.5px] font-semibold text-slate-400">{p.label}</p>
            </motion.div>
          ))}
        </div>
        {data.prediction.neetScore && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 text-[12px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Target className="h-3.5 w-3.5" /> Expected NEET score: {data.prediction.neetScore}
          </div>
        )}
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold text-slate-400">Score trajectory</p>
          <AreaTrend data={data.prediction.trajectory} xKey="exam" height={150} series={[{ key: 'score', name: 'Score', color: '#8b5cf6' }]} />
        </div>
      </ChartCard>

      {/* ============ 12. Question review table + Mentor CTA ============ */}
      <ChartCard title="Question-by-question review" subtitle={`Attempt-level intelligence for every question${activeSubject ? ` (${activeSubject})` : ''}`}>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Q</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Topic</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Marks</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {questionReview.map((q) => (
                <tr key={q.q} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{q.q}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" size="sm">{q.subject}</Badge></td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{q.topic}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{q.type}</td>
                  <td className="px-4 py-3 text-center"><Badge variant={q.status === 'Correct' ? 'success' : q.status === 'Incorrect' ? 'danger' : 'warning'}>{q.status}</Badge></td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">{q.marks}</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{q.time} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Mentor CTA */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 p-6 text-white shadow-lift sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[15px] font-bold">Ask MediXO Mentor about this test</p>
            <p className="text-xs text-white/80">Why did my accuracy drop in Mathematics? Explain my weakest chapter. Build a JEE revision plan.</p>
          </div>
        </div>
        <Button asChild variant="secondary" className="bg-white text-indigo-700 hover:bg-indigo-50">
          <Link to="/student/mentor">
            <Sparkles className="h-4 w-4" /> Ask MediXO Mentor
          </Link>
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page — workflow: select exam → select subject → generate.           */
/* ------------------------------------------------------------------ */
function ExamAnalysis() {
  const { data: optionsData, isLoading, isError, refetch } = useExamAnalysisOptions()
  const [generated, setGenerated] = useState(false)
  const toast = useToast()

  const options = optionsData?.items ?? []
  /* Context isolation (Part 10): university and competitive options are
     filtered before they ever reach the selectors — no mixed lists.
     State cascades through the shared engine: context → family → exam →
     subject; switching context/family clears any exam/subject that no
     longer belongs to the new context (JEE/NEET/University stay isolated). */
  const cascadeConfig = useMemo(
    () => ({ ...buildExamAnalysisCascade(options), initialValues: { context: 'University', family: 'All', examId: '', subject: '' } }),
    [options],
  )
  const { values, set } = useFilterCascade(cascadeConfig)
  const { context, family, examId, subject } = values

  const { data: analysisData, isLoading: analysisLoading, isFetching: analysisFetching, isError: analysisError, refetch: refetchAnalysis } = useExamAnalysisById(generated ? examId : null)
  const availableFamilies = useMemo(() => competitiveExamFamilies(options), [options])
  const visibleOptions = useMemo(() => visibleExamOptions(options, context, family), [options, context, family])

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const selectedExam = visibleOptions.find((o) => o.id === examId)

  const handleContextChange = (c) => {
    set('context', c)
    setGenerated(false)
  }
  const handleFamilyChange = (f) => {
    set('family', f)
    setGenerated(false)
  }

  const handleExamChange = (id) => {
    set('examId', id)
    setGenerated(false)
  }

  const handleGenerate = () => {
    if (!examId || !subject) return
    setGenerated(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const generating = Boolean(generated && (analysisLoading || analysisFetching) && !analysisData)
  const showAnalysis = generated && !generating && !!analysisData

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI Academic Intelligence · Exam Analysis"
        title="AI Exam Analysis"
        description="Deep AI-powered academic intelligence for every attempt — pick an exam and subject to generate your report."
        breadcrumbs={[{ label: 'Student' }, { label: 'Examinations', to: '/student/examinations' }, { label: 'AI Exam Analysis' }]}
        actions={
          showAnalysis && analysisData ? (
            <>
              <Button variant="outline" size="sm" onClick={() => toast.info('Not available yet', 'PDF export is not available yet.')}>
                <Download className="h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info('Not available yet', 'Shareable report links are not available yet.')}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button asChild size="sm">
                <Link to="/student/mentor">
                  <Sparkles className="h-4 w-4" /> Revision plan
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <SelectionCard
        options={visibleOptions}
        examId={examId}
        subject={subject}
        context={context}
        family={family}
        availableFamilies={availableFamilies}
        onContextChange={handleContextChange}
        onFamilyChange={handleFamilyChange}
        onExamChange={handleExamChange}
        onSubjectChange={(s) => { set('subject', s); setGenerated(false) }}
        onGenerate={handleGenerate}
        generating={generating}
        hasGenerated={generated}
      />

      {generated && generating && <DashboardSkeleton cards={4} />}
      {generated && analysisError && !generating && <ErrorState title="Analysis unavailable" onRetry={() => refetchAnalysis()} />}
      {showAnalysis && analysisData && (
        <>
          {/* selection summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 text-[10px] font-bold text-white">✓</span>
              Analysing <span className="font-bold text-indigo-600 dark:text-indigo-300">{selectedExam?.shortName ?? examId}</span> · <span className="font-bold text-indigo-600 dark:text-indigo-300">{subject}</span>
              {analysisFetching && <span className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />}
            </p>
            <Button variant="ghost" size="sm" onClick={() => { setGenerated(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              Change selection
            </Button>
          </div>
          <AnalysisDashboard data={analysisData} subject={subject} />
        </>
      )}

      {!generated && !generating && (
        <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/10 to-teal-500/10 ring-1 ring-indigo-500/20">
            <BrainCircuit className="h-6 w-6 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">Your report will appear here</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
            Complete steps 1 and 2 above and hit <span className="font-bold text-indigo-600 dark:text-indigo-300">Generate analysis</span> — the full dashboard (question intelligence, chapter & topic mapping, mistakes, predictions) loads instantly.
          </p>
        </div>
      )}
    </div>
  )
}

export { ExamAnalysis }
export default ExamAnalysis
