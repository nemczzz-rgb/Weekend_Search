// Screen addresses through query parameters only (plan section 12, rule P7; docs/ux/information-architecture.md).
import { useCallback, useEffect, useState } from 'react'

export type View = 'home' | 'day-ideas' | 'routes' | 'places' | 'plan'
export const VIEWS: View[] = ['home', 'day-ideas', 'routes', 'places', 'plan']

/** Labels for the «←» link of the next screen (R-NAV-2). */
export const FROM_LABEL: Record<View, string> = {
  home: 'Главная',
  'day-ideas': 'Идеи для дня',
  routes: 'Маршруты',
  places: 'Места',
  plan: 'Мой план',
}

/** Development-only switches that must survive navigation (never present in production links). */
const KEEP = ['app']

export function readView(query: URLSearchParams): View {
  const value = query.get('view') ?? 'home'
  return (VIEWS as string[]).includes(value) ? value as View : 'home' // unknown view → home (S09)
}

/** Address of a screen: only its own parameters plus development switches. */
export function viewHref(view: View, params: Record<string, string | undefined> = {}, current = new URLSearchParams(location.search)): string {
  const next = new URLSearchParams()
  for (const key of KEEP) { const value = current.get(key); if (value) next.set(key, value) }
  if (view !== 'home') next.set('view', view)
  for (const [key, value] of Object.entries(params)) if (value) next.set(key, value)
  const search = next.toString()
  return `${location.pathname}${search ? `?${search}` : ''}`
}

export type ShellRoute = { query: URLSearchParams; view: View; serial: number; action: 'initial' | 'forward' | 'back' }

/**
 * R-NAV-1: going forward pushes a history entry (scroll to top), going back restores the
 * previous screen. The day-ideas screen manages its own catalog ↔ idea navigation; the shell
 * remounts it only when the shell itself navigates (serial changes).
 */
export function useShellRoute() {
  const [route, setRoute] = useState<ShellRoute>(() => {
    const query = new URLSearchParams(location.search)
    return { query, view: readView(query), serial: 0, action: 'initial' }
  })

  useEffect(() => {
    const onPop = () => setRoute(old => {
      const query = new URLSearchParams(location.search)
      const view = readView(query)
      // Back inside the day-ideas screen is handled by that screen; keep it mounted.
      const serial = view === 'day-ideas' && old.view === 'day-ideas' ? old.serial : old.serial + 1
      return { query, view, serial, action: 'back' }
    })
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((href: string) => {
    const target = new URL(href, location.href)
    if (target.pathname + target.search === location.pathname + location.search) return
    // History is changed outside the state updater: StrictMode runs updaters twice in development.
    const fromView = readView(new URLSearchParams(location.search))
    history.replaceState({ ...history.state, scrollY }, '', location.href)
    history.pushState({ from: { href: location.pathname + location.search, label: FROM_LABEL[fromView] }, scrollY: 0 }, '', target.pathname + target.search)
    const query = new URLSearchParams(target.search)
    setRoute(old => ({ query, view: readView(query), serial: old.serial + 1, action: 'forward' }))
  }, [])

  return { route, navigate }
}

/** Intercepts plain clicks on same-page links so screens can use ordinary <a href> (P7). */
export function interceptLinks(event: React.MouseEvent<HTMLElement>, navigate: (href: string) => void): void {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const link = (event.target as HTMLElement).closest('a')
  if (!link || link.target || link.hasAttribute('download')) return
  const url = new URL(link.href, location.href)
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash) return
  event.preventDefault()
  navigate(url.pathname + url.search)
}
