// Reads a stored or imported plan and brings it to the current version (rule P5).
// Unknown or broken data returns null instead of a half-valid plan.
import { isIsoDate } from './dates.ts'
import { PLAN_VERSION, type Plan, type PlanDay, type PlanItem } from './model.ts'

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

function readItem(raw: unknown): PlanItem | null {
  if (!isObject(raw) || !isText(raw.uid)) return null
  switch (raw.kind) {
    case 'place':
      return isText(raw.placeId) ? { kind: 'place', uid: raw.uid, placeId: raw.placeId } : null
    case 'event':
      return isText(raw.eventId) ? { kind: 'event', uid: raw.uid, eventId: raw.eventId } : null
    case 'activity': {
      if (!isText(raw.activityId) || !isText(raw.ideaId)) return null
      const item: PlanItem = { kind: 'activity', uid: raw.uid, activityId: raw.activityId, ideaId: raw.ideaId }
      if (isText(raw.filmGenre)) item.filmGenre = raw.filmGenre as typeof item.filmGenre
      if (isText(raw.filmId)) item.filmId = raw.filmId
      return item
    }
    case 'custom': {
      if (!isText(raw.title)) return null
      const minutes = typeof raw.durationMinutes === 'number' && Number.isFinite(raw.durationMinutes) ? Math.round(raw.durationMinutes) : 60
      const item: PlanItem = { kind: 'custom', uid: raw.uid, title: raw.title.trim().slice(0, 60), durationMinutes: Math.min(480, Math.max(15, minutes)) }
      if (isText(raw.address)) item.address = raw.address.trim().slice(0, 100)
      return item
    }
    default:
      return null
  }
}

function readDay(raw: unknown): PlanDay | null {
  if (!isObject(raw) || !isIsoDate(raw.date) || !Array.isArray(raw.items)) return null
  const items: PlanItem[] = []
  const uids = new Set<string>()
  for (const entry of raw.items) {
    const item = readItem(entry)
    if (!item || uids.has(item.uid)) return null
    uids.add(item.uid)
    items.push(item)
  }
  return { date: raw.date, items }
}

export function migratePlan(raw: unknown): Plan | null {
  if (!isObject(raw)) return null
  if (raw.version !== PLAN_VERSION) return null // future versions add a step here: v1 → v2 …
  if (!isText(raw.area) || !Array.isArray(raw.days) || raw.days.length < 1 || raw.days.length > 2) return null
  const days: PlanDay[] = []
  for (const entry of raw.days) {
    const day = readDay(entry)
    if (!day) return null
    days.push(day)
  }
  const plan: Plan = { version: PLAN_VERSION, area: raw.area, days }
  if (isText(raw.sourceTitle)) plan.sourceTitle = raw.sourceTitle
  return plan
}
