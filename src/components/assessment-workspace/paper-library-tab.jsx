/**
 * MediXO EduX — Assessment Workspace · Tab 5: Paper Library (Phase 9 Backend-Ready).
 * No samplePapers fallback. Fetches from backend via centralized API client.
 * Backend unavailable → empty state "Paper Library unavailable" / "Connect the EduX backend"
 */

import { useEffect, useState } from 'react'
import { BookOpen, Database, History } from 'lucide-react'
import { useAiPaperLibrary, usePaperDeleteBackend, usePaperDuplicateBackend, usePaperArchiveBackend } from '@/services/faculty-papers'
import { StatCard } from '@/components/shared/stat-card'
import { DashboardSkeleton, ErrorState } from '@/components/shared/loading'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, useToast } from '@/components/ui'
import { PaperCard, PaperPreviewDialog, PaperDeleteDialog, SharePaperDialog } from './paper-parts'
import { formatDate } from '@/utils/format'

function PaperLibraryTab({ onEditPaper = null, onGoToGenerate = null }) {
  const { data, isLoading, isError, error, refetch } = useAiPaperLibrary()
  const { mutateAsync: deletePaper } = usePaperDeleteBackend()
  const { mutateAsync: duplicatePaper } = usePaperDuplicateBackend()
  const { mutateAsync: archivePaper } = usePaperArchiveBackend()
  const [filter, setFilter] = useState('All')
  const [modeFilter, setModeFilter] = useState('All')
  const [examFilter, setExamFilter] = useState('All')
  const [shareTarget, setShareTarget] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { refetch() }, [refetch])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  if (isLoading) return <DashboardSkeleton cards={3} />
  if (isError) {
    const isBackendDown = !error?.response || error?.response?.status >= 500
    if (isBackendDown) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <Database className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Paper Library unavailable</p>
          <p className="mt-1 text-xs text-slate-400">The paper library is temporarily unavailable. Please try again later.</p>
          <p className="mt-2 text-[11px] text-slate-400">{String(error?.message ?? 'Network error')}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </div>
      )
    }
    return <ErrorState onRetry={() => refetch()} />
  }

  const papers = data?.generatedPapers ?? []
  const statusFiltered = filter === 'All' ? papers : filter === 'Archived' ? papers.filter((p) => p.archived) : papers.filter((p) => p.status === filter)
  const filtered = statusFiltered.filter((p) => {
    const mode = p.domain ?? p.mode ?? 'University'
    if (modeFilter === 'University' && mode !== 'University') return false
    if (modeFilter === 'Competitive' && mode !== 'Competitive') return false
    if (examFilter === 'JEE' && (p.examFamily ?? p.exam) !== 'JEE' && !String(p.examType ?? '').includes('JEE') && (p.examFamily ?? '') !== 'JEE Main') return false
    if (examFilter === 'NEET' && (p.examFamily ?? p.exam) !== 'NEET' && !String(p.examType ?? '').includes('NEET') && (p.examFamily ?? '') !== 'NEET UG') return false
    if (search) {
      const hay = `${p.title} ${p.subject ?? ''} ${p.course ?? ''} ${p.exam ?? ''} ${p.examType ?? ''}`.toLowerCase()
      if (!hay.includes(search.toLowerCase())) return false
    }
    return true
  })
  const uniCount = papers.filter((p) => (p.domain ?? p.mode ?? 'University') === 'University').length
  const compCount = papers.filter((p) => (p.domain ?? p.mode ?? 'University') === 'Competitive').length
  const jeeCount = papers.filter((p) => (p.domain ?? p.mode ?? 'University') === 'Competitive' && ((p.examFamily ?? p.exam) === 'JEE' || String(p.examType ?? '').includes('JEE') || (p.examFamily ?? '') === 'JEE Main')).length
  const neetCount = papers.filter((p) => (p.domain ?? p.mode ?? 'University') === 'Competitive' && ((p.examFamily ?? p.exam) === 'NEET' || String(p.examType ?? '').includes('NEET') || (p.examFamily ?? '') === 'NEET UG')).length
  const totalQuestions = papers.reduce((a, p) => a + (p.questions ?? p.selectedQuestionIds?.length ?? 0), 0)
  const readyCount = papers.filter((p) => p.status === 'Ready' && !p.archived).length

  const handleDuplicate = async (paper) => {
    try {
      const res = await duplicatePaper(paper.id)
      if (res?.ok || res?.paper) {
        toast.success('Duplicated', `${res.paper?.title ?? paper.title} added as a copy.`)
        refetch()
      }
    } catch {
      toast.error('Could not duplicate', 'Please try again.')
    }
  }

  const handleArchive = async (paper) => {
    try {
      const res = await archivePaper({ id: paper.id, archived: !paper.archived })
      toast.success(paper.archived ? 'Restored' : 'Archived', `${res.paper?.title ?? paper.title} ${paper.archived ? 'restored to the library.' : 'moved to the archive.'}`)
      refetch()
    } catch {
      toast.error('Could not archive', 'Please try again.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePaper(deleteTarget.id)
      toast.success('Paper deleted', `${deleteTarget.title} was permanently removed.`)
      setDeleteTarget(null)
      refetch()
    } catch {
      toast.error('Could not delete', 'Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Papers in library" value={String(papers.length)} sub="saved papers" icon="BookOpen" gradient="from-indigo-500 to-blue-500" />
        <StatCard index={1} label="Ready to publish" value={String(readyCount)} sub="status · Ready" icon="CheckCircle2" gradient="from-emerald-500 to-teal-500" />
        <StatCard index={2} label="Total questions" value={String(totalQuestions)} sub="across all papers" icon="ListChecks" gradient="from-amber-500 to-orange-500" />
        <StatCard index={3} label="Total marks" value={String(papers.reduce((a, p) => a + (p.totalMarks ?? 0), 0))} sub="library capacity" icon="Target" gradient="from-violet-500 to-purple-500" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {['All', 'Ready', 'Draft', 'In Review', 'Archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${filter === f ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}
          >
            {f}
            <span className="ml-1.5 opacity-60">
              {f === 'All' ? papers.length : f === 'Archived' ? papers.filter((p) => p.archived).length : papers.filter((p) => p.status === f).length}
            </span>
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} papers</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Domain</span>
        {['All', 'University', 'Competitive'].map((m) => (
          <button
            key={m}
            onClick={() => { setModeFilter(m); setExamFilter('All') }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${modeFilter === m ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}
          >
            {m}
            <span className="ml-1.5 opacity-60">{m === 'All' ? papers.length : m === 'University' ? uniCount : compCount}</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search papers…" className="h-9 w-48 pl-8 text-xs sm:w-64" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {modeFilter === 'Competitive' && (
          <>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Exam Family</span>
            {['All', 'JEE', 'NEET'].map((e) => (
              <button
                key={e}
                onClick={() => setExamFilter(e)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${examFilter === e ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}
              >
                {e}
                <span className="ml-1.5 opacity-60">{e === 'All' ? compCount : e === 'JEE' ? jeeCount : neetCount}</span>
              </button>
            ))}
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((p, i) => (
          <PaperCard
            key={p.id}
            paper={p}
            index={i}
            onView={(paper) => { setSelectedPaper(paper); setPreviewOpen(true) }}
            onDuplicate={handleDuplicate}
            onDelete={setDeleteTarget}
            onArchive={handleArchive}
            onVersions={(paper) => { setSelectedPaper(paper); setVersionsOpen(true) }}
            onShare={setShareTarget}
            onEdit={(paper) => { if (onEditPaper) onEditPaper({ ...paper }); }}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
          <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No question papers yet.</p>
          <p className="mt-1 text-xs text-slate-400">Create or generate questions to build your paper library.</p>
          {onGoToGenerate && (
            <Button size="sm" className="mt-4" onClick={onGoToGenerate}>
              Create your first paper
            </Button>
          )}
        </div>
      )}

      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-indigo-500" /> Version history — {selectedPaper?.title}</DialogTitle>
            <DialogDescription>{selectedPaper?.course} · {selectedPaper?.domain ?? selectedPaper?.mode ?? 'University'} · {selectedPaper?.examType ?? '—'} · created {formatDate(selectedPaper?.created ?? selectedPaper?.generated, 'MMM d, yyyy')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            {(data?.versionHistory?.[selectedPaper?.id] ?? []).slice().reverse().map((v) => (
              <div key={v.version} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 dark:border-slate-800">
                <Badge variant="gradient" size="sm">{v.version}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{v.note}</p>
                  <p className="text-[10.5px] text-slate-400">{formatDate(v.date, 'MMM d, yyyy')}</p>
                </div>
              </div>
            ))}
            {!data?.versionHistory?.[selectedPaper?.id]?.length && <p className="py-6 text-center text-xs text-slate-400">No version history yet.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <PaperPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} paper={selectedPaper} />
      <PaperDeleteDialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)} paper={deleteTarget} onConfirm={handleDelete} deleting={deleting} />
      <SharePaperDialog paper={shareTarget} open={!!shareTarget} onOpenChange={(v) => !v && setShareTarget(null)} />
    </div>
  )
}

export { PaperLibraryTab }
export default PaperLibraryTab
