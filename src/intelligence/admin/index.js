/**
 * MediXO EduX — Admin (Institution) Intelligence Foundation — public API.
 *
 * One centralized intelligence layer for the Administrator module:
 *  - masterInstitutionProfile  → single source of truth for institution identity
 *  - adminDatasets             → every admin dataset (re-exported, zero loss)
 *  - engine                    → deterministic derivation functions
 *  - computeAdminIntelligence() → fully assembled derived snapshot
 *
 * Mirrors the student/faculty foundations exactly. UI-free; relative
 * imports so it runs in plain Node and the browser.
 */

import { masterInstitutionProfile, institutionProfileView } from './master-profile.js'
import { adminDatasets, adminPeople } from './datasets/index.js'
import {
  computeAcademicHealth, computeAttendanceHealth, computeAssessmentHealth,
  computeFacultyHealth, computeStudentSuccess, computeOutcomesHealth,
  computeDepartmentHealth, computeInstitutionHealth,
} from './engine/health.js'
import { computeStudentIntelligence } from './engine/students.js'
import { computeAssessmentIntelligence, computeAttendanceIntelligence } from './engine/assessments.js'
import {
  buildInstitutionSummary, buildDepartmentSummary, buildStudentRiskSummary,
  buildFacultySummary, buildAssessmentSummary,
  REPORT_TYPES, buildExecutiveSummary, buildReportPreviewDoc,
} from './engine/reports.js'

export {
  masterInstitutionProfile, institutionProfileView,
  adminDatasets, adminPeople,
  computeAcademicHealth, computeAttendanceHealth, computeAssessmentHealth,
  computeFacultyHealth, computeStudentSuccess, computeOutcomesHealth,
  computeDepartmentHealth, computeInstitutionHealth,
  computeStudentIntelligence, computeAssessmentIntelligence, computeAttendanceIntelligence,
  buildInstitutionSummary, buildDepartmentSummary, buildStudentRiskSummary,
  buildFacultySummary, buildAssessmentSummary,
  REPORT_TYPES, buildExecutiveSummary, buildReportPreviewDoc,
}

/* ---------- Derived intelligence — recomputed on every call ---------- */
export function computeAdminIntelligence() {
  const ds = adminDatasets
  const profile = masterInstitutionProfile
  const admin = ds.analytics

  /* Health pillars */
  const academicHealth = computeAcademicHealth({ adminAnalytics: admin.adminAnalytics, adminPerformance: admin.adminPerformance })
  const attendanceHealth = computeAttendanceHealth({ adminAttendanceAnalytics: admin.adminAttendanceAnalytics })
  const assessmentHealth = computeAssessmentHealth({ adminExamAnalytics: admin.adminExamAnalytics, adminAssignmentAnalytics: admin.adminAssignmentAnalytics })

  /* At-risk rate (authoritative faculty cohort trend) → feeds student success. */
  const cohortTrend = admin.weakStudentDetection?.cohortTrend ?? []
  const atRiskRate = cohortTrend[cohortTrend.length - 1]?.atRisk ?? 5.9

  const studentSuccess = computeStudentSuccess({
    adminAnalytics: admin.adminAnalytics, adminPerformance: admin.adminPerformance,
    adminExamAnalytics: admin.adminExamAnalytics, atRiskRate,
  })
  const facultyHealth = computeFacultyHealth({ adminAnalytics: admin.adminAnalytics, adminResearch: admin.adminResearch, profile })
  const outcomesHealth = computeOutcomesHealth({ adminPlacements: admin.adminPlacements, adminResearch: admin.adminResearch })
  const institutionHealth = computeInstitutionHealth({
    academicHealth, attendanceHealth, assessmentHealth, facultyHealth, studentSuccess, outcomesHealth,
  })

  /* Departments */
  const departments = computeDepartmentHealth({
    departments: profile.departments,
    deptPassRates: admin.adminPerformance?.deptPassRates,
    attendanceByDept: admin.adminAttendanceAnalytics?.byDept,
  })

  /* Students (institution roll-up) */
  const students = computeStudentIntelligence({
    profile, adminPerformance: admin.adminPerformance,
    adminAttendanceAnalytics: admin.adminAttendanceAnalytics,
    adminAnalytics: admin.adminAnalytics, weakStudentDetection: admin.weakStudentDetection,
  })

  /* Assessments + attendance */
  const assessments = computeAssessmentIntelligence({
    adminExamAnalytics: admin.adminExamAnalytics, adminAssignmentAnalytics: admin.adminAssignmentAnalytics,
    adminQuestionBank: admin.adminQuestionBank, adminAttendanceAnalytics: admin.adminAttendanceAnalytics,
  })
  const attendance = computeAttendanceIntelligence({ adminAttendanceAnalytics: admin.adminAttendanceAnalytics })

  /* Totals (authoritative from master profile) */
  const totals = { ...profile.totals }

  /* Rule-based interventions */
  const interventions = buildInterventions({
    institutionHealth, departments, students, attendance, assessments,
    adminRevenue: admin.adminRevenue, adminApiConfig: admin.adminApiConfig,
  })

  /* AI narrative (foundation only — Phase 5 renders it) */
  const ai = {
    insights: ds.ai.execInsightPool,
    recommendations: ds.ai.interventionPool.slice(0, 4),
    reportTemplates: ds.ai.adminReportTemplates,
    promptSeeds: ds.ai.execPromptSeeds,
    aiAdoption: { sessions: profile.aiContext.aiAdoptionSessions },
  }

  /* Reports (structured summaries) */
  const reports = {
    institution: buildInstitutionSummary({ health: institutionHealth, totals, students, assessments, aiAdoption: ai.aiAdoption }),
    departments: buildDepartmentSummary({ departments }),
    studentRisk: buildStudentRiskSummary({ students }),
    faculty: buildFacultySummary({ facultyHealth, profile, people: ds.people }),
    assessment: buildAssessmentSummary({ assessments, health: assessmentHealth }),
  }

  return {
    profile: institutionProfileView,
    masterProfile: profile,
    totals,
    institutionHealth,
    departments,
    students,
    faculty: {
      totals: profile.totals.faculty,
      health: facultyHealth,
      rosterCount: ds.people.faculty.length,
      byDept: reports.faculty.byDept,
    },
    academics: {
      programs: profile.programs,
      courses: ds.academics.adminCourses.length,
      subjects: ds.academics.adminSubjects.length,
      batches: ds.academics.adminBatches.length,
      calendar: ds.academics.adminAcademicCalendar,
      deptHodMap: ds.academics.deptHodMap,
    },
    assessments,
    attendance,
    interventions,
    reports,
    ai,
    generatedAt: new Date().toISOString(),
  }
}

/* ---------- rule-based interventions ---------- */
function buildInterventions({ institutionHealth, departments, students, attendance, assessments, adminRevenue, adminApiConfig }) {
  const list = []

  if ((students?.riskSummary?.latestRate ?? 0) > 5) {
    list.push({
      id: 'aint_risk', priority: 'Critical', category: 'Student Risk',
      reason: `At-risk rate ${students.riskSummary.latestRate}% · ${students.totals.activeRisk} students estimated`,
      action: 'Sustain weekly intervention reviews; escalate top 10% to counsellors',
      expected: '1 pt reduction before the midsem window',
    })
  }

  if ((attendance?.belowThresholdCount ?? 0) > 0) {
    list.push({
      id: 'aint_att', priority: 'High', category: 'Attendance',
      reason: `${attendance.belowThresholdCount} students below the ${profileThreshold()}% floor (${attendance.best ? `${attendance.worst.dept} needs most attention at ${attendance.worst.pct}%` : '—'})`,
      action: 'Trigger attendance reminders + HOD review of flagged sections',
      expected: '2–3 pt recovery within 2 weeks',
    })
  }

  if ((assessments?.exams?.readiness?.drafting ?? 0) > 0) {
    list.push({
      id: 'aint_exam', priority: 'High', category: 'Assessment',
      reason: `${assessments.exams.readiness.drafting} exam draft(s) still drafting — midsem begins Aug 19`,
      action: 'Finalize OS, DBMS & Networks papers this week',
      expected: '100% readiness by Aug 18',
    })
  }

  const worstDept = departments?.worst
  if (worstDept && worstDept.score < 80) {
    list.push({
      id: 'aint_dept', priority: 'Medium', category: 'Department',
      reason: `${worstDept.name} is the weakest department (${worstDept.score}/100 — pass ${worstDept.passRate}%, placement ${worstDept.placement}%)`,
      action: `Schedule a review with ${worstDept.hod} on pass rate and placement strategy`,
      expected: '+3 pts department health within a term',
    })
  }

  const outstanding = adminRevenue?.kpis?.find((k) => k.label === 'Outstanding')?.value ?? '₹4.7 Cr'
  if (String(outstanding).includes('4.7')) {
    list.push({
      id: 'aint_fin', priority: 'Medium', category: 'Finance',
      reason: '₹4.7 Cr outstanding · 342 invoices overdue >45 days (44% MBA, 31% ECE)',
      action: 'Batch reminder with instalment options to MBA & ECE cohorts',
      expected: '₹1.6 Cr recovery within 30 days',
    })
  }

  const degraded = (adminApiConfig?.endpoints ?? []).filter((e) => e.status === 'Degraded')
  if (degraded.length) {
    list.push({
      id: 'aint_ops', priority: 'Medium', category: 'Operations',
      reason: `${degraded.map((d) => d.name).join(', ')} degraded — latency above SLA`,
      action: 'Restart workers and monitor after next deploy',
      expected: 'Latency back under 200ms',
    })
  }

  return {
    list,
    critical: list.filter((i) => i.priority === 'Critical').length,
    high: list.filter((i) => i.priority === 'High').length,
  }
}

const profileThreshold = () => 75

/** Fully assembled snapshot: profile + datasets + derived. */
export function getAdminIntelligence() {
  return {
    profile: masterInstitutionProfile,
    datasets: adminDatasets,
    derived: computeAdminIntelligence(),
  }
}

export default computeAdminIntelligence
