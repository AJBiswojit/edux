/**
 * Faculty Academic Intelligence Foundation — API routes.
 * Serves the centralized profile, datasets and derived intelligence.
 */
import { defineRoute } from '../core/router'
import { getFacultyIntelligence } from '@/intelligence/faculty'

/* The snapshot is a pure function of immutable module-level datasets (no
   attempt-store or localStorage inputs, and no route handler mutates them), so
   a lazy singleton is safe and avoids recomputing the whole faculty graph on
   every request. A real backend replaces this layer wholesale. */
let snapshot
defineRoute('get', '/faculty-intelligence/summary', () => (snapshot ??= getFacultyIntelligence()))
