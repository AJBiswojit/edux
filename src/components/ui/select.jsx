import { Children, createContext, forwardRef, useContext, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

const SelectContext = createContext(null)

const Select = forwardRef(function Select({ value, defaultValue, onValueChange, children, className, disabled, placeholder, id, ariaLabel, active = false, collision = false }, ref) {
  const [internal, setInternal] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [menuStyle, setMenuStyle] = useState(null)
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const menuId = useId()
  const current = value ?? internal

  useEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return undefined
    }
    const onDoc = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)

    const positionMenu = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return
      const triggerBox = trigger.getBoundingClientRect()
      if (!collision) {
        /* Preserve the original absolute-menu behaviour for the rest of
           EduX; Source Library filters opt into the fixed collision mode. */
        const menuBox = menu.getBoundingClientRect()
        const below = window.innerHeight - triggerBox.bottom
        const above = triggerBox.top
        if (below < menuBox.height + 8 && above > below) {
          menu.style.bottom = `${window.innerHeight - triggerBox.top + 8}px`
          menu.style.top = 'auto'
        } else {
          menu.style.top = ''
          menu.style.bottom = ''
        }
        return
      }
      const viewportPadding = 8
      const width = Math.min(Math.max(triggerBox.width, 192), Math.max(1, window.innerWidth - viewportPadding * 2))
      const left = Math.min(Math.max(triggerBox.left, viewportPadding), Math.max(viewportPadding, window.innerWidth - width - viewportPadding))
      const measuredHeight = Math.min(288, Math.max(menu.scrollHeight, menu.getBoundingClientRect().height))
      const below = Math.max(0, window.innerHeight - triggerBox.bottom - viewportPadding)
      const above = Math.max(0, triggerBox.top - viewportPadding)
      const openUp = below < measuredHeight && above > below
      const available = Math.max(48, openUp ? above : below)
      setMenuStyle({
        left,
        width,
        maxHeight: available,
        top: openUp ? 'auto' : triggerBox.bottom + viewportPadding,
        bottom: openUp ? window.innerHeight - triggerBox.top + viewportPadding : 'auto',
      })
    }

    let settleTimer
    const raf = requestAnimationFrame(() => {
      positionMenu()
      // The menu's list/search field can settle after its first paint.
      settleTimer = window.setTimeout(positionMenu, 60)
    })
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    // Focus the menu search field for keyboard-first filtering.
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 40)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      clearTimeout(focusTimer)
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, collision, search])

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

  const selectedItem = Children.toArray(children).find((child) => child?.props?.value === current)
  const selectedLabel = selectedItem?.props?.children ?? placeholder ?? 'Select…'
  const selectedLabelText = typeof selectedLabel === 'string' || typeof selectedLabel === 'number' ? String(selectedLabel) : 'Selected option'

  return (
    <SelectContext.Provider value={{ current, setCurrent: (v) => { setInternal(v); onValueChange?.(v); setOpen(false) }, open, setOpen, search, setSearch }}>
      <div ref={rootRef} className={cn('relative', className)}>
        <button
          ref={(node) => { triggerRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }}
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => setOpen(!open)}
          onKeyDown={onTriggerKeyDown}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? menuId : undefined}
          aria-label={ariaLabel ? `${ariaLabel}: ${selectedLabelText}` : placeholder ?? selectedLabelText}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 text-sm font-medium transition-all dark:bg-slate-950/60',
            active && !open && 'border-indigo-300 bg-indigo-50/40 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/10 dark:text-indigo-300',
            open
              ? 'border-indigo-400 ring-4 ring-indigo-500/15'
              : !active && 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <span className={cn('truncate', active ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-900 dark:text-slate-100')}>{selectedLabel}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              ref={menuRef}
              id={menuId}
              data-select-menu
              style={collision ? { ...(menuStyle ?? {}), visibility: menuStyle ? 'visible' : 'hidden' } : undefined}
              className={cn(
                'z-[70] flex max-h-72 min-w-[12rem] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-lift backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95',
                collision ? 'fixed' : 'absolute mt-2 w-full'
              )}
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
              <div ref={listRef} role="listbox" onKeyDown={onListKeyDown} className="min-h-0 max-h-52 flex-1 overflow-y-auto scrollbar-thin">{children}</div>
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
