// The temporary UI adapter must never turn mixed fact dates or hints into a fresh verification.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'

const require = createRequire(import.meta.url)
const { transpileModule, ModuleKind } = require('../../apps/web/node_modules/typescript')
const placeRecordById = new Map()
const exports = {}
const source = readFileSync(new URL('../../apps/web/src/visit.ts', import.meta.url), 'utf8')
const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } })
runInNewContext(outputText, { exports, require: name => {
  assert.equal(name, './data')
  return { placeRecordById }
} })
const { getVisit, placeMapUrl } = exports
const place = { id: 'test', title: 'Тест', area: 'Москва', address: 'Адрес пользователя', sourceUrl: 'https://yandex.ru/maps/example' }
const fact = (value, checkedAt, source = 'https://example.org/facts') => ({ value, checkedAt, source })
const visit = record => { placeRecordById.set('test', record); return getVisit(place) }

let result = visit({ address: fact('Адрес', '2026-11-13'), hours: fact('Часы', '2026-11-13'), price: fact('Цена', '2026-11-13') })
assert.equal(result.checkedAt, '2026-11-13')
assert.equal(result.source, 'https://example.org/facts')

result = visit({ address: fact('Адрес', '2026-11-10', 'owner'), hours: fact('Часы', '2026-11-13'), price: fact('Цена', '2026-11-12') })
assert.equal(result.checkedAt, '2026-11-10', 'an older displayed owner fact must not inherit the newer external check date')
assert.equal(result.source, 'https://example.org/facts')

result = visit({ hints: { address: 'Подсказка', hours: 'Уточнить' }, extraSources: ['https://example.org/info'] })
assert.equal(result.checkedAt, undefined, 'hints and extra links do not verify facts')
assert.equal(result.source, undefined)
assert.equal(result.secondarySource, 'https://example.org/info')

result = visit({ publicSpace: true, address: fact('Не показан', '2026-11-13') })
assert.equal(result.checkedAt, undefined, 'generic public-space text has no verification badge')
assert.equal(result.source, undefined)

placeRecordById.delete('test')
assert.equal(getVisit(place).checkedAt, undefined, 'custom places are not externally checked')
assert.equal(placeMapUrl(place, place.address), place.sourceUrl, 'the user map link is preserved')

result = visit({ address: fact('Адрес', '2026-11-13'), price: fact('Цена', '2026-11-13') })
assert.equal(result.hours, undefined, 'unknown hours are not filled from another fact')
console.log('Факты визита: даты смешанных источников, непроверенные подсказки, свои места и отсутствующие часы — OK')
