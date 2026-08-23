/**
 * Auth API — sign-in support flows + student registration.
 *
 * Endpoint contracts (unchanged in Phase 7):
 *   POST /auth/forgot-password · /auth/verify-otp · /auth/reset-password
 *   POST /auth/verify-email · /auth/resend-otp
 *   GET  /auth/registration/options · POST /auth/register · /auth/register/verify
 *
 * CURRENT: deterministic prototype adapter (demo OTPs, in-browser registry).
 * FUTURE : backend identity service. Authentication behaviour is untouched.
 */
import { defineRoute } from '../core/router'
import { DEMO_USERS } from '@/datasets/platform/users.js'
import { REGISTRATION_OPTIONS } from '@/datasets/platform/registration.js'

/* ---------------- Auth ---------------- */
defineRoute('post', '/auth/forgot-password', ({ body }) => ({
  ok: true,
  message: 'If an account exists for that email, a reset link has been sent.',
  verificationId: 'otp_demo_4821',
  demoOtp: '482193',
}))
defineRoute('post', '/auth/verify-otp', ({ body }) => {
  if (String(body?.otp) !== '482193') {
    const err = new Error('Invalid OTP. Check the code and try again.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  return { ok: true, token: 'otp_verified' }
})
defineRoute('post', '/auth/reset-password', () => ({ ok: true, message: 'Password updated. You can now sign in.' }))
defineRoute('post', '/auth/verify-email', ({ body }) => {
  if (String(body?.otp) !== '731205') {
    const err = new Error('Verification code incorrect.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  return { ok: true, verified: true }
})
defineRoute('post', '/auth/resend-otp', () => ({ ok: true, message: 'OTP re-sent.', demoOtp: '731205' }))
/* Phase 3 — retired POST /auth/profile-setup (the Profile Setup page persists
   through AuthContext, nothing consumed this response). */

/* ---------------- Registration (Phase 28) ----------------
   Deterministic prototype flow: register -> OTP (482193) -> profile -> session.
   Persistence follows the existing pattern: the AuthContext writes the user
   to localStorage (APP_CONFIG.USER_KEY); the registered identity is stored
   under the dedicated EduX_registered_students key (prototype registry,
   NOT a second auth architecture). Duplicate email/phone are validated
   against the demo user directory + the in-browser registry. */
defineRoute('get', '/auth/registration/options', () => REGISTRATION_OPTIONS)
defineRoute('post', '/auth/register', ({ body }) => {
  const email = String(body?.email ?? '').toLowerCase().trim()
  const phone = String(body?.phone ?? '').replace(/[^0-9]/g, '')

  const existing = DEMO_USERS.some((u) => u.email?.toLowerCase() === email)
  if (existing) {
    const err = new Error('An account already exists for this email — try signing in instead.')
    err.response = { status: 409, data: { message: err.message } }
    throw err
  }

  let registry = []
  try { registry = JSON.parse(window.localStorage.getItem('EduX_registered_students') || '[]') } catch { registry = [] }
  const dupEmail = registry.find((r) => r.email?.toLowerCase() === email)
  if (dupEmail) {
    const err = new Error(dupEmail.verified ? 'An account already exists for this email — try signing in instead.' : 'This email is already registered — verify the OTP we sent earlier, or use a different email.')
    err.response = { status: 409, data: { message: err.message } }
    throw err
  }
  if (registry.some((r) => String(r.phone || '').replace(/[^0-9]/g, '') === phone && phone)) {
    const err = new Error('This mobile number is already registered.')
    err.response = { status: 409, data: { message: err.message } }
    throw err
  }

  const draft = {
    id: `u_stu_${Date.now()}`,
    role: 'student',
    ...body,
    email,
    phone,
    verified: false,
    createdAt: new Date().toISOString(),
  }
  registry.push(draft)
  try { window.localStorage.setItem('EduX_registered_students', JSON.stringify(registry)) } catch { /* storage unavailable */ }

  return { ok: true, verificationId: 'otp_demo_4821', demoOtp: '482193', draftId: draft.id }
})
defineRoute('post', '/auth/register/verify', ({ body }) => {
  if (String(body?.otp) !== '482193') {
    const err = new Error('Invalid code. Use the demo OTP 482193.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const email = String(body?.email ?? '').toLowerCase().trim()
  let registry = []
  try { registry = JSON.parse(window.localStorage.getItem('EduX_registered_students') || '[]') } catch { registry = [] }
  const draft = registry.find((r) => r.email?.toLowerCase() === email)
  if (!draft) {
    const err = new Error('Registration session not found — please register again.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  draft.verified = true
  try { window.localStorage.setItem('EduX_registered_students', JSON.stringify(registry)) } catch { /* storage unavailable */ }
  return { ok: true, verified: true }
})
/* Phase 3 — retired GET /auth/registration/status (unused read view; the
   register → OTP → verified flow is untouched and keeps its own registry). */
