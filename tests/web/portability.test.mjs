// Rules P1–P3 of plan section 12: the site stays ready to move from GitHub Pages to an own server (AC-DI-17).
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('../../apps/web/src/', import.meta.url))
const files = []
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(ts|tsx|js|jsx|mjs|css)$/.test(name)) files.push(path)
  }
}
walk(src)
const rel = path => relative(src, path).split(sep).join('/')
const problems = []

for (const path of files) {
  const name = rel(path)
  const text = readFileSync(path, 'utf8')
  // P1: knowledge base JSON is imported only by the static content source.
  if (name !== 'content/static-source.ts' && /(from\s+|import\()\s*['"][^'"]+\.json['"]/.test(text)) problems.push(`${name}: imports JSON (P1: use content/load.ts)`)
  // P2: localStorage only in the local plan repository.
  if (name !== 'plan/repository-local.ts' && /\blocalStorage\b/.test(text)) problems.push(`${name}: uses localStorage (P2: use PlanRepository)`)
  // P3: no hosting addresses in the code.
  if (/github\.io/.test(text)) problems.push(`${name}: mentions github.io (P3)`)
  if (/['"`(]\/Weekend_Search\//.test(text)) problems.push(`${name}: hard-coded /Weekend_Search/ path (P3: use import.meta.env.BASE_URL)`)
}

assert.deepEqual(problems, [], problems.join('\n'))

// P1: the content source loads every collection, including lazy ones.
const { getContentSource } = await import('../../apps/web/src/content/load.ts')
const source = getContentSource()
for (const name of ['places', 'routes', 'events', 'films', 'recipes', 'activities', 'day-ideas']) {
  const items = await source.getCollection(name)
  assert.ok(Array.isArray(items), name)
}
assert.equal((await source.getById('recipes', 'roman-pizza')).id, 'roman-pizza')
assert.equal(await source.getById('places', 'no-such-place'), undefined)

console.log(`Переносимость: ${files.length} файлов без JSON-импортов, localStorage и адресов хостинга вне своих модулей; источник данных отдаёт все коллекции — OK`)
