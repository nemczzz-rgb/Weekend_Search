// Plan model (plan section 8.1, refined by docs/ux/interaction-rules.md R-MODEL).
import type { GenreId, Id } from '../content/types.ts'
import type { IsoDate } from './dates.ts'

export const PLAN_VERSION = 1
/** R-ADD-4: a day holds at most this many items. */
export const MAX_ITEMS_PER_DAY = 6
/** R-ADD-5: default district for a new plan, as in the current demo. */
export const DEFAULT_AREA = 'Тверской'

export type PlaceItem = { kind: 'place'; uid: string; placeId: Id }
export type EventItem = { kind: 'event'; uid: string; eventId: Id }
/** R-MODEL-3: activities enter the plan only as part of a day idea, so ideaId is required. */
export type ActivityItem = { kind: 'activity'; uid: string; activityId: Id; ideaId: Id; filmGenre?: GenreId; filmId?: Id }
export type CustomItem = { kind: 'custom'; uid: string; title: string; address?: string; durationMinutes: number }
export type PlanItem = PlaceItem | EventItem | ActivityItem | CustomItem

/** Item description before it gets a uid. */
export type NewPlanItem =
  | Omit<PlaceItem, 'uid'>
  | Omit<EventItem, 'uid'>
  | Omit<ActivityItem, 'uid'>
  | Omit<CustomItem, 'uid'>

export type PlanDay = { date: IsoDate; items: PlanItem[] }

/** What is saved (R-MODEL-1). The wish text and the active day are not part of the plan (R-MODEL-2). */
export type Plan = {
  version: typeof PLAN_VERSION
  area: string
  days: PlanDay[]
  sourceTitle?: string
}

/** P2: plan persistence. Browser storage today (repository-local.ts), an API on an own server later. */
export interface PlanRepository {
  load(): Promise<Plan | null>
  /** Rejects when the plan could not be saved (R-SAVE-1). */
  save(plan: Plan): Promise<void>
}

/**
 * Duplicate key (R-ADD-3): the same place, event or activity is in the plan once,
 * even when the activity comes from different ideas. Custom items never collide.
 */
export function itemKey(item: PlanItem | NewPlanItem): string | null {
  switch (item.kind) {
    case 'place': return `place:${item.placeId}`
    case 'event': return `event:${item.eventId}`
    case 'activity': return `activity:${item.activityId}`
    case 'custom': return null
  }
}
