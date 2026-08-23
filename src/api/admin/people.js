/**
 * Admin API — unified people directory (intelligence-backed).
 * Endpoint contracts unchanged (GET /admin/students · /admin/faculty).
 */
import { defineRoute } from '../core/router'
import { adminPeople } from '@/intelligence/admin/datasets/people'
import { masterInstitutionProfile } from '@/intelligence/admin/master-profile'

/* ---------------- Admin unified people (intelligence-backed) ---------------- */
defineRoute('get', '/admin/students', () => ({
  students: adminPeople.students,
  total: masterInstitutionProfile.totals.students,
}))
defineRoute('get', '/admin/faculty', () => ({
  faculty: adminPeople.faculty,
  total: masterInstitutionProfile.totals.faculty,
}))
