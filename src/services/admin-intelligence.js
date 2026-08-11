import { useQuery } from '@tanstack/react-query'
import { getQuery as get } from './query'

/**
 * Admin (Institution) Intelligence Foundation — service hooks.
 * Consume the centralized profile / datasets / derived intelligence via the
 * mock API (swap to a real backend with VITE_USE_MOCK=false, zero code
 * changes). Mirrors the faculty intelligence service layer.
 */

export const useAdminIntelligence = () => useQuery(get('/admin-intelligence/summary', ['admin-intelligence', 'summary']))
export const useAdminIntelligenceDerived = () => useQuery(get('/admin-intelligence/derived', ['admin-intelligence', 'derived']))
export const useAdminIntelligenceDatasets = () => useQuery(get('/admin-intelligence/datasets', ['admin-intelligence', 'datasets']))
export const useMasterInstitutionProfile = () => useQuery(get('/admin-intelligence/profile', ['admin-intelligence', 'profile']))
