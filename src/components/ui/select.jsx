import { createContext, forwardRef, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

const SelectContext = createContext(null)

const Select = forwardRef(function Select({ value, defaultValue, onValueChange, children, className, disabled, placeholder, id }, ref) {
  const [internal, setInternal] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const triggerRef = useRef(null)
  const current = value ?? internal

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    /* Flip the menu upward when it would overflow the viewport bottom, so
       the dropdown is never cut off at the screen edge. */
    const flip = () => {
      const trigger = triggerRef.current
      const menu = listRef.current?.closest?.('[data-select-menu]') ?? rootRef.current?.querySelector('[data-select-menu]')
      if (!trigger || !menu) return
      const tr = trigger.getBoundingClientRect()
      const mr = menu.getBoundingClientRect()
      const below = window.innerHeight - tr.bottom
      const above = tr.top
      if (below < mr.height + 8 && above > below) {
        menu.style.bottom = `${window.innerHeight - tr.top + 8}px`
        menu.style.top = 'auto'
      } else {
        menu.style.top = ''
        menu.style.bottom = ''
      }
    }
    const raf = requestAnimationFrame(() => {
      flip()
      // menu list height can change after items render — re-check once more
      setTimeout(flip, 60)
    })
    window.addEventListener('resize', flip)
    // focus the search field on open for keyboard-first flow
    const t = setTimeout(() => searchRef.current?.focus(), 40)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('resize', flip)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const focusItem = (index) => {
    const items = listRef.current ? [...listRef.current.querySelectorAll('button')] : []
    if (items.length) items[Math.max(0, Math.min(index, items.length - 1))].focus()
  }

  const onTriggerKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else focusItem(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      else {
        const items = listRef.current ? [...listRef.current.querySelectorAll('button')] : []
        focusItem(items.length - 1)
      }
    } else if ((e.key === 'Enter' || e.key === ' ') && !open) {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const items = [...listRef.current.querySelectorAll('button')]
      const idx = items.indexOf(document.activeElement)
      focusItem(idx + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const items = [...listRef.current.querySelectorAll('button')]
      const idx = items.indexOf(document.activeElement)
      focusItem(idx - 1)
    }
  }

  const selectedLabel = children?.find?.((c) => c?.props?.value === current)?.props?.children ?? placeholder ?? 'Select…'

  return (
    <SelectContext.Provider value={{ current, setCurrent: (v) => { setInternal(v); onValueChange?.(v); setOpen(false) }, open, setOpen, search, setSearch }}>
      <div ref={rootRef} className={cn('relative', className)}>
        <button
          ref={(node) => { triggerRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          onKeyDown={onTriggerKeyDown}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={placeholder ?? 'Select option'}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 text-sm font-medium shadow-sm transition-all dark:bg-slate-950/60',
            open
              ? 'border-indigo-400 ring-4 ring-indigo-500/15'
              : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <span className="truncate text-slate-900 dark:text-slate-100">{selectedLabel}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              data-select-menu
              className="absolute z-[70] mt-2 max-h-72 w-full min-w-[12rem] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lift backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
            >
              <div className="relative mb-1.5">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      focusItem(0)
                    }
                  }}
                  placeholder="Search…"
                  aria-label="Search options"
                  className="h-9 w-full rounded-lg border-0 bg-slate-100 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800"
                />
              </div>
              <div ref={listRef} role="listbox" onKeyDown={onListKeyDown} className="max-h-52 overflow-y-auto scrollbar-thin">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SelectContext.Provider>
  )
})

const SelectItem = forwardRef(function SelectItem({ value, className, children, ...props }, ref) {
  const { current, setCurrent, search } = useContext(SelectContext)
  const selected = current === value
  if (search && !String(children).toLowerCase().includes(search.toLowerCase())) return null
  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => setCurrent(value)}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        selected
          ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {selected && <Check className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />}
    </button>
  )
})

const SelectTrigger = ({ children }) => children
const SelectContent = ({ children }) => children
const SelectValue = ({ children }) => children

export { Select, SelectItem, SelectTrigger, SelectContent, SelectValue }
export default Select
