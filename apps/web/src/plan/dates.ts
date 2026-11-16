// Calendar dates as YYYY-MM-DD strings in the device's local time zone.

export type IsoDate = string

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function fromIsoDate(value: IsoDate): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = fromIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Nearest Saturday, today included (R-ADD-5). */
export function nearestSaturday(today: Date): IsoDate {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7))
  return toIsoDate(date)
}
