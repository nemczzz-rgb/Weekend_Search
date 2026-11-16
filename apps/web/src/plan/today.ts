// Status «сегодня» and preparation lines (plan section 8.4, docs/ux/interaction-rules.md R-TODAY).
import type { Activity } from '../content/types.ts'
import { addDays, toIsoDate, type IsoDate } from './dates.ts'

export type Lead = { min: number; max: number; note?: string }

/** R-TODAY-1: the activity with the largest lead time decides; min and max come from the same activity. */
export function leadOf(activities: Activity[]): Lead | null {
  let best: Activity | null = null
  for (const activity of activities) {
    const lead = activity.leadTimeHours
    if (!lead || lead.min <= 0) continue
    const current = best?.leadTimeHours
    if (!current || lead.min > current.min || (lead.min === current.min && lead.max > current.max)) best = activity
  }
  if (!best?.leadTimeHours) return null
  return { min: best.leadTimeHours.min, max: best.leadTimeHours.max, note: best.leadTimeNote }
}

export function activeMinutes(activities: Activity[]): number {
  return activities.reduce((total, activity) => total + activity.durationMinutes, 0)
}

/** Lead term for texts (docs/ux/content-rules.md): days from 24 h, hours below. */
export type LeadTerm = { unit: 'days' | 'hours'; from: number; to: number }

export function leadTerm(lead: Lead): LeadTerm {
  if (lead.min >= 24) return { unit: 'days', from: Math.ceil(lead.min / 24), to: Math.ceil(lead.max / 24) }
  return { unit: 'hours', from: lead.min, to: lead.max }
}

export type TodayStatus =
  | { kind: 'lead'; term: LeadTerm; note?: string }
  | { kind: 'today' }
  | { kind: 'later' }

const DAY_ENDS_AT_HOUR = 23

/** R-TODAY-2. Opening hours of places are not taken into account. */
export function todayStatus(activities: Activity[], now: Date): TodayStatus {
  const lead = leadOf(activities)
  if (lead) return { kind: 'lead', term: leadTerm(lead), note: lead.note }
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAY_ENDS_AT_HOUR, 0, 0)
  const minutesLeft = (endOfDay.getTime() - now.getTime()) / 60000
  return minutesLeft > activeMinutes(activities) ? { kind: 'today' } : { kind: 'later' }
}

const leadDays = (lead: Lead) => Math.ceil(lead.min / 24)

/** R-TODAY-3: the latest date to start preparing for a day. */
export function prepDeadline(dayDate: IsoDate, lead: Lead): IsoDate {
  return addDays(dayDate, -leadDays(lead))
}

/** R-TODAY-4: the first day that is far enough for preparation started today. */
export function nearestSuitableDate(today: Date, lead: Lead): IsoDate {
  return addDays(toIsoDate(today), leadDays(lead))
}

export type PrepLine = { deadline: IsoDate; missed: boolean; nearest: IsoDate; note?: string }

/** R-TODAY-3 and R-TODAY-4 for a day of the plan. */
export function prepLine(dayDate: IsoDate, activities: Activity[], today: Date): PrepLine | null {
  const lead = leadOf(activities)
  if (!lead) return null
  const deadline = prepDeadline(dayDate, lead)
  return { deadline, missed: deadline < toIsoDate(today), nearest: nearestSuitableDate(today, lead), note: lead.note }
}
