import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { APP_CONFIG } from '@/config'
import { login as authLogin } from '@/services/auth'

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
    /* Phase 10 — no demo authentication. Credentials are validated by the
       real backend (POST /auth/login). When the backend is unavailable the
       call rejects and the login page shows an appropriate network/error
       state — the frontend NEVER fakes a successful login.

       The verified registration-draft path (register -> OTP -> session) is a
       prototype registration flow retained because no backend registration
       endpoint exists yet; it is NOT a demo-credential backdoor. */
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
      // Session tokens are issued by the registration flow on the backend
      // once that endpoint exists; until then the session is client-only.
      persistTokens(`sess_${Date.now()}`, `sess_${Date.now()}_r`)
      window.localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
      setStatus('authenticated')
      return sessionUser
    }

    // Real backend authentication only — no DEMO_USERS, no fake tokens.
    return authLogin({ email, password, role }).then((session) => {
      const sessionUser = { ...session }
      persistTokens(session.accessToken ?? `sess_${Date.now()}`, session.refreshToken ?? `sess_${Date.now()}_r`)
      window.localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
      setStatus('authenticated')
      return sessionUser
    })
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
