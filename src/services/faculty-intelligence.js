import { useQuery } from '@tanstack/react-query'
import { getQuery as get } from './query'

/**
 * Faculty Academic Intelligence Foundation — service hooks.
 * Consume the centralized profile / datasets / derived intelligence via the
 * mock API (swap to real backend with VITE_USE_MOCK=false, zero code changes).
 */

export const useFacultyIntelligence = () => useQuery(get('/faculty-intelligence/summary', ['faculty-intelligence', 'summary']))
export const useFacultyIntelligenceDerived = () => useQuery(get('/faculty-intelligence/derived', ['faculty-intelligence', 'derived']))
export const useFacultyIntelligenceDatasets = () => useQuery(get('/faculty-intelligence/datasets', ['faculty-intelligence', 'datasets']))
export const useMasterFacultyProfile = () => useQuery(get('/faculty-intelligence/profile', ['faculty-intelligence', 'profile']))
