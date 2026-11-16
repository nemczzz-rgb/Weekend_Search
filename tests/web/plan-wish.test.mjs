// Reference wishes of plan section 8.3 on the real knowledge base (AC-DI-07; docs/ux/interaction-rules.md R-WISH).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const { draftFromWish, tokenize } = await import('../../apps/web/src/plan/wish.ts')
const { rankIdeas, makeDraft } = await import('../../apps/web/src/planner.ts')
const read = name => JSON.parse(readFileSync(new URL(`../../apps/web/src/content/${name}.json`, import.meta.url), 'utf8'))
const data = { dayIdeas: read('day-ideas'), activities: read('activities'), routes: read('routes'), places: read('places') }
const activity = new Map(data.activities.map(a => [a.id, a]))
const place = new Map(data.places.map(p => [p.id, p]))
const AREA = 'Тверской'

const isHome = item => item.kind === 'activity' && activity.get(item.activityId).location === 'home'
const isCity = item => item.kind === 'place' || (item.kind === 'activity' && activity.get(item.activityId).location === 'city')
const cityPlaceIds = items => items.flatMap(item => item.kind === 'place' ? [item.placeId]
  : activity.get(item.activityId).detail.type === 'places' ? activity.get(item.activityId).detail.placeIds : [])
const hasTag = (items, tag) => cityPlaceIds(items).some(id => place.get(id)?.tags.includes(tag))
const cityThenHome = items => items.findIndex(isHome) === -1 || items.slice(items.findIndex(isHome)).every(isHome)

// 1. «музей, а вечером дома фильм» → 1–3 art places, then the film night last.
let draft = draftFromWish('музей, а вечером дома фильм', data, AREA)
let city = cityPlaceIds(draft.items)
assert.ok(city.length >= 1 && city.length <= 3, `1–3 places, got ${city.length}`)
assert.ok(hasTag(draft.items, 'искусство'))
assert.equal(draft.items.at(-1).activityId, 'film-night')
assert.ok(cityThenHome(draft.items))

// 2. «парк и спа-вечер» → 1–3 park places, then the home spa evening last.
draft = draftFromWish('парк и спа-вечер', data, AREA)
city = cityPlaceIds(draft.items)
assert.ok(city.length >= 1 && city.length <= 3)
assert.ok(hasTag(draft.items, 'парки') || hasTag(draft.items, 'сады'))
assert.ok(isHome(draft.items.at(-1)))
assert.match(activity.get(draft.items.at(-1).activityId).title.toLowerCase(), /спа/)
assert.ok(cityThenHome(draft.items))

// 3. «хочу весь день дома» → only activities (2–3), no places, addresses or map links.
draft = draftFromWish('хочу весь день дома', data, AREA)
assert.ok(draft.items.length >= 2 && draft.items.length <= 3)
assert.ok(draft.items.every(isHome))
assert.equal(cityPlaceIds(draft.items).length, 0)

// 4. «пицца и кино» → the pizza idea as a whole; its status warns about the dough (R-TODAY).
draft = draftFromWish('пицца и кино', data, AREA)
assert.equal(draft.trace.wholeIdeaId, 'roman-pizza')
assert.deepEqual(draft.items.map(i => i.activityId), ['roman-pizza-cooking', 'film-night'])
assert.equal(draft.sourceTitle, 'Римская пицца под киновечер')
const { todayStatus } = await import('../../apps/web/src/plan/today.ts')
assert.equal(todayStatus(draft.items.map(i => activity.get(i.activityId)), new Date(2026, 10, 21, 10)).kind, 'lead')

// 5. «сходить в кино» → a cinema place, no home film.
draft = draftFromWish('сходить в кино', data, AREA)
assert.ok(draft.items.length >= 1)
assert.ok(draft.items.every(i => i.kind === 'place'))
assert.ok(draft.items.some(i => place.get(i.placeId).kind === 'Кинотеатр'))

// 6. «прогулка по старому центру» → the same places as before the change (regression).
draft = draftFromWish('прогулка по старому центру', data, AREA)
const previous = makeDraft(rankIdeas('прогулка по старому центру', [], AREA)[0], 1)[0].map(p => p.id)
assert.deepEqual(draft.items.map(i => i.placeId), previous)

// Every activity in a draft belongs to an idea (R-MODEL-3); at most 6 items (R-WISH-5).
for (const phrase of ['музей, а вечером дома фильм', 'парк и спа-вечер', 'хочу весь день дома', 'пицца и кино', 'книга и глина дома', 'испечь что-нибудь']) {
  const result = draftFromWish(phrase, data, AREA)
  assert.ok(result.items.length <= 6)
  for (const item of result.items.filter(i => i.kind === 'activity')) assert.ok(data.dayIdeas.some(idea => idea.id === item.ideaId && idea.activityIds.includes(item.activityId)))
}

// R-WISH-6: nothing recognised → the general city variant, flagged.
draft = draftFromWish('qwerty', data, AREA)
assert.equal(draft.fallback, true)
assert.ok(draft.items.length > 0 && draft.items.every(i => i.kind === 'place'))

// R-WISH-1: normalisation and stop words.
assert.deepEqual(tokenize('Хочу ЁЛКУ, а потом — в кино!'), ['елку', 'кино'])

console.log('Пожелания: шесть эталонных фраз на реальной базе знаний и общий вариант — OK')
