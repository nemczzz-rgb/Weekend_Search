import assert from 'node:assert/strict'

// TASK-056: экспорт и импорт плана (R-SAVE-2, R-SAVE-3, AC-DI-18).
const { PLAN_FILE_NAME, planFromFile, planToFile, unavailableCount } = await import('../../apps/web/src/plan/file.ts')

assert.equal(PLAN_FILE_NAME, 'weekend-search-plan.json')

const plan = {
  version: 1,
  area: 'Хамовники',
  sourceTitle: 'Музей и вечер дома',
  days: [
    { date: '2026-11-21', items: [
      { kind: 'place', uid: 'a', placeId: 'tretyakov' },
      { kind: 'activity', uid: 'b', activityId: 'film-evening', ideaId: 'museum-film', filmGenre: 'drama', filmId: 'film-1' },
      { kind: 'custom', uid: 'c', title: 'Кофе у друга', address: 'Остоженка, 1', durationMinutes: 45 },
    ] },
    { date: '2026-11-22', items: [{ kind: 'event', uid: 'd', eventId: 'gone-event' }] },
  ],
}

// Круговой проход: файл читается в тот же план.
const text = planToFile(plan)
assert.deepEqual(planFromFile(text), plan)
assert.deepEqual(planFromFile('﻿' + text), plan, 'файл с BOM после редактора тоже читается')

// Неверные файлы не дают плана: текущий план не меняется.
for (const [bad, why] of [
  ['', 'пустой файл'],
  ['не json', 'не JSON'],
  ['[]', 'массив'],
  [JSON.stringify({ ...plan, version: 2 }), 'версия новее'],
  [JSON.stringify({ ...plan, days: [] }), 'без дней'],
  [JSON.stringify({ ...plan, days: [plan.days[0], plan.days[1], plan.days[1]] }), 'три дня'],
  [JSON.stringify({ ...plan, days: [{ date: '21.11.2026', items: [] }] }), 'дата не ISO'],
  [JSON.stringify({ ...plan, days: [{ date: '2026-11-21', items: [{ kind: 'unknown', uid: 'x' }] }] }), 'неизвестный вид пункта'],
  ['{"version":1,"area":"' + 'x'.repeat(250_000) + '"}', 'слишком большой файл'],
]) assert.equal(planFromFile(bad), null, why)

// Пункты с исчезнувшими id не теряются: остаются в плане и считаются недоступными.
const known = { places: new Set(['tretyakov']), events: new Set(), activities: new Set(['film-evening']) }
const imported = planFromFile(text)
assert.equal(imported.days[1].items[0].eventId, 'gone-event')
assert.equal(unavailableCount(imported, known), 1)
assert.equal(unavailableCount(imported, { ...known, events: new Set(['gone-event']) }), 0)

console.log('plan-file: ok')
