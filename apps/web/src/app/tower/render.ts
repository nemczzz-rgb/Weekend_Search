// Canvas rendering of the tower, Kremlin and Moscow City (approved TowerNext artboard, 16.11.2026).
import { LAMP_Y, TOP_Y, type Segments } from './model.ts'

export type RGB = [number, number, number]
export type Frame = { width: number; height: number; mobile: boolean; t: number; angle: number; accent: RGB; lamp: number }
type Layout = { pxm: number; cx: number; D: number; camH: number; baseY: number; strength: number }

const PAPER: RGB = [245, 244, 241]
const INK: RGB = [25, 24, 33]
const LAMP = '#ffcd00' // yellow only for the lamp and the logo (ADR-006)
const GROUND = -4
// TowerNext parameters: back half at 50 %, middle rings at 55 %, coarse widths, paper gap under front lines.
const BACK = 0.5, MID = 0.55, MIN_W = 0.6, GAP = 1
// Artboard where the skyline was drawn: 1152 px wide, tower base at y = 490.
const ART = { width: 1152, baseY: 490 }

/** Camera for a viewport: t = 0 shows the top with the lamp, t = 1 the base (design ws.js layout). */
export function layout(vw: number, vh: number, t: number, mobile: boolean): Layout {
  const R = 19.3
  if (mobile) {
    const pxm = vh / 112, win = 112
    const yB = (TOP_Y - win) + (GROUND + 2 - (TOP_Y - win)) * t
    return { pxm, cx: vw + pxm, D: 320, camH: yB + win * 0.3, baseY: vh + yB * pxm, strength: 0.6 }
  }
  const pxm = Math.min(vh / 52, 0.24 * vw / R), win = vh / pxm
  const yB = (TOP_Y - win) + (GROUND - (TOP_Y - win)) * t
  return { pxm, cx: vw - 0.82 * R * pxm, D: 170, camH: yB + win * 0.25, baseY: vh + yB * pxm, strength: 1 }
}

const mix = (c: RGB, a: number) => `rgb(${c.map((v, i) => Math.round(PAPER[i] + (v - PAPER[i]) * a)).join(',')})`
const coarse = (w: number) => (w < 0.09 ? 0.06 : w < 0.19 ? 0.14 : 0.27)

function drawSkyline(ctx: CanvasRenderingContext2D, o: Layout, frame: Frame, hatch: CanvasPattern | null) {
  // The city stands on the horizon behind the tower and is several times smaller (TowerNext: «масштаб условный»):
  // the artboard spans the screen width, its base line sits on the tower ground line.
  const k = Math.min(1.4, Math.max(0.45, frame.width / ART.width))
  const X = (x: number) => x * k
  const Y = (y: number) => o.baseY + (y - ART.baseY) * k
  if (Y(350) > frame.height + 20) return // the city is below the screen
  const lw = Math.max(0.6, k)
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.strokeStyle = mix(INK, 1)
  ctx.lineWidth = lw
  // Horizon with a gap behind the tower base.
  const gap = 18 * o.pxm
  ctx.beginPath()
  ctx.moveTo(0, Y(470)); ctx.lineTo(Math.max(0, o.cx - gap), Y(470))
  if (o.cx + gap < frame.width) { ctx.moveTo(o.cx + gap, Y(470)); ctx.lineTo(frame.width, Y(470)) }
  ctx.stroke()
  ctx.setTransform(ctx.getTransform().translate(X(0), Y(0)).scale(k))
  ctx.lineWidth = lw / k
  if (hatch) ctx.fillStyle = hatch // pattern space follows the transform: one tile = 5 × 13 artboard px
  for (const d of SKYLINE) { const path = new Path2D(d); if (hatch) ctx.fill(path); ctx.stroke(path) }
  // Kremlin wall battlements.
  ctx.save(); ctx.setLineDash([3, 3]); ctx.lineWidth = 4; ctx.stroke(new Path2D('M80 456H400')); ctx.restore()
  ctx.stroke(new Path2D('M255 386v-7')) // cross of Ivan the Great bell tower
  ctx.translate(150, 383); ctx.scale(0.6, 0.6)
  ctx.fillStyle = `rgb(${frame.accent.join(',')})`
  ctx.fill(new Path2D('M0-7l2.2 5.6 6 .4-4.6 3.9 1.5 5.9-5.1-3.3-5.1 3.3 1.5-5.9-4.6-3.9 6-.4z')) // Spasskaya star
  ctx.restore()
}

/** Hatch of the city silhouettes: paper, accent and ink diagonals, ink sill (artboard pattern twLat). */
export function makeHatch(ctx: CanvasRenderingContext2D, accent: RGB, dpr: number): CanvasPattern | null {
  if (typeof document === 'undefined') return null
  const tile = document.createElement('canvas')
  tile.width = Math.round(5 * dpr); tile.height = Math.round(13 * dpr)
  const g = tile.getContext('2d')
  if (!g) return null
  g.scale(dpr, dpr)
  g.fillStyle = mix(PAPER, 0); g.fillRect(0, 0, 5, 13)
  g.lineWidth = 0.6; g.strokeStyle = `rgb(${accent.join(',')})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(5, 13); g.stroke()
  g.lineWidth = 0.5; g.strokeStyle = mix(INK, 1); g.beginPath(); g.moveTo(5, 0); g.lineTo(0, 13); g.stroke()
  g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, 0); g.lineTo(5, 0); g.stroke()
  const pattern = ctx.createPattern(tile, 'repeat')
  pattern?.setTransform(new DOMMatrix().scale(1 / dpr))
  return pattern
}

export function drawFrame(ctx: CanvasRenderingContext2D, model: Segments, frame: Frame, hatch: CanvasPattern | null): { lampX: number; lampY: number } {
  const o = layout(frame.width, frame.height, frame.t, frame.mobile)
  ctx.clearRect(0, 0, frame.width, frame.height)
  drawSkyline(ctx, o, frame, hatch)

  const COL: RGB[] = [INK, frame.accent, INK, INK], GAIN = [0.62 * MID, 1, 1, 1]
  const f = o.pxm * o.D, hy = o.baseY - o.pxm * o.camH, ca = Math.cos(frame.angle), sa = Math.sin(frame.angle)
  const NF = 4, pad = 20, S = model.s
  const buckets = new Map<number, number[]>() // key = fi * 100 + layer * 10 + width class
  const WIDTHS = [0.06, 0.14, 0.27]
  for (let i = 0; i < model.count; i++) {
    const q = i * 7
    const x1 = S[q] * ca + S[q + 2] * sa, z1 = -S[q] * sa + S[q + 2] * ca
    const x2 = S[q + 3] * ca + S[q + 5] * sa, z2 = -S[q + 3] * sa + S[q + 5] * ca
    const s1 = f / (o.D - z1), s2 = f / (o.D - z2)
    const X1 = o.cx + x1 * s1, Y1 = hy - (S[q + 1] - o.camH) * s1, X2 = o.cx + x2 * s2, Y2 = hy - (S[q + 4] - o.camH) * s2
    if ((Y1 < -pad && Y2 < -pad) || (Y1 > frame.height + pad && Y2 > frame.height + pad) || (X1 < -pad && X2 < -pad) || (X1 > frame.width + pad && X2 > frame.width + pad)) continue
    const xm = (x1 + x2) / 2, zm = (z1 + z2) / 2, rr = Math.hypot(xm, zm)
    const front = 0.5 + 0.5 * (rr < 1.4 ? 0.6 : zm / rr)
    const fi = Math.min(NF - 1, (front * NF) | 0)
    const key = fi * 100 + model.layer[i] * 10 + WIDTHS.indexOf(coarse(S[q + 6]))
    let list = buckets.get(key)
    if (!list) buckets.set(key, list = [])
    list.push(X1, Y1, X2, Y2)
  }
  for (let fi = 0; fi < NF; fi++) {
    const fr = (fi + 0.5) / NF, frontHalf = fr > 0.5, kk = (0.14 + 0.8 * Math.pow(fr, 1.5)) * o.strength
    for (const layer of frontHalf ? [0, 1, 2, 3] : [3, 2, 1, 0]) {
      for (let wc = 0; wc < WIDTHS.length; wc++) {
        const list = buckets.get(fi * 100 + layer * 10 + wc)
        if (!list) continue
        const a = Math.min(1, kk * GAIN[layer]) * (frontHalf ? 1 : BACK)
        if (a < 0.03) continue
        const path = new Path2D()
        for (let j = 0; j < list.length; j += 4) { path.moveTo(list[j], list[j + 1]); path.lineTo(list[j + 2], list[j + 3]) }
        const px = Math.max(WIDTHS[wc] * o.pxm * 1.18, MIN_W)
        if (frontHalf) { ctx.lineCap = 'butt'; ctx.strokeStyle = mix(PAPER, 0); ctx.lineWidth = px + GAP * 4 * (fr - 0.5); ctx.stroke(path) }
        ctx.lineCap = 'round'; ctx.strokeStyle = mix(COL[layer], a); ctx.lineWidth = px; ctx.stroke(path)
      }
    }
  }

  // Lamp on the mast.
  const lampX = o.cx, lampY = hy - (LAMP_Y - o.camH) * o.pxm
  if (frame.lamp > 0 && lampY > -40 && lampY < frame.height + 40) {
    const glow = Math.max(18, o.pxm * 3.2) // lamp sizes from design ws.js
    const gradient = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, glow)
    gradient.addColorStop(0, `rgba(255,205,0,${0.85 * frame.lamp})`); gradient.addColorStop(1, 'rgba(255,205,0,0)')
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(lampX, lampY, glow, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = LAMP; ctx.strokeStyle = mix(INK, 1); ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(lampX, lampY, glow * 0.09 + 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
  return { lampX, lampY }
}

/** Kremlin (left) and Moscow City (right) in artboard coordinates; composition approved by Alex071004 on 16.11.2026. */
const SKYLINE = [
  'M250 458V412h10v46M251.5 412v-14h7v14M251.5 398q-3-7 3.5-12q6.5 5 3.5 12',
  'M266 458v-22h24v22M268 436q-1-6 4-9q5 3 4 9M280 436q-1-7 4-10q5 3 4 10',
  'M300 458v-20h44v20',
  'M80 470V458H400V470',
  'M88 470V440h14v30M90 440l5-22 5 22',
  'M141 470V434h18v36M144 434v-12h12v12M146.5 422v-10h7v10M146.5 412 150 388l3.5 24',
  'M194 470V448h12v22M196 448l4-14 4 14',
  'M314 470V448h12v22M316 448l4-14 4 14',
  'M352 470V430h16v40M355 430v-10h10v10M355 420l5-26 5 26',
  'M800 470V390h22v80',
  'M828 470V440h-3V410h3V379h20V410h3V440h-3V470',
  'M852 470V393h16v77',
  'M876 470Q870 433 880 396L894 398Q902 434 892 470',
  'M900 470V408q11-14 22 0V470',
  'M930 470V397q16 30 20 73',
  'M954 470V358q22 50 26 112',
  'M988 470V380l5-12h10l7 20v82',
  'M1016 470V377h20v93',
  'M1042 470V372l20-8v106',
  'M1068 470V366h18v104M1090 470V379h16v91',
]
