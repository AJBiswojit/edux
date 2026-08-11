/**
 * Admin Intelligence Engine — Institution Student Intelligence (roll-up).
 *
 * The institution-level view is a HIGHER-LEVEL roll-up of existing data:
 *  · at-risk trend ← faculty weakStudentDetection.cohortTrend (authoritative
 *    cohort series: Mar 8.4 → Aug 5.9). The old admin mock truncated this
 *    series at Jul 6.2 — the engine now exposes the full authoritative
 *    series so Admin and Faculty tell the SAME story.
 *  · performance distribution ← adminPerformance.gradeDistribution
 *  · high performers ← adminPerformance.topStudents
 *  · interventions impact ← adminPerformance.interventionImpact (institution
 *    scope, mock-authoritative)
 *  · active risk cohort ← totalStudents × latest at-risk rate (documented
 *    deterministic approximation).
 */

import { clamp, round1, avg } from './scores.js'

export function computeStudentIntelligence({
  profile, adminPerformance, adminAttendanceAnalytics, adminAnalytics, weakStudentDetection,
}) {
  const totalStudents = profile?.totals?.students ?? 12480

  /* At-risk trend — authoritative series from the faculty cohort model. */
  const riskTrend = (weakStudentDetection?.cohortTrend ?? []).map((c) => ({
    month: c.month,
    atRisk: c.atRisk,
  }))
  const latestRate = riskTrend[riskTrend.length - 1]?.atRisk ?? 5.9
  const firstRate = riskTrend[0]?.atRisk ?? latestRate
  const trendDelta = round1(latestRate - firstRate)
  const trendReduction = firstRate ? round1(((firstRate - latestRate) / firstRate) * 100) : 0

  const intervention = adminPerformance?.interventionImpact ?? { flagged: 214, recovered: 168, recoveryRate: 78.5, avgWeeks: 4.2 }

  /* Performance distribution (adminPerformance.gradeDistribution: % shares). */
  const distribution = (adminPerformance?.gradeDistribution ?? []).map((g) => ({
    grade: g.grade,
    pct: g.count,
  }))
  const topBand = distribution.find((d) => d.grade === 'A+')?.pct ?? 0
  const bottomBand = distribution.find((d) => d.grade === 'D/F')?.pct ?? 0

  const highPerformers = (adminPerformance?.topStudents ?? []).map((s) => ({ ...s }))

  /* Attendance risk cohort. */
  const attendanceRisk = (adminAttendanceAnalytics?.belowThreshold ?? []).map((s) => ({ ...s }))

  /* Retention + CGPA context. */
  const retention = adminAnalytics?.retention?.slice(-1)[0]?.overall ?? 92
  const cgpaAvg = adminAnalytics?.semesterWise?.length ? round1(avg(adminAnalytics.semesterWise, 'cgpa')) : 7.7

  /* Documented deterministic approximation: active at-risk cohort = total × rate. */
  const activeRisk = Math.round((totalStudents * latestRate) / 100)
  const improvingStudents = intervention.recovered ?? 168

  return {
    totals: {
      totalStudents,
      activeRisk,
      improvingStudents,
      flagged: intervention.flagged ?? 0,
      recoveryRate: intervention.recoveryRate ?? 0,
      avgWeeksToRecover: intervention.avgWeeks ?? 0,
    },
    riskTrend,
    riskSummary: {
      latestRate,
      firstRate,
      trendDelta,
      trendReduction,
    },
    distribution,
    distributionSummary: {
      topBand,
      bottomBand,
      healthyBand: clamp(100 - topBand - bottomBand),
    },
    highPerformers,
    attendanceRisk,
    retention,
    cgpaAvg,
  }
}

export default computeStudentIntelligence
