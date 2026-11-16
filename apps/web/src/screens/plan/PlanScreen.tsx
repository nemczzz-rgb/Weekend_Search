// S07 «Мой план» (docs/ux/screens.md; rules R-ADD, R-DEL, R-MOVE, R-REPL, R-DAYS, R-TODAY, R-EVENT, R-WISH, R-SAVE).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getContentSource, type ContentSource } from '../../content/load.ts'
import { GENRES, type Activity, type DayIdea, type Event, type Film, type Place, type Route } from '../../content/types.ts'
import { toIsoDate } from '../../plan/dates.ts'
import type { Plan, PlanDay, PlanItem } from '../../plan/model.ts'
import {
  addItems, clearPlan, createPlan, findItem, isHomeDay, isOutdated, isPlanEmpty, moveItem, moveToNearestSaturday,
  removeItem, replacePlace, restoreItem, setArea, setDayCount, setFirstDate, transferItem, type PlanStore,
} from '../../plan/store.ts'
import { prepLine } from '../../plan/today.ts'
import { draftFromWish } from '../../plan/wish.ts'
import { Banner, Button, Dialog, EmptyState, EveningDivider, Field, LoadError, PageHeading, PlanDayCard, PlanItemCard, Segmented, Skeleton, SourceFacts, StorageBar, TextLink, WishInput } from '../../ui/components.tsx'
import { capitalize, dayLabel, daysWord, eventDates, formatMinutes, inDay, itemsWord, notLaterThan, toDay } from '../../app/format.ts'
import { Notice, useNotice } from '../../app/Notice.tsx'
import { planStore, usePlanState } from '../../app/plan-state.ts'
import { useResource } from '../../app/resource.ts'
import { viewHref } from '../../app/routing.ts'
import { takePendingWish } from '../../app/wish-intent.ts'
import './plan.css'

const AREAS = ['Тверской', 'Пресненский', 'Арбат', 'Хамовники', 'Басманный', 'Мещанский', 'Якиманка', 'Замоскворечье', 'Останкинский', 'Бутырский']
const WISH_EXAMPLES = ['музей, а вечером дома фильм', 'парк и спа-вечер', 'хочу весь день дома', 'пицца и кино']

type Data = { places: Place[]; events: Event[]; activities: Activity[]; ideas: DayIdea[]; routes: Route[]; films: Film[] }

async function loadData(source: ContentSource): Promise<Data> {
  const [places, events, activities, ideas, routes, films] = await Promise.all([
    source.getCollection('places'), source.getCollection('events'), source.getCollection('activities'),
    source.getCollection('day-ideas'), source.getCollection('routes'), source.getCollection('films'),
  ])
  return { places, events, activities, ideas, routes, films }
}

const eventFits = (event: Event | undefined, date: string) => Boolean(event && event.dateStart <= date && date <= (event.dateEnd ?? event.dateStart))

export function PlanScreen({ store = planStore, source = getContentSource(), now = () => new Date() }: { store?: PlanStore; source?: ContentSource; now?: () => Date }) {
  const resource = useResource(() => loadData(source), [source])
  return <>
    {!resource.data
      ? <><PageHeading eyebrow="Мой план">Мой план</PageHeading>{resource.error ? <LoadError onRetry={resource.retry} /> : <Skeleton />}</>
      : <LoadedPlan data={resource.data} store={store} now={now()} />}
  </>
}

function LoadedPlan({ data, store, now }: { data: Data; store: PlanStore; now: Date }) {
  const { plan, storageAvailable } = usePlanState(store)
  const { notice, notify, dismiss } = useNotice()
  const [dayParam, setDayParam] = useState(() => new URLSearchParams(location.search).get('day') === '2' ? 1 : 0)
  const [wish, setWish] = useState(''), [wrote, setWrote] = useState<string>(), [wishOpen, setWishOpen] = useState(false), [fallback, setFallback] = useState(false)
  const [pendingWish, setPendingWish] = useState<{ text: string; draft: ReturnType<typeof draftFromWish> }>()
  const [confirmClear, setConfirmClear] = useState(false), [daysChoice, setDaysChoice] = useState(false), [replaceUid, setReplaceUid] = useState<string>()
  const [live, setLive] = useState('')
  const focusAfter = useRef<string | undefined>(undefined)
  // Focus requests are applied after the plan re-renders (R-MOVE-2, R-MOVE-3, R-REPL-1).
  const pendingFocus = useRef<string | undefined>(undefined)
  const focusLater = (selector: string) => { pendingFocus.current = selector }

  const place = useMemo(() => new Map(data.places.map(x => [x.id, x])), [data])
  const event = useMemo(() => new Map(data.events.map(x => [x.id, x])), [data])
  const activity = useMemo(() => new Map(data.activities.map(x => [x.id, x])), [data])
  const idea = useMemo(() => new Map(data.ideas.map(x => [x.id, x])), [data])
  const film = useMemo(() => new Map(data.films.map(x => [x.id, x])), [data])
  const location_ = (id: string) => activity.get(id)?.location

  const activeDay = plan && dayParam < plan.days.length ? dayParam : 0
  const save = (next: Plan | null) => { void store.set(next) }
  const selectDay = (index: number) => {
    setDayParam(index)
    const query = new URLSearchParams(location.search)
    if (index === 0) query.delete('day'); else query.set('day', String(index + 1))
    history.replaceState(history.state, '', `${location.pathname}${query.toString() ? `?${query}` : ''}`)
  }
  const restoreFocus = () => setTimeout(() => {
    const target = focusAfter.current ? document.querySelector<HTMLElement>(focusAfter.current) : null
    const fallback = document.querySelector<HTMLElement>('.ws-plan-day h2')
    if (fallback && !target) fallback.tabIndex = -1
    ;(target ?? fallback)?.focus()
  })
  useEffect(() => {
    if (!pendingFocus.current) return
    const element = document.querySelector<HTMLElement>(pendingFocus.current)
    pendingFocus.current = undefined
    if (element) { if (element.tagName === 'H3') element.tabIndex = -1; element.focus() }
  }, [plan, dayParam])
  // A wish sent from the home screen (S01) is applied here, with the same dialog when the plan is not empty.
  useEffect(() => { const text = takePendingWish(); if (text) submitWish(text) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // A removed second day must not stay in the address (R-DAYS-2).
  useEffect(() => { if (plan && dayParam >= plan.days.length) selectDay(0) })

  // ---------- wish (R-WISH) ----------
  const submitWish = (text: string) => {
    const draft = draftFromWish(text, { dayIdeas: data.ideas, activities: data.activities, routes: data.routes, places: data.places }, plan?.area)
    if (!plan || isPlanEmpty(plan)) applyDraft(text, draft, 'replace')
    else setPendingWish({ text, draft })
  }
  const applyDraft = (text: string, draft: ReturnType<typeof draftFromWish>, mode: 'replace' | 'add') => {
    const base = plan ?? createPlan(now)
    if (mode === 'replace') {
      const fresh: Plan = { version: base.version, area: base.area, days: [{ date: base.days[0].date, items: [] }] }
      const result = addItems(fresh, 0, draft.items)
      save(result.status === 'added' ? { ...result.plan, sourceTitle: draft.sourceTitle } : fresh)
      selectDay(0)
    } else {
      const result = addItems(base, activeDay, draft.items)
      if (result.status === 'limit') { notify(`${capitalize(inDay(base.days[activeDay].date))} не хватает места: в дне не больше 6 пунктов`, { error: true }); return }
      if (result.status === 'already') { notify('Всё из черновика уже в плане'); return }
      save(result.plan)
      notify(`Добавлено ${toDay(base.days[activeDay].date)}`, { undo: () => { const latest = store.get(); if (latest) save(removeItemsSafe(latest, result.addedUids)) } })
    }
    setWrote(text); setFallback(draft.fallback); setWish(''); setWishOpen(false); setPendingWish(undefined)
  }

  // ---------- item actions ----------
  const move = (uid: string, direction: -1 | 1, action: 'up' | 'down') => {
    if (!plan) return
    const next = moveItem(plan, uid, direction)
    if (!next) return
    save(next)
    const found = findItem(next, uid)!
    const title = itemTitle(found.item)
    setLive(`${title}: пункт ${found.index + 1} из ${next.days[found.dayIndex].items.length}`)
    const atEdge = action === 'up' ? found.index === 0 : found.index === next.days[found.dayIndex].items.length - 1
    focusLater(`[data-uid="${uid}"] [data-action="${atEdge ? (action === 'up' ? 'down' : 'up') : action}"]`)
  }
  const transfer = (uid: string) => {
    if (!plan) return
    const result = transferItem(plan, uid, (item, date) => item.kind !== 'event' || eventFits(event.get(item.eventId), date))
    if (result.status === 'limit') { notify('В другом дне не хватает места: в дне не больше 6 пунктов', { error: true }); return }
    if (result.status !== 'moved') return
    save(result.plan)
    selectDay(result.toDayIndex)
    notify(`Перенесено ${toDay(result.plan.days[result.toDayIndex].date)}`)
    focusLater(`[data-uid="${uid}"] h3`)
  }
  const remove = (uid: string) => {
    if (!plan) return
    const result = removeItem(plan, uid)
    if (!result) return
    const items = plan.days[result.undo.dayIndex].items
    const neighbour = items[result.undo.index + 1] ?? items[result.undo.index - 1]
    focusAfter.current = neighbour ? `[data-uid="${neighbour.uid}"] h3` : undefined
    save(result.plan)
    notify('Убрано', { focusUndo: true, undo: () => { const latest = store.get(); if (latest) { focusLater(`[data-uid="${uid}"] h3`); save(restoreItem(latest, result.undo)) } } })
  }

  const itemTitle = (item: PlanItem): string => {
    switch (item.kind) {
      case 'place': return place.get(item.placeId)?.title ?? 'Место'
      case 'event': return event.get(item.eventId)?.title ?? 'Событие'
      case 'activity': return activity.get(item.activityId)?.title ?? 'Занятие'
      case 'custom': return item.title
    }
  }

  if (!plan || isPlanEmpty(plan)) {
    return <>
      <PageHeading eyebrow="Мой план" description="Добавляйте идеи, маршруты и места или записывайте свои пункты.">Мой план</PageHeading>
      <WishBlock value={wish} onChange={setWish} onSubmit={submitWish} onExample={submitWish} wrote={wrote} fallback={fallback} />
      <EmptyState title="Здесь пока пусто" action={<p className="ws-app-links"><TextLink href={viewHref('day-ideas')}>Идеи для дня</TextLink><TextLink href={viewHref('routes')}>Маршруты</TextLink><TextLink href={viewHref('places')}>Места</TextLink></p>}>Напишите, чего хочется, или выберите идею, маршрут или место.</EmptyState>
      {plan && <Refine plan={plan} now={now} save={save} onTwoToOne={() => setDaysChoice(true)} />}
      {!storageAvailable && <p role="status">План сохранится только до закрытия страницы.</p>}
      {notice && <Notice notice={notice} dismiss={dismiss} onClosedWithFocus={restoreFocus} />}
    </>
  }

  const count = plan.days.reduce((total, day) => total + day.items.length, 0)
  const day = plan.days[activeDay]
  const homeDay = isHomeDay(day, location_)
  const cityPresent = day.items.some(item => item.kind === 'place' || item.kind === 'event' || (item.kind === 'activity' && location_(item.activityId) === 'city'))
  const dayActivities = day.items.flatMap(item => item.kind === 'activity' && activity.get(item.activityId) ? [activity.get(item.activityId)!] : [])
  const prep = prepLine(day.date, dayActivities, now)
  const firstHome = day.items.findIndex(item => item.kind === 'activity' && location_(item.activityId) === 'home')
  const showEvening = firstHome > 0 && day.items.slice(0, firstHome).some(item => item.kind !== 'activity' || location_(item.activityId) === 'city')
  const otherDay = plan.days.length === 2 ? plan.days[activeDay === 0 ? 1 : 0] : undefined

  return <>
    <PageHeading eyebrow="Мой план" description="Добавляйте идеи, маршруты и места или записывайте свои пункты.">{plan.sourceTitle ?? 'Мой план'}</PageHeading>
    {isOutdated(plan, now) && <Banner title="Даты плана прошли"><Button variant="secondary" onClick={() => save(moveToNearestSaturday(plan, now))}>Перенести на ближайшую субботу</Button></Banner>}

    {wishOpen
      ? <WishBlock value={wish} onChange={setWish} onSubmit={submitWish} onExample={submitWish} wrote={wrote} fallback={fallback} />
      : <p className="ws-plan-wish-line">Что хочется?{wrote && <span> «{wrote.length > 40 ? wrote.slice(0, 40) + '…' : wrote}»</span>} <Button variant="text" onClick={() => setWishOpen(true)}>Изменить</Button></p>}
    {!wishOpen && wrote && fallback && <p className="ws-caption">Не нашли точных слов — показали общий вариант.</p>}

    <Refine plan={plan} now={now} save={save} onTwoToOne={() => setDaysChoice(true)} />
    <StorageBar onClear={() => setConfirmClear(true)}>{storageAvailable ? 'План хранится в этом браузере' : 'План сохранится только до закрытия страницы'}</StorageBar>

    <p className="ws-plan-summary">{plan.days.length} {daysWord(plan.days.length)} · {count} {itemsWord(count)}</p>
    {plan.days.length === 2 && <Segmented label="День плана" value={String(activeDay)} onChange={value => selectDay(Number(value))}
      options={plan.days.map((d, i) => ({ value: String(i), label: `День ${i + 1} · ${dayLabel(d.date)}` }))} />}

    <Banner title="Черновик, ещё не готовый маршрут">{homeDay ? 'Проверьте, что всё нужное есть дома.' : 'Проверьте часы и стоимость на дату визита. Адреса открываются в Яндекс Картах.'}</Banner>
    {prep && <Banner tone="preparation" title={prep.missed ? 'Срок подготовки прошёл' : `Начните подготовку ${notLaterThan(prep.deadline)}`}>
      {prep.missed ? `Если заготовки нет, выберите дату позже: ближайшая подходящая — ${dayLabel(prep.nearest)}.` : capitalize(prep.note ?? 'нужна подготовка заранее') + '.'}
    </Banner>}

    <PlanDayCard number={activeDay + 1} date={dayLabel(day.date)} area={!homeDay && cityPresent ? plan.area : undefined}>
      {day.items.length === 0 ? <p className="ws-caption">В этом дне пока ничего нет</p> : <ol className="ws-plan-items">
        {day.items.map((item, index) => <li key={item.uid} data-uid={item.uid}>
          {index === firstHome && showEvening && <EveningDivider />}
          <PlanItemCard number={index + 1} title={itemTitle(item)} kind={kindLabel(item, activity, place)}
            actions={<>
              <Button variant="item" data-action="up" disabled={index === 0} aria-label={`Выше: ${itemTitle(item)}`} onClick={() => move(item.uid, -1, 'up')}>↑ Выше</Button>
              <Button variant="item" data-action="down" disabled={index === day.items.length - 1} aria-label={`Ниже: ${itemTitle(item)}`} onClick={() => move(item.uid, 1, 'down')}>↓ Ниже</Button>
              {otherDay && (item.kind !== 'event' || eventFits(event.get(item.eventId), otherDay.date)) && <Button variant="item" aria-label={`${capitalize(toDay(otherDay.date).split(',')[0])}: ${itemTitle(item)}`} onClick={() => transfer(item.uid)}>{capitalize(toDay(otherDay.date).split(',')[0])}</Button>}
              {item.kind === 'place' && place.has(item.placeId) && <Button variant="item" aria-label={`Заменить: ${itemTitle(item)}`} onClick={() => setReplaceUid(item.uid)}>Заменить</Button>}
              <Button variant="danger" aria-label={`Убрать: ${itemTitle(item)}`} onClick={() => remove(item.uid)}>Убрать</Button>
            </>}>
            <ItemDetails item={item} date={day.date} place={place} event={event} activity={activity} idea={idea} film={film} />
          </PlanItemCard>
        </li>)}
      </ol>}
    </PlanDayCard>

    <AddCustom plan={plan} dayIndex={activeDay} save={save} notify={notify} />
    <p className="ws-app-links"><TextLink href={viewHref('places')}>+ Место</TextLink><TextLink href={viewHref('day-ideas')}>+ Идея для дня</TextLink></p>

    <div className="ws-sr-only" aria-live="polite">{live}</div>
    {notice && <Notice notice={notice} dismiss={dismiss} onClosedWithFocus={restoreFocus} />}

    <Dialog open={confirmClear} title="Очистить план?" confirmLabel="Очистить" destructive onDismiss={() => setConfirmClear(false)}
      onConfirm={() => { save(clearPlan(plan)); setConfirmClear(false) }}>Все пункты будут удалены. Отменить это нельзя.</Dialog>
    <Dialog open={Boolean(pendingWish)} title="В плане уже есть пункты" confirmLabel="Заменить план" destructive onDismiss={() => setPendingWish(undefined)}
      onConfirm={() => pendingWish && applyDraft(pendingWish.text, pendingWish.draft, 'replace')}>
      <p>Можно заменить план черновиком или добавить черновик {toDay(day.date)}.</p>
      <Button variant="secondary" onClick={() => pendingWish && applyDraft(pendingWish.text, pendingWish.draft, 'add')}>Добавить {toDay(day.date)}</Button>
    </Dialog>
    <DaysDialog open={daysChoice} plan={plan} save={save} close={() => setDaysChoice(false)} />
    <ReplaceDialog uid={replaceUid} plan={plan} places={data.places} save={save} close={() => setReplaceUid(undefined)} focusLater={focusLater} />
  </>
}

const removeItemsSafe = (plan: Plan, uids: string[]): Plan => ({ ...plan, days: plan.days.map(day => ({ date: day.date, items: day.items.filter(item => !uids.includes(item.uid)) })) })

function kindLabel(item: PlanItem, activity: Map<string, Activity>, place: Map<string, Place>): string {
  switch (item.kind) {
    case 'place': { const p = place.get(item.placeId); return p ? `${p.kind} · ${p.area}` : 'Место' }
    case 'event': return 'Событие'
    case 'activity': return activity.get(item.activityId)?.location === 'city' ? 'Занятие · в городе' : 'Занятие · дома'
    case 'custom': return 'Свой пункт'
  }
}

function mapHref(p: Place): string {
  if (p.address && p.mapLink && p.address.value === p.mapLink.address) return p.mapLink.url
  if (p.address) return `https://yandex.ru/maps/?text=${encodeURIComponent(`Москва, ${p.address.value}`)}`
  if (p.mapLink) return p.mapLink.url
  return `https://yandex.ru/maps/?text=${encodeURIComponent(`${p.area === 'Подмосковье' ? 'Московская область' : 'Москва'}, ${p.title}`)}`
}

function PlaceFacts({ p }: { p: Place }) {
  return <>
    <p>{p.note}</p>
    <TextLink href={mapHref(p)} external>{p.address?.value ?? p.hints?.address ?? p.mapLink?.address ?? 'Найти на карте'}</TextLink>
    {p.publicSpace
      ? <p className="ws-caption">Городское пространство; возможны ограничения. Прогулка без билета.</p>
      : <SourceFacts facts={[{ label: 'Часы', fact: p.hours, unknown: p.hints?.hours ?? 'Уточнить перед визитом' }, { label: 'Стоимость', fact: p.price, unknown: p.hints?.price ?? 'Нет подтверждённой цены' }]} linkedFacts={p.address ? [{ label: 'Адрес', fact: p.address }] : []} />}
  </>
}

function ItemDetails({ item, date, place, event, activity, idea, film }: { item: PlanItem; date: string; place: Map<string, Place>; event: Map<string, Event>; activity: Map<string, Activity>; idea: Map<string, DayIdea>; film: Map<string, Film> }): ReactNode {
  const unavailable = <p role="status">Этот пункт больше недоступен</p>
  switch (item.kind) {
    case 'place': {
      const p = place.get(item.placeId)
      return p ? <><PlaceFacts p={p} /><p className="ws-caption">Около {formatMinutes(p.durationMinutes)} на месте</p></> : unavailable
    }
    case 'event': {
      const e = event.get(item.eventId)
      if (!e) return unavailable
      const where = e.placeId ? place.get(e.placeId)?.title : e.address
      const past = (e.dateEnd ?? e.dateStart) < date, later = e.dateStart > date
      return <div className={past || later ? 'ws-plan-muted' : undefined}>
        {past && <p role="status">Событие прошло</p>}{later && <p role="status">Не совпадает с датой дня</p>}
        <p>{eventDates(e.dateStart, e.dateEnd)}{e.time ? `, ${e.time}` : ''}{where ? ` · ${where}` : ''}</p>
        {e.price && <p>{e.price}</p>}
        <TextLink href={e.source} external>Источник</TextLink>
      </div>
    }
    case 'activity': {
      const a = activity.get(item.activityId)
      if (!a) return unavailable
      const chosen = item.filmId ? film.get(item.filmId) : undefined
      return <>
        {a.needs.length > 0 && <p>Понадобится: {a.needs.join(', ')}</p>}
        <p className="ws-caption">Около {formatMinutes(a.durationMinutes)}</p>
        {item.filmGenre && <p>Жанр: {GENRES[item.filmGenre]}{chosen ? ` · ${chosen.title} (${chosen.year})` : ''}</p>}
        {a.detail.type === 'places' && <ul className="ws-plan-places">{a.detail.placeIds.map(id => { const p = place.get(id); return p ? <li key={id}>{p.title} · <TextLink href={mapHref(p)} external>{p.address?.value ?? 'на карте'}</TextLink></li> : null })}</ul>}
        {idea.has(item.ideaId) && <TextLink href={viewHref('day-ideas', { idea: item.ideaId })}>Открыть идею</TextLink>}
      </>
    }
    case 'custom':
      return <>{item.address && <p>{item.address}</p>}<p className="ws-caption">Около {formatMinutes(item.durationMinutes)}</p></>
  }
}

function WishBlock({ value, onChange, onSubmit, onExample, wrote, fallback }: { value: string; onChange: (v: string) => void; onSubmit: (v: string) => void; onExample: (v: string) => void; wrote?: string; fallback: boolean }) {
  return <section className="ws-plan-wish" aria-label="Подбор по пожеланию">
    <WishInput value={value} onChange={onChange} onSubmit={onSubmit} />
    <p className="ws-caption">Подбор работает по словам и темам.</p>
    <div className="ws-plan-examples">{WISH_EXAMPLES.map(text => <Button key={text} variant="secondary" onClick={() => { onChange(text); onExample(text) }}>{text}</Button>)}</div>
    {wrote && <p>Вы написали «{wrote}»</p>}
    {wrote && fallback && <p className="ws-caption">Не нашли точных слов — показали общий вариант.</p>}
  </section>
}

function Refine({ plan, now, save, onTwoToOne }: { plan: Plan; now: Date; save: (p: Plan) => void; onTwoToOne: () => void }) {
  return <details className="ws-plan-refine"><summary>Уточнить</summary>
    <div className="ws-plan-refine-fields">
      <label className="ws-field"><span>Район начала</span><select value={plan.area} onChange={e => save(setArea(plan, e.target.value))}>{AREAS.map(a => <option key={a}>{a}</option>)}</select></label>
      <Field label="Первый день" type="date" value={plan.days[0].date} min={toIsoDate(now)} onChange={e => { if (e.target.value && e.target.value >= toIsoDate(now)) save(setFirstDate(plan, e.target.value)) }} />
      <Segmented label="Сколько дней" value={String(plan.days.length)} options={[{ value: '1', label: 'Один день' }, { value: '2', label: 'Два дня' }]}
        onChange={value => { const result = setDayCount(plan, value === '2' ? 2 : 1); if (result.status === 'ok') save(result.plan); else onTwoToOne() }} />
    </div>
  </details>
}

function DaysDialog({ open, plan, save, close }: { open: boolean; plan: Plan; save: (p: Plan) => void; close: () => void }) {
  const room = plan.days.length === 2 && plan.days[0].items.length + plan.days[1].items.length <= 6
  return <Dialog open={open} title="Во втором дне есть пункты" confirmLabel="Удалить пункты" destructive onDismiss={close}
    onConfirm={() => { const r = setDayCount(plan, 1, 'delete'); if (r.status === 'ok') save(r.plan); close() }}>
    <p>{room ? 'Пункты можно перенести в первый день.' : 'В первом дне не хватает места.'}</p>
    <Button variant="secondary" disabled={!room} onClick={() => { const r = setDayCount(plan, 1, 'move'); if (r.status === 'ok') save(r.plan); close() }}>Перенести в первый день</Button>
  </Dialog>
}

function ReplaceDialog({ uid, plan, places, save, close, focusLater }: { uid?: string; plan: Plan; places: Place[]; save: (p: Plan) => void; close: () => void; focusLater: (selector: string) => void }) {
  const [query, setQuery] = useState('')
  const inPlan = new Set(plan.days.flatMap(d => d.items).flatMap(i => i.kind === 'place' ? [i.placeId] : []))
  const q = query.trim().toLocaleLowerCase('ru-RU')
  const options = places.filter(p => !inPlan.has(p.id) && (!q || `${p.title} ${p.area} ${p.kind} ${p.address?.value ?? ''}`.toLocaleLowerCase('ru-RU').includes(q))).slice(0, 30)
  return <Dialog open={Boolean(uid)} title="Другое место" confirmLabel="Готово" onDismiss={() => { setQuery(''); close() }} onConfirm={() => { setQuery(''); close() }}>
    <Field label="Найти место" value={query} onChange={e => setQuery(e.target.value)} />
    {options.length === 0 ? <p>Мест по этому запросу нет</p> : <ul className="ws-plan-replace">{options.map(p => <li key={p.id}>
      <Button variant="item" onClick={() => { if (uid) { focusLater(`[data-uid="${uid}"] h3`); const next = replacePlace(plan, uid, p.id); if (next) save(next) } setQuery(''); close() }}>{p.title} · {p.area}</Button>
    </li>)}</ul>}
  </Dialog>
}

function AddCustom({ plan, dayIndex, save, notify }: { plan: Plan; dayIndex: number; save: (p: Plan) => void; notify: ReturnType<typeof useNotice>['notify'] }) {
  const [title, setTitle] = useState(''), [address, setAddress] = useState(''), [minutes, setMinutes] = useState(60), [touched, setTouched] = useState(false)
  const day: PlanDay = plan.days[dayIndex]
  const submit = () => {
    setTouched(true)
    if (!title.trim()) return
    const result = addItems(plan, dayIndex, [{ kind: 'custom', title: title.trim().slice(0, 60), ...(address.trim() ? { address: address.trim().slice(0, 100) } : {}), durationMinutes: Math.min(480, Math.max(15, minutes || 60)) }])
    if (result.status === 'limit') { notify(`${capitalize(inDay(day.date))} не хватает места: в дне не больше 6 пунктов`, { error: true }); return }
    if (result.status !== 'added') return
    save(result.plan)
    setTitle(''); setAddress(''); setTouched(false)
    notify(`Добавлено ${toDay(day.date)}`, { undo: () => save(removeItemsSafe(result.plan, result.addedUids)) })
  }
  return <form className="ws-plan-custom" onSubmit={e => { e.preventDefault(); submit() }}>
    <h2>+ Свой пункт</h2>
    <Field label="Название" value={title} maxLength={60} placeholder="Куда хотите зайти?" onChange={e => setTitle(e.target.value)} error={touched && !title.trim() ? 'Напишите название' : undefined} />
    <Field label="Адрес" value={address} maxLength={100} placeholder="Улица и дом" onChange={e => setAddress(e.target.value)} />
    <Field label="Минут на месте" type="number" min={15} max={480} step={5} value={minutes} onChange={e => setMinutes(Number(e.target.value))} />
    <Button type="submit">Добавить +</Button>
  </form>
}
