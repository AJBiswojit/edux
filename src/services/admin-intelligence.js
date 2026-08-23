import { useQuery } from '@tanstack/react-query'
import { getQuery as get } from './query'

/**
 * Admin (Institution) Intelligence Foundation — service hooks.
 * Consume the centralized profile / datasets / derived intelligence via the
 * API layer (swap to a real backend with VITE_USE_MOCK=false, zero code
 * changes). Mirrors the faculty intelligence service layer.
 */

/* Phase 3 — consolidated to ONE canonical snapshot hook: /admin-intelligence/
   summary already embeds the master profile, all datasets and the derived
   intelligence (mirrors the faculty foundation contract). The unused
   /profile | /datasets | /derived view hooks were retired with their
   projection endpoints. */
export const useAdminIntelligence = () => useQuery(get('/admin-intelligence/summary', ['admin-intelligence', 'summary']))
