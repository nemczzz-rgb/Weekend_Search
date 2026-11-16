import type { Activity, Audience, DayIdea, Film, GenreId } from '../../content/types.ts'
import type { NewPlanItem } from '../../plan/model.ts'
import { activeMinutes, todayStatus } from '../../plan/today.ts'
import type { Availability } from '../../ui/components.tsx'

export const AUDIENCES: { value: Audience; label: string }[] = [{ value: 'solo', label: 'Одному' }, { value: 'pair', label: 'Вдвоём' }, { value: 'friends', label: 'С друзьями' }, { value: 'family', label: 'С семьёй' }]
export const MODES = [{ value: 'all', label: 'Все' }, { value: 'home', label: 'Дома' }, { value: 'city', label: 'В городе' }, { value: 'mixed', label: 'Дома и в городе' }]
export const TIMES = [{ value: 'short', label: 'До 2 ч' }, { value: 'medium', label: '2–4 ч' }, { value: 'long', label: 'Больше 4 ч' }]
export type Filters = { mode: string; audience: Audience[]; time: string }
export function readFilters(query: URLSearchParams): Filters {
  return { mode: MODES.some(x => x.value === query.get('mode')) ? query.get('mode')! : 'all', audience: AUDIENCES.filter(x => query.getAll('for').flatMap(v => v.split(',')).includes(x.value)).map(x => x.value), time: TIMES.some(x => x.value === query.get('time')) ? query.get('time')! : '' }
}
export function ideaActivities(idea: DayIdea, activities: Activity[]): Activity[] { return idea.activityIds.flatMap(id => { const a = activities.find(a => a.id === id); return a ? [a] : [] }) }
export function sharedAudience(activities: Activity[]): Audience[] { return activities.length ? AUDIENCES.map(x => x.value).filter(a => activities.every(x => x.audience.includes(a))) : [] }
export function audienceText(activities: Activity[]): string { return AUDIENCES.filter(x => sharedAudience(activities).includes(x.value)).map((x, i) => i === 0 ? x.label : x.label.toLowerCase()).join(', ') }
export function needsOf(activities: Activity[]): string[] { return [...new Set(activities.flatMap(x => x.needs))] }
export function matchesIdea(idea: DayIdea, activities: Activity[], filters: Filters): boolean {
  const current = ideaActivities(idea, activities)
  if (current.length !== idea.activityIds.length) return false
  const minutes = activeMinutes(current)
  return (filters.mode === 'all' || idea.mode === filters.mode) && (!filters.audience.length || sharedAudience(current).some(x => filters.audience.includes(x))) && (!filters.time || (filters.time === 'short' ? minutes < 120 : filters.time === 'medium' ? minutes >= 120 && minutes <= 240 : minutes > 240))
}
export function formatMinutes(minutes: number): string { const hours = Math.floor(minutes / 60), rest = minutes % 60; return [hours ? `${hours} ч` : '', rest ? `${rest} мин` : ''].filter(Boolean).join(' ') || '0 мин' }
export function availability(activities: Activity[], now: Date): Availability {
  const status = todayStatus(activities, now)
  if (status.kind !== 'lead') return { kind: status.kind }
  const { from, to, unit } = status.term
  return { kind: 'lead', label: `Начать за ${from === to ? from : `${from}–${to}`} ${unit === 'days' ? 'дн.' : 'ч'}`, reason: status.note ? status.note[0].toUpperCase() + status.note.slice(1) : 'Нужна подготовка заранее' }
}
export function filmsForGenre(films: Film[], genre: GenreId): Film[] { return films.filter(x => x.genres.includes(genre)).sort((a, b) => Number(b.origin === 'owner') - Number(a.origin === 'owner') || b.year - a.year || a.id.localeCompare(b.id)) }
export function ideaItems(idea: DayIdea, activities: Activity[], selected?: { genre?: GenreId; filmId?: string }): NewPlanItem[] {
  return activities.map(activity => ({ kind: 'activity', activityId: activity.id, ideaId: idea.id, ...(activity.detail.type === 'films' ? { filmGenre: selected?.genre, filmId: selected?.filmId } : {}) }))
}
export function imageProps(idea: DayIdea, base: string) {
  if (!idea.image) return undefined
  const src = base + idea.image
  return { src, alt: idea.imageAlt ?? '', ...(idea.image.endsWith('-640.webp') ? { srcSet: `${src} 640w, ${base + idea.image.replace('-640.webp', '-1280.webp')} 1280w` } : {}) }
}
