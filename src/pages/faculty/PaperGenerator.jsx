import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Copy, Layers, ListOrdered, Save, Sparkles, Wand2 } from 'lucide-react'
import { usePaperGenerator, usePaperDelete, usePaperDuplicate } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { BarCompare, DonutChart } from '@/components/charts'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Select, SelectItem, useToast } from '@/components/ui'
import { PaperCard, PaperPreviewDialog, PaperDeleteDialog, SharePaperDialog } from '@/components/assessment-workspace/paper-parts'

function PaperGenerator() {
  const { data, isLoading, isError, refetch } = usePaperGenerator()
  const { mutateAsync: deletePaper } = usePaperDelete()
  const { mutateAsync: duplicatePaper } = usePaperDuplicate()
  const [overlay, setOverlay] = useState({ added: [], removed: [] })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  /* Single source of truth = query data + a small local overlay for
     additions/removals, so mutations update the UI immediately without
     racing a state mirror of the array. */
  const papers = useMemo(() => {
    const base = data?.generatedPapers ?? []
    const filtered = base.filter((p) => !overlay.removed.includes(p.id))
    const added = overlay.added.filter((p) => !overlay.removed.includes(p.id))
    return [...added, ...filtered]
  }, [data, overlay])

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const qi = data.questionIntelligence
  const cfg = data.config

  const openPreview = (paper) => {
    setSelectedPaper(paper)
    setPreviewOpen(true)
  }

  const handleDuplicate = async (paper) => {
    try {
      const res = await duplicatePaper(paper.id)
      if (res?.ok) {
        setOverlay((o) => ({ ...o, added: [res.paper, ...o.added] }))
        toast.success('Duplicated', `${res.paper.title} added to your papers as a Draft.`)
      }
    } catch {
      toast.error('Could not duplicate', 'Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePaper(deleteTarget.id)
      setOverlay((o) => ({ ...o, removed: [...o.removed, deleteTarget.id] }))
      toast.success('Paper deleted', `${deleteTarget.title} was permanently removed.`)
      setDeleteTarget(null)
    } catch {
      toast.error('Could not delete', 'Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Question Bank & Papers · AI Question Paper Generator"
        title="AI question paper generator"
        description="Generate, manage and export complete question papers — with Bloom's taxonomy, CO/PO mapping and difficulty calibration."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'Question Intelligence', to: '/faculty/question-intelligence' }, { label: 'AI Paper Generator' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success('Template saved', 'Paper template saved for reuse.')}>
              <Save className="h-4 w-4" /> Save template
            </Button>
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <Wand2 className="h-4 w-4" /> Generate paper
            </Button>
          </>
        }
      />

      {/* Generated papers — full management */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 dark:text-white">
            <BookOpen className="h-4 w-4 text-indigo-500" /> Generated papers ({papers.length})
          </h2>
          <p className="text-[11px] font-medium text-slate-400">View · edit · duplicate · export · delete — everything from the card</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {papers.map((p, i) => (
            <PaperCard
              key={p.id}
              paper={p}
              index={i}
              onView={openPreview}
              onEdit={() => toast.success('Editing…', `${p.title} opened in the paper editor.`)}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteTarget}
              onShare={setShareTarget}
            />
          ))}
        </div>
      </div>

      {/* Question intelligence */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Difficulty distribution" subtitle="Questions & marks by difficulty">
          <BarCompare
            data={qi.difficultyDistribution}
            xKey="level"
            height={230}
            series={[
              { key: 'count', name: 'Questions', color: '#6366f1' },
              { key: 'marks', name: 'Marks', color: '#14b8a6' },
            ]}
          />
        </ChartCard>
        <ChartCard title="Bloom's taxonomy" subtitle="Cognitive level balance">
          <DonutChart
            data={qi.bloomDistribution.map((b) => ({ name: b.level, value: b.marks, color: ['#6366f1', '#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#8b5cf6'][['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].indexOf(b.level)] }))}
            height={230}
            centerLabel={`${qi.questionCount}`}
            centerSub="questions"
          />
        </ChartCard>
        <ChartCard title="Chapter coverage" subtitle="Question & marks per chapter">
          <BarCompare
            data={qi.chapterCoverage}
            xKey="chapter"
            height={230}
            series={[{ key: 'coverage', name: 'Coverage %', color: '#10b981' }]}
            formatter={(v) => `${v}%`}
          />
        </ChartCard>
      </div>

      {/* Paper preview dialog */}
      <PaperPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        paper={selectedPaper}
        onPublish={() => toast.success('Published 🎉', `${selectedPaper?.title} published to students.`)}
      />

      {/* Delete confirmation dialog */}
      <SharePaperDialog
        paper={shareTarget}
        open={!!shareTarget}
        onOpenChange={(v) => !v && setShareTarget(null)}
      />
      <PaperDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}
        paper={deleteTarget}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      {/* Generate dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-indigo-500" /> Generate question paper</DialogTitle>
            <DialogDescription>Configure the paper — AI drafts it with balanced difficulty, Bloom's levels and CO mapping.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pattern">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.patterns.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Course">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.courses.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Semester">
              <Select defaultValue="Sem 5">
                {cfg.semesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Chapter">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.chapters.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Total marks">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                <option>10</option><option>20</option><option>50</option><option>100</option>
              </select>
            </Field>
            <Field label="Duration (min)">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.durations.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.difficulties.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Question types">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                {cfg.questionTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/60 p-3.5 text-xs text-indigo-700 dark:bg-indigo-500/5 dark:text-indigo-300">
            <Sparkles className="h-4 w-4 shrink-0" /> The AI balances difficulty (30/50/20), Bloom's levels and chapter coverage automatically. You approve every question before publishing.
          </div>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setGenerateOpen(false); toast.success('Generating…', 'A second set (Paper B) is being drafted.') }}>
              <Copy className="h-4 w-4" /> Generate 2 sets
            </Button>
            <Button onClick={() => { setGenerateOpen(false); toast.success('Generating ✨', 'Paper drafted — 22 questions ready for review.') }}>
              <Wand2 className="h-4 w-4" /> Generate paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates */}
      <ChartCard title="Saved templates" subtitle="Reusable paper blueprints">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{t.name}</p>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">{t.marks} marks · {t.duration} min</p>
                <p className="text-[10.5px] text-slate-400">{t.sections}</p>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => { setGenerateOpen(true); toast.info(t.name, 'Template loaded into the generator.') }}>
                  <ListOrdered className="h-3.5 w-3.5" /> Use template
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </ChartCard>

      {/* Mentor CTA */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 p-6 text-white shadow-lift sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[15px] font-bold">Ask MediXO Mentor about this paper</p>
            <p className="text-xs text-white/80">Balance the difficulty. Suggest a tougher long answer. Generate another paper.</p>
          </div>
        </div>
        <Button variant="secondary" className="bg-white text-indigo-700 hover:bg-indigo-50" onClick={() => toast.info('MediXO Mentor', 'Opening the AI Teaching Assistant with paper context…')}>
          <Sparkles className="h-4 w-4" /> Ask MediXO Mentor
        </Button>
      </div>
    </div>
  )
}

export { PaperGenerator }
export default PaperGenerator
