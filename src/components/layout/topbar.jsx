import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, Command, FolderOpen, LogOut, Menu, Moon, Search, Settings, Sparkles, Sun, User,
} from 'lucide-react'
import {
  Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Tooltip,
} from '@/components/ui'

function Topbar({ role, user, isDark, onToggleTheme, onOpenSidebar, onOpenPalette, onLogout }) {
  const navigate = useNavigate()
  // Students use the unified MediXO Mentor workspace; faculty use the AI
  // Teaching Assistant. Other roles (admin) have no AI workspace in the
  // current version — the sparkles entry is hidden for them (no dead links).
  const hasAiWorkspace = role === 'student' || role === 'faculty'
  const mentorPath = hasAiWorkspace
    ? (role === 'student' ? '/student/mentor' : '/faculty/ai-assistant')
    : null

  return (
    <header className="glass-nav sticky top-0 z-30">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenSidebar}
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search trigger */}
        <button
          onClick={onOpenPalette}
          className="group hidden h-10 w-full max-w-md items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 text-sm text-slate-400 shadow-sm transition-all hover:border-indigo-300 hover:shadow-soft sm:flex dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500 dark:hover:border-indigo-500/40"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search anything…</span>
          <kbd className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {hasAiWorkspace && (
          <Tooltip content={role === 'student' ? 'MediXO Mentor' : 'AI Teaching Assistant'}>
            <button
              onClick={() => navigate(mentorPath)}
              className="group relative rounded-xl p-2.5 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
              aria-label={role === 'student' ? 'Open MediXO Mentor' : 'Open AI Teaching Assistant'}
            >
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
              </span>
              <Sparkles className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>
          )}

          <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <button
              onClick={onToggleTheme}
              className="rounded-xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
          </Tooltip>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-800" />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-2xl p-1.5 pr-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Account menu">
              <Avatar name={user?.fullName} size="sm" />
              <span className="hidden max-w-[140px] truncate text-[13px] font-semibold text-slate-700 md:block dark:text-slate-200">
                {user?.fullName}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5 py-1">
                  <Avatar name={user?.fullName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.fullName}</p>
                    <p className="truncate text-[11px] font-normal normal-case tracking-normal text-slate-400">{user?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem icon={User} onClick={() => navigate(role === 'faculty' ? '/faculty/ai-assistant?tab=profile' : `/${role}/settings`)}>
                  Profile
                </DropdownMenuItem>
                {role === 'student' && (
                  <DropdownMenuItem icon={FolderOpen} onClick={() => navigate('/student/portfolio')}>
                    Digital Portfolio
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem icon={Settings} onClick={() => navigate(`/${role}/settings`)}>
                  Settings
                </DropdownMenuItem>
                {hasAiWorkspace && (
                  <DropdownMenuItem icon={Sparkles} onClick={() => navigate(mentorPath)}>
                    {role === 'student' ? 'MediXO Mentor' : 'AI Teaching Assistant'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={LogOut} className="text-rose-600 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={onLogout}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export { Topbar }
export default Topbar
