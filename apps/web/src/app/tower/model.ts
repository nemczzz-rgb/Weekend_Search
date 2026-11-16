// Shukhov tower model for the new site (ADR-006, docs/design-system/tokens.md «Башня и фон»).
// Geometry is the same as apps/web/src/shukhov-background.js (six sections, 24 and 12 legs, mast with two
// traverses and a flagpole to 160 m); the old file stays untouched for the current site. This port follows the
// approved TowerNext artboard (design/claude-design/project/TowerNext.dc.html, build(4, 36, 6)).

export type Segments = { s: Float32Array; layer: Uint8Array; count: number }

const DEG = Math.PI / 180
const SECTIONS = [
  { y0: 0, h: 25, rb: 20.25, rt: 16.25, n: 24, phi: 37.5, rings: 4, w: 0.21 },
  { y0: 25, h: 25, rb: 16.25, rt: 12.5, n: 24, phi: 37.5, rings: 4, w: 0.21 },
  { y0: 50, h: 25, rb: 12.5, rt: 9.0, n: 24, phi: 45, rings: 7, w: 0.17 },
  { y0: 75, h: 25, rb: 9.0, rt: 6.0, n: 24, phi: 45, rings: 9, w: 0.15 },
  { y0: 100, h: 25, rb: 6.0, rt: 3.75, n: 12, phi: 45, rings: 9, w: 0.14 },
  { y0: 125, h: 20, rb: 3.75, rt: 2.5, n: 12, phi: 45, rings: 9, w: 0.13 },
]

/** Height of the lamp on the mast, metres. */
export const LAMP_Y = 157
export const TOP_Y = 165

/** Floor of each section: 0 — the top with the lamp (home), 0.8 — the base (plan); scrolling adds up to FLOOR_SPAN. */
export const FLOORS = { home: 0, 'day-ideas': 0.2, routes: 0.4, places: 0.6, plan: 0.8 } as const
export const FLOOR_SPAN = 0.2
/** Camera position for a section floor and page scroll progress 0..1. */
export const towerT = (floor: number, progress: number) => Math.min(1, Math.max(0, floor + progress * FLOOR_SPAN))
/** Rotation follows scroll: progress × 360° (tokens.md). */
export const towerAngle = (progress: number, still: boolean) => 0.35 + (still ? 0 : progress * Math.PI * 2)

/** Layers: 0 — rings, 1 — legs facing one way (accent), 2 — legs the other way and the mast (ink), 3 — heavy rings. */
export function buildTower(SUB = 4, RMAX = 36): Segments {
  const out: number[] = [], layers: number[] = []
  const seg = (a: number[], b: number[], w: number, layer: number) => { out.push(a[0], a[1], a[2], b[0], b[1], b[2], w); layers.push(layer) }
  const pt = (r: number, a: number, y: number) => [r * Math.cos(a * DEG), y, r * Math.sin(a * DEG)]
  const ring = (y: number, r: number, w: number, layer: number, n: number) => {
    n = Math.min(n, RMAX)
    for (let i = 0; i < n; i++) seg(pt(r, 360 * i / n, y), pt(r, 360 * (i + 1) / n, y), w, layer)
  }
  ring(0, 20.25, 0.36, 3, 120)
  let phase = 0
  for (const s of SECTIONS) {
    const step = 360 / s.n
    for (let i = 0; i < s.n; i++) {
      for (let d = 1; d >= -1; d -= 2) {
        const off = d > 0 ? -0.1 : 0.1, a0 = phase + i * step, a1 = a0 + d * s.phi
        const p0 = pt(s.rb + off, a0, s.y0), p1 = pt(s.rt + off, a1, s.y0 + s.h)
        for (let k = 0; k < SUB; k++) {
          const t0 = k / SUB, t1 = (k + 1) / SUB
          seg([0, 1, 2].map(j => p0[j] + (p1[j] - p0[j]) * t0), [0, 1, 2].map(j => p0[j] + (p1[j] - p0[j]) * t1), s.w, d > 0 ? 1 : 2)
        }
      }
    }
    const q0 = pt(s.rb, 0, 0), q1 = pt(s.rt, s.phi, 0)
    for (let k = 1; k <= s.rings; k++) {
      const t = k / (s.rings + 1)
      const r = Math.hypot(q0[0] + (q1[0] - q0[0]) * t, q0[2] + (q1[2] - q0[2]) * t)
      ring(s.y0 + s.h * t, r - 0.2, 0.11, 0, s.rb > 8 ? 120 : 60)
    }
    const yt = s.y0 + s.h
    ring(yt - 0.5, s.rt + 0.2, 0.24, 3, s.rt > 8 ? 120 : 60)
    ring(yt, s.rt + 0.2, 0.28, 3, s.rt > 8 ? 120 : 60)
    phase += s.phi
  }
  for (const [y, r] of [[125, 3.75], [145, 2.5]]) {
    ring(y, r * 0.45, 0.07, 0, 36)
    for (let i = 0; i < 12; i++) seg(pt(r * 0.45, i * 30, y), pt(r, i * 30, y), 0.07, 0)
    ring(y + 1.1, r - 0.25, 0.06, 0, 48)
  }
  const m = 0.5, yb = 145, ym = 151.5
  for (const [u0, u1] of [[m, m], [m, -m], [-m, -m], [-m, m]]) seg([u0, yb, u1], [u0 * 0.5, ym, u1 * 0.5], 0.1, 2)
  const traverse = (y: number, half: number, depth: number) => {
    seg([-half, y, 0], [half, y, 0], 0.11, 2)
    seg([-half + 0.8, y + depth, 0], [half - 0.8, y + depth, 0], 0.08, 2)
    seg([-half, y, 0], [-half + 0.8, y + depth, 0], 0.08, 2)
    seg([half, y, 0], [half - 0.8, y + depth, 0], 0.08, 2)
    seg([-half, y, 0], [0, y + 3.2, 0], 0.04, 2)
    seg([half, y, 0], [0, y + 3.2, 0], 0.04, 2)
  }
  traverse(146.9, 5.2, 0.55)
  traverse(149.6, 3.6, 0.5)
  seg([0, ym, 0], [0, 160, 0], 0.11, 2)
  return { s: Float32Array.from(out), layer: Uint8Array.from(layers), count: layers.length }
}
