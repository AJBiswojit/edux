/**
 * Faculty Academic Intelligence Foundation — mock API routes.
 * Serves the centralized profile, datasets and derived intelligence.
 */
import { mockRoute } from './mock-server'
import { getFacultyIntelligence } from '@/intelligence/faculty'

mockRoute('get', '/faculty-intelligence/summary', () => getFacultyIntelligence())
