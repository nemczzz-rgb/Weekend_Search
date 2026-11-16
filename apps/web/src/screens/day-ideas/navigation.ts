import { useEffect, useState } from 'react'
export type ScreenRoute = { query: URLSearchParams; action: 'initial' | 'forward' | 'back'; serial: number }
export function makeHref(patch: Record<string, string | undefined>, current = new URLSearchParams(location.search)): string {
  const next = new URLSearchParams(current)
  for (const [key, value] of Object.entries(patch)) { if (value) next.set(key, value); else next.delete(key) }
  return `${location.pathname}?${next}`
}
export function useIdeaNavigation() {
  const [route, setRoute] = useState<ScreenRoute>(() => ({ query: new URLSearchParams(location.search), action: 'initial', serial: 0 }))
  useEffect(() => { const previousRestoration = history.scrollRestoration; history.scrollRestoration = 'manual'; const onPop = () => setRoute(old => ({ query: new URLSearchParams(location.search), action: 'back', serial: old.serial + 1 })); addEventListener('popstate', onPop); return () => { removeEventListener('popstate', onPop); history.scrollRestoration = previousRestoration } }, [])
  const replace = (patch: Record<string, string | undefined>) => { history.replaceState(history.state, '', makeHref(patch)); setRoute(old => ({ ...old, query: new URLSearchParams(location.search) })) }
  const open = (href: string) => {
    history.replaceState({ ...history.state, scrollY }, '', location.href)
    history.pushState({ from: { href: location.pathname + location.search, label: 'Идеи для дня' }, scrollY: 0 }, '', href)
    setRoute(old => ({ query: new URLSearchParams(location.search), action: 'forward', serial: old.serial + 1 }))
  }
  return { route, replace, open }
}
