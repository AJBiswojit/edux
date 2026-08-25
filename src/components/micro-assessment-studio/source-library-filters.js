/**
 * Pure Source Library filter helpers.
 *
 * The component receives `filterCatalog` through the service/API response;
 * it never imports the source dataset. Hierarchy options are derived from
 * the catalog with downstream filters deliberately ignored so a parent can
 * always be changed and invalid children can be cleared.
 */

const HIERARCHY_KEYS = ['domain', 'examFamily', 'subject', 'chapter', 'topic']
const LABELS = {
  search: 'Search',
  domain: 'Domain',
  examFamily: 'Exam Family',
  subject: 'Subject',
  chapter: 'Chapter',
  topic: 'Topic',
  sourceType: 'Source Type',
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function optionalValue(value) {
  const normalized = String(value ?? '').trim()
  return !normalized || normalized.toLowerCase().startsWith('all ') || normalized.toLowerCase() === 'all' ? '' : normalized
}

function searchable(source) {
  return [source.title, source.subject, source.chapter, source.topic, source.sourceType, source.examFamily, source.content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function independentMatch(source, filters) {
  const search = String(filters.search ?? '').trim().toLowerCase()
  const sourceType = optionalValue(filters.sourceType)
  return (!search || searchable(source).includes(search))
    && (!sourceType || source.sourceType === sourceType)
}

function hierarchyMatch(source, filters, through) {
  if (!independentMatch(source, filters)) return false
  const end = HIERARCHY_KEYS.indexOf(through)
  return HIERARCHY_KEYS.slice(0, end + 1).every((key) => {
    const value = optionalValue(filters[key])
    if (!value) return true
    if (key === 'domain') return source.domain === value
    return source[key] === value
  })
}

function valuesFor(catalog, filters, key) {
  if (key === 'domain') return unique(catalog.filter((source) => independentMatch(source, filters)).map((source) => source.domain))
  if (key === 'examFamily') {
    if (optionalValue(filters.domain).toLowerCase() !== 'competitive') return []
    return unique(catalog.filter((source) => hierarchyMatch(source, filters, 'domain')).filter((source) => source.domain === 'competitive').map((source) => source.examFamily))
  }
  if (key === 'subject') {
    const sources = catalog.filter((source) => hierarchyMatch(source, filters, 'examFamily'))
    return unique(sources.map((source) => source.subject))
  }
  if (key === 'chapter') {
    const sources = catalog.filter((source) => hierarchyMatch(source, filters, 'subject'))
    return unique(sources.map((source) => source.chapter))
  }
  if (key === 'topic') {
    if (!optionalValue(filters.chapter)) return []
    const sources = catalog.filter((source) => hierarchyMatch(source, filters, 'chapter'))
    return unique(sources.map((source) => source.topic))
  }
  /* Source Type is independent from the hierarchy but still reflects the
     current search/context so its options remain useful. */
  return unique(catalog.filter((source) => hierarchyMatch(source, filters, 'topic')).map((source) => source.sourceType))
}

export function deriveSourceFilterOptions(filters = {}, catalog = []) {
  return {
    domains: valuesFor(catalog, filters, 'domain'),
    examFamilies: valuesFor(catalog, filters, 'examFamily'),
    subjects: valuesFor(catalog, filters, 'subject'),
    chapters: valuesFor(catalog, filters, 'chapter'),
    topics: valuesFor(catalog, filters, 'topic'),
    sourceTypes: valuesFor(catalog, filters, 'sourceType'),
  }
}

/** Clears only downstream values that are no longer valid after a parent
 * change. Search and sourceType intentionally survive hierarchy changes. */
export function sanitizeSourceFilters(nextFilters = {}, catalog = []) {
  let next = {
    search: nextFilters.search ?? '',
    domain: optionalValue(nextFilters.domain),
    examFamily: optionalValue(nextFilters.examFamily),
    subject: optionalValue(nextFilters.subject),
    chapter: optionalValue(nextFilters.chapter),
    topic: optionalValue(nextFilters.topic),
    sourceType: optionalValue(nextFilters.sourceType),
  }
  /* Search and source type are independent filters. They may produce a
     legitimate no-match state, so they must never make a hierarchy value
     look invalid and silently clear it. */
  const hierarchyOptions = () => deriveSourceFilterOptions({ ...next, search: '', sourceType: '' }, catalog)
  let options = hierarchyOptions()
  if (next.domain && !options.domains.includes(next.domain)) {
    next = { ...next, domain: '', examFamily: '', subject: '', chapter: '', topic: '' }
  }
  if (next.domain !== 'competitive') next = { ...next, examFamily: '' }
  options = hierarchyOptions()
  if (next.examFamily && !options.examFamilies.includes(next.examFamily)) {
    next = { ...next, examFamily: '', subject: '', chapter: '', topic: '' }
  }
  options = hierarchyOptions()
  if (next.subject && !options.subjects.includes(next.subject)) next = { ...next, subject: '', chapter: '', topic: '' }
  options = hierarchyOptions()
  if (next.chapter && !options.chapters.includes(next.chapter)) next = { ...next, chapter: '', topic: '' }
  options = hierarchyOptions()
  if (next.topic && !options.topics.includes(next.topic)) next = { ...next, topic: '' }
  return next
}

export function activeSourceFilters(filters = {}) {
  return Object.entries(LABELS)
    .filter(([key]) => key === 'search' ? String(filters[key] ?? '').trim() : optionalValue(filters[key]))
    .map(([key]) => ({ key, label: LABELS[key], value: filters[key] }))
}

export function sourceMatchesFilters(source, filters = {}) {
  const domain = optionalValue(filters.domain)
  const examFamily = optionalValue(filters.examFamily)
  const subject = optionalValue(filters.subject)
  const chapter = optionalValue(filters.chapter)
  const topic = optionalValue(filters.topic)
  return independentMatch(source, filters)
    && (!domain || source.domain === domain)
    && (!examFamily || source.examFamily === examFamily)
    && (!subject || source.subject === subject)
    && (!chapter || source.chapter === chapter)
    && (!topic || source.topic === topic)
}

export { LABELS }
