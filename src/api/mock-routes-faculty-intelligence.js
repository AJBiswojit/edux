/**
 * Faculty Academic Intelligence Foundation — mock API routes.
 * Serves the centralized profile, datasets and derived intelligence.
 */
import { mockRoute } from './mock-server'
import { masterFacultyProfile, facultyDatasets, computeFacultyIntelligence, getFacultyIntelligence } from '@/intelligence/faculty'

mockRoute('get', '/faculty-intelligence/profile', () => masterFacultyProfile)
mockRoute('get', '/faculty-intelligence/datasets', () => facultyDatasets)
mockRoute('get', '/faculty-intelligence/derived', () => computeFacultyIntelligence())
mockRoute('get', '/faculty-intelligence/summary', () => getFacultyIntelligence())
