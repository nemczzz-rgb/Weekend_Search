import { placeById, routeIdeas, type Place, type RouteIdea } from './data'

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

function normalize(value: string) { return value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е') }

export function rankIdeas(query: string, interests: string[], area: string): RouteIdea[] {
  const raw = normalize(`${query} ${interests.join(' ')}`)
  const wordStarts = ` ${raw.replace(/[^\p{L}\p{N}]+/gu, ' ')}`
  const signals = synonyms.filter(([pattern]) => pattern.test(raw)).map(([, tag]) => tag)

  return [...routeIdeas].sort((a, b) => {
    const score = (idea: RouteIdea) => {
      const words = normalize(`${idea.title} ${idea.subtitle} ${idea.theme} ${idea.keywords.join(' ')}`)
      let value = signals.reduce((total, signal) => total + (words.includes(signal) ? 4 : 0), 0)
      value += idea.keywords.reduce((total, keyword) => total + (wordStarts.includes(` ${normalize(keyword)}`) ? 2 : 0), 0)
      if (normalize(idea.area).includes(normalize(area))) value += 2
      return value
    }
    return score(b) - score(a)
  })
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
