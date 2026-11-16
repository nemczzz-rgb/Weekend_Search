// One notification area per screen (S08): 8 s, paused while hovered or focused (R-DEL-2).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Toast } from '../ui/components.tsx'

export type NoticeData = { id: number; message: ReactNode; error?: boolean; undo?: () => void; focusUndo?: boolean }

export function useNotice() {
  const [notice, setNotice] = useState<NoticeData>()
  const notify = useCallback((message: ReactNode, options: Omit<NoticeData, 'id' | 'message'> = {}) => setNotice({ id: Date.now(), message, ...options }), [])
  const dismiss = useCallback(() => setNotice(undefined), [])
  return { notice, notify, dismiss }
}

export function Notice({ notice, dismiss, onClosedWithFocus }: { notice: NoticeData; dismiss: () => void; onClosedWithFocus?: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const remaining = useRef(8000), started = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hovering = useRef(false), focused = useRef(false)
  const close = useCallback(() => {
    const hadFocus = box.current?.contains(document.activeElement) ?? false
    dismiss()
    if (hadFocus) onClosedWithFocus?.()
  }, [dismiss, onClosedWithFocus])
  const pause = useCallback(() => {
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = undefined
    remaining.current -= Date.now() - started.current
  }, [])
  const resume = useCallback(() => {
    if (hovering.current || focused.current || timer.current) return
    started.current = Date.now()
    timer.current = setTimeout(close, Math.max(0, remaining.current))
  }, [close])
  useEffect(() => {
    remaining.current = 8000
    if (notice.focusUndo) box.current?.querySelector('button')?.focus()
    resume()
    return pause
  }, [notice.id, notice.focusUndo, pause, resume])
  const undo = notice.undo ? () => { notice.undo!(); dismiss() } : undefined
  return <div ref={box} className="ws-app-notice"
    onMouseEnter={() => { hovering.current = true; pause() }}
    onMouseLeave={() => { hovering.current = false; resume() }}
    onFocus={() => { focused.current = true; pause() }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { focused.current = false; resume() } }}>
    <Toast error={notice.error} onUndo={undo}>{notice.message}</Toast>
  </div>
}
