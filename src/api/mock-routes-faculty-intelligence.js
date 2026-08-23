/**
 * Faculty Academic Intelligence Foundation — mock API routes.
 * Serves the centralized profile, datasets and derived intelligence.
 */
import { mockRoute } from './mock-server'
import { getFacultyIntelligence } from '@/intelligence/faculty'

/* The snapshot is a pure function of immutable module-level datasets (no
   attempt-store or localStorage inputs, and no mock route mutates them), so
   a lazy singleton is safe and avoids recomputing the whole faculty graph on
   every request. A real backend replaces this layer wholesale. */
let snapshot
mockRoute('get', '/faculty-intelligence/summary', () => (snapshot ??= getFacultyIntelligence()))
