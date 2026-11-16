import { placeById, routeIdeas, type Place, type RouteIdea } from './data.ts'

const synonyms: Array<[RegExp, string]> = [
  [/погуля|гуля|пешком|прогул/iu, 'прогулка'],
  [/старин|старо|истори|двор|переул/iu, 'история'],
  [/музе|выстав|галере|картин|искусств/iu, 'искусство'],
  [/парк|сад|зел[её]н|природ/iu, 'парк'],
  [/кофе|кафе|поесть|обед|еда|ресторан/iu, 'еда'],
  [/вода|река|набереж|закат/iu, 'вода'],
  [/архитект|здани|особняк/iu, 'архитектура'],
  [/дизайн|креатив|современн/iu, 'дизайн'],
  [/тих|спокой|нетороп/iu, 'тихо'],
]

export function normalize(value: string) { return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е') }

/** City topics found in the text (the synonym dictionary of section 8.2, «городские»). */
export function cityTopics(text: string): string[] {
  const raw = normalize(text)
  return synonyms.filter(([pattern]) => pattern.test(raw)).map(([, tag]) => tag)
}

type RankedRoute = { title: string; subtitle: string; theme: string; area: string; keywords: string[] }

/** Text score of a route: topic signals, keyword word starts and the start district. */
export function routeTextScore(route: RankedRoute, query: string, interests: string[], area: string): number {
  const raw = normalize(`${query} ${interests.join(' ')}`)
  const wordStarts = ` ${raw.replace(/[^\p{L}\p{N}]+/gu, ' ')}`
  const signals = cityTopics(raw)
  const words = normalize(`${route.title} ${route.subtitle} ${route.theme} ${route.keywords.join(' ')}`)
  let value = signals.reduce((total, signal) => total + (words.includes(signal) ? 4 : 0), 0)
  value += route.keywords.reduce((total, keyword) => total + (wordStarts.includes(` ${normalize(keyword)}`) ? 2 : 0), 0)
  if (area && normalize(route.area).includes(normalize(area))) value += 2
  return value
}

export function rankRoutes<T extends RankedRoute>(routes: T[], query: string, interests: string[], area: string): T[] {
  return [...routes].sort((a, b) => routeTextScore(b, query, interests, area) - routeTextScore(a, query, interests, area))
}

export function rankIdeas(query: string, interests: string[], area: string): RouteIdea[] {
  return rankRoutes(routeIdeas, query, interests, area)
}

export function getIdeaPlaces(idea: RouteIdea): Place[] {
  return idea.places.map(id => placeById.get(id)).filter((place): place is Place => Boolean(place))
}

export function makeDraft(idea: RouteIdea, daysCount: 1 | 2, query = '', interests: string[] = [], area = ''): Place[][] {
  const first = getIdeaPlaces(idea)
  if (daysCount === 1) return [first.slice(0, 4)]
  if (idea.days === 2) return [first.slice(0, 3), first.slice(3, 6)]

  const used = new Set(first.map(place => place.id))
  const secondIdea = rankIdeas(query, interests, area).find(candidate => candidate.id !== idea.id && getIdeaPlaces(candidate).some(place => !used.has(place.id)))
  const second = secondIdea ? getIdeaPlaces(secondIdea).filter(place => !used.has(place.id)).slice(0, 4) : []
  return [first.slice(0, 4), second]
}
