import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ThemeProvider } from '@/contexts/theme-context'
// Single toast system: the provider that also renders the toast UI lives in
// components/ui/toast.jsx (contexts/toast-context re-exports it for compat).
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/contexts/auth-context'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import '@/api/mock-routes'
import '@/api/mock-routes-extra'
import '@/api/mock-routes-intelligence'
import '@/api/mock-routes-faculty-intelligence'
import '@/api/mock-routes-admin-intelligence'
import '@/api/mock-routes-exam-agent'
import '@/api/mock-routes-faculty-students'
import '@/api/mock-routes-faculty-interventions'
import '@/api/mock-routes-question-studio'
import '@/index.css'

/**
 * MediXO EduX — An AI-Powered Education Platform
 * Entry point. Providers (outer → inner):
 * BrowserRouter → QueryClient → Theme → Toast → Auth
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Honor the app-level reduced-motion preference before first paint.
try {
  if (window.localStorage.getItem('aurora_reduced_motion') === 'true') {
    document.documentElement.classList.add('reduced-motion')
  }
} catch {
  /* storage unavailable */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary showDetails>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
