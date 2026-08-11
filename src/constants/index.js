export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  PARENT: 'parent',
  ADMIN: 'admin',
}

export const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty',
  parent: 'Parent',
  admin: 'Administrator',
}

export const ROLE_HOME = {
  student: '/student',
  faculty: '/faculty',
  parent: '/parent',
  admin: '/admin',
}

export const ROLE_GRADIENTS = {
  student: 'linear-gradient(135deg, #6366f1, #3b82f6)',
  faculty: 'linear-gradient(135deg, #14b8a6, #0ea5e9)',
  parent: 'linear-gradient(135deg, #10b981, #84cc16)',
  admin: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
}

export const SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']

export const ATTENDANCE_STATUS = { PRESENT: 'Present', ABSENT: 'Absent', LEAVE: 'Leave', HOLIDAY: 'Holiday' }

export const ASSIGNMENT_STATUS = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  GRADED: 'Graded',
  OVERDUE: 'Overdue',
  DRAFT: 'Draft',
}

export const DIFFICULTY = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' }

export const EXAM_TYPES = {
  MIDSEM: 'Mid-Semester',
  ENDSEM: 'End-Semester',
  QUIZ: 'Quiz',
  MOCK: 'Mock Test',
  FINAL: 'Final Examination',
}

export const PLACEMENT_STATUS = { OFFERED: 'Offered', IN_PROCESS: 'In Process', NOT_PLACED: 'Not Placed' }

export const PERMISSIONS = ['read', 'create', 'update', 'delete', 'approve', 'export', 'manage_ai', 'manage_users', 'manage_roles']

export const SUBJECTS_MAP = {
  'CS501': { code: 'CS501', name: 'Data Structures & Algorithms', color: '#6366f1' },
  'CS502': { code: 'CS502', name: 'Database Management Systems', color: '#14b8a6' },
  'CS503': { code: 'CS503', name: 'Operating Systems', color: '#f59e0b' },
  'CS504': { code: 'CS504', name: 'Computer Networks', color: '#f43f5e' },
  'CS505': { code: 'CS505', name: 'Machine Learning', color: '#8b5cf6' },
  'CS506': { code: 'CS506', name: 'Theory of Computation', color: '#0ea5e9' },
}
