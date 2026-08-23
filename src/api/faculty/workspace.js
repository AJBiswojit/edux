/**
 * Faculty API — teaching workspace reads (attendance, assignments, question
 * bank, research, lecture planner, exam builder, settings, roster, courses,
 * timetable, announcements, quiz builder). Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { STUDENT_ROSTER } from '@/datasets/platform/users.js'
import {
  facultyAttendance, facultyAssignments, questionBank,
  facultyResearch, facultyLecturePlanner, facultyExamBuilder,
  facultyReports, facultySettings,
} from '@/datasets/faculty/workspace.js'
import { facultyCourses, facultyTimetable, facultyAnnouncements, facultyQuizBuilder } from '@/datasets/faculty/teaching.js'

/* ---------------- Faculty ---------------- */
defineRoute('get', '/faculty/attendance', () => facultyAttendance)
defineRoute('get', '/faculty/assignments', () => ({ items: facultyAssignments }))
defineRoute('get', '/faculty/question-bank', () => questionBank)
defineRoute('get', '/faculty/research', () => facultyResearch)
defineRoute('get', '/faculty/lecture-planner', () => ({ items: facultyLecturePlanner }))
defineRoute('get', '/faculty/exam-builder', () => facultyExamBuilder)
defineRoute('get', '/faculty/reports', () => ({ items: facultyReports }))
defineRoute('get', '/faculty/settings', () => facultySettings)
defineRoute('get', '/faculty/roster', () => ({ students: STUDENT_ROSTER }))

/* ---------------- Faculty (extra) ---------------- */
defineRoute('get', '/faculty/courses', () => ({ items: facultyCourses }))
defineRoute('get', '/faculty/timetable', () => ({ items: facultyTimetable }))
defineRoute('get', '/faculty/announcements', () => ({ items: facultyAnnouncements }))
defineRoute('get', '/faculty/quiz-builder', () => facultyQuizBuilder)
/* Phase 3 — retired GET /faculty/ai-studio (superseded page fetch; the AI
   Workspace consumes assistant threads/respond + the save endpoint below). */
