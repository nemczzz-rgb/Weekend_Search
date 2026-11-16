// Texts that depend on numbers and dates (docs/ux/content-rules.md).
import { fromIsoDate, type IsoDate } from '../plan/dates.ts'

export function plural(count: number, one: string, few: string, many: string): string {
  const last = count % 10, teens = count % 100
  if (last === 1 && teens !== 11) return one
  if (last >= 2 && last <= 4 && (teens < 12 || teens > 14)) return few
  return many
}

export const itemsWord = (count: number) => plural(count, 'пункт', 'пункта', 'пунктов')
export const daysWord = (count: number) => plural(count, 'день', 'дня', 'дней')

/** «суббота, 21 ноября» — lowercase inside a sentence. */
export function dayLabel(date: IsoDate): string {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromIsoDate(date))
}

const ACCUSATIVE: Record<string, string> = { среда: 'среду', пятница: 'пятницу', суббота: 'субботу' }
const GENITIVE: Record<string, string> = { понедельник: 'понедельника', вторник: 'вторника', среда: 'среды', четверг: 'четверга', пятница: 'пятницы', суббота: 'субботы', воскресенье: 'воскресенья' }
const PREPOSITIONAL: Record<string, string> = { понедельник: 'понедельнике', вторник: 'вторнике', среда: 'среде', четверг: 'четверге', пятница: 'пятнице', суббота: 'субботе', воскресенье: 'воскресенье' }

const weekday = (date: IsoDate) => new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(fromIsoDate(date))
const dayMonth = (date: IsoDate) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(fromIsoDate(date))

/** «в субботу, 21 ноября», «во вторник, 24 ноября» (R-ADD-2, toast.added). */
export function toDay(date: IsoDate): string {
  const day = weekday(date)
  return `${day === 'вторник' ? 'во' : 'в'} ${ACCUSATIVE[day] ?? day}, ${dayMonth(date)}`
}

/** «в субботе» (toast.limit). */
export function inDay(date: IsoDate): string {
  const day = weekday(date)
  return `${day === 'вторник' ? 'во' : 'в'} ${PREPOSITIONAL[day] ?? day}`
}

/** «не позже четверга, 19 ноября» (R-TODAY-3). */
export function notLaterThan(date: IsoDate): string {
  const day = weekday(date)
  return `не позже ${GENITIVE[day] ?? day}, ${dayMonth(date)}`
}

export const capitalize = (text: string) => text ? text[0].toUpperCase() + text.slice(1) : text

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60), rest = minutes % 60
  return [hours ? `${hours} ч` : '', rest ? `${rest} мин` : ''].filter(Boolean).join(' ') || '0 мин'
}

/** «15 ноября», «15–16 ноября», «30 ноября – 2 декабря». */
export function eventDates(start: IsoDate, end?: IsoDate): string {
  if (!end || end === start) return dayMonth(start)
  const a = fromIsoDate(start), b = fromIsoDate(end)
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${dayMonth(end)}`
  return `${dayMonth(start)} – ${dayMonth(end)}`
}
