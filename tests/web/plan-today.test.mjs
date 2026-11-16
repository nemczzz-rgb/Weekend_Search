// Status «сегодня» and preparation lines (TASK-047; plan 8.4, docs/ux/interaction-rules.md R-TODAY).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const today = await import('../../apps/web/src/plan/today.ts')
const activities = JSON.parse(readFileSync(new URL('../../apps/web/src/content/activities.json', import.meta.url), 'utf8'))
const byId = id => activities.find(a => a.id === id)
const pizza = [byId('roman-pizza-cooking'), byId('film-night')]
assert.ok(pizza.every(Boolean), 'real pizza activities exist')

// R-TODAY-1, R-TODAY-2: the pizza idea is never «Можно сегодня» (AC-DI-04).
for (const hour of [0, 9, 14, 22]) {
  const status = today.todayStatus(pizza, new Date(2026, 10, 21, hour))
  assert.equal(status.kind, 'lead')
  assert.deepEqual(status.term, { unit: 'days', from: 2, to: 3 })
  assert.equal(status.note, 'тесто 48–72 ч в холодильнике')
}

// Without lead time: today while the activities fit before 23:00, otherwise later.
const short = [{ id: 'a', durationMinutes: 120 }, { id: 'b', durationMinutes: 60 }]
assert.equal(today.todayStatus(short, new Date(2026, 10, 21, 10, 0)).kind, 'today')
assert.equal(today.todayStatus(short, new Date(2026, 10, 21, 20, 0)).kind, 'later', '180 minutes do not fit before 23:00')
assert.equal(today.todayStatus(short, new Date(2026, 10, 21, 19, 59)).kind, 'today')

// Lead term in hours below one day, equal bounds kept as is.
assert.deepEqual(today.leadTerm({ min: 6, max: 8 }), { unit: 'hours', from: 6, to: 8 })
assert.deepEqual(today.leadTerm({ min: 48, max: 48 }), { unit: 'days', from: 2, to: 2 })
assert.deepEqual(today.leadTerm({ min: 30, max: 50 }), { unit: 'days', from: 2, to: 3 })

// The largest lead decides, min and max from the same activity.
assert.deepEqual(today.leadOf([{ leadTimeHours: { min: 12, max: 100 } }, { leadTimeHours: { min: 48, max: 72 }, leadTimeNote: 'тесто' }]), { min: 48, max: 72, note: 'тесто' })
assert.equal(today.leadOf([{ leadTimeHours: { min: 0, max: 0 } }]), null)

// R-TODAY-3: pizza on Saturday, 14 November → start not later than Thursday, 12 November.
assert.equal(today.prepDeadline('2026-11-14', { min: 48, max: 72 }), '2026-11-12')
let line = today.prepLine('2026-11-14', pizza, new Date(2026, 10, 10))
assert.deepEqual(line, { deadline: '2026-11-12', missed: false, nearest: '2026-11-12', note: 'тесто 48–72 ч в холодильнике' })
line = today.prepLine('2026-11-14', pizza, new Date(2026, 10, 13))
assert.equal(line.missed, true)
// R-TODAY-4: nearest suitable day = today + ceil(min / 24) days.
assert.equal(line.nearest, '2026-11-15')
assert.equal(today.prepLine('2026-11-14', short, new Date(2026, 10, 13)), null)

console.log('Статус «сегодня»: пицца всегда «начать за 2–3 дня», срок подготовки и пропущенный срок — OK')
