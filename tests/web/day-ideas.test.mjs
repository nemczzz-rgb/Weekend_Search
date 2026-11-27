import assert from 'node:assert/strict'
import { getContentSource } from '../../apps/web/src/content/load.ts'
import { AUDIENCES, readFilters, sharedAudience, matchesIdea, filmsForGenre, ideaItems, imageProps, availability } from '../../apps/web/src/screens/day-ideas/model.ts'
import { loadCatalog, loadIdea } from '../../apps/web/src/screens/day-ideas/load.ts'
import { addItems, createPlan, presence, removeItems, setFilm, PlanStore } from '../../apps/web/src/plan/store.ts'
const source = getContentSource(), catalog = await loadCatalog(source), pizza = await loadIdea(source, 'roman-pizza')
assert.ok(catalog.ideas.length >= 40) // D14 minimum; the base keeps growing
assert.equal(pizza.recipes[0].ingredients[0].items.find(x => x.name.toLowerCase().includes('вод')).amount, 390)
assert.equal(availability(pizza.activities, new Date(2026, 10, 16, 10)).kind, 'lead')
assert.equal((await loadIdea(source, 'not-a-real-idea')).idea, undefined)
const original = catalog.activities[0], idea = { id: 'test', title: 'Test', summary: 'Test', mode: 'home', activityIds: ['a', 'b'], keywords: [] }
const a = { ...original, id: 'a', audience: ['pair', 'friends'], durationMinutes: 60 }, b = { ...original, id: 'b', audience: ['pair', 'family'], durationMinutes: 60 }
assert.deepEqual(sharedAudience([a, b]), ['pair'])
assert.equal(matchesIdea(idea, [a, b], { mode: 'all', audience: ['friends', 'family'], time: '' }), false)
assert.equal(matchesIdea(idea, [a, b], { mode: 'home', audience: ['pair', 'friends'], time: 'medium' }), true)
for (const [minutes, range] of [[119, 'short'], [120, 'medium'], [240, 'medium'], [241, 'long']]) {
  const current = [{ ...a, durationMinutes: minutes }, { ...b, durationMinutes: 0 }]
  for (const time of ['short', 'medium', 'long']) assert.equal(matchesIdea(idea, current, { mode: 'all', audience: [], time }), time === range)
}
assert.deepEqual(readFilters(new URLSearchParams('mode=bad&for=pair,friends,bad&time=no')), { mode: 'all', audience: ['pair', 'friends'], time: '' })
assert.equal(AUDIENCES.length, 4)
const films = await source.getCollection('films'), cozy = filmsForGenre(films, 'cozy')
assert.equal(cozy.length, 66)
for (let i = 1; i < cozy.length; i++) assert.ok(cozy[i-1].origin === 'owner' && cozy[i].origin === 'research' || cozy[i-1].origin === cozy[i].origin && cozy[i-1].year >= cozy[i].year)
assert.equal(imageProps({ ...idea, image: 'images/ideas/test-640.webp', imageAlt: 'Test' }, '/prefix/').srcSet, '/prefix/images/ideas/test-640.webp 640w, /prefix/images/ideas/test-1280.webp 1280w')
const items = ideaItems(pizza.idea, pizza.activities, { genre: 'cozy', filmId: cozy[0].id })
const store = new PlanStore({ load: async () => null, save: async () => {} }); await store.init()
const result = addItems(createPlan(new Date(2026, 10, 16)), 0, items, (() => { let i = 0; return () => 'test-' + ++i })())
assert.equal(result.status, 'added'); await store.set(result.plan)
assert.equal(presence(store.get(), items).inPlan, items.length)
assert.equal(addItems(store.get(), 0, items).status, 'already')
const filmItem = store.get().days[0].items.find(x => x.kind === 'activity' && x.filmId)
assert.ok(filmItem); await store.set(setFilm(store.get(), filmItem.uid, 'cozy', 'home-alone-1990'))
assert.equal(store.get().days[0].items.find(x => x.uid === filmItem.uid).filmId, 'home-alone-1990')
await store.set(removeItems(store.get(), result.addedUids)); assert.equal(store.get().days[0].items.length, 0)
const calls=[]; const tracked = { getCollection: name => { calls.push(name); return source.getCollection(name) }, getById: (name,id) => { calls.push(name); return source.getById(name,id) } }
await loadCatalog(tracked); assert.ok(!calls.includes('films') && !calls.includes('recipes'))
calls.length=0; await loadIdea(tracked,'roman-pizza'); assert.ok(calls.includes('recipes') && !calls.includes('films'))
await assert.rejects(loadCatalog({ getCollection: async () => { throw Error('offline') } }))
console.log('Экраны идей: границы фильтров, пересечение аудиторий, 40 сценариев, точный рецепт, отложенная загрузка, сортировка фильмов, настоящие операции плана и ошибки источника — OK')
