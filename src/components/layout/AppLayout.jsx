import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NAV_GROUPS } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { useToast } from '@/components/ui'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { AICopilotFab } from './ai-copilot'
import { CommandPalette } from './command-palette'
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetClose } from '@/components/ui'
import { Logo } from '@/components/shared/logo'
import { useMediaQuery } from '@/hooks/use-media-query'

function AppLayout() {
  const { user, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)

  const role = user?.role ?? 'student'
  const navGroups = useMemo(() => NAV_GROUPS[role] ?? NAV_GROUPS.student, [role])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
    setCopilotOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    toast.success('Signed out', 'See you soon!')
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-500/8 blur-3xl dark:bg-indigo-500/10" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-teal-500/6 blur-3xl dark:bg-teal-500/8" />
        <div className="bg-grid mask-fade-y absolute inset-0 opacity-40 dark:opacity-30" />
      </div>

      {/* Desktop sidebar — pure navigation; profile lives in the topbar avatar menu */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-slate-200/70 bg-white/80 backdrop-blur-2xl lg:block dark:border-slate-800 dark:bg-slate-950/70">
        <Sidebar navGroups={navGroups} role={role} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader>
            <Logo size={30} />
            <SheetClose />
          </SheetHeader>
          <SheetBody className="p-3">
            <Sidebar navGroups={navGroups} role={role} onNavigate={() => setSidebarOpen(false)} />
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="relative flex min-h-screen flex-col lg:pl-[264px]">
        <Topbar
          role={role}
          user={user}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onLogout={handleLogout}
        />

        <main id="main-content" tabIndex={-1} className="relative mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-6 outline-none sm:px-6 lg:px-8">
          {/*
            Page transition — enter-only.
            A keyed AnimatePresence with `mode="wait"` + an exit animation used
            to wrap the Outlet. When the exiting route's lazy chunk re-suspended
            (slow/contended loads, dev-server chunk revalidation), the exit never
            completed and the entering route never mounted — a blank page that
            only a manual refresh could clear. The enter animation keeps the
            premium feel with zero risk of a stuck exit.
          */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>

        <footer className="relative border-t border-slate-200/60 px-6 py-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          MediXO EduX · {user?.institution ?? 'Meridian Institute of Technology'} · v1.0
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} navGroups={navGroups} />
      <AICopilotFab open={copilotOpen} onOpenChange={setCopilotOpen} role={role} onNavigate={(to) => { setCopilotOpen(false); navigate(to) }} />
    </div>
  )
}

export { AppLayout }
export default AppLayout
