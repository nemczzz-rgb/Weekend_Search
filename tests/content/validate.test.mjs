// Tests for scripts/content/validate.mjs. Fixtures below are synthetic test data, not site content.
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateContent, COLLECTIONS, GENRES } from '../../scripts/content/validate.mjs'

const today = new Date('2026-11-13T12:00:00Z')
const poster = { src: 'images/films/film-a.webp', alt: 'Постер фильма', width: 2, height: 3, source: 'https://example.org/film/posters', credit: 'Test source', checkedAt: '2026-11-12' }
// A real 2 × 3 WebP fixture, not a renamed non-image file.
const posterBytes = Buffer.from('UklGRjQAAABXRUJQVlA4ICgAAACQAQCdASoCAAMAAUAmJYgCdLoAA5gA/vmo7+1Niqnnd+hRsol8wAAA', 'base64')
const fact = value => ({ value, source: 'https://example.org/page', checkedAt: '2026-11-10' })

function base() {
  return {
    places: [
      { id: 'park', title: 'Парк', kind: 'Парк', area: 'Москва', durationMinutes: 60, note: 'Тестовое место', tags: ['парки'], address: fact('ул. Тестовая, 1'), hours: fact('10:00–22:00') },
      { id: 'square', title: 'Площадь', kind: 'Прогулка', area: 'Центр', durationMinutes: 30, note: 'Тест', tags: ['прогулки'], publicSpace: true, hints: { price: 'Прогулка без билета' } },
    ],
    routes: [{ id: 'walk', title: 'Прогулка', subtitle: 'Тест', theme: 'Прогулки', area: 'Центр', tone: 'sage', days: 1, placeIds: ['park'], keywords: ['парк'] }],
    events: [{ id: 'concert', title: 'Концерт', dateStart: '2026-11-15', dateEnd: '2026-11-16', placeId: 'park', source: 'https://example.org/event', checkedAt: '2026-11-12' }],
    films: [{ id: 'film-a', title: 'Фильм', year: 2001, genres: ['comedy'], origin: 'owner', source: 'https://example.org/film', checkedAt: '2026-11-12' }],
    recipes: [{
      id: 'roman-pizza', title: 'Пицца', yield: '4 основы', leadTimeHours: { min: 48, max: 72 },
      ingredients: [{ group: 'Тесто', items: [{ name: 'Мука', amount: 600, unit: 'г' }, { name: 'Дрожжи', note: 'по вкусу' }] }],
      sections: ['autolysis', 'kneading', 'fermentation', 'shaping', 'bake-1', 'bake-2'].map(id => ({ id, title: id, steps: [{ text: 'Шаг', durationMinutes: 10 }] })),
      tips: ['Совет'], toppings: [{ title: 'Маргарита', text: 'Соус, сыр' }], serving: ['Подать'], source: 'owner', checkedAt: '2026-11-12',
    }],
    activities: [
      { id: 'cook', title: 'Испечь пиццу', location: 'home', durationMinutes: 60, audience: ['pair'], needs: ['духовка'], detail: { type: 'recipe', recipeId: 'roman-pizza' }, leadTimeHours: { min: 48, max: 72 }, leadTimeNote: 'тесто 48–72 ч в холодильнике' },
      { id: 'movie', title: 'Киновечер', location: 'home', durationMinutes: 120, audience: ['pair', 'friends'], needs: [], detail: { type: 'films' } },
      { id: 'walk-park', title: 'Прогулка', location: 'city', durationMinutes: 60, audience: ['solo'], needs: [], detail: { type: 'places', placeIds: ['park'] } },
    ],
    'day-ideas': [
      { id: 'pizza-movie', title: 'Пицца и кино', summary: 'Тест', mode: 'home', activityIds: ['cook', 'movie'], keywords: ['пицца'] },
      { id: 'park-movie', title: 'Парк и кино', summary: 'Тест', mode: 'mixed', activityIds: ['walk-park', 'movie'], keywords: ['парк'] },
    ],
  }
}

function run(data, options = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ws-content-'))
  const dir = join(root, 'src/content')
  mkdirSync(dir, { recursive: true })
  mkdirSync(join(root, 'public/images/films'), { recursive: true })
  writeFileSync(join(root, 'public/images/films/film-a.webp'), options.posterBytes ?? posterBytes)
  try {
    for (const name of COLLECTIONS) if (data[name] !== undefined) writeFileSync(join(dir, `${name}.json`), JSON.stringify(data[name]))
    return validateContent(dir, { today, ...options })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

let rejectedCases = 0
function expectError(name, mutate, pattern, options = {}) {
  const data = base()
  mutate(data)
  const { errors } = run(data, options)
  rejectedCases++
  assert.ok(errors.some(e => pattern.test(e)), `${name}: expected ${pattern}, got:\n${errors.join('\n') || '(no errors)'}`)
}

// 1. Valid synthetic dataset passes; minimums are only warnings outside --release.
{
  const { errors, warnings, counts } = run(base())
  assert.deepEqual(errors, [])
  assert.ok(warnings.some(w => w.includes('below release minimums')))
  assert.equal(counts.filmsPerGenre.comedy, 1)
  assert.deepEqual(counts.dayIdeasByMode, { home: 1, city: 0, mixed: 1 })
  assert.ok(run(base(), { release: true }).errors.some(e => e.includes('below release minimums')))
}

// Existing films without posters and new films with verified local posters both pass.
{
  const data = base()
  data.films[0].poster = { ...poster }
  assert.deepEqual(run(data).errors, [])
}

// 2. Real site content is valid.
{
  const dir = join(dirname(fileURLToPath(import.meta.url)), '../../apps/web/src/content')
  const { errors } = validateContent(dir)
  assert.deepEqual(errors, [], errors.join('\n'))
}

// 3. Bad data is caught.
expectError('missing file', d => { delete d.events }, /events\.json: file is missing/)
expectError('bad id', d => { d.places[0].id = 'Park 1' }, /kebab-case/)
expectError('duplicate id', d => { d.films.push({ ...d.films[0], title: 'Другой' }) }, /duplicate id/)
expectError('fact without source', d => { delete d.places[0].address.source }, /places\[park\]\.address: "source"/)
expectError('http source', d => { d.places[0].hours.source = 'http://example.org' }, /https URL or "owner"/)
expectError('future checkedAt', d => { d.places[0].hours.checkedAt = '2027-01-01' }, /in the future/)
expectError('invalid date', d => { d.places[0].hours.checkedAt = '2026-02-30' }, /YYYY-MM-DD/)
expectError('hint with price', d => { d.places[1].hints.price = '500 ₽' }, /must not contain numbers or prices/)
expectError('fact and hint together', d => { d.places[0].hints = { hours: 'Круглосуточно' } }, /both a fact and a hint/)
expectError('unknown place in route', d => { d.routes[0].placeIds = ['nowhere'] }, /unknown place "nowhere"/)
expectError('too many route places', d => { d.routes[0].placeIds = ['park', 'square', 'a', 'b', 'c', 'd', 'e'] }, /1–6 places/)
expectError('bad tone', d => { d.routes[0].tone = 'pink' }, /"tone" must be one of/)
expectError('event ends before start', d => { d.events[0].dateEnd = '2026-11-14' }, /before "dateStart"/)
expectError('event owner source', d => { d.events[0].source = 'owner' }, /need an https source/)
expectError('film platform link', d => { d.films[0].watchUrl = 'https://example.org' }, /unknown field "watchUrl".*not allowed/)
expectError('poster is not an object', d => { d.films[0].poster = 'x.jpg' }, /poster: must be an object/)
expectError('poster without alt', d => { d.films[0].poster = { ...poster, alt: '' } }, /poster: "alt"/)
expectError('poster without credit', d => { d.films[0].poster = { ...poster, credit: '' } }, /poster: "credit"/)
expectError('poster without source', d => { d.films[0].poster = { ...poster, source: undefined } }, /poster: "source"/)
expectError('poster owner source', d => { d.films[0].poster = { ...poster, source: 'owner' } }, /poster: "source"/)
expectError('poster http source', d => { d.films[0].poster = { ...poster, source: 'http://example.org' } }, /poster: "source"/)
expectError('poster credentials', d => { d.films[0].poster = { ...poster, source: 'https://user:pass@example.org' } }, /poster: "source"/)
expectError('poster missing checkedAt', d => { d.films[0].poster = { ...poster, checkedAt: undefined } }, /poster: "checkedAt"/)
expectError('poster future checkedAt', d => { d.films[0].poster = { ...poster, checkedAt: '2027-01-01' } }, /poster: "checkedAt" is in the future/)
expectError('poster invalid date', d => { d.films[0].poster = { ...poster, checkedAt: '2026-02-30' } }, /poster: "checkedAt" must be a date/)
expectError('poster traversal', d => { d.films[0].poster = { ...poster, src: '../outside.webp' } }, /base-relative path/)
expectError('poster domain root', d => { d.films[0].poster = { ...poster, src: '/images/films/film-a.webp' } }, /base-relative path/)
expectError('poster remote image', d => { d.films[0].poster = { ...poster, src: 'https://example.org/x.webp' } }, /base-relative path/)
expectError('poster wrong film', d => { d.films[0].poster = { ...poster, src: 'images/films/other-film.webp' } }, /base-relative path/)
expectError('poster zero dimension', d => { d.films[0].poster = { ...poster, width: 0 } }, /"width" must be a positive integer/)
expectError('poster excessive dimensions', d => { d.films[0].poster = { ...poster, width: 481 } }, /dimensions exceed/)
expectError('poster unknown field', d => { d.films[0].poster = { ...poster, watchUrl: 'https://example.org' } }, /unknown field "watchUrl"/)
expectError('poster missing file', d => { d.films[0].id = 'missing'; d.films[0].poster = { ...poster, src: 'images/films/missing.webp' } }, /local poster file is missing/)
expectError('poster corrupt file', d => { d.films[0].poster = { ...poster } }, /must be a WebP file/, { posterBytes: Buffer.from('not an image') })
expectError('poster empty file', d => { d.films[0].poster = { ...poster } }, /poster must be 1–300000 bytes/, { posterBytes: Buffer.alloc(0) })
expectError('poster excessive bytes', d => { d.films[0].poster = { ...poster } }, /poster must be 1–300000 bytes/, { posterBytes: Buffer.alloc(300001) })
expectError('unknown genre', d => { d.films[0].genres = ['horror'] }, /unknown genre "horror"/)
expectError('long film note', d => { d.films[0].note = 'я'.repeat(101) }, /longer than 100/)
expectError('duplicate film', d => { d.films.push({ ...d.films[0], id: 'film-b' }) }, /duplicate film/)
expectError('film without source', d => { delete d.films[0].source }, /"source" must be/)
expectError('pizza section missing', d => { d.recipes[0].sections = d.recipes[0].sections.filter(s => s.id !== 'bake-2') }, /section "bake-2" is required/)
expectError('pizza lead time', d => { d.recipes[0].leadTimeHours = { min: 0, max: 2 } }, /\{min: 48, max: 72\}/)
expectError('pizza source', d => { d.recipes[0].source = 'https://example.org/recipe' }, /must have source "owner"/)
expectError('unit without amount', d => { d.recipes[0].ingredients[0].items[1].unit = 'г' }, /"unit" without "amount"/)
expectError('lead time order', d => { d.activities[0].leadTimeHours = { min: 72, max: 48 } }, /0 ≤ min ≤ max/)
expectError('lead note without hours', d => { d.activities[1].leadTimeNote = 'нужна подготовка' }, /"leadTimeNote" requires "leadTimeHours"/)
expectError('long lead note', d => { d.activities[0].leadTimeNote = 'я'.repeat(61) }, /longer than 60/)
expectError('unknown recipe', d => { d.activities[0].detail.recipeId = 'nope' }, /unknown recipe "nope"/)
expectError('bad audience', d => { d.activities[0].audience = ['everyone'] }, /"audience" must be/)
expectError('places activity at home', d => { d.activities[2].location = 'home' }, /must have location "city"/)
expectError('one activity in idea', d => { d['day-ideas'][0].activityIds = ['cook'] }, /2–3 activities/)
expectError('mode mismatch', d => { d['day-ideas'][0].mode = 'mixed' }, /does not match activity locations/)
expectError('long summary', d => { d['day-ideas'][0].summary = 'я'.repeat(141) }, /longer than 140/)
expectError('image without alt', d => { d['day-ideas'][0].image = 'pizza.webp' }, /"imageAlt" is required/)
expectError('not an array', d => { d.films = { id: 'x' } }, /must be a JSON array/)

assert.equal(GENRES.length, 10)
console.log(`Валидатор базы знаний: корректные данные проходят, ${rejectedCases} видов ошибок ловятся — OK`)
