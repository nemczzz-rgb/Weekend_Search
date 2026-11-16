import { useCallback, useEffect, useRef, useState, type DependencyList, type ReactNode } from 'react'
import { getContentSource, type ContentSource } from '../../content/load.ts'
import { GENRES, type Activity, type DayIdea, type Film, type GenreId } from '../../content/types.ts'
import { addItems, createPlan, isPlanEmpty, presence, removeItems, setFilm, type PlanStore } from '../../plan/store.ts'
import { fromIsoDate } from '../../plan/dates.ts'
import { prepLine } from '../../plan/today.ts'
import { AddToDay, Banner, Button, EmptyState, Eyebrow, FilmChoice, FilterChip, IdeaCard, IdeaSummary, LoadError, PageHeading, PlaceCard, RecipeBlocks, Segmented, Skeleton, StatusBadge, TextLink, Toast, type AddToDayState } from '../../ui/components.tsx'
import { activeMinutes } from '../../plan/today.ts'
import { AUDIENCES, MODES, TIMES, audienceText, availability, filmsForGenre, formatMinutes, ideaActivities, ideaItems, imageProps, matchesIdea, needsOf, readFilters } from './model.ts'
import { loadCatalog, loadIdea, type IdeaData } from './load.ts'
import { makeHref, useIdeaNavigation } from './navigation.ts'
import './screens.css'
const GENRE_IDS = Object.keys(GENRES) as GenreId[]

function useResource<T>(loader: () => Promise<T>, dependencies: DependencyList) {
  const [state, setState] = useState<{ data?: T; error?: boolean }>({}), [retry, setRetry] = useState(0)
  useEffect(() => { let active = true; setState({}); Promise.resolve().then(loader).then(data => { if (active) setState({ data }) }, () => { if (active) setState({ error: true }) }); return () => { active = false } }, [...dependencies, retry])
  return { ...state, retry: () => setRetry(x => x + 1) }
}
function usePlan(store: PlanStore) { const [state, update] = useState(() => ({ plan: store.get(), storageAvailable: store.storageAvailable })); useEffect(() => store.subscribe(plan => update({ plan, storageAvailable: store.storageAvailable })), [store]); return state }
const dateText = (date: string) => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromIsoDate(date))
const toDay = (date: string) => dateText(date).replace(/^суббота/, 'субботу').replace(/^среда/, 'среду').replace(/^пятница/, 'пятницу')
const nowDefault = () => new Date()
type Notice = { id: number; message: ReactNode; error?: boolean; undo?: () => void }
function Feedback({ notice, dismiss }: { notice: Notice; dismiss: () => void }) {
  const remaining = useRef(8000), started = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), hovering = useRef(false), focused = useRef(false)
  const pause = useCallback(() => { if (timer.current) { clearTimeout(timer.current); timer.current = undefined; remaining.current -= Date.now() - started.current } }, [])
  const resume = useCallback(() => { if (!hovering.current && !focused.current && !timer.current) { started.current = Date.now(); timer.current = setTimeout(dismiss, Math.max(0, remaining.current)) } }, [dismiss])
  useEffect(() => { remaining.current = 8000; resume(); return pause }, [notice.id, pause, resume])
  return <div className="ws-idea-feedback" onMouseEnter={() => { hovering.current = true; pause() }} onMouseLeave={() => { hovering.current = false; resume() }} onFocus={() => { focused.current = true; pause() }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { focused.current = false; resume() } }}><Toast error={notice.error} onUndo={notice.undo}>{notice.message}</Toast></div>
}

export function DayIdeasScreen({ store, source = getContentSource(), now = nowDefault }: { store: PlanStore; source?: ContentSource; now?: () => Date }) {
  const { route, replace, open } = useIdeaNavigation(), id = route.query.get('idea'), main = useRef<HTMLElement>(null)
  const [notice, setNotice] = useState<Notice>(), dismiss = useCallback(() => setNotice(undefined), [])
  const notify = (message: ReactNode, options: Pick<Notice, 'error' | 'undo'> = {}) => setNotice({ id: Date.now(), message, ...options })
  const loaded = useCallback(() => { const expected = location.search; void document.fonts.ready.then(() => requestAnimationFrame(() => { if (location.search !== expected) return; const heading = main.current?.querySelector('h1'); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) } scrollTo(0, route.action === 'back' ? Number(history.state?.scrollY ?? 0) : 0) })) }, [id, route.serial])
  return <main id="main" ref={main} className="ws-ideas-screen">
    {id ? <IdeaDetail key={id} id={id} source={source} store={store} now={now()} query={route.query} replace={replace} notify={notify} onLoaded={loaded} /> : <IdeaCatalog source={source} now={now()} query={route.query} replace={replace} open={open} onLoaded={loaded} />}
    {notice && <Feedback key={notice.id} notice={notice} dismiss={dismiss} />}
  </main>
}
function IdeaCatalog({ source, now, query, replace, open, onLoaded }: { source: ContentSource; now: Date; query: URLSearchParams; replace: (patch: Record<string, string | undefined>) => void; open: (href: string) => void; onLoaded: () => void }) {
  const resource = useResource(() => loadCatalog(source), [source]), filters = readFilters(query)
  useEffect(() => { if (resource.data || resource.error) onLoaded() }, [resource.data, resource.error, onLoaded])
  const changed = filters.mode !== 'all' || Boolean(filters.audience.length || filters.time), reset = () => replace({ mode: undefined, for: undefined, time: undefined })
  const visible = resource.data?.ideas.filter(idea => matchesIdea(idea, resource.data!.activities, filters)) ?? []
  return <><PageHeading eyebrow="Чем заняться" description="Два-три занятия, которые можно совместить за день.">Идеи для дня</PageHeading>
    <div className="ws-idea-filters"><Segmented label="Где провести день" options={MODES} value={filters.mode} onChange={value => replace({ mode: value === 'all' ? undefined : value })} />
      <fieldset><legend>Для кого</legend>{AUDIENCES.map(a => <FilterChip key={a.value} selected={filters.audience.includes(a.value)} onClick={() => replace({ for: (filters.audience.includes(a.value) ? filters.audience.filter(x => x !== a.value) : [...filters.audience, a.value]).join(',') || undefined })}>{a.label}</FilterChip>)}</fieldset>
      <fieldset><legend>Время</legend>{TIMES.map(t => <FilterChip key={t.value} selected={filters.time === t.value} onClick={() => replace({ time: filters.time === t.value ? undefined : t.value })}>{t.label}</FilterChip>)}</fieldset>
    </div>
    {!resource.data ? resource.error ? <LoadError onRetry={resource.retry} /> : <div className="ws-idea-grid"><Skeleton /><Skeleton /><Skeleton /></div> : <>
      <div className="ws-idea-results"><p role="status">Найдено: {visible.length}</p>{changed && <Button variant="text" onClick={reset}>Сбросить ×</Button>}</div>
      {!resource.data.ideas.length ? <EmptyState title="Идей для дня пока нет" action={<TextLink href={makeHref({ view: 'routes' })}>Посмотрите маршруты по городу</TextLink>} /> : !visible.length ? <EmptyState title="Под такие условия идей нет" action={<Button variant="secondary" onClick={reset}>Сбросить фильтры</Button>} /> : <div className="ws-idea-grid" onClick={event => { const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a.ws-idea-card'); if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); open(link.href) } }}>{visible.map(idea => {
        const activities = ideaActivities(idea, resource.data!.activities), needs = needsOf(activities), audience = audienceText(activities)
        return <IdeaCard key={idea.id} href={makeHref({ view: 'day-ideas', idea: idea.id, genre: undefined })} eyebrow={[MODES.find(x => x.value === idea.mode)?.label, audience].filter(Boolean).join(' · ')} title={idea.title} summary={idea.summary} time={`Около ${formatMinutes(activeMinutes(activities))}`} needs={needs.slice(0, 3).join(', ') + (needs.length > 3 ? ` и ещё ${needs.length - 3}` : '')} availability={availability(activities, now)} image={imageProps(idea, import.meta.env.BASE_URL)} />
      })}</div>}
      {filters.mode === 'city' && <p><TextLink href={makeHref({ view: 'routes', idea: undefined })}>Ещё {resource.data.routeCount} маршрутов по городу</TextLink></p>}
    </>}
  </>
}

type DetailProps = { id: string; source: ContentSource; store: PlanStore; now: Date; query: URLSearchParams; replace: (patch: Record<string, string | undefined>) => void; notify: (message: ReactNode, options?: Pick<Notice, 'error' | 'undo'>) => void; onLoaded: () => void }
function IdeaDetail(props: DetailProps) {
  const { id, source, onLoaded } = props, resource = useResource(() => loadIdea(source, id), [source, id])
  useEffect(() => { if (resource.data || resource.error) onLoaded() }, [resource.data, resource.error, onLoaded])
  if (!resource.data) return <><PageHeading eyebrow="Идеи для дня">Идея для дня</PageHeading>{resource.error ? <LoadError onRetry={resource.retry} /> : <Skeleton />}</>
  if (!resource.data.idea) return <><PageHeading eyebrow="Идеи для дня">Такой идеи нет</PageHeading><TextLink href={makeHref({ view: 'day-ideas', idea: undefined, genre: undefined })}>Ко всем идеям для дня</TextLink></>
  return <LoadedIdea {...props} data={resource.data as IdeaData & { idea: DayIdea }} />
}
function LoadedIdea({ data, store, now, query, replace, source, notify }: DetailProps & { data: IdeaData & { idea: DayIdea } }) {
  const { idea, activities } = data, { plan, storageAvailable } = usePlan(store), [transientFilm, setTransientFilm] = useState<string>(), genreValue = query.get('genre'), genre = GENRE_IDS.includes(genreValue as GenreId) ? genreValue as GenreId : undefined
  const filmActivity = activities.find(a => a.detail.type === 'films'), savedFilm = plan?.days.flatMap(d => d.items).find(item => item.kind === 'activity' && item.activityId === filmActivity?.id)
  const selectedFilm = savedFilm?.kind === 'activity' ? savedFilm.filmId : transientFilm
  const items = ideaItems(idea, activities, { genre, filmId: selectedFilm }), current = presence(plan, items), status = availability(activities, now), needs = needsOf(activities), image = imageProps(idea, import.meta.env.BASE_URL)
  const changeFilm = (filmId?: string, chosenGenre = genre) => { setTransientFilm(filmId); if (savedFilm && plan) { const next = setFilm(plan, savedFilm.uid, chosenGenre, filmId); if (next) void store.set(next) } }
  const changeGenre = (next?: GenreId) => { replace({ genre: next }); setTransientFilm(undefined); if (savedFilm && plan) { const updated = setFilm(plan, savedFilm.uid, next, undefined); if (updated) void store.set(updated) } }
  const add = async (dayIndex: number) => {
    const before = store.get() ?? createPlan(now), result = addItems(before, dayIndex, items)
    if (result.status === 'limit') { const other = before.days.findIndex((day, i) => i !== dayIndex && 6 - day.items.length >= items.length - current.inPlan); notify(<span>В дне не больше 6 пунктов. Свободно: {result.free}.{other >= 0 && <Button variant="text" onClick={() => void add(other)}>Добавить: {dateText(before.days[other].date)}</Button>}</span>, { error: true }); return }
    if (result.status === 'already') { notify('Все занятия уже в плане'); return }
    const next = isPlanEmpty(before) ? { ...result.plan, sourceTitle: idea.title } : result.plan
    await store.set(next)
    notify(`Добавлено в ${toDay(next.days[dayIndex].date)}`, { undo: () => { const latest = store.get(); if (latest) void store.set(removeItems(latest, result.addedUids)); notify('Добавление отменено') } })
  }
  const dayButtons = plan?.days.map((day, index) => ({ id: day.date, label: `В ${toDay(day.date)}`, onAdd: () => void add(index) }))
  const addState: AddToDayState = current.inPlan === current.total && current.total > 0 ? { kind: 'added', dayLabel: current.dayIndexes.map(i => dateText(plan!.days[i].date)).join(' и '), planHref: makeHref({ view: 'plan', idea: undefined, genre: undefined, day: String((current.dayIndexes[0] ?? 0) + 1) }) } : current.inPlan > 0 ? { kind: 'partial', existing: current.inPlan, total: current.total, onAdd: () => void add(0), days: dayButtons && dayButtons.length > 1 ? dayButtons : undefined } : dayButtons && dayButtons.length > 1 ? { kind: 'days', days: dayButtons } : { kind: 'single', onAdd: () => void add(0) }
  const warnings = (plan ?? createPlan(now)).days.map(day => ({ day, preparation: prepLine(day.date, activities, now) })).filter(x => x.preparation?.missed)
  const action = <>{data.missingActivity ? <Banner tone="error" title="Пока нет данных">Не все занятия доступны. Добавление временно недоступно.</Banner> : <AddToDay state={addState} />}{warnings.map(({ day, preparation }) => <p className="ws-prep-warning" key={day.date}>◷ {dateText(day.date)}: если заготовки ещё нет, к этому дню она не успеет. Ближайший подходящий день — {dateText(preparation!.nearest)}.</p>)}</>
  const from = history.state?.from, backHref = typeof from?.href === 'string' ? from.href : makeHref({ view: 'day-ideas', idea: undefined, genre: undefined }), backLabel = ['Главная', 'Мой план', 'Идеи для дня'].includes(from?.label) ? from.label : 'Идеи для дня'
  return <><a className="ws-idea-back" href={backHref} onClick={event => { if (from?.href && !event.ctrlKey && !event.metaKey) { event.preventDefault(); history.back() } }}>← {backLabel}</a>
    <div className="ws-idea-detail-layout"><div>{image && <img className="ws-idea-hero" src={image.src} srcSet={image.srcSet} sizes="(max-width: 900px) 100vw, 66vw" alt={image.alt} width="1280" height="853" decoding="async" />}
      <PageHeading eyebrow={`Идея для дня · ${MODES.find(x => x.value === idea.mode)?.label}`} description={idea.summary}>{idea.title}</PageHeading>
      <p>{[audienceText(activities), `Около ${formatMinutes(activeMinutes(activities))}`].filter(Boolean).join(' · ')}</p>
      <div className="ws-idea-mobile-summary"><StatusBadge {...status} />{status.kind === 'lead' && <p>{status.reason}. {status.label}.</p>}{action}</div>
      <section className="ws-idea-needs"><h2>Что понадобится</h2><ul>{needs.map(need => <li key={need}>{need}</li>)}</ul></section>
      <div className="ws-idea-activities">{idea.activityIds.map((activityId, i) => { const activity = activities.find(a => a.id === activityId); return activity ? <ActivityBlock key={activity.id} activity={activity} index={i} data={data} source={source} genre={genre} changeGenre={changeGenre} selectedFilm={selectedFilm} changeFilm={changeFilm} /> : <Banner key={activityId} tone="error" title="Пока нет данных">Занятие недоступно</Banner> })}</div>
      <div className="ws-idea-mobile-summary ws-idea-bottom-add">{action}</div>
    </div><IdeaSummary><Eyebrow>Ваш день</Eyebrow><p>{audienceText(activities)}</p><p>Около {formatMinutes(activeMinutes(activities))}</p><StatusBadge {...status} />{status.kind === 'lead' && <p>{status.reason}. {status.label}.</p>}<h2>Что понадобится</h2><ul>{needs.slice(0, 5).map(need => <li key={need}>{need}</li>)}</ul>{needs.length > 5 && <p>И ещё {needs.length - 5} — полный список слева.</p>}{action}</IdeaSummary></div>
    {!storageAvailable && <Banner tone="error" title="Не получилось сохранить план">План останется только до закрытия страницы. Откройте план, чтобы сохранить его в файл.</Banner>}
  </>
}
function ActivityBlock({ activity, index, data, source, genre, changeGenre, selectedFilm, changeFilm }: { activity: Activity; index: number; data: IdeaData; source: ContentSource; genre?: GenreId; changeGenre: (genre?: GenreId) => void; selectedFilm?: string; changeFilm: (id?: string) => void }) {
  const detail = activity.detail, recipe = detail.type === 'recipe' ? data.recipes.find(r => r.id === detail.recipeId) : undefined
  return <section className="ws-idea-activity"><Eyebrow>{String(index + 1).padStart(2, '0')} · {activity.location === 'home' ? 'Дома' : 'В городе'}</Eyebrow><h2>{activity.title}</h2><p className="ws-caption">Около {formatMinutes(activity.durationMinutes)}</p>
    {detail.type === 'recipe' ? recipe ? <RecipeBlocks key={recipe.id} recipe={recipe} /> : <p>Пока нет данных</p> : detail.type === 'films' ? <FilmSelector source={source} genre={genre} changeGenre={changeGenre} selected={selectedFilm} onSelect={changeFilm} /> : detail.type === 'steps' ? <ol>{detail.steps.map((step, i) => <li key={i}>{step}</li>)}</ol> : <div className="ws-idea-places">{detail.placeIds.map(id => { const place = data.places.find(p => p.id === id); return place ? <PlaceCard key={id} kind={place.kind} area={place.area} title={place.title} description={place.note} address={place.address?.value} addressFact={place.address} mapHref={place.mapLink?.url ?? `https://yandex.ru/maps/?text=${encodeURIComponent(place.address?.value ?? place.title + ' Москва')}`} facts={place.publicSpace ? [] : [{ label: 'Часы', fact: place.hours, unknown: 'Уточните часы перед посещением.' }, { label: 'Стоимость', fact: place.price, unknown: 'Нет подтверждённой цены' }]} duration={formatMinutes(place.durationMinutes)} /> : <p key={id}>Пока нет данных</p> })}</div>}
  </section>
}
function FilmSelector({ source, genre, changeGenre, selected, onSelect }: { source: ContentSource; genre?: GenreId; changeGenre: (genre?: GenreId) => void; selected?: string; onSelect: (id?: string) => void }) {
  const resource = useResource(() => genre ? source.getCollection('films') : Promise.resolve<Film[]>([]), [source, genre]), [count, setCount] = useState(6)
  useEffect(() => setCount(6), [genre])
  const films = genre && resource.data ? filmsForGenre(resource.data, genre) : [], selectedFilm = resource.data?.find(f => f.id === selected)
  return <div><h3>Выберите жанр</h3><div className="ws-genre-chips">{GENRE_IDS.map(value => <FilterChip key={value} selected={genre === value} onClick={() => changeGenre(genre === value ? undefined : value)}>{GENRES[value]}</FilterChip>)}</div>
    {genre && (!resource.data ? resource.error ? <LoadError onRetry={resource.retry} /> : <Skeleton /> : films.length ? <><p><TextLink href="https://www.themoviedb.org" external>Постеры: TMDB</TextLink></p>{selectedFilm && !films.slice(0, count).some(f => f.id === selectedFilm.id) && <p role="status">Выбран: {selectedFilm.title} ({selectedFilm.year})</p>}<div className="ws-idea-film-grid">{films.slice(0, count).map(film => <div key={film.id}><FilmChoice film={film} selected={selected === film.id} posterSrc={film.poster ? import.meta.env.BASE_URL + film.poster.src : undefined} onSelect={() => onSelect(selected === film.id ? undefined : film.id)} /><details className="ws-film-dates"><summary>Даты проверки</summary><p>Фильм: {film.checkedAt}</p>{film.noteCheckedAt && <p>Описание: {film.noteCheckedAt}</p>}{film.poster && <p>Постер: {film.poster.checkedAt}</p>}</details></div>)}</div>{count < films.length && <Button variant="secondary" onClick={() => setCount(value => value + 6)}>Показать ещё ({films.length - count})</Button>}</> : <p>В этом жанре пока нет фильмов</p>)}
    <p className="ws-caption">Фильм можно не выбирать. Где смотреть — решаете вы.</p><details className="ws-film-credits"><summary>Источники и атрибуция</summary><a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer"><img src="https://files.readme.io/29c6fee-blue_short.svg" onError={event => { event.currentTarget.style.display = 'none' }} alt="The Movie Database (TMDB)" width="137" height="18" loading="lazy" /></a><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p>Постеры получены с публичных страниц TMDB, без API-ключа. Права на изображения принадлежат их правообладателям.</p></details>
  </div>
}
