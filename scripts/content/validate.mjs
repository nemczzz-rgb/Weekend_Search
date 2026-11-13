#!/usr/bin/env node
// Validator for the Weekend Search knowledge base (plan section 9). No dependencies.
// Usage: node scripts/content/validate.mjs [--release] [contentDir]
//   --release  volume minimums from decision D14 become errors instead of warnings.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const COLLECTIONS = ['places', 'routes', 'events', 'films', 'recipes', 'activities', 'day-ideas']
export const GENRES = ['romance', 'comedy', 'drama', 'thriller', 'sci-fi', 'fantasy', 'family', 'animation', 'adventure', 'cozy']
const TONES = ['blue', 'sage', 'olive', 'rust', 'sand', 'ink']
const AUDIENCES = ['solo', 'pair', 'friends', 'family']
const ROMAN_PIZZA_SECTIONS = ['autolysis', 'kneading', 'fermentation', 'shaping', 'bake-1', 'bake-2']

/** Decision D14: minimums for the release (gate G5). */
export const RELEASE_MINIMUMS = {
  places: 100,
  routes: 50,
  recipes: 20,
  filmsPerGenre: 15,
  dayIdeas: 40,
  dayIdeasByMode: { home: 15, city: 10, mixed: 15 },
}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function validateContent(dir, { release = false, today = new Date() } = {}) {
  const errors = []
  const warnings = []
  const data = {}
  const todayIso = today.toISOString().slice(0, 10)

  for (const name of COLLECTIONS) {
    const file = join(dir, `${name}.json`)
    if (!existsSync(file)) { errors.push(`${name}.json: file is missing (use [] for an empty collection)`); data[name] = []; continue }
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8'))
      if (!Array.isArray(parsed)) { errors.push(`${name}.json: must be a JSON array`); data[name] = []; continue }
      data[name] = parsed
    } catch (error) {
      errors.push(`${name}.json: invalid JSON (${error.message})`)
      data[name] = []
    }
  }

  // ---------- helpers ----------
  const at = (collection, index, item) => `${collection}[${item && typeof item.id === 'string' ? item.id : '#' + index}]`
  const isObj = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  const str = (where, value, field, { max } = {}) => {
    if (typeof value !== 'string' || !value.trim()) { errors.push(`${where}: "${field}" must be a non-empty string`); return false }
    if (max && value.length > max) errors.push(`${where}: "${field}" is longer than ${max} characters (${value.length})`)
    return true
  }
  const strList = (where, value, field, { allowEmpty = false } = {}) => {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) { errors.push(`${where}: "${field}" must be a ${allowEmpty ? '' : 'non-empty '}array of strings`); return }
    value.forEach((entry, i) => str(where, entry, `${field}[${i}]`))
  }
  const posInt = (where, value, field) => {
    if (!Number.isInteger(value) || value <= 0) errors.push(`${where}: "${field}" must be a positive integer`)
  }
  const validDate = value => {
    if (typeof value !== 'string' || !DATE.test(value)) return false
    const d = new Date(value + 'T00:00:00Z')
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
  }
  const date = (where, value, field) => {
    if (!validDate(value)) { errors.push(`${where}: "${field}" must be a date YYYY-MM-DD`); return false }
    return true
  }
  const https = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password } catch { return false }
  }
  const source = (where, value, field = 'source') => {
    if (value !== 'owner' && !(typeof value === 'string' && https(value))) errors.push(`${where}: "${field}" must be an https URL or "owner"`)
  }
  const checkedAt = (where, value, field = 'checkedAt') => {
    if (date(where, value, field) && value > todayIso) errors.push(`${where}: "${field}" is in the future`)
  }
  const fact = (where, value, field) => {
    if (!isObj(value)) { errors.push(`${where}: "${field}" must be an object {value, source, checkedAt}`); return }
    allowed(`${where}.${field}`, value, ['value', 'source', 'checkedAt'])
    str(`${where}.${field}`, value.value, 'value')
    source(`${where}.${field}`, value.source)
    checkedAt(`${where}.${field}`, value.checkedAt)
  }
  const allowed = (where, item, keys) => {
    for (const key of Object.keys(item)) {
      if (!keys.includes(key)) {
        const hint = /url|link|platform|poster|stream|watch/i.test(key) ? ' (links to platforms and unknown links are not allowed)' : ''
        errors.push(`${where}: unknown field "${key}"${hint}`)
      }
    }
  }
  const image = (where, item) => {
    if (item.image !== undefined) {
      str(where, item.image, 'image')
      if (typeof item.imageAlt !== 'string' || !item.imageAlt.trim()) errors.push(`${where}: "imageAlt" is required when "image" is set`)
    } else if (item.imageAlt !== undefined) errors.push(`${where}: "imageAlt" without "image"`)
  }
  const leadTime = (where, value) => {
    if (!isObj(value) || !Number.isInteger(value.min) || !Number.isInteger(value.max) || value.min < 0 || value.min > value.max) {
      errors.push(`${where}: "leadTimeHours" must be {min, max} with integers 0 ≤ min ≤ max`)
    } else allowed(`${where}.leadTimeHours`, value, ['min', 'max'])
  }
  const ids = {}
  for (const name of COLLECTIONS) {
    ids[name] = new Set()
    data[name].forEach((item, index) => {
      const where = at(name, index, item)
      if (!isObj(item)) { errors.push(`${where}: must be an object`); return }
      if (typeof item.id !== 'string' || !ID.test(item.id)) errors.push(`${where}: "id" must be kebab-case latin (a-z, 0-9, -)`)
      else if (ids[name].has(item.id)) errors.push(`${where}: duplicate id`)
      else ids[name].add(item.id)
    })
  }
  const objects = name => data[name].map((item, index) => [item, at(name, index, item)]).filter(([item]) => isObj(item))

  // ---------- places ----------
  for (const [p, where] of objects('places')) {
    allowed(where, p, ['id', 'title', 'kind', 'area', 'durationMinutes', 'note', 'tags', 'publicSpace', 'address', 'hours', 'price', 'extraSources', 'mapLink', 'hints', 'scheme'])
    str(where, p.title, 'title'); str(where, p.kind, 'kind'); str(where, p.area, 'area'); str(where, p.note, 'note')
    posInt(where, p.durationMinutes, 'durationMinutes')
    strList(where, p.tags, 'tags')
    if (p.publicSpace !== undefined && p.publicSpace !== true) errors.push(`${where}: "publicSpace" can only be true`)
    for (const key of ['address', 'hours', 'price']) if (p[key] !== undefined) fact(where, p[key], key)
    if (p.extraSources !== undefined) {
      if (!Array.isArray(p.extraSources) || p.extraSources.some(url => !https(url))) errors.push(`${where}: "extraSources" must be an array of https URLs`)
    }
    if (p.mapLink !== undefined) {
      if (!isObj(p.mapLink) || !https(p.mapLink.url) || typeof p.mapLink.address !== 'string') errors.push(`${where}: "mapLink" must be {url: https, address}`)
      else allowed(`${where}.mapLink`, p.mapLink, ['url', 'address'])
    }
    if (p.hints !== undefined) {
      if (!isObj(p.hints)) errors.push(`${where}: "hints" must be an object`)
      else {
        allowed(`${where}.hints`, p.hints, ['address', 'hours', 'price'])
        for (const [key, value] of Object.entries(p.hints)) {
          if (str(`${where}.hints`, value, key) && /[0-9₽$€]/.test(value)) errors.push(`${where}.hints.${key}: unsourced hints must not contain numbers or prices — add it as a fact with source and checkedAt`)
          if (p[key] !== undefined) errors.push(`${where}.hints.${key}: both a fact and a hint are set`)
        }
      }
    }
    if (p.scheme !== undefined && (!isObj(p.scheme) || !Number.isFinite(p.scheme.x) || !Number.isFinite(p.scheme.y))) errors.push(`${where}: "scheme" must be {x, y} numbers`)
  }

  // ---------- routes ----------
  for (const [r, where] of objects('routes')) {
    allowed(where, r, ['id', 'title', 'subtitle', 'theme', 'area', 'tone', 'days', 'placeIds', 'keywords', 'image', 'imageAlt'])
    for (const key of ['title', 'subtitle', 'theme', 'area']) str(where, r[key], key)
    if (!TONES.includes(r.tone)) errors.push(`${where}: "tone" must be one of ${TONES.join(', ')}`)
    if (r.days !== 1 && r.days !== 2) errors.push(`${where}: "days" must be 1 or 2`)
    if (!Array.isArray(r.placeIds) || r.placeIds.length < 1 || r.placeIds.length > 6) errors.push(`${where}: "placeIds" must list 1–6 places`)
    else {
      if (new Set(r.placeIds).size !== r.placeIds.length) errors.push(`${where}: "placeIds" has duplicates`)
      for (const id of r.placeIds) if (!ids.places.has(id)) errors.push(`${where}: unknown place "${id}"`)
    }
    strList(where, r.keywords, 'keywords')
    image(where, r)
  }

  // ---------- events ----------
  for (const [e, where] of objects('events')) {
    allowed(where, e, ['id', 'title', 'dateStart', 'dateEnd', 'time', 'placeId', 'address', 'price', 'source', 'checkedAt'])
    str(where, e.title, 'title')
    const startOk = date(where, e.dateStart, 'dateStart')
    if (e.dateEnd !== undefined && date(where, e.dateEnd, 'dateEnd') && startOk && e.dateEnd < e.dateStart) errors.push(`${where}: "dateEnd" is before "dateStart"`)
    for (const key of ['time', 'address', 'price']) if (e[key] !== undefined) str(where, e[key], key)
    if (e.placeId !== undefined && !ids.places.has(e.placeId)) errors.push(`${where}: unknown place "${e.placeId}"`)
    if (e.placeId === undefined && e.address === undefined) warnings.push(`${where}: neither "placeId" nor "address" is set`)
    if (e.source === 'owner') errors.push(`${where}: events need an https source, not "owner"`)
    else source(where, e.source)
    checkedAt(where, e.checkedAt)
  }

  // ---------- films ----------
  const filmKeys = new Set()
  const filmsPerGenre = Object.fromEntries(GENRES.map(g => [g, 0]))
  const currentYear = today.getUTCFullYear()
  for (const [f, where] of objects('films')) {
    allowed(where, f, ['id', 'title', 'originalTitle', 'year', 'genres', 'origin', 'note', 'poster', 'source', 'checkedAt'])
    str(where, f.title, 'title')
    if (f.originalTitle !== undefined) str(where, f.originalTitle, 'originalTitle')
    if (!Number.isInteger(f.year) || f.year < 1888 || f.year > currentYear + 1) errors.push(`${where}: "year" must be a release year`)
    if (!Array.isArray(f.genres) || f.genres.length === 0) errors.push(`${where}: "genres" must be a non-empty array`)
    else {
      if (new Set(f.genres).size !== f.genres.length) errors.push(`${where}: "genres" has duplicates`)
      for (const g of f.genres) {
        if (!GENRES.includes(g)) errors.push(`${where}: unknown genre "${g}" (allowed: ${GENRES.join(', ')})`)
        else filmsPerGenre[g]++
      }
    }
    if (f.origin !== 'owner' && f.origin !== 'research') errors.push(`${where}: "origin" must be "owner" or "research"`)
    if (f.note !== undefined) str(where, f.note, 'note', { max: 100 })
    if (f.poster !== undefined) {
      const pw = `${where}.poster`
      const p = f.poster
      if (!isObj(p)) errors.push(`${pw}: must be an object`)
      else {
        allowed(pw, p, ['src', 'alt', 'width', 'height', 'source', 'credit', 'checkedAt'])
        str(pw, p.alt, 'alt'); str(pw, p.credit, 'credit')
        posInt(pw, p.width, 'width'); posInt(pw, p.height, 'height')
        if (p.width > 480 || p.height > 720) errors.push(`${pw}: dimensions exceed 480 × 720`)
        if (!(typeof p.source === 'string' && https(p.source))) errors.push(`${pw}: "source" must be an https URL`)
        checkedAt(pw, p.checkedAt)
        if (typeof f.id !== 'string' || !ID.test(f.id) || p.src !== `images/films/${f.id}.webp`) {
          errors.push(`${pw}: "src" must be the base-relative path images/films/<film-id>.webp`)
        } else {
          const file = resolve(dir, '../../public', p.src)
          if (!existsSync(file) || !statSync(file).isFile()) errors.push(`${pw}: local poster file is missing`)
          else {
            const size = statSync(file).size
            if (size === 0 || size > 300000) errors.push(`${pw}: poster must be 1–300000 bytes`)
            else {
              const bytes = readFileSync(file)
              if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') errors.push(`${pw}: poster must be a WebP file`)
            }
          }
        }
      }
    }
    source(where, f.source)
    checkedAt(where, f.checkedAt)
    const key = `${String(f.title).toLocaleLowerCase('ru-RU')}|${f.year}`
    if (filmKeys.has(key)) errors.push(`${where}: duplicate film (same title and year)`)
    filmKeys.add(key)
  }

  // ---------- recipes ----------
  for (const [r, where] of objects('recipes')) {
    allowed(where, r, ['id', 'title', 'yield', 'leadTimeHours', 'ingredients', 'sections', 'tips', 'toppings', 'serving', 'source', 'checkedAt'])
    str(where, r.title, 'title'); str(where, r.yield, 'yield')
    leadTime(where, r.leadTimeHours)
    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) errors.push(`${where}: "ingredients" must be a non-empty array of groups`)
    else r.ingredients.forEach((group, gi) => {
      const gw = `${where}.ingredients[${gi}]`
      if (!isObj(group)) { errors.push(`${gw}: must be {group, items}`); return }
      allowed(gw, group, ['group', 'items'])
      str(gw, group.group, 'group')
      if (!Array.isArray(group.items) || group.items.length === 0) { errors.push(`${gw}: "items" must be a non-empty array`); return }
      group.items.forEach((item, ii) => {
        const iw = `${gw}.items[${ii}]`
        if (!isObj(item)) { errors.push(`${iw}: must be an object`); return }
        allowed(iw, item, ['name', 'amount', 'unit', 'note'])
        str(iw, item.name, 'name')
        if (item.amount !== undefined && !(typeof item.amount === 'number' && item.amount > 0)) errors.push(`${iw}: "amount" must be a positive number`)
        if (item.unit !== undefined) str(iw, item.unit, 'unit')
        if (item.unit !== undefined && item.amount === undefined) errors.push(`${iw}: "unit" without "amount"`)
        if (item.note !== undefined) str(iw, item.note, 'note')
      })
    })
    const sectionIds = new Set()
    if (!Array.isArray(r.sections) || r.sections.length === 0) errors.push(`${where}: "sections" must be a non-empty array`)
    else r.sections.forEach((section, si) => {
      const sw = `${where}.sections[${si}]`
      if (!isObj(section)) { errors.push(`${sw}: must be {id, title, steps}`); return }
      allowed(sw, section, ['id', 'title', 'steps'])
      if (typeof section.id !== 'string' || !ID.test(section.id)) errors.push(`${sw}: "id" must be kebab-case latin`)
      else if (sectionIds.has(section.id)) errors.push(`${sw}: duplicate section id`)
      else sectionIds.add(section.id)
      str(sw, section.title, 'title')
      if (!Array.isArray(section.steps) || section.steps.length === 0) { errors.push(`${sw}: "steps" must be a non-empty array`); return }
      section.steps.forEach((step, ti) => {
        const tw = `${sw}.steps[${ti}]`
        if (!isObj(step)) { errors.push(`${tw}: must be {text}`); return }
        allowed(tw, step, ['text', 'durationMinutes', 'temperatureC'])
        str(tw, step.text, 'text')
        if (step.durationMinutes !== undefined) posInt(tw, step.durationMinutes, 'durationMinutes')
        if (step.temperatureC !== undefined && !Number.isInteger(step.temperatureC)) errors.push(`${tw}: "temperatureC" must be an integer`)
      })
    })
    if (r.tips !== undefined) strList(where, r.tips, 'tips')
    if (r.serving !== undefined) strList(where, r.serving, 'serving')
    if (r.toppings !== undefined) {
      if (!Array.isArray(r.toppings) || r.toppings.length === 0) errors.push(`${where}: "toppings" must be a non-empty array`)
      else r.toppings.forEach((topping, ti) => {
        const tw = `${where}.toppings[${ti}]`
        if (!isObj(topping)) { errors.push(`${tw}: must be {title, text}`); return }
        allowed(tw, topping, ['title', 'text'])
        str(tw, topping.title, 'title'); str(tw, topping.text, 'text')
      })
    }
    source(where, r.source)
    checkedAt(where, r.checkedAt)
    if (r.id === 'roman-pizza') {
      for (const id of ROMAN_PIZZA_SECTIONS) if (!sectionIds.has(id)) errors.push(`${where}: section "${id}" is required for the owner's recipe`)
      for (const key of ['tips', 'toppings', 'serving']) if (r[key] === undefined) errors.push(`${where}: "${key}" is required for the owner's recipe`)
      if (r.source !== 'owner') errors.push(`${where}: the owner's recipe must have source "owner"`)
      if (isObj(r.leadTimeHours) && (r.leadTimeHours.min !== 48 || r.leadTimeHours.max !== 72)) errors.push(`${where}: "leadTimeHours" must be {min: 48, max: 72}`)
    }
  }

  // ---------- activities ----------
  const activityLocation = new Map()
  for (const [a, where] of objects('activities')) {
    allowed(where, a, ['id', 'title', 'location', 'durationMinutes', 'audience', 'needs', 'detail', 'leadTimeHours', 'leadTimeNote', 'image', 'imageAlt'])
    if (a.leadTimeNote !== undefined) {
      str(where, a.leadTimeNote, 'leadTimeNote', { max: 60 })
      if (a.leadTimeHours === undefined) errors.push(`${where}: "leadTimeNote" requires "leadTimeHours"`)
    }
    str(where, a.title, 'title')
    if (a.location !== 'home' && a.location !== 'city') errors.push(`${where}: "location" must be "home" or "city"`)
    else activityLocation.set(a.id, a.location)
    posInt(where, a.durationMinutes, 'durationMinutes')
    if (!Array.isArray(a.audience) || a.audience.length === 0 || a.audience.some(x => !AUDIENCES.includes(x))) errors.push(`${where}: "audience" must be a non-empty subset of ${AUDIENCES.join(', ')}`)
    strList(where, a.needs, 'needs', { allowEmpty: true })
    if (a.leadTimeHours !== undefined) leadTime(where, a.leadTimeHours)
    image(where, a)
    const d = a.detail
    if (!isObj(d)) { errors.push(`${where}: "detail" must be an object with "type"`); continue }
    if (d.type === 'recipe') {
      allowed(`${where}.detail`, d, ['type', 'recipeId'])
      if (!ids.recipes.has(d.recipeId)) errors.push(`${where}: unknown recipe "${d.recipeId}"`)
    } else if (d.type === 'films') {
      allowed(`${where}.detail`, d, ['type'])
    } else if (d.type === 'steps') {
      allowed(`${where}.detail`, d, ['type', 'steps'])
      strList(`${where}.detail`, d.steps, 'steps')
    } else if (d.type === 'places') {
      allowed(`${where}.detail`, d, ['type', 'placeIds'])
      if (!Array.isArray(d.placeIds) || d.placeIds.length === 0) errors.push(`${where}.detail: "placeIds" must be a non-empty array`)
      else for (const id of d.placeIds) if (!ids.places.has(id)) errors.push(`${where}.detail: unknown place "${id}"`)
      if (a.location !== 'city') errors.push(`${where}: activities with places must have location "city"`)
    } else errors.push(`${where}: "detail.type" must be recipe, films, steps or places`)
  }

  // ---------- day ideas ----------
  const ideasByMode = { home: 0, city: 0, mixed: 0 }
  for (const [d, where] of objects('day-ideas')) {
    allowed(where, d, ['id', 'title', 'summary', 'mode', 'activityIds', 'keywords', 'image', 'imageAlt'])
    str(where, d.title, 'title')
    str(where, d.summary, 'summary', { max: 140 })
    if (!['home', 'city', 'mixed'].includes(d.mode)) errors.push(`${where}: "mode" must be home, city or mixed`)
    else ideasByMode[d.mode]++
    if (!Array.isArray(d.activityIds) || d.activityIds.length < 2 || d.activityIds.length > 3) errors.push(`${where}: "activityIds" must list 2–3 activities`)
    else {
      if (new Set(d.activityIds).size !== d.activityIds.length) errors.push(`${where}: "activityIds" has duplicates`)
      const locations = new Set()
      for (const id of d.activityIds) {
        if (!ids.activities.has(id)) errors.push(`${where}: unknown activity "${id}"`)
        else if (activityLocation.has(id)) locations.add(activityLocation.get(id))
      }
      const expected = d.mode === 'mixed' ? ['city', 'home'] : [d.mode]
      if (locations.size && [...locations].sort().join() !== expected.join()) errors.push(`${where}: mode "${d.mode}" does not match activity locations (${[...locations].sort().join(', ')})`)
    }
    strList(where, d.keywords, 'keywords')
    image(where, d)
  }

  // ---------- volumes (D14) ----------
  const counts = {
    places: data.places.length,
    routes: data.routes.length,
    events: data.events.length,
    films: data.films.length,
    filmsPerGenre,
    recipes: data.recipes.length,
    activities: data.activities.length,
    dayIdeas: data['day-ideas'].length,
    dayIdeasByMode: ideasByMode,
  }
  const below = []
  const m = RELEASE_MINIMUMS
  for (const key of ['places', 'routes', 'recipes', 'dayIdeas']) if (counts[key] < m[key]) below.push(`${key} ${counts[key]}/${m[key]}`)
  for (const g of GENRES) if (filmsPerGenre[g] < m.filmsPerGenre) below.push(`films.${g} ${filmsPerGenre[g]}/${m.filmsPerGenre}`)
  for (const mode of Object.keys(m.dayIdeasByMode)) if (ideasByMode[mode] < m.dayIdeasByMode[mode]) below.push(`dayIdeas.${mode} ${ideasByMode[mode]}/${m.dayIdeasByMode[mode]}`)
  if (below.length) (release ? errors : warnings).push(`below release minimums (D14): ${below.join('; ')}`)

  return { errors, warnings, counts }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const args = process.argv.slice(2)
  const release = args.includes('--release')
  const dir = args.find(arg => !arg.startsWith('--')) ?? join(dirname(fileURLToPath(import.meta.url)), '../../apps/web/src/content')
  const { errors, warnings, counts } = validateContent(dir, { release })
  const genreLine = Object.entries(counts.filmsPerGenre).map(([g, n]) => `${g} ${n}`).join(', ')
  console.log(`places ${counts.places} · routes ${counts.routes} · events ${counts.events} · recipes ${counts.recipes} · activities ${counts.activities} · day ideas ${counts.dayIdeas} (home ${counts.dayIdeasByMode.home}, city ${counts.dayIdeasByMode.city}, mixed ${counts.dayIdeasByMode.mixed})`)
  console.log(`films ${counts.films}: ${genreLine}`)
  for (const warning of warnings) console.log(`warning: ${warning}`)
  for (const error of errors) console.error(`error: ${error}`)
  if (errors.length) { console.error(`${errors.length} error(s)`); process.exit(1) }
  console.log('content OK')
}
