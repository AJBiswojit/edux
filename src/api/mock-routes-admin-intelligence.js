/**
 * Admin Intelligence Foundation — mock API routes.
 * Serves the centralized master profile, datasets and derived intelligence.
 * Endpoints mirror the faculty foundation contract:
 *   /admin-intelligence/profile | datasets | derived | summary
 */
import { mockRoute } from './mock-server'
import {
  masterInstitutionProfile, adminDatasets, computeAdminIntelligence, getAdminIntelligence,
} from '@/intelligence/admin'

mockRoute('get', '/admin-intelligence/profile', () => masterInstitutionProfile)
mockRoute('get', '/admin-intelligence/datasets', () => adminDatasets)
mockRoute('get', '/admin-intelligence/derived', () => computeAdminIntelligence())
mockRoute('get', '/admin-intelligence/summary', () => getAdminIntelligence())
