// Plan file for moving a plan between browsers and site addresses (R-SAVE-2, TASK-056).
// The file is the saved Plan itself with its version; reading goes through migratePlan (rule P5).
import { migratePlan } from './migrate.ts'
import type { Plan } from './model.ts'

export const PLAN_FILE_NAME = 'weekend-search-plan.json'
/** A real plan file is a few kilobytes; anything far larger is not ours. */
export const PLAN_FILE_MAX_BYTES = 200_000

export function planToFile(plan: Plan): string {
  return JSON.stringify(plan, null, 2) + '\n'
}

/** Returns the plan from a file, or null for a broken, foreign or newer-version file. */
export function planFromFile(text: string): Plan | null {
  if (text.length > PLAN_FILE_MAX_BYTES) return null
  try {
    return migratePlan(JSON.parse(text.replace(/^\uFEFF/, '')))
  } catch {
    return null
  }
}

export type KnownIds = { places: Set<string>; events: Set<string>; activities: Set<string> }

/** Items whose ids are no longer in the knowledge base. They stay in the plan and are shown as unavailable (R-SAVE-3). */
export function unavailableCount(plan: Plan, known: KnownIds): number {
  return plan.days.flatMap(day => day.items).filter(item => {
    switch (item.kind) {
      case 'place': return !known.places.has(item.placeId)
      case 'event': return !known.events.has(item.eventId)
      case 'activity': return !known.activities.has(item.activityId)
      case 'custom': return false
    }
  }).length
}
