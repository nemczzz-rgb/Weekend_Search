// Plan operations (docs/ux/interaction-rules.md) and a small store over PlanRepository (rule P2).
// Operations are pure: they take a plan and return a new one plus what happened, so screens
// can show the right message and undo exactly the last action.
import { addDays, nearestSaturday, toIsoDate, type IsoDate } from './dates.ts'
import {
  DEFAULT_AREA, MAX_ITEMS_PER_DAY, PLAN_VERSION, itemKey,
  type NewPlanItem, type Plan, type PlanDay, type PlanItem, type PlanRepository,
} from './model.ts'

export type MakeUid = () => string
const defaultUid: MakeUid = () => globalThis.crypto.randomUUID()

const cloneDays = (plan: Plan): PlanDay[] => plan.days.map(day => ({ date: day.date, items: [...day.items] }))
const withDays = (plan: Plan, days: PlanDay[], extra: Partial<Plan> = {}): Plan => ({ ...plan, ...extra, days })

/** R-ADD-5: a new plan has one day on the nearest Saturday. */
export function createPlan(today: Date, area = DEFAULT_AREA): Plan {
  return { version: PLAN_VERSION, area, days: [{ date: nearestSaturday(today), items: [] }] }
}

export function isPlanEmpty(plan: Plan | null): boolean {
  return !plan || plan.days.every(day => day.items.length === 0)
}

export function findItem(plan: Plan, uid: string): { dayIndex: number; index: number; item: PlanItem } | null {
  for (const [dayIndex, day] of plan.days.entries()) {
    const index = day.items.findIndex(item => item.uid === uid)
    if (index >= 0) return { dayIndex, index, item: day.items[index] }
  }
  return null
}

function keysInPlan(plan: Plan): Map<string, number> {
  const keys = new Map<string, number>()
  plan.days.forEach((day, dayIndex) => day.items.forEach(item => {
    const key = itemKey(item)
    if (key) keys.set(key, dayIndex)
  }))
  return keys
}

// ---------- adding (R-ADD) ----------

export type AddResult =
  | { status: 'added'; plan: Plan; addedUids: string[]; skipped: number }
  | { status: 'already'; plan: Plan; dayIndexes: number[] }
  | { status: 'limit'; plan: Plan; free: number }

/** R-ADD-1, R-ADD-3, R-ADD-4: append items to a day, skipping duplicates, all or nothing on the limit. */
export function addItems(plan: Plan, dayIndex: number, items: NewPlanItem[], makeUid: MakeUid = defaultUid): AddResult {
  if (!plan.days[dayIndex]) throw new RangeError(`No day ${dayIndex}`)
  const present = keysInPlan(plan)
  const batch = new Set<string>()
  const fresh = items.filter(item => {
    const key = itemKey(item)
    if (!key) return true
    if (present.has(key) || batch.has(key)) return false
    batch.add(key)
    return true
  })
  if (fresh.length === 0) {
    const dayIndexes = [...new Set(items.map(item => present.get(itemKey(item) ?? '')).filter((i): i is number => i !== undefined))]
    return { status: 'already', plan, dayIndexes }
  }
  const free = MAX_ITEMS_PER_DAY - plan.days[dayIndex].items.length
  if (fresh.length > free) return { status: 'limit', plan, free }
  const days = cloneDays(plan)
  const addedUids: string[] = []
  for (const item of fresh) {
    const uid = makeUid()
    addedUids.push(uid)
    days[dayIndex].items.push({ ...item, uid } as PlanItem)
  }
  return { status: 'added', plan: withDays(plan, days), addedUids, skipped: items.length - fresh.length }
}

/** R-ADD-6: undo of an addition removes exactly the added items. */
export function removeItems(plan: Plan, uids: string[]): Plan {
  const drop = new Set(uids)
  return withDays(plan, plan.days.map(day => ({ date: day.date, items: day.items.filter(item => !drop.has(item.uid)) })))
}

export type PresenceState = { total: number; inPlan: number; dayIndexes: number[] }

/** R-ADD-7: how much of an idea or route is already in the plan. */
export function presence(plan: Plan | null, items: NewPlanItem[]): PresenceState {
  const keys = plan ? keysInPlan(plan) : new Map<string, number>()
  const dayIndexes = new Set<number>()
  let inPlan = 0
  for (const item of items) {
    const day = keys.get(itemKey(item) ?? '')
    if (day !== undefined) { inPlan++; dayIndexes.add(day) }
  }
  return { total: items.length, inPlan, dayIndexes: [...dayIndexes].sort() }
}

/** R-ADD-8: a two-day route is split in half, the first half rounded up. */
export function splitInHalf<T>(items: T[]): [T[], T[]] {
  const first = Math.ceil(items.length / 2)
  return [items.slice(0, first), items.slice(first)]
}

// ---------- removing and undo (R-DEL) ----------

export type RemoveUndo = { item: PlanItem; dayIndex: number; index: number }

/** R-DEL-1 */
export function removeItem(plan: Plan, uid: string): { plan: Plan; undo: RemoveUndo } | null {
  const found = findItem(plan, uid)
  if (!found) return null
  const days = cloneDays(plan)
  days[found.dayIndex].items.splice(found.index, 1)
  return { plan: withDays(plan, days), undo: { item: found.item, dayIndex: found.dayIndex, index: found.index } }
}

/** R-DEL-1: put the removed item back where it was. */
export function restoreItem(plan: Plan, undo: RemoveUndo): Plan {
  if (findItem(plan, undo.item.uid) || !plan.days[undo.dayIndex]) return plan
  const days = cloneDays(plan)
  const items = days[undo.dayIndex].items
  items.splice(Math.min(undo.index, items.length), 0, undo.item)
  return withDays(plan, days)
}

/** R-DEL-4: days and dates stay, items and the source title go. */
export function clearPlan(plan: Plan): Plan {
  return { version: plan.version, area: plan.area, days: plan.days.map(day => ({ date: day.date, items: [] })) }
}

// ---------- moving (R-MOVE) ----------

/** R-MOVE-1: one step inside the day; null at the edges. */
export function moveItem(plan: Plan, uid: string, direction: -1 | 1): Plan | null {
  const found = findItem(plan, uid)
  if (!found) return null
  const target = found.index + direction
  if (target < 0 || target >= plan.days[found.dayIndex].items.length) return null
  const days = cloneDays(plan)
  const items = days[found.dayIndex].items
  ;[items[found.index], items[target]] = [items[target], items[found.index]]
  return withDays(plan, days)
}

export type TransferResult = { status: 'moved'; plan: Plan; toDayIndex: number } | { status: 'limit' | 'date' | 'single-day'; plan: Plan }

/**
 * R-MOVE-3, R-MOVE-4: to the end of the other day. `fitsDate` says whether an event
 * can happen on that date; other items always fit.
 */
export function transferItem(plan: Plan, uid: string, fitsDate: (item: PlanItem, date: IsoDate) => boolean = () => true): TransferResult {
  const found = findItem(plan, uid)
  if (!found || plan.days.length < 2) return { status: 'single-day', plan }
  const toDayIndex = found.dayIndex === 0 ? 1 : 0
  if (plan.days[toDayIndex].items.length >= MAX_ITEMS_PER_DAY) return { status: 'limit', plan }
  if (!fitsDate(found.item, plan.days[toDayIndex].date)) return { status: 'date', plan }
  const days = cloneDays(plan)
  days[found.dayIndex].items.splice(found.index, 1)
  days[toDayIndex].items.push(found.item)
  return { status: 'moved', plan: withDays(plan, days), toDayIndex }
}

// ---------- replacing (R-REPL) ----------

/** R-REPL-1: only places; the new place must not be in the plan yet. */
export function replacePlace(plan: Plan, uid: string, placeId: string): Plan | null {
  const found = findItem(plan, uid)
  if (!found || found.item.kind !== 'place') return null
  if (keysInPlan(plan).has(`place:${placeId}`)) return null
  const days = cloneDays(plan)
  days[found.dayIndex].items[found.index] = { kind: 'place', uid: found.item.uid, placeId }
  return withDays(plan, days)
}

// ---------- days and dates (R-DAYS) ----------

export type DayCountResult = { status: 'ok'; plan: Plan } | { status: 'needs-choice' | 'no-room'; plan: Plan }

/** R-DAYS-1, R-DAYS-2. `secondDay` decides what happens to the items of day 2 when going to one day. */
export function setDayCount(plan: Plan, count: 1 | 2, secondDay?: 'move' | 'delete'): DayCountResult {
  if (count === plan.days.length) return { status: 'ok', plan }
  if (count === 2) {
    return { status: 'ok', plan: withDays(plan, [...cloneDays(plan), { date: addDays(plan.days[0].date, 1), items: [] }]) }
  }
  const [first, second] = cloneDays(plan)
  if (second.items.length === 0) return { status: 'ok', plan: withDays(plan, [first]) }
  if (!secondDay) return { status: 'needs-choice', plan }
  if (secondDay === 'delete') return { status: 'ok', plan: withDays(plan, [first]) }
  if (first.items.length + second.items.length > MAX_ITEMS_PER_DAY) return { status: 'no-room', plan }
  return { status: 'ok', plan: withDays(plan, [{ date: first.date, items: [...first.items, ...second.items] }]) }
}

/** R-DAYS-1, R-DAYS-3: the second day always follows the first. */
export function setFirstDate(plan: Plan, date: IsoDate): Plan {
  return withDays(plan, plan.days.map((day, index) => ({ date: addDays(date, index), items: [...day.items] })))
}

export function setArea(plan: Plan, area: string): Plan {
  return { ...plan, area, days: cloneDays(plan) }
}

/** R-DAYS-4 */
export function isOutdated(plan: Plan, today: Date): boolean {
  return plan.days[0].date < toIsoDate(today)
}

export function moveToNearestSaturday(plan: Plan, today: Date): Plan {
  return setFirstDate(plan, nearestSaturday(today))
}

/** R-DAYS-5: a home day has only home activities. */
export function isHomeDay(day: PlanDay, activityLocation: (activityId: string) => 'home' | 'city' | undefined): boolean {
  return day.items.length > 0 && day.items.every(item => item.kind === 'activity' && activityLocation(item.activityId) === 'home')
}

// ---------- film choice (R-FILM-3) ----------

export function setFilm(plan: Plan, uid: string, filmGenre: string | undefined, filmId: string | undefined): Plan | null {
  const found = findItem(plan, uid)
  if (!found || found.item.kind !== 'activity') return null
  const days = cloneDays(plan)
  const item = { ...found.item }
  if (filmGenre) item.filmGenre = filmGenre as typeof item.filmGenre; else delete item.filmGenre
  if (filmId) item.filmId = filmId; else delete item.filmId
  days[found.dayIndex].items[found.index] = item
  return withDays(plan, days)
}

// ---------- store over a repository (P2, R-SAVE-1) ----------

type Listener = (plan: Plan | null) => void

export class PlanStore {
  private plan: Plan | null = null
  private listeners = new Set<Listener>()
  /** False when the last save failed: the plan lives only until the page closes (R-SAVE-1). */
  storageAvailable = true
  private readonly repository: PlanRepository

  constructor(repository: PlanRepository) {
    this.repository = repository
  }

  async init(): Promise<Plan | null> {
    try {
      this.plan = await this.repository.load()
    } catch {
      this.plan = null
    }
    this.emit()
    return this.plan
  }

  get(): Plan | null {
    return this.plan
  }

  /** Replace the plan and persist it. Saving errors never break the screen. */
  async set(plan: Plan | null): Promise<void> {
    this.plan = plan
    this.emit()
    if (!plan) return
    try {
      await this.repository.save(plan)
      this.storageAvailable = true
    } catch {
      this.storageAvailable = false
    }
    this.emit()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.plan)
  }
}
