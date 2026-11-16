// S06 «Места» with «Ближайшие события» (docs/ux/screens.md; R-EVENT-1, R-EVENT-2, R-ADD-2…6).
import { useEffect, useMemo, useState } from 'react'
import { getContentSource, type ContentSource } from '../../content/load.ts'
import type { Event, Place } from '../../content/types.ts'
import { toIsoDate } from '../../plan/dates.ts'
import { createPlan, isPlanEmpty, setFirstDate, type PlanStore } from '../../plan/store.ts'
import { Button, EmptyState, Eyebrow, Field, LoadError, PageHeading, PlaceCard, Skeleton, SourceFacts, TextLink } from '../../ui/components.tsx'
import { makeAdder } from '../../app/add.tsx'
import { dayLabel, eventDates, formatMinutes, toDay } from '../../app/format.ts'
import { Notice, useNotice } from '../../app/Notice.tsx'
import { getActiveDay, planStore, usePlanState } from '../../app/plan-state.ts'
import { eventOn, isUpcoming, placeAddressText, placeFacts, placeMapHref } from '../../app/places.ts'
import { useResource } from '../../app/resource.ts'
import { viewHref } from '../../app/routing.ts'
import './places.css'

type Data = { places: Place[]; events: Event[] }
const load = async (source: ContentSource): Promise<Data> => {
  const [places, events] = await Promise.all([source.getCollection('places'), source.getCollection('events')])
  return { places, events }
}
const norm = (text: string) => text.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')

export function PlacesScreen({ source = getContentSource(), store = planStore, now = () => new Date() }: { source?: ContentSource; store?: PlanStore; now?: () => Date }) {
  const resource = useResource(() => load(source), [source])
  return !resource.data
    ? <><PageHeading eyebrow="Места">Места Москвы</PageHeading>{resource.error ? <LoadError onRetry={resource.retry} /> : <Skeleton />}</>
    : <LoadedPlaces data={resource.data} store={store} now={now} />
}

function LoadedPlaces({ data, store, now }: { data: Data; store: PlanStore; now: () => Date }) {
  const { plan } = usePlanState(store)
  const { notice, notify, dismiss } = useNotice()
  const add = makeAdder(store, notify, now)
  const [text, setText] = useState(() => new URLSearchParams(location.search).get('q') ?? '')
  const [allEvents, setAllEvents] = useState(false)
  const highlight = new URLSearchParams(location.search).get('place')
  const placeById = useMemo(() => new Map(data.places.map(p => [p.id, p])), [data])
  const today = toIsoDate(now())

  // place=<id> scrolls to the card (S06); unknown ids are ignored (S09).
  useEffect(() => {
    if (!highlight) return
    const card = document.getElementById(`place-${highlight}`)
    if (!card) return
    card.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    card.classList.add('ws-place-highlight')
    const timer = setTimeout(() => card.classList.remove('ws-place-highlight'), 2000)
    return () => clearTimeout(timer)
  }, [highlight])

  const search = (value: string) => {
    setText(value)
    const query = new URLSearchParams(location.search)
    if (value) query.set('q', value); else query.delete('q')
    query.delete('place')
    history.replaceState(history.state, '', `${location.pathname}?${query}`) // R-FILTER-2
  }

  const upcoming = data.events.filter(e => isUpcoming(e, today)).sort((a, b) => a.dateStart.localeCompare(b.dateStart))
  const shownEvents = allEvents ? upcoming : upcoming.slice(0, 6)
  const visible = data.places.filter(p => !text.trim() || norm(`${p.title} ${placeAddressText(p) ?? ''} ${p.area} ${p.kind} ${p.tags.join(' ')}`).includes(norm(text.trim())))

  return <>
    <PageHeading eyebrow="Места" description="Выбирайте места и добавляйте их в свой план.">Места Москвы</PageHeading>

    {upcoming.length > 0 && <section className="ws-events" aria-labelledby="events-title">
      <Eyebrow>События</Eyebrow><h2 id="events-title">Ближайшие события</h2>
      <div className="ws-events-grid">{shownEvents.map(event => <EventCard key={event.id} event={event} place={event.placeId ? placeById.get(event.placeId) : undefined}
        actions={<EventActions event={event} today={today} plan={plan} onAdd={dayIndex => add([{ kind: 'event', eventId: event.id }], dayIndex)}
          onCreate={() => { const date = event.dateStart > today ? event.dateStart : today; add([{ kind: 'event', eventId: event.id }], 0, { base: setFirstDate(plan ?? createPlan(now()), date) }) }} />} />)}</div>
      {upcoming.length > 6 && !allEvents && <Button variant="secondary" onClick={() => setAllEvents(true)}>Показать все события ({upcoming.length})</Button>}
    </section>}

    <div className="ws-places-tools"><Field label="Поиск" type="search" placeholder="Поиск: название, район, адрес…" value={text} onChange={e => search(e.target.value)} /></div>
    <p role="status" className="ws-places-count">Найдено: {visible.length}</p>
    {visible.length === 0
      ? <EmptyState title="Мест по этому запросу нет">Попробуйте другое название или район.</EmptyState>
      : <ol className="ws-places-list">{visible.map((p, i) => <li key={p.id} id={`place-${p.id}`}>
        <PlaceCard number={i + 1} kind={p.kind} area={p.area} title={p.title} description={p.note} address={placeAddressText(p)} addressFact={p.address} mapHref={placeMapHref(p)} facts={placeFacts(p)}
          duration={`Около ${formatMinutes(p.durationMinutes)} на месте`} onAdd={() => add([{ kind: 'place', placeId: p.id }], getActiveDay(store.get()))} />
        {p.publicSpace && <p className="ws-caption">Городское пространство; возможны ограничения. Прогулка без билета.</p>}
      </li>)}</ol>}
    {notice && <Notice notice={notice} dismiss={dismiss} />}
  </>
}

function EventCard({ event, place, actions }: { event: Event; place?: Place; actions: React.ReactNode }) {
  return <article className="ws-card ws-card-body ws-event-card">
    <Eyebrow>{eventDates(event.dateStart, event.dateEnd)}{event.time ? `, ${event.time}` : ''}</Eyebrow>
    <h3>{event.title}</h3>
    {place ? <TextLink href={viewHref('places', { place: place.id })}>{place.title}</TextLink> : event.address && <p>{event.address}</p>}
    <SourceFacts facts={[{ label: 'Стоимость', unknown: event.price ?? 'Нет подтверждённой цены' }]} linkedFacts={[{ label: 'Дата', fact: { value: event.dateStart, source: event.source, checkedAt: event.checkedAt } }]} />
    <div className="ws-card-actions">{actions}</div>
  </article>
}

function EventActions({ event, today, plan, onAdd, onCreate }: { event: Event; today: string; plan: ReturnType<typeof usePlanState>['plan']; onAdd: (dayIndex: number) => void; onCreate: () => void }) {
  const fitting = plan ? plan.days.flatMap((d, i) => eventOn(event, d.date) ? [i] : []) : []
  if (fitting.length) return <>{fitting.map(i => <Button key={i} variant="item" onClick={() => onAdd(i)}>{toDay(plan!.days[i].date).replace(/^в/, 'В')}</Button>)}</>
  if (!plan || isPlanEmpty(plan)) return <Button variant="item" onClick={onCreate}>Сделать план на {dayLabel(event.dateStart > today ? event.dateStart : today)}</Button>
  return <p className="ws-caption">В плане нет дня {eventDates(event.dateStart, event.dateEnd)}. Поменяйте дату в «Уточнить» на экране плана.</p>
}
