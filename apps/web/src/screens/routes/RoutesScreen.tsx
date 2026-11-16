// S04 «Маршруты» and S05 «Маршрут» (docs/ux/screens.md; R-ADD-7, R-ADD-8, R-FILTER-2, R-NAV-2).
import { useEffect, useMemo, useState } from 'react'
import { getContentSource, type ContentSource } from '../../content/load.ts'
import type { Place, Route } from '../../content/types.ts'
import type { NewPlanItem } from '../../plan/model.ts'
import { createPlan, presence, setDayCount, splitInHalf, type PlanStore } from '../../plan/store.ts'
import { AddToDay, Button, EmptyState, Eyebrow, Field, LoadError, PageHeading, PlaceCard, RouteCard, Skeleton, TextLink, type AddToDayState } from '../../ui/components.tsx'
import { makeAdder } from '../../app/add.tsx'
import { dayLabel, formatMinutes, plural, toDay } from '../../app/format.ts'
import { Notice, useNotice } from '../../app/Notice.tsx'
import { planStore, usePlanState } from '../../app/plan-state.ts'
import { placeAddressText, placeFacts, placeMapHref } from '../../app/places.ts'
import { useResource } from '../../app/resource.ts'
import { viewHref } from '../../app/routing.ts'
import './routes.css'

type Data = { routes: Route[]; places: Place[] }
const load = async (source: ContentSource): Promise<Data> => {
  const [routes, places] = await Promise.all([source.getCollection('routes'), source.getCollection('places')])
  return { routes, places }
}
const norm = (text: string) => text.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')

export function RoutesScreen({ source = getContentSource(), store = planStore, now = () => new Date() }: { source?: ContentSource; store?: PlanStore; now?: () => Date }) {
  const resource = useResource(() => load(source), [source])
  const [query, setQuery] = useState(() => new URLSearchParams(location.search))
  useEffect(() => { const onPop = () => setQuery(new URLSearchParams(location.search)); addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop) }, [])
  const routeId = query.get('route')
  if (!resource.data) return <><PageHeading eyebrow="Маршруты">{routeId ? 'Маршрут' : 'Маршруты по городу'}</PageHeading>{resource.error ? <LoadError onRetry={resource.retry} /> : <Skeleton />}</>
  if (routeId) {
    const route = resource.data.routes.find(r => r.id === routeId)
    return route ? <RouteDetail route={route} places={resource.data.places} store={store} now={now} />
      : <EmptyState title="Такого маршрута нет" action={<TextLink href={viewHref('routes')}>Ко всем маршрутам</TextLink>} />
  }
  return <RouteCatalog data={resource.data} query={query} setQuery={setQuery} />
}

function RouteCatalog({ data, query, setQuery }: { data: Data; query: URLSearchParams; setQuery: (q: URLSearchParams) => void }) {
  const text = query.get('q') ?? '', theme = query.get('theme') ?? ''
  const replace = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(location.search)
    for (const [key, value] of Object.entries(patch)) { if (value) next.set(key, value); else next.delete(key) }
    history.replaceState(history.state, '', `${location.pathname}?${next}`) // R-FILTER-2: filters replace the history entry
    setQuery(next)
  }
  const placeTitle = useMemo(() => new Map(data.places.map(p => [p.id, p.title])), [data])
  const themes = useMemo(() => [...new Set(data.routes.map(r => r.theme))].sort((a, b) => a.localeCompare(b, 'ru')), [data])
  const visible = data.routes.filter(route => {
    const haystack = norm(`${route.title} ${route.subtitle} ${route.theme} ${route.area} ${route.placeIds.map(id => placeTitle.get(id) ?? '').join(' ')}`)
    return (!theme || route.theme === theme) && (!text.trim() || haystack.includes(norm(text.trim())))
  })
  const filtered = Boolean(text || theme)
  return <>
    <PageHeading eyebrow="Маршруты" description="Готовые подборки мест, которые можно добавить в свой день.">Маршруты по городу</PageHeading>
    <div className="ws-routes-tools">
      <Field label="Поиск" type="search" placeholder="Поиск: музей, парк, Арбат…" value={text} onChange={e => replace({ q: e.target.value || undefined })} />
      <label className="ws-field"><span>Тема</span><select value={theme} onChange={e => replace({ theme: e.target.value || undefined })}><option value="">Все темы</option>{themes.map(t => <option key={t}>{t}</option>)}</select></label>
    </div>
    <div className="ws-routes-results"><p role="status">Найдено: {visible.length}</p>{filtered && <Button variant="text" onClick={() => replace({ q: undefined, theme: undefined })}>Сбросить ×</Button>}</div>
    {visible.length === 0
      ? <EmptyState title="По этому запросу маршрутов нет" action={<Button variant="secondary" onClick={() => replace({ q: undefined, theme: undefined })}>Сбросить фильтры</Button>}>Попробуйте другое слово или откройте «Места».</EmptyState>
      : <div className="ws-routes-grid">{visible.map(route => <RouteCard key={route.id} href={viewHref('routes', { route: route.id })} theme={route.theme} title={route.title} subtitle={route.subtitle} area={route.area} days={route.days}
        places={route.placeIds.map(id => placeTitle.get(id)).filter((x): x is string => Boolean(x))} />)}</div>}
  </>
}

function RouteDetail({ route, places, store, now }: { route: Route; places: Place[]; store: PlanStore; now: () => Date }) {
  const { plan } = usePlanState(store)
  const { notice, notify, dismiss } = useNotice()
  const add = makeAdder(store, notify, now)
  const byId = new Map(places.map(p => [p.id, p]))
  const routePlaces = route.placeIds.flatMap(id => byId.get(id) ? [byId.get(id)!] : [])
  const items: NewPlanItem[] = routePlaces.map(p => ({ kind: 'place', placeId: p.id }))
  const state = presence(plan, items)
  const [firstHalf, secondHalf] = splitInHalf(items)
  const missing = items.filter(item => presence(plan, [item]).inPlan === 0)

  // R-ADD-8: two-day routes are split in half.
  const addTwoDays = () => {
    let base = store.get() ?? createPlan(now())
    if (base.days.length === 1) { const r = setDayCount(base, 2); if (r.status !== 'ok') return; base = r.plan }
    // The first half goes to day 1 and the second to day 2, as one action with one undo.
    const one = base.days[0], two = base.days[1]
    if (6 - one.items.length < firstHalf.length || 6 - two.items.length < secondHalf.length) { notify('В днях плана не хватает места: в дне не больше 6 пунктов', { error: true }); return }
    const merged = { ...base, days: [{ ...one, items: [...one.items] }, { ...two, items: [...two.items] }] }
    const uids: string[] = []
    const keys = new Set(merged.days.flatMap(d => d.items).flatMap(i => i.kind === 'place' ? [i.placeId] : []))
    ;[firstHalf, secondHalf].forEach((half, dayIndex) => half.forEach(item => {
      if (item.kind !== 'place' || keys.has(item.placeId)) return
      const uid = globalThis.crypto.randomUUID(); uids.push(uid)
      merged.days[dayIndex].items.push({ ...item, uid })
    }))
    void store.set(base.days.every(d => d.items.length === 0) ? { ...merged, sourceTitle: route.title } : merged)
    notify(`Добавлено ${toDay(merged.days[0].date).split(',')[0]} и ${toDay(merged.days[1].date).split(',')[0].replace(/^во? /, '')}`, { undo: () => { const latest = store.get(); if (latest) void store.set({ ...latest, days: latest.days.map(d => ({ ...d, items: d.items.filter(i => !uids.includes(i.uid)) })) }) } })
  }

  const dayButtons = plan && plan.days.length > 1 ? plan.days.map((d, i) => ({ id: d.date, label: `В ${toDay(d.date).replace(/^во? /, '')}`, onAdd: () => { add(missing.length ? missing : items, i, { sourceTitle: route.title }) } })) : undefined
  const addState: AddToDayState = state.total > 0 && state.inPlan === state.total
    ? { kind: 'added', dayLabel: state.dayIndexes.map(i => dayLabel(plan!.days[i].date)).join(' и '), planHref: viewHref('plan', { day: state.dayIndexes[0] ? String(state.dayIndexes[0] + 1) : undefined }) }
    : state.inPlan > 0 ? { kind: 'partial', existing: state.inPlan, total: state.total, onAdd: () => { add(missing, 0, { sourceTitle: route.title }) }, days: dayButtons }
    : route.days === 2 ? (plan && plan.days.length === 2 ? { kind: 'two-days', onAdd: addTwoDays } : { kind: 'create-two-days', onAdd: addTwoDays })
    : dayButtons ? { kind: 'days', days: dayButtons }
    : { kind: 'single', onAdd: () => { add(items, 0, { sourceTitle: route.title }) } }

  const from = history.state?.from
  const backHref = typeof from?.href === 'string' ? from.href : viewHref('routes')
  const backLabel = typeof from?.label === 'string' ? from.label : 'Маршруты'
  const half = route.days === 2 ? Math.ceil(routePlaces.length / 2) : Infinity
  return <>
    <a className="ws-idea-back" href={backHref} onClick={event => { if (from?.href && !event.ctrlKey && !event.metaKey) { event.preventDefault(); history.back() } }}>← {backLabel}</a>
    <PageHeading eyebrow={`Маршрут · ${route.theme}`} description={route.subtitle}>{route.title}</PageHeading>
    <p>{route.area} · {routePlaces.length} {plural(routePlaces.length, 'место', 'места', 'мест')} · {route.days === 1 ? '1 день' : '2 дня'}</p>
    <div className="ws-route-add"><AddToDay state={addState} /></div>
    <ol className="ws-route-places">{routePlaces.map((p, i) => <li key={p.id}>
      {i === half && <Eyebrow>День 2</Eyebrow>}
      <PlaceCard number={i + 1} kind={p.kind} area={p.area} title={p.title} description={p.note} address={placeAddressText(p)} addressFact={p.address} mapHref={placeMapHref(p)} facts={placeFacts(p)} duration={`Около ${formatMinutes(p.durationMinutes)} на месте`} />
      {p.publicSpace && <p className="ws-caption">Городское пространство; возможны ограничения. Прогулка без билета.</p>}
    </li>)}</ol>
    {routePlaces.length < route.placeIds.length && <p role="status">Часть мест маршрута пока недоступна.</p>}
    <div className="ws-route-add"><AddToDay state={addState} /></div>
    {notice && <Notice notice={notice} dismiss={dismiss} />}
  </>
}
