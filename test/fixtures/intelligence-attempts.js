export function attempt({ id, studentId = 'student', examMode, examFamily = null, subject, chapter, topic = 'Core', correct = false }) {
  return {
    id, studentId, mode: 'manual', examMode, examFamily,
    submittedAt: `2026-08-${String(Number(id.replace(/\D/g, '') || 1)).padStart(2, '0')}T10:00:00.000Z`,
    questionAttempts: [0, 1, 2].map((index) => ({
      questionId: `${id}-q${index}`,
      academicContext: { subject, chapter, topic },
      question: { difficulty: 'Medium', marks: 4, type: 'MCQ', correctAnswer: 0 },
      response: { selectedAnswer: correct ? 0 : 1, status: correct ? 'answered' : 'answered', answerChanges: 0 },
      timing: { timeSpent: 60 },
      behaviour: { visits: 1 },
      evaluation: { isCorrect: correct, isSkipped: false },
    })),
  }
}

export const mixedUniversityJee = [
  attempt({ id: 'u1', examMode: 'University', subject: 'CS501', chapter: 'Graphs', correct: true }),
  attempt({ id: 'j1', examMode: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion' }),
  attempt({ id: 'j2', examMode: 'Competitive', examFamily: 'JEE', subject: 'Mathematics', chapter: 'Calculus' }),
  attempt({ id: 'j3', examMode: 'Competitive', examFamily: 'JEE', subject: 'Chemistry', chapter: 'Organic Chemistry' }),
]

export const mixedUniversityNeet = [
  attempt({ id: 'u2', examMode: 'University', subject: 'CS501', chapter: 'Data Structures' }),
  attempt({ id: 'n1', examMode: 'Competitive', examFamily: 'NEET', subject: 'Physics', chapter: 'Modern Physics' }),
  attempt({ id: 'n2', examMode: 'Competitive', examFamily: 'NEET', subject: 'Chemistry', chapter: 'Organic Chemistry' }),
  attempt({ id: 'n3', examMode: 'Competitive', examFamily: 'NEET', subject: 'Biology', chapter: 'Human Physiology' }),
]
