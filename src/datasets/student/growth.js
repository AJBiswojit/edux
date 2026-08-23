/**
 * Student portal deterministic dataset — portfolio, resume, coding practice,
 * career, messages, notifications and settings.
 */

export const studentSettings = {
  profile: { email: 'aarav.sharma@medixoedux.edu', phone: '+91 98765 43210', language: 'English', timezone: 'IST (UTC+5:30)' },
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    deadlineReminders: true,
    aiInsights: true,
    streakReminders: true,
    reducedMotion: false,
    compactMode: false,
  },
  privacy: { showRankToPeers: true, showProfilePublic: false, shareLearningData: true },
  dangerZone: { exportData: true, deleteAccount: false },
}
