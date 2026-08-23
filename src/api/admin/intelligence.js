/**
 * Admin Intelligence Foundation — API routes.
 * Serves the centralized master profile, datasets and derived intelligence.
 *
 * Phase 3 — consolidated to ONE canonical snapshot route, matching the
 * faculty foundation contract (/faculty-intelligence/summary). The summary
 * already embeds the master profile, all datasets and the derived
 * intelligence, so the unused /profile | /datasets | /derived projection
 * routes were retired (their hooks had zero consumers).
 */
import { defineRoute } from '../core/router'
import { getAdminIntelligence } from '@/intelligence/admin'

/* The snapshot is a pure function of immutable module-level datasets (no
   attempt-store or localStorage inputs, and no route handler mutates them), so
   a lazy singleton is safe and avoids recomputing the whole institution
   graph on every request. A real backend replaces this layer wholesale. */
let snapshot
defineRoute('get', '/admin-intelligence/summary', () => (snapshot ??= getAdminIntelligence()))
