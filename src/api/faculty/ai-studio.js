/**
 * Faculty API — AI Teaching Studio saves.
 * Endpoint contract unchanged (POST /faculty/ai-studio/save).
 */
import { defineRoute } from '../core/router'
import { aiStudioHistory, savedLessonPlans } from '@/intelligence/faculty/datasets/ai-studio'

/* ---------------- AI Teaching Studio (saves) ----------------
   Saves append to the shared history / lesson-plan datasets so the
   foundation-derived studio views reflect them on the next refetch. */
defineRoute('post', '/faculty/ai-studio/save', ({ body }) => {
  const kind = body?.kind ?? 'item'
  const item = body?.item ?? {}
  const today = new Date().toISOString().slice(0, 10)
  const historyEntry = {
    id: `h_${Date.now()}`,
    type: kind === 'lesson-plan' ? 'lesson-plan' : kind === 'evaluation' ? 'evaluation' : kind === 'content' ? item?.type ?? 'notes' : kind,
    title: item?.title ?? `${kind} saved`,
    detail: item?.meta ?? `Saved from the AI Teaching Studio · ${today}`,
    date: today,
  }
  aiStudioHistory.unshift(historyEntry)
  if (kind === 'lesson-plan' && item?.plan) {
    savedLessonPlans.unshift({ ...item.plan, id: `lp_${Date.now()}`, created: today })
  }
  return { ok: true, historyEntry }
})
