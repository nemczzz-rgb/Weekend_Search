// Wish → draft of one day, without AI (D3). Rules: docs/ux/interaction-rules.md R-WISH-1…9.
// Step A: a whole day idea with a home part (home or mixed) when at least two words match its keywords.
// City-only wishes keep the previous behaviour through routes (reference phrase 6 of section 8.3).
// Step B: home signals in the remaining words pick home activities of matching ideas.
// Step C: city words and «кино» without «дома» pick places of the best route.
import type { Activity, DayIdea, Place, Route } from '../content/types.ts'
import { cityTopics, normalize, rankRoutes, routeTextScore } from '../planner.ts'
import { MAX_ITEMS_PER_DAY, type NewPlanItem } from './model.ts'

export type WishData = { dayIdeas: DayIdea[]; activities: Activity[]; routes: Route[]; places: Place[] }

export type WishDraft = {
  /** Draft of one day: city first, home after (R-WISH-5). */
  items: NewPlanItem[]
  /** Title for S07 when the draft is one idea or one route as a whole (R-MODEL-1). */
  sourceTitle?: string
  /** True when nothing matched and the general city variant was used (R-WISH-6). */
  fallback: boolean
  /** Which rule produced what — for tests and debugging. */
  trace: { wholeIdeaId?: string; homeIdeaIds: string[]; routeId?: string }
}

const STOP_WORDS = new Set([
  'а', 'и', 'в', 'во', 'на', 'по', 'с', 'со', 'к', 'ко', 'у', 'о', 'об', 'за', 'из', 'от', 'до', 'для', 'не', 'но', 'или',
  'же', 'бы', 'ли', 'то', 'что', 'нибудь', 'хочу', 'хочется', 'хотим', 'хотел', 'хотела', 'весь', 'всё', 'все', 'день',
  'потом', 'затем', 'еще', 'сходить', 'пойти', 'сделать', 'устроить', 'можно', 'бы', 'мне', 'нам',
])

const HOME = ['дома', 'домой', 'домашн', 'диван']
const HOME_SIGNALS: Array<{ name: string; stems: string[]; needsHome?: boolean }> = [
  { name: 'film-home', stems: ['фильм', 'кино', 'киновечер', 'сериал'], needsHome: true },
  { name: 'cooking', stems: ['готов', 'пицц', 'испеч', 'рецепт', 'выпеч'] },
  { name: 'selfcare', stems: ['спа', 'ванн', 'маск', 'отдохн'] },
  { name: 'craft', stems: ['глин', 'лепить', 'лепк', 'рисова', 'творч'] },
  { name: 'reading', stems: ['книг', 'почитать', 'читать', 'чтени'] },
]
const CINEMA = ['кино', 'кинотеатр']
const MAX_HOME_ACTIVITIES = 3

export function tokenize(text: string): string[] {
  return normalize(text).split(/[^\p{L}\p{N}]+/u).filter(token => token.length >= 2 && !STOP_WORDS.has(token))
}

/** R-WISH-1: a token matches a keyword word by its start («фильмы» ~ «фильм»). */
function tokenMatchesWord(token: string, word: string): boolean {
  return token.startsWith(word) || (token.length >= 4 && word.startsWith(token))
}

const hasStem = (token: string, stems: string[]) => stems.some(stem => token.startsWith(stem))

/** Tokens of the query that take part in matched keywords; a multi-word keyword needs all its words. */
function matchedTokens(tokens: string[], keywords: string[]): Set<string> {
  const used = new Set<string>()
  for (const keyword of keywords) {
    const words = normalize(keyword).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
    const hits = words.map(word => tokens.find(token => tokenMatchesWord(token, word)))
    if (words.length && hits.every(Boolean)) hits.forEach(hit => used.add(hit as string))
  }
  return used
}

function keywordMatchesStem(keywords: string[], stems: string[]): boolean {
  return keywords.some(keyword => normalize(keyword).split(/[^\p{L}\p{N}]+/u).some(word => stems.some(stem => word.startsWith(stem))))
}

export function draftFromWish(text: string, data: WishData, area = ''): WishDraft {
  const tokens = tokenize(text)
  const activityById = new Map(data.activities.map(activity => [activity.id, activity]))
  const cityItems: NewPlanItem[] = []
  const homeItems: NewPlanItem[] = []
  const trace: WishDraft['trace'] = { homeIdeaIds: [] }
  const addActivities = (idea: DayIdea, onlyHome: boolean) => {
    for (const id of idea.activityIds) {
      const activity = activityById.get(id)
      if (!activity || (onlyHome && activity.location !== 'home')) continue
      const target = activity.location === 'home' ? homeItems : cityItems
      if (target === homeItems && homeItems.length >= MAX_HOME_ACTIVITIES) continue
      if ([...cityItems, ...homeItems].some(item => item.kind === 'activity' && item.activityId === id)) continue
      target.push({ kind: 'activity', activityId: id, ideaId: idea.id })
    }
  }

  // Step A (R-WISH-2)
  const preferCity = cityTopics(text).length > 0
  let best: { idea: DayIdea; used: Set<string> } | null = null
  for (const idea of data.dayIdeas) {
    if (idea.mode === 'city') continue
    const used = matchedTokens(tokens, idea.keywords)
    if (used.size < 2) continue
    if (!best || used.size > best.used.size) { best = { idea, used }; continue }
    const tie = used.size === best.used.size
    if (tie && preferCity && best.idea.mode === 'home' && idea.mode !== 'home') best = { idea, used }
  }
  if (best) {
    trace.wholeIdeaId = best.idea.id
    addActivities(best.idea, false)
  }
  const remaining = tokens.filter(token => !best?.used.has(token))

  // Step B (R-WISH-3)
  const hasHome = tokens.some(token => hasStem(token, HOME))
  const signals = HOME_SIGNALS
    .filter(signal => !signal.needsHome || hasHome)
    .map(signal => ({ signal, at: remaining.findIndex(token => hasStem(token, signal.stems)) }))
    .filter(found => found.at >= 0)
    .sort((a, b) => a.at - b.at)
  for (const { signal } of signals) {
    if (homeItems.length >= MAX_HOME_ACTIVITIES) break
    const idea = data.dayIdeas.find(candidate => candidate.mode !== 'city' && candidate.id !== trace.wholeIdeaId
      && !trace.homeIdeaIds.includes(candidate.id) && keywordMatchesStem(candidate.keywords, signal.stems))
    if (!idea) continue
    trace.homeIdeaIds.push(idea.id)
    addActivities(idea, true)
  }
  if (hasHome && !best && homeItems.length === 0) {
    const idea = data.dayIdeas.find(candidate => candidate.mode === 'home')
    if (idea) { trace.homeIdeaIds.push(idea.id); addActivities(idea, true) }
  }

  // Step C (R-WISH-4)
  const remainingText = remaining.join(' ')
  const cinema = !hasHome && remaining.some(token => hasStem(token, CINEMA))
  const cityWanted = cityTopics(remainingText).length > 0 || cinema
  const placeLimit = homeItems.length > 0 ? 3 : 4
  const addRoute = (route: Route) => {
    trace.routeId = route.id
    for (const placeId of route.placeIds) {
      if (cityItems.filter(item => item.kind === 'place').length >= placeLimit) break
      if (!data.places.some(place => place.id === placeId)) continue
      cityItems.push({ kind: 'place', placeId })
    }
  }
  if (cityWanted || (remaining.length > 0 && !best && homeItems.length === 0)) {
    const ranked = rankRoutes(data.routes, remainingText, [], area)
    if (ranked[0] && routeTextScore(ranked[0], remainingText, [], '') > 0) addRoute(ranked[0])
  }

  // R-WISH-6: nothing found — the general city variant, as before.
  let fallback = false
  if (cityItems.length === 0 && homeItems.length === 0) {
    const ranked = rankRoutes(data.routes, text, [], area)
    if (ranked[0]) addRoute(ranked[0])
    fallback = true
  }

  const items = [...cityItems, ...homeItems].slice(0, MAX_ITEMS_PER_DAY)
  let sourceTitle: string | undefined
  if (best && trace.homeIdeaIds.length === 0 && !trace.routeId) sourceTitle = best.idea.title
  else if (!best && trace.homeIdeaIds.length === 0 && trace.routeId) sourceTitle = data.routes.find(route => route.id === trace.routeId)?.title
  return { items, sourceTitle, fallback, trace }
}
