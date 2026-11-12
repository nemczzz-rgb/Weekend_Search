import { useEffect, useRef } from 'react'
import { mount } from './shukhov-background.js'

export function TowerBackground() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (canvas.current) return mount(canvas.current)
  }, [])

  return <div className="tower-background" aria-hidden="true">
    <canvas ref={canvas} />
  </div>
}
