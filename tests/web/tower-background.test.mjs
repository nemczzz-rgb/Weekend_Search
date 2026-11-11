import assert from 'node:assert/strict'

// Проверяем интеграцию прокрутки без браузера и дополнительных зависимостей.
const events = new Map()
const frames = new Map()
let nextFrame = 0
let resizeContent
let disconnected = false
const motion = { matches: false, addEventListener: (_, fn) => events.set('motion', fn), removeEventListener: () => events.delete('motion') }
globalThis.window = {
  innerHeight: 900, scrollY: 0, devicePixelRatio: 1,
  matchMedia: () => motion,
  addEventListener: (name, fn) => events.set(name, fn),
  removeEventListener: name => events.delete(name),
  requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame },
  cancelAnimationFrame: id => frames.delete(id),
}
globalThis.document = { documentElement: { scrollHeight: 1900, clientWidth: 1440 }, body: {} }
globalThis.ResizeObserver = class {
  constructor(fn) { resizeContent = fn }
  observe() {}
  disconnect() { disconnected = true }
}
const ctx = Object.fromEntries(['fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke'].map(name => [name, () => {}]))
const canvas = { dataset: {}, getContext: () => ctx }
const { mount } = await import('../../apps/web/src/shukhov-background.js')
const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()) }
const dispose = mount(canvas)
flush()
assert.equal(canvas.dataset.angle, '0.00')
window.scrollY = 750
events.get('scroll')(); flush()
assert.equal(canvas.dataset.angle, '270.00')
window.scrollY = 250
events.get('scroll')(); flush()
assert.equal(canvas.dataset.angle, '90.00')
document.documentElement.scrollHeight = 1400
resizeContent(); flush()
assert.equal(canvas.dataset.angle, '180.00')
motion.matches = true
events.get('motion')(); flush()
assert.equal(canvas.dataset.angle, '0.00')
motion.matches = false
document.documentElement.scrollHeight = 900
events.get('motion')(); flush()
assert.equal(canvas.dataset.angle, '0.00')
document.documentElement.clientWidth = 390
events.get('resize')(); flush()
assert.equal(canvas.width, 390)
assert.ok(Number.isFinite(Number(canvas.dataset.camera)))
events.get('scroll')()
dispose()
assert.equal(frames.size, 0)
assert.equal(events.size, 0)
assert.equal(disconnected, true)
mount({ getContext: () => null })()
console.log('Фон: оба направления, изменение высоты, уменьшение движения, мобильный размер и очистка — OK')
