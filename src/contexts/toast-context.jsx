/**
 * Toast context — compatibility re-export.
 *
 * The single toast implementation (state + rendered UI) lives in
 * `components/ui/toast.jsx`. This module exists so that any import path
 * (`@/contexts/toast-context` or `@/components/ui`) resolves to the same
 * provider and the same `useToast` hook — a mismatch between the two used
 * to mount a state-only provider while consumers read a different context,
 * which crashed every page that called `useToast`.
 */
export { ToastProvider, useToast, ToastContext } from '@/components/ui/toast'
export { default } from '@/components/ui/toast'
