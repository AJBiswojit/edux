import { createContext, forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

const DropdownContext = createContext(null)

const DropdownMenu = forwardRef(function DropdownMenu({ open, onOpenChange, children }, ref) {
  const [internal, setInternal] = useState(false)
  const isOpen = open ?? internal
  const setOpen = (v) => {
    setInternal(v)
    onOpenChange?.(v)
  }
  const rootRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  return (
    <DropdownContext.Provider value={{ isOpen, setOpen }}>
      <div ref={rootRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
})

const DropdownMenuTrigger = forwardRef(function DropdownMenuTrigger({ className, children, ...props }, ref) {
  const { setOpen, isOpen } = useContext(DropdownContext)
  return (
    <button ref={ref} className={cn(className)} aria-expanded={isOpen} onClick={() => setOpen(!isOpen)} {...props}>
      {children}
    </button>
  )
})

function DropdownMenuContent({ className, align = 'start', children, ...props }) {
  const { isOpen, setOpen } = useContext(DropdownContext)
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setOpen(false)}
          className={cn(
            'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lift backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const DropdownMenuItem = forwardRef(function DropdownMenuItem({ className, icon: Icon, checked, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
      <span className="flex-1 text-left">{children}</span>
      {checked && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
    </button>
  )
})

const DropdownMenuLabel = forwardRef(function DropdownMenuLabel({ className, ...props }, ref) {
  return <div ref={ref} className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500', className)} {...props} />
})

const DropdownMenuSeparator = forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <div ref={ref} className={cn('my-1.5 h-px bg-slate-200/80 dark:bg-slate-800', className)} {...props} />
})

const DropdownMenuGroup = forwardRef(function DropdownMenuGroup({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col gap-0.5', className)} {...props} />
})

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
}
export default DropdownMenu
