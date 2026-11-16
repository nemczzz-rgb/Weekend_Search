import assert from 'node:assert/strict'

// AC-DI-11: прошедшие события скрываются автоматически (R-EVENT-1), даты дня сверяются с периодом события (R-EVENT-2).
// Дата «сегодня» подменяется, поэтому тест не зависит от дня запуска.
const { isUpcoming, eventOn, eventEnd } = await import('../../apps/web/src/app/places.ts')

const oneDay = { id: 'a', dateStart: '2026-11-21' }
const period = { id: 'b', dateStart: '2026-11-01', dateEnd: '2026-12-15' }

assert.equal(eventEnd(oneDay), '2026-11-21')
assert.equal(eventEnd(period), '2026-12-15')

assert.equal(isUpcoming(oneDay, '2026-11-20'), true, 'событие завтра видно')
assert.equal(isUpcoming(oneDay, '2026-11-21'), true, 'событие сегодня видно')
assert.equal(isUpcoming(oneDay, '2026-11-22'), false, 'вчерашнее событие скрыто')
assert.equal(isUpcoming(period, '2026-12-15'), true, 'последний день выставки ещё виден')
assert.equal(isUpcoming(period, '2026-12-16'), false, 'выставка после окончания скрыта')

assert.equal(eventOn(period, '2026-11-21'), true)
assert.equal(eventOn(period, '2026-10-31'), false)
assert.equal(eventOn(oneDay, '2026-11-22'), false)
assert.equal(eventOn(undefined, '2026-11-21'), false)

// Все события базы: после даты окончания ни одно не остаётся в списке «Ближайшие события».
const { default: events } = await import('../../apps/web/src/content/events.json', { with: { type: 'json' } })
for (const event of events) {
  const end = eventEnd(event)
  const next = new Date(`${end}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1)
  assert.equal(isUpcoming(event, next.toISOString().slice(0, 10)), false, `${event.id} скрыто после ${end}`)
  assert.equal(isUpcoming(event, end), true, `${event.id} видно в день окончания`)
}

console.log(`events-dates: ok (${events.length} событий)`)
