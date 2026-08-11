import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { APP_CONFIG } from '@/config'
import { MOCK_USERS } from '@/mock-data/users'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(APP_CONFIG.USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistTokens(access, refresh) {
  window.localStorage.setItem(APP_CONFIG.TOKEN_KEY, access)
  window.localStorage.setItem(APP_CONFIG.REFRESH_TOKEN_KEY, refresh)
}

function clearTokens() {
  window.localStorage.removeItem(APP_CONFIG.TOKEN_KEY)
  window.localStorage.removeItem(APP_CONFIG.REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(APP_CONFIG.USER_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [status, setStatus] = useState(user ? 'authenticated' : 'anonymous')

  const login = useCallback(async ({ email, password, role, registerDraft }) => {
    // In mock mode, credentials are validated against the mock directory.
    // Swap this call for authService.login() when the backend is connected.
    await new Promise((r) => setTimeout(r, 700))

    /* Phase 28 — registration path: a verified registration draft becomes the
       session user through the SAME login primitive (no second auth system).
       The draft carries the role + registration profile (university &
       competitive context) and is hydrated for the student's first session. */
    if (registerDraft) {
      const sessionUser = {
        ...registerDraft,
        id: registerDraft.id ?? `u_stu_${Date.now()}`,
        role: 'student',
        firstName: (registerDraft.fullName ?? '').split(' ')[0] || 'Student',
        institution: registerDraft.university?.institution ?? 'Meridian Institute of Technology',
        department: registerDraft.university?.branch ?? null,
        program: registerDraft.university?.degree ?? null,
        semester: registerDraft.university?.semester ?? null,
        phone: registerDraft.phone ?? null,
        joinedAt: registerDraft.createdAt ?? new Date().toISOString().slice(0, 10),
        isNewRegistration: true,
      }
      persistTokens(`mock_access_${Date.now()}`, `mock_refresh_${Date.now()}`)
      window.localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
      setStatus('authenticated')
      return sessionUser
    }

    const normalized = email.toLowerCase().trim()
    const match = MOCK_USERS.find(
      (u) => u.email === normalized && (role ? u.role === role : true)
    )

    /* Phase 28 — a verified registration-draft user can sign back in:
       fall back to the in-browser registry (same storage as registration). */
    if (!match || password !== 'aurora123') {
      let registry = []
      try { registry = JSON.parse(window.localStorage.getItem('aurora_registered_students') || '[]') } catch { registry = [] }
      const draft = registry.find((r) => r.email?.toLowerCase() === normalized && r.verified && (role ? r.role === role : true))
      if (draft && password === draft.password) {
        const sessionUser = {
          ...draft,
          id: draft.id,
          role: 'student',
          firstName: (draft.fullName ?? '').split(' ')[0] || 'Student',
          institution: draft.university?.institution ?? 'Meridian Institute of Technology',
          department: draft.university?.branch ?? null,
          program: draft.university?.degree ?? null,
          semester: draft.university?.semester ?? null,
          phone: draft.phone ?? null,
          joinedAt: draft.createdAt ?? new Date().toISOString().slice(0, 10),
          isNewRegistration: false,
        }
        persistTokens(`mock_access_${Date.now()}`, `mock_refresh_${Date.now()}`)
        window.localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(sessionUser))
        setUser(sessionUser)
        setStatus('authenticated')
        return sessionUser
      }
      throw new Error(
        match
          ? 'Incorrect password. Hint: use the demo password “aurora123”.'
          : 'No account found for this email. Try one of the demo accounts.'
      )
    }

    const sessionUser = { ...match }
    persistTokens(`mock_access_${Date.now()}`, `mock_refresh_${Date.now()}`)
    window.localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    setStatus('authenticated')
    return sessionUser
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      window.localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    // Hydrate user across tabs.
    const onStorage = (e) => {
      if (e.key === APP_CONFIG.USER_KEY) setUser(e.newValue ? JSON.parse(e.newValue) : null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(
    () => ({ user, status, isAuthenticated: !!user, login, logout, updateUser }),
    [user, status, login, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthProvider
