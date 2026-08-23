/**
 * Faculty API — PYQ (previous-year question) intelligence reads.
 * Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { pyqAnalysis, pyqFilters, pyqPatterns, pyqVariants, applyPyqVariant } from '@/datasets/faculty/pyq-analysis.js'

/* ---------------- PYQ Analysis (faculty) ---------------- */
defineRoute('get', '/faculty/pyq-analysis', () => pyqAnalysis)
defineRoute('get', '/faculty/pyq-analysis/filters', () => pyqFilters)
defineRoute('get', '/faculty/pyq-analysis/patterns', () => ({ items: pyqPatterns }))
defineRoute('get', '/faculty/pyq-analysis/analytics', ({ params }) => applyPyqVariant(pyqAnalysis, pyqVariants[params?.subject]))
