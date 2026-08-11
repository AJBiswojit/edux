import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpenCheck, ClipboardList, FilePlus2, FileText, LayoutTemplate, ListChecks, Sparkles, Star, Wand2 } from 'lucide-react'
import { useFacultyAiStudio } from '@/services/extra'
import { PageHeader } from '@/components/shared/page-header'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, useToast } from '@/components/ui'
import { formatRelative } from '@/utils/format'

const TYPE_ICONS = {
  'Lesson plan': BookOpenCheck,
  Quiz: ListChecks,
  Worksheet: FileText,
  'Case study': LayoutTemplate,
  Slides: FilePlus2,
  Announcement: ClipboardList,
}

function AIContentStudio() {
  const { data, isLoading, isError, refetch } = useFacultyAiStudio()
  const [generateOpen, setGenerateOpen] = useState(false)
  const toast = useToast()

  if (isLoading) return <DashboardSkeleton cards={2} />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        eyebrow="AI Tools · Content Studio"
        title="AI content studio"
        description="One studio for everything AI-generated: lesson plans, quizzes, worksheets, rubrics and slides — drafted by AI, approved by you."
        breadcrumbs={[{ label: 'Faculty' }, { label: 'AI Content Studio' }]}
        actions={
          <Button size="sm" onClick={() => setGenerateOpen(true)}>
            <Wand2 className="h-4 w-4" /> Generate content
          </Button>
        }
      />

      <Tabs defaultValue="templates">
        <TabsList className="mb-1 flex w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="templates"><LayoutTemplate className="h-4 w-4" /> Content templates</TabsTrigger>
          <TabsTrigger value="rubrics"><ListChecks className="h-4 w-4" /> Rubric library</TabsTrigger>
          <TabsTrigger value="history"><Sparkles className="h-4 w-4" /> Generation history</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.contentTemplates.map((t, i) => {
              const Icon = TYPE_ICONS[t.type] ?? FileText
              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className="group h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </span>
                      <Badge variant="secondary" size="sm">{t.type}</Badge>
                    </div>
                    <h3 className="mt-3.5 text-[14.5px] font-bold text-slate-900 dark:text-white">{t.name}</h3>
                    <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                      <span>{t.uses} uses</span>
                      <span className="flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {t.rating}</span>
                    </div>
                    <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => { setGenerateOpen(true); toast.info(t.name, 'Opens the generator pre-configured.') }}>
                      <Wand2 className="h-3.5 w-3.5" /> Use template
                    </Button>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="rubrics">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.rubricTemplates.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="h-full p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-300">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-[14px] font-bold leading-snug text-slate-900 dark:text-white">{r.name}</h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {r.criteria.map((c) => <Badge key={c} variant="outline" size="sm">{c}</Badge>)}
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-slate-400">{r.levels} mastery levels · used {r.uses}×</p>
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.success('Rubric applied', `${r.name} attached to the active assignment.`)}>
                    Apply rubric
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Course</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Generated</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.generationHistory.map((g, i) => (
                    <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5"><Badge variant="secondary" size="sm">{g.type}</Badge></td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-100">{g.title}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{g.course}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{formatRelative(g.generated)}</td>
                      <td className="px-5 py-3.5 text-center"><Badge variant={g.status === 'Approved' ? 'success' : 'warning'}>{g.status}</Badge></td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {g.rating}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Generator dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-indigo-500" /> AI content generator</DialogTitle>
            <DialogDescription>Describe what you need — the AI drafts it with your course context and question bank.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Content type">
              <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100">
                <option>Lesson plan</option><option>Quiz</option><option>Worksheet</option><option>Rubric</option><option>Case study</option><option>Slides outline</option>
              </select>
            </Field>
            <Field label="Course & topic">
              <Input placeholder="e.g. CS501 — Network flows (medium difficulty)" />
            </Field>
            <Field label="Prompt / requirements">
              <Textarea rows={4} placeholder="Include learning outcomes, duration, batch strength, any constraints…" />
            </Field>
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/60 p-3.5 text-xs text-indigo-700 dark:bg-indigo-500/5 dark:text-indigo-300">
              <Sparkles className="h-4 w-4 shrink-0" /> Generates with Bloom's level tags, CO mapping and answer keys where relevant.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={() => { setGenerateOpen(false); toast.success('Generation started ✨', 'Draft will be ready in ~20 seconds — you approve before it goes live.') }}>
              <Wand2 className="h-4 w-4" /> Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AIContentStudio }
export default AIContentStudio
