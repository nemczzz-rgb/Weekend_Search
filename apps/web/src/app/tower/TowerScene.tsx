// Background scene of the new site (tokens.md «Башня и фон»):
// - the angle follows page scroll (progress × 360°), the camera moves down the tower while scrolling;
// - each section has its own «floor»: home — the top with the lamp, then ideas, routes, places, plan — the base;
// - section change: the camera rises or descends in 450 ms; the first visit of the home screen: 2.4 s from the base
//   to the top, then the lamp lights up and the heading appears;
// - prefers-reduced-motion: a still frame, no intro and no transitions.
import { useEffect, useRef } from 'react'
import { ACCENTS, type Accent } from '../../ui/components.tsx'
import type { View } from '../routing.ts'
import { buildTower, FLOORS, towerAngle, towerT, type Segments } from './model.ts'
import { drawFrame, makeHatch, type RGB } from './render.ts'

const TRANSITION_MS = 450, INTRO_MS = 2400, LAMP_MS = 400

let model: Segments | null = null
let introPlayed = false

const rgb = (hex: string): RGB => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB
const ease = (x: number) => 1 - Math.pow(1 - x, 3)

export function TowerScene({ view, accent }: { view: View; accent: Accent }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef<{ view: View; accent: Accent; from: number; to: number; start: number; duration: number; lamp: number }>({ view, accent, from: FLOORS[view], to: FLOORS[view], start: 0, duration: 0, lamp: 1 })

  useEffect(() => {
    const node = canvas.current
    const ctx = node?.getContext('2d')
    if (!node || !ctx) return
    model ??= buildTower()
    const still = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, hatch: CanvasPattern | null = null, hatchKey = ''
    const s = state.current

    if (s.view === 'home' && !introPlayed && !still.matches) {
      introPlayed = true
      Object.assign(s, { from: 1, to: 0, start: performance.now(), duration: INTRO_MS, lamp: 0 })
      document.documentElement.dataset.towerIntro = 'running'
      setTimeout(() => { document.documentElement.dataset.towerIntro = 'done' }, INTRO_MS + LAMP_MS + 100) // also when rAF is paused
    }

    const progress = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0
    }
    const render = (now: number) => {
      frame = 0
      const dpr = Math.min(2, devicePixelRatio || 1), width = innerWidth, height = innerHeight
      if (node.width !== Math.round(width * dpr) || node.height !== Math.round(height * dpr)) {
        node.width = Math.round(width * dpr); node.height = Math.round(height * dpr); hatchKey = ''
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const accentRGB = rgb(ACCENTS.find(a => a[0] === s.accent)?.[2] ?? '#3932bd')
      if (hatchKey !== `${s.accent}|${dpr}`) { hatch = makeHatch(ctx, accentRGB, dpr); hatchKey = `${s.accent}|${dpr}` }
      const moving = s.duration > 0 && now - s.start < s.duration
      const k = s.duration > 0 ? ease(Math.min(1, (now - s.start) / s.duration)) : 1
      const base = s.from + (s.to - s.from) * k
      const p = still.matches ? 0 : progress()
      const t = towerT(base, moving && s.duration === INTRO_MS ? 0 : p)
      let lamp = s.lamp
      if (s.lamp < 1 && !moving) {
        const lampK = Math.min(1, (now - s.start - s.duration) / LAMP_MS)
        lamp = Math.max(0, lampK)
        if (lampK >= 1) s.lamp = 1
      }
      drawFrame(ctx, model!, { width, height, mobile: width < 768, t, angle: towerAngle(p, still.matches), accent: accentRGB, lamp }, hatch)
      if (moving || s.lamp < 1) schedule()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render) }
    ;(node as HTMLCanvasElement & { redraw?: () => void }).redraw = schedule
    addEventListener('scroll', schedule, { passive: true })
    addEventListener('resize', schedule)
    still.addEventListener('change', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
      still.removeEventListener('change', schedule)
    }
  }, [])

  // Section change: rise or descend to the section floor (R-NAV-1 animations, tokens.md).
  useEffect(() => {
    const s = state.current
    if (s.view === view) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const now = performance.now()
    const current = s.duration > 0 && now - s.start < s.duration ? s.from + (s.to - s.from) * ease((now - s.start) / s.duration) : s.to
    Object.assign(s, { view, from: reduced ? FLOORS[view] : current, to: FLOORS[view], start: now, duration: reduced ? 0 : TRANSITION_MS, lamp: 1 })
    ;(canvas.current as (HTMLCanvasElement & { redraw?: () => void }) | null)?.redraw?.()
  }, [view])

  useEffect(() => {
    state.current.accent = accent
    ;(canvas.current as (HTMLCanvasElement & { redraw?: () => void }) | null)?.redraw?.()
  }, [accent])

  return <div className="ws-tower" aria-hidden="true"><canvas ref={canvas} /></div>
}
