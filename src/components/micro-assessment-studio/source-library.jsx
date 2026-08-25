import { BookOpen, Check, FileText, Filter, Library, Search, Sparkles } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Select, SelectItem, Textarea } from '@/components/ui'
import { EmptyState } from '@/components/shared/empty-state'

const DOMAIN_LABELS = { university: 'University', competitive: 'Competitive' }
const DOMAIN_BADGES = { university: 'info', competitive: 'warning' }

function SourceContext({ source }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={DOMAIN_BADGES[source.domain] ?? 'secondary'} size="sm">{DOMAIN_LABELS[source.domain] ?? source.domain}</Badge>
      {source.examFamily && <Badge variant="secondary" size="sm">{source.examFamily}</Badge>}
      <Badge variant="outline" size="sm">{source.sourceType}</Badge>
    </div>
  )
}

export function SourceCard({ source, onUseSource }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/10 to-teal-500/15 text-indigo-600 ring-1 ring-indigo-500/15 dark:text-indigo-300">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900 dark:text-white">{source.title}</h3>
          <div className="mt-2"><SourceContext source={source} /></div>
        </div>
      </div>
      <dl className="mt-3 space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        <div className="flex gap-2"><dt className="font-bold text-slate-400">Subject</dt><dd className="truncate">{source.subject}</dd></div>
        <div className="flex gap-2"><dt className="font-bold text-slate-400">Chapter</dt><dd className="truncate">{source.chapter}</dd></div>
        <div className="flex gap-2"><dt className="font-bold text-slate-400">Topic</dt><dd className="truncate">{source.topic}</dd></div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="text-[10.5px] font-semibold text-slate-400">{source.wordCount} words · {source.estimatedReadingTime} min read</span>
        <Button type="button" size="sm" onClick={() => onUseSource(source)} aria-label={`Use sample ${source.title}`}>
          <Sparkles className="h-3 w-3" /> Use Sample
        </Button>
      </div>
    </article>
  )
}

export function SourceLibrary({ data, filters, onFiltersChange, onUseSource, onStartCustom }) {
  const filterOptions = data?.filters ?? {}
  const update = (key, value) => onFiltersChange((current) => ({ ...current, [key]: value }))
  const items = data?.items ?? []
  const domain = filters.domain
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300"><Library className="h-3.5 w-3.5" /> Source Library</p>
          <h2 className="mt-1 text-[17px] font-bold text-slate-900 dark:text-white">Start with teaching material</h2>
          <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">Ten curated study passages are ready for a faculty review. Choose one, then edit the source before processing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Badge variant="gradient" size="sm">{data?.total ?? 10} sample sources</Badge>{onStartCustom && <Button type="button" size="sm" variant="outline" onClick={onStartCustom}><FileText className="h-3 w-3" /> Paste custom</Button>}</div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search source, subject or topic…" className="h-10 pl-9 text-xs" aria-label="Search source library" />
        </div>
        <Select value={filters.domain || 'All'} onValueChange={(value) => onFiltersChange((current) => ({ ...current, domain: value === 'All' ? '' : value, examFamily: value === 'competitive' ? current.examFamily : '' }))}>
          <SelectItem value="All">All domains</SelectItem>
          {(filterOptions.domains ?? ['university', 'competitive']).map((value) => <SelectItem key={value} value={value}>{DOMAIN_LABELS[value] ?? value}</SelectItem>)}
        </Select>
        {domain === 'competitive' ? (
          <Select value={filters.examFamily || 'All'} onValueChange={(value) => update('examFamily', value === 'All' ? '' : value)}>
            <SelectItem value="All">All exams</SelectItem>
            {(filterOptions.examFamilies ?? ['JEE', 'NEET']).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </Select>
        ) : <div className="hidden lg:block" aria-hidden="true" />}
        <Select value={filters.subject || 'All'} onValueChange={(value) => update('subject', value === 'All' ? '' : value)}>
          <SelectItem value="All">All subjects</SelectItem>
          {(filterOptions.subjects ?? []).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
        </Select>
        <Select value={filters.chapter || 'All'} onValueChange={(value) => update('chapter', value === 'All' ? '' : value)}>
          <SelectItem value="All">All chapters</SelectItem>
          {(filterOptions.chapters ?? []).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
        </Select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Source type</span>
        <Select value={filters.sourceType || 'All'} onValueChange={(value) => update('sourceType', value === 'All' ? '' : value)}>
          <SelectItem value="All">All types</SelectItem>
          {(filterOptions.sourceTypes ?? []).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
        </Select>
        <span className="text-[11px] font-semibold text-slate-400">{items.length} matching source{items.length === 1 ? '' : 's'}</span>
      </div>

      {items.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((source) => <SourceCard key={source.id} source={source} onUseSource={onUseSource} />)}
        </div>
      ) : (
        <div className="mt-4"><EmptyState compact icon={BookOpen} title="No sources match these filters" description="Try a different domain, exam family, subject or source type." /></div>
      )}
    </Card>
  )
}

export function SourceEditor({ draft, onChange, errors = {}, onProcess, processing, processed }) {
  const set = (key, value) => onChange((current) => ({ ...current, [key]: value }))
  const hasDraft = !!draft
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Step 1 · Choose Source</p>
          <h2 className="mt-1 text-[17px] font-bold text-slate-900 dark:text-white">Teach EduX what to assess</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">Paste a paragraph or use a curated sample. Metadata keeps the assessment in the right University, JEE or NEET context.</p>
        </div>
        {hasDraft && <Badge variant={processed ? 'success' : 'secondary'} size="sm">{processed ? <><Check className="h-3 w-3" /> Source processed</> : 'Editable source'}</Badge>}
      </div>

      {!hasDraft ? (
        <EmptyState compact className="mt-4" icon={FileText} title="No source selected" description="Choose Use Sample from the library above, or start a custom paragraph." />
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Source title" error={errors.title} required className="sm:col-span-2 lg:col-span-1"><Input value={draft.title ?? ''} onChange={(event) => set('title', event.target.value)} placeholder="e.g. Week 4 lecture — graph traversal" /></Field>
            <Field label="Domain" required>
              <Select value={draft.domain || 'university'} onValueChange={(value) => onChange((current) => ({ ...current, domain: value, examFamily: value === 'competitive' ? (current.examFamily || 'JEE') : null }))}>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
              </Select>
            </Field>
            {draft.domain === 'competitive' ? (
              <Field label="Exam family" error={errors.examFamily} required>
                <Select value={draft.examFamily || 'JEE'} onValueChange={(value) => set('examFamily', value)}>
                  <SelectItem value="JEE">JEE</SelectItem>
                  <SelectItem value="NEET">NEET</SelectItem>
                </Select>
              </Field>
            ) : <Field label="Exam family"><Input value="Not applicable" disabled aria-label="University exam family not applicable" /></Field>}
            <Field label="Subject" error={errors.subject} required><Input value={draft.subject ?? ''} onChange={(event) => set('subject', event.target.value)} placeholder="e.g. Computer Science" /></Field>
            <Field label="Chapter" error={errors.chapter} required><Input value={draft.chapter ?? ''} onChange={(event) => set('chapter', event.target.value)} placeholder="e.g. Data Structures" /></Field>
            <Field label="Topic" error={errors.topic} required><Input value={draft.topic ?? ''} onChange={(event) => set('topic', event.target.value)} placeholder="e.g. Graph Traversal" /></Field>
            <Field label="Source type"><Select value={draft.sourceType || 'Custom Text'} onValueChange={(value) => set('sourceType', value)}>
              {['Textbook', 'NCERT', 'Lecture Notes', 'PDF', 'Faculty Notes', 'Custom Text', 'NCERT / Study Material', 'Study Material'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
            </Select></Field>
          </div>
          <Field label="Paragraph / source content" error={errors.content} hint={`${draft.content?.trim().split(/\s+/).filter(Boolean).length ?? 0} words · edit sample content before processing`} required>
            <Textarea value={draft.content ?? ''} onChange={(event) => set('content', event.target.value)} rows={8} placeholder="Paste a paragraph of teaching material here…" className="resize-y leading-relaxed" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="max-w-xl text-[10.5px] font-medium leading-relaxed text-slate-400"><Sparkles className="mr-1 inline h-3 w-3 text-indigo-500" />Prototype processing reads the selected source metadata; it does not call a real LLM or parse files.</p>
            <Button type="button" onClick={onProcess} disabled={processing} aria-busy={processing}>
              {processing ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Processing source…</> : <><Sparkles className="h-3.5 w-3.5" /> Process with AI</>}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default SourceLibrary
