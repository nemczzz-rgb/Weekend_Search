// Plan model, operations, migration and storage (TASK-047; docs/ux/interaction-rules.md R-ADD, R-DEL, R-MOVE, R-REPL, R-DAYS, R-SAVE).
import assert from 'node:assert/strict'

const store = await import('../../apps/web/src/plan/store.ts')
const { migratePlan } = await import('../../apps/web/src/plan/migrate.ts')
const { LocalStoragePlanRepository, PLAN_STORAGE_KEY } = await import('../../apps/web/src/plan/repository-local.ts')
const { MAX_ITEMS_PER_DAY } = await import('../../apps/web/src/plan/model.ts')

let counter = 0
const uid = () => `u${++counter}`
const place = placeId => ({ kind: 'place', placeId })
const activity = (activityId, ideaId = 'idea') => ({ kind: 'activity', activityId, ideaId })
const event = eventId => ({ kind: 'event', eventId })
const custom = title => ({ kind: 'custom', title, durationMinutes: 60 })

// R-ADD-5: a new plan has one day on the nearest Saturday, Saturday itself included.
assert.equal(store.createPlan(new Date(2026, 10, 16)).days[0].date, '2026-11-21') // Monday
assert.equal(store.createPlan(new Date(2026, 10, 21)).days[0].date, '2026-11-21') // Saturday
assert.equal(store.createPlan(new Date(2026, 10, 22)).days[0].date, '2026-11-28') // Sunday
let plan = store.createPlan(new Date(2026, 10, 16))
assert.equal(plan.area, 'Тверской')
assert.ok(store.isPlanEmpty(plan))

// R-ADD-1, R-ADD-3: order kept, duplicates skipped, custom items never collide.
let result = store.addItems(plan, 0, [place('a'), activity('cook'), activity('film')], uid)
assert.equal(result.status, 'added')
plan = result.plan
assert.deepEqual(plan.days[0].items.map(i => i.placeId ?? i.activityId), ['a', 'cook', 'film'])
result = store.addItems(plan, 0, [activity('film', 'other-idea'), place('b'), custom('Кафе'), custom('Кафе')], uid)
assert.equal(result.status, 'added')
assert.equal(result.skipped, 1, 'the same activity from another idea is a duplicate')
plan = result.plan
assert.equal(plan.days[0].items.length, 6)
assert.equal(store.addItems(plan, 0, [place('a')], uid).status, 'already')
assert.deepEqual(store.addItems(plan, 0, [place('a')], uid).dayIndexes, [0])

// R-ADD-4: all or nothing over the limit.
assert.equal(MAX_ITEMS_PER_DAY, 6)
result = store.addItems(plan, 0, [place('c')], uid)
assert.equal(result.status, 'limit')
assert.equal(result.free, 0)
assert.equal(result.plan, plan, 'nothing changes on the limit')

// R-ADD-6: undo of an addition removes exactly what was added.
const before = store.createPlan(new Date(2026, 10, 16))
const added = store.addItems(before, 0, [place('x'), place('y')], uid)
assert.deepEqual(store.removeItems(added.plan, added.addedUids).days[0].items, [])

// R-ADD-7: presence of an idea or route in the plan.
assert.deepEqual(store.presence(plan, [activity('cook'), activity('film'), activity('walk')]), { total: 3, inPlan: 2, dayIndexes: [0] })
assert.deepEqual(store.presence(null, [place('a')]), { total: 1, inPlan: 0, dayIndexes: [] })

// R-ADD-8: halves, the first rounded up.
assert.deepEqual(store.splitInHalf([1, 2, 3, 4, 5]), [[1, 2, 3], [4, 5]])
assert.deepEqual(store.splitInHalf([1, 2, 3, 4, 5, 6]), [[1, 2, 3], [4, 5, 6]])

// R-DEL-1: remove and undo to the same position.
const second = plan.days[0].items[1]
const removed = store.removeItem(plan, second.uid)
assert.equal(removed.plan.days[0].items.length, 5)
assert.deepEqual(store.restoreItem(removed.plan, removed.undo).days[0].items.map(i => i.uid), plan.days[0].items.map(i => i.uid))
assert.equal(store.removeItem(plan, 'missing'), null)

// R-MOVE-1: one step, null at the edges.
const firstUid = plan.days[0].items[0].uid
assert.equal(store.moveItem(plan, firstUid, -1), null)
assert.equal(store.moveItem(plan, firstUid, 1).days[0].items[1].uid, firstUid)
assert.equal(store.moveItem(plan, plan.days[0].items[5].uid, 1), null)

// R-DAYS-1, R-MOVE-3, R-MOVE-4: second day, transfer, limit and event dates.
let two = store.setDayCount(plan, 2).plan
assert.deepEqual(two.days.map(d => d.date), ['2026-11-21', '2026-11-22'])
const moved = store.transferItem(two, firstUid)
assert.equal(moved.status, 'moved')
assert.equal(moved.plan.days[1].items.at(-1).uid, firstUid)
assert.equal(store.transferItem(plan, firstUid).status, 'single-day')
assert.equal(store.transferItem(two, firstUid, () => false).status, 'date')
let full = store.setDayCount(store.createPlan(new Date(2026, 10, 16)), 2).plan
full = store.addItems(full, 0, [place('p1')], uid).plan
full = store.addItems(full, 1, [1, 2, 3, 4, 5, 6].map(n => place(`q${n}`)), uid).plan
assert.equal(store.transferItem(full, full.days[0].items[0].uid).status, 'limit')

// R-DAYS-2: going back to one day.
two = store.addItems(two, 1, [place('z')], uid).plan
assert.equal(store.setDayCount(two, 1).status, 'needs-choice')
assert.equal(store.setDayCount(two, 1, 'move').status, 'no-room', 'day 1 already has 6 items')
const deleted = store.setDayCount(two, 1, 'delete')
assert.equal(deleted.status, 'ok')
assert.equal(deleted.plan.days.length, 1)
let small = store.setDayCount(store.createPlan(new Date(2026, 10, 16)), 2).plan
small = store.addItems(small, 0, [place('m')], uid).plan
small = store.addItems(small, 1, [place('n')], uid).plan
const merged = store.setDayCount(small, 1, 'move')
assert.deepEqual(merged.plan.days[0].items.map(i => i.placeId), ['m', 'n'])

// R-DAYS-3, R-DAYS-4: dates follow the first day; outdated plans move to the nearest Saturday.
assert.deepEqual(store.setFirstDate(two, '2026-12-31').days.map(d => d.date), ['2026-12-31', '2027-01-01'])
assert.equal(store.isOutdated(two, new Date(2026, 10, 25)), true)
assert.equal(store.isOutdated(two, new Date(2026, 10, 21)), false)
assert.deepEqual(store.moveToNearestSaturday(two, new Date(2026, 10, 25)).days.map(d => d.date), ['2026-11-28', '2026-11-29'])

// R-DAYS-5: a home day has only home activities.
const location = id => ({ cook: 'home', film: 'home', walk: 'city' })[id]
assert.equal(store.isHomeDay({ date: '2026-11-21', items: [{ kind: 'activity', uid: 'h1', activityId: 'cook', ideaId: 'i' }, { kind: 'activity', uid: 'h2', activityId: 'film', ideaId: 'i' }] }, location), true)
assert.equal(store.isHomeDay({ date: '2026-11-21', items: [{ kind: 'activity', uid: 'h1', activityId: 'walk', ideaId: 'i' }] }, location), false)
assert.equal(store.isHomeDay({ date: '2026-11-21', items: [{ kind: 'custom', uid: 'c', title: 'x', durationMinutes: 30 }] }, location), false)
assert.equal(store.isHomeDay({ date: '2026-11-21', items: [] }, location), false)

// R-REPL-1: only places, never a place already in the plan.
const placeUid = plan.days[0].items.find(i => i.kind === 'place').uid
assert.equal(store.replacePlace(plan, placeUid, 'new').days[0].items.find(i => i.uid === placeUid).placeId, 'new')
assert.equal(store.replacePlace(plan, placeUid, 'b'), null)
assert.equal(store.replacePlace(plan, plan.days[0].items.find(i => i.kind === 'activity').uid, 'new'), null)

// R-FILM-3 and R-DEL-4.
const filmUid = plan.days[0].items.find(i => i.activityId === 'film').uid
const withFilm = store.setFilm(plan, filmUid, 'cozy', 'little-women')
assert.equal(store.findItem(withFilm, filmUid).item.filmId, 'little-women')
assert.equal(store.findItem(store.setFilm(withFilm, filmUid, undefined, undefined), filmUid).item.filmId, undefined)
const cleared = store.clearPlan({ ...plan, sourceTitle: 'Идея' })
assert.ok(store.isPlanEmpty(cleared))
assert.equal(cleared.sourceTitle, undefined)
assert.equal(cleared.days[0].date, plan.days[0].date)

// P5: migration accepts version 1 and rejects broken data.
const roundTrip = migratePlan(JSON.parse(JSON.stringify(withFilm)))
assert.deepEqual(roundTrip, withFilm)
assert.equal(migratePlan(null), null)
assert.equal(migratePlan({ ...withFilm, version: 2 }), null)
assert.equal(migratePlan({ ...withFilm, days: [] }), null)
assert.equal(migratePlan({ ...withFilm, days: [{ date: '2026-02-30', items: [] }] }), null)
assert.equal(migratePlan({ ...withFilm, days: [{ date: '2026-11-21', items: [{ kind: 'activity', uid: 'x', activityId: 'film' }] }] }), null, 'activity without ideaId')
assert.equal(migratePlan({ ...withFilm, days: [{ date: '2026-11-21', items: [{ kind: 'place', uid: 'x', placeId: 'a' }, { kind: 'place', uid: 'x', placeId: 'b' }] }] }), null, 'duplicate uid')

// P2, R-SAVE-1: localStorage repository and store behaviour when saving fails.
const memory = new Map()
const fakeStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
const repository = new LocalStoragePlanRepository(fakeStorage)
assert.equal(await repository.load(), null)
await repository.save(withFilm)
assert.ok(memory.has(PLAN_STORAGE_KEY))
assert.deepEqual(await repository.load(), withFilm)
memory.set(PLAN_STORAGE_KEY, '{broken')
assert.equal(await repository.load(), null)
await assert.rejects(new LocalStoragePlanRepository(null).save(withFilm))

const planStore = new store.PlanStore(new LocalStoragePlanRepository(fakeStorage))
const seen = []
planStore.subscribe(value => seen.push(value))
await planStore.set(withFilm)
assert.equal(planStore.storageAvailable, true)
assert.deepEqual(await new LocalStoragePlanRepository(fakeStorage).load(), withFilm)
const failing = new store.PlanStore({ load: async () => { throw new Error('no') }, save: async () => { throw new Error('quota') } })
assert.equal(await failing.init(), null)
await failing.set(withFilm)
assert.equal(failing.storageAvailable, false, 'R-SAVE-1: the plan stays in memory')
assert.deepEqual(failing.get(), withFilm)
assert.ok(seen.length >= 1)

console.log('План: добавление, дубли, лимит, отмена, перестановка, дни, замена, миграция и хранение — OK')
