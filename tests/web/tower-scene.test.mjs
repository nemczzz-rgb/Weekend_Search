import assert from 'node:assert/strict'

// Новая башня (apps/web/src/app/tower): модель, этажи разделов, камера и отрисовка без браузера.
const { buildTower, FLOORS, towerT, towerAngle, LAMP_Y } = await import('../../apps/web/src/app/tower/model.ts')
const { layout, drawFrame } = await import('../../apps/web/src/app/tower/render.ts')

const model = buildTower()
assert.ok(model.count > 3000, 'в модели есть сетка всех шести секций')
assert.equal(model.s.length, model.count * 7)
assert.equal(model.layer.length, model.count)
let top = 0
for (let i = 0; i < model.count; i++) top = Math.max(top, model.s[i * 7 + 1], model.s[i * 7 + 4])
assert.equal(top, 160, 'флагшток заканчивается на 160 м')

// Главная — верх с фонарём, «Мой план» — основание; разделы идут сверху вниз.
const order = ['home', 'day-ideas', 'routes', 'places', 'plan']
order.slice(1).forEach((view, i) => assert.ok(FLOORS[view] > FLOORS[order[i]], `${view} ниже ${order[i]}`))
assert.equal(towerT(FLOORS.home, 0), 0)
assert.equal(towerT(FLOORS.plan, 1), 1)
assert.ok(towerT(FLOORS.routes, 1) <= FLOORS.places + 1e-9, 'прокрутка раздела не заходит на этаж следующего')
assert.ok(Math.abs(towerAngle(1, false) - towerAngle(0, false) - Math.PI * 2) < 1e-9, 'полная прокрутка — полный оборот')
assert.equal(towerAngle(0.7, true), towerAngle(0, true), 'reduced-motion: угол не зависит от прокрутки')

// Камера: при t = 0 фонарь в кадре, при t = 1 видно основание; на телефоне башня у правого края.
for (const [w, h, mobile] of [[1280, 800, false], [390, 844, true]]) {
  const up = layout(w, h, 0, mobile), down = layout(w, h, 1, mobile)
  const lampY = up.baseY - LAMP_Y * up.pxm
  assert.ok(lampY > 0 && lampY < h, `фонарь в кадре на ${w}px`)
  assert.ok(down.baseY > 0 && down.baseY <= h + 4 * down.pxm, `основание видно на ${w}px`)
  assert.ok(up.cx > w * 0.5, `ось башни справа на ${w}px`)
}

// Отрисовка: кадр рисуется на заглушке контекста, фонарь возвращается в координатах экрана.
const calls = { stroke: 0, fill: 0 }
globalThis.Path2D = class { moveTo() {} lineTo() {} }
const ctx = new Proxy({ getTransform: () => ({ translate() { return { scale: () => ({}) } } }) }, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'stroke' || key === 'fill') return () => { calls[key]++ }
    if (key === 'createRadialGradient') return () => ({ addColorStop() {} })
    return () => {}
  },
  set() { return true },
})
const lamp = drawFrame(ctx, model, { width: 1280, height: 800, mobile: false, t: 0, angle: 0.35, accent: [57, 50, 189], lamp: 1 }, null)
assert.ok(calls.stroke > 10, 'линии башни нарисованы')
assert.ok(lamp.lampY > 0 && lamp.lampY < 800 && lamp.lampX > 640)

console.log('tower-scene: ok')
