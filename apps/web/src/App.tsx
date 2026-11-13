import { useEffect, useMemo, useState } from 'react'
import { places, routeIdeas, type Place, type RouteIdea } from './data'
import { getIdeaPlaces, makeDraft, rankIdeas } from './planner'
import { getVisit, placeMapUrl } from './visit'
import { TowerBackground } from './TowerBackground'

type View = 'home' | 'plan' | 'catalog'
type Day = { id: number; stops: Place[] }

function nextSaturday() {
  const date = new Date()
  date.setDate(date.getDate() + (6 - date.getDay() + 7) % 7)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value: string, offset = 0) {
  if (!value) return 'Дата не выбрана'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date(year, month - 1, day + offset))
}

function placeWord(count: number) {
  const last = count % 10
  const teens = count % 100
  if (last === 1 && teens !== 11) return 'место'
  if (last >= 2 && last <= 4 && (teens < 12 || teens > 14)) return 'места'
  return 'мест'
}

function PlaceDetails({ place }: { place: Place }) {
  const visit = getVisit(place)
  return <div className="visit-details">
    <p className="visit-description">{place.note}</p>
    <a className="visit-map-link" href={placeMapUrl(place, visit.address)} target="_blank" rel="noopener noreferrer">
      {visit.address ?? 'Найти на карте'} <span aria-hidden="true">↗</span>
    </a>
    <dl className="visit-facts">
      <div><dt>Часы</dt><dd>{visit.hours ?? 'Уточнить перед визитом'}</dd></div>
      <div><dt>Стоимость</dt><dd>{visit.price ?? 'Нет подтверждённой цены'}</dd></div>
    </dl>
    {visit.source && <div className="visit-source">
      <a href={visit.source} target="_blank" rel="noopener noreferrer">Источник ↗</a>
      {visit.secondarySource && <a href={visit.secondarySource} target="_blank" rel="noopener noreferrer">Подробнее ↗</a>}
      {visit.checkedAt && <span>Проверено {visit.checkedAt.split('-').reverse().join('.')}</span>}
    </div>}
  </div>
}

function App() {
  const [view, setView] = useState<View>('home')
  const [daysCount, setDaysCount] = useState<1 | 2>(1)
  const [date, setDate] = useState(nextSaturday)
  const [area, setArea] = useState('Тверской')
  const [start, setStart] = useState('11:00')
  const [end, setEnd] = useState('19:00')
  const [interests, setInterests] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [request, setRequest] = useState('')
  const [chosenIdea, setChosenIdea] = useState<RouteIdea | null>(null)
  const [days, setDays] = useState<Day[]>([{ id: 1, stops: [] }])
  const [activeDay, setActiveDay] = useState(1)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [customDuration, setCustomDuration] = useState(60)
  const [replaceId, setReplaceId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [catalogTab, setCatalogTab] = useState<'routes' | 'places'>('routes')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [catalogTheme, setCatalogTheme] = useState('Все')

  const activeStops = days.find(day => day.id === activeDay)?.stops ?? []
  const stopCount = days.slice(0, daysCount).reduce((total, day) => total + day.stops.length, 0)
  const themes = ['Все', ...new Set(routeIdeas.map(idea => idea.theme))]
  const visibleIdeas = useMemo(() => routeIdeas.filter(idea => {
    const query = catalogQuery.trim().toLocaleLowerCase('ru-RU')
    const haystack = `${idea.title} ${idea.subtitle} ${idea.theme} ${idea.area} ${getIdeaPlaces(idea).map(place => place.title).join(' ')}`.toLocaleLowerCase('ru-RU')
    return (catalogTheme === 'Все' || idea.theme === catalogTheme) && (!query || haystack.includes(query))
  }), [catalogQuery, catalogTheme])
  const visiblePlaces = useMemo(() => places.filter(place => {
    const query = catalogQuery.trim().toLocaleLowerCase('ru-RU')
    return !query || `${place.title} ${getVisit(place).address ?? ''} ${place.area} ${place.kind} ${place.tags.join(' ')}`.toLocaleLowerCase('ru-RU').includes(query)
  }), [catalogQuery])

  useEffect(() => { window.scrollTo(0, 0) }, [view])

  function openCatalog(tab: 'routes' | 'places') {
    setCatalogTab(tab)
    setCatalogQuery('')
    setCatalogTheme('Все')
    setView('catalog')
  }

  function toggleInterest(value: string) {
    setInterests(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])
  }

  function changeDays(count: 1 | 2) {
    setDaysCount(count)
    if (count === 2) setDays(current => current.length === 1 ? [...current, { id: 2, stops: [] }] : current)
    if (count === 1) setActiveDay(1)
  }

  function openDraft(idea: RouteIdea, count: 1 | 2 = daysCount, query = request) {
    if (!date || !start || !end || start >= end) {
      setNotice('Проверьте дату и время: начало дня должно быть раньше окончания.')
      setView('plan')
      return
    }
    if (stopCount > 0 && !window.confirm('Заменить текущий план этой подборкой?')) return
    const drafted = makeDraft(idea, count, query, interests, area)
    setDays(drafted.map((stops, index) => ({ id: index + 1, stops })))
    setDaysCount(count)
    setChosenIdea(idea)
    setRequest(query)
    setActiveDay(1)
    setSelectedStopId(drafted[0][0]?.id ?? null)
    setNotice(query ? 'Подборка собрана по вашим пожеланиям.' : 'Подборка добавлена в план.')
    setView('plan')
  }

  function submitRequest() {
    const text = message.trim()
    if (!text) return
    openDraft(rankIdeas(text, interests, area)[0], daysCount, text)
  }

  function updateDays(mutator: (current: Day[]) => Day[]) {
    setDays(current => mutator(current.map(day => ({ ...day, stops: [...day.stops] }))))
    setNotice('План обновлён.')
  }

  function moveStop(dayId: number, index: number, direction: -1 | 1) {
    updateDays(current => current.map(day => {
      if (day.id !== dayId) return day
      const target = index + direction
      if (target < 0 || target >= day.stops.length) return day
      ;[day.stops[index], day.stops[target]] = [day.stops[target], day.stops[index]]
      return day
    }))
  }

  function removeStop(dayId: number, id: string) {
    updateDays(current => current.map(day => day.id === dayId ? { ...day, stops: day.stops.filter(stop => stop.id !== id) } : day))
    if (selectedStopId === id) setSelectedStopId(null)
  }

  function transferStop(dayId: number, id: string) {
    updateDays(current => {
      const from = current.find(day => day.id === dayId)
      const to = current.find(day => day.id !== dayId)
      const stop = from?.stops.find(item => item.id === id)
      if (from && to && stop) {
        from.stops = from.stops.filter(item => item.id !== id)
        to.stops.push(stop)
      }
      return current
    })
    setSelectedStopId(null)
  }

  function replaceStop(dayId: number, oldId: string, newId: string) {
    const replacement = places.find(place => place.id === newId)
    if (!replacement) return
    updateDays(current => current.map(day => day.id === dayId ? { ...day, stops: day.stops.map(stop => stop.id === oldId ? replacement : stop) } : { ...day, stops: day.stops.filter(stop => stop.id !== newId) }))
    setSelectedStopId(replacement.id)
    setReplaceId(null)
  }

  function addStop(place: Place, openPlan = false) {
    const existingDay = days.slice(0, daysCount).find(day => day.stops.some(stop => stop.id === place.id))
    if (existingDay) {
      setNotice('Эта точка уже есть в черновике.')
      if (openPlan) {
        setActiveDay(existingDay.id)
        setSelectedStopId(place.id)
        setView('plan')
      }
      return
    }
    updateDays(current => current.map(day => day.id === activeDay ? { ...day, stops: [...day.stops, place] } : { ...day, stops: day.stops.filter(stop => stop.id !== place.id) }))
    setSelectedStopId(place.id)
    setNotice('Место добавлено в план.')
    if (openPlan) setView('plan')
  }

  function addCustomStop() {
    const title = customTitle.trim()
    if (!title) return
    addStop({ id: crypto.randomUUID(), title, kind: 'Своя точка', area: 'Москва', address: customAddress.trim() || undefined, duration: Math.max(15, Math.min(customDuration || 60, 480)), note: 'Место добавлено вручную', tags: [], x: NaN, y: NaN })
    setCustomTitle('')
    setCustomAddress('')
  }

  return <div className={view === 'home' ? 'site-shell tower-page' : 'site-shell tower-page tower-inner'}>
    <TowerBackground />
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => setView('home')} aria-label="Weekend Search — главная"><span className="brand-mark">✳</span><span>weekend<span className="brand-light"> search</span></span></a>
      <nav className="topnav" aria-label="Основная навигация">
        <button aria-pressed={view === 'catalog' && catalogTab === 'routes'} onClick={() => openCatalog('routes')}>Идеи</button>
        <button aria-pressed={view === 'catalog' && catalogTab === 'places'} onClick={() => openCatalog('places')}>Места</button>
        <button aria-pressed={view === 'plan'} onClick={() => setView('plan')}>Мой план</button>
      </nav>
      <span className="header-note">МОСКВА / WEEKEND GUIDE</span>
    </header>

    <main id="top">
      {view === 'home' && <div className="home-layout">
        <section className="weekend-poster" aria-labelledby="hero-title">
          <div className="poster-copy">
            <p className="poster-label">МОСКВА</p>
            <h1 id="hero-title"><span className="poster-title-first">Выходные</span><br /><span className="poster-title-second">в Москве</span></h1>
            <p className="poster-description">Парки, кино, выставки и кафе. Найдите место и добавьте его в план.</p>
            <div className="poster-actions">
              <button className="poster-button" onClick={() => openCatalog('routes')}>Смотреть идеи <span aria-hidden="true">↗</span></button>
              <button className="poster-button secondary" onClick={() => openCatalog('places')}>Найти место <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </section>
        <section className="weekend-picks" aria-labelledby="picks-title">
          <div className="picks-heading">
            <div><p className="poster-label">01 / ПОДБОРКИ</p><h2 id="picks-title">Идеи на выходные</h2></div>
            <button className="poster-button secondary" onClick={() => openCatalog('routes')}>Все идеи ({routeIdeas.length}) <span aria-hidden="true">↗</span></button>
          </div>
          <div className="picks-grid">
            {routeIdeas.slice(0, 6).map((idea, index) => (
              <button className="pick-card" key={idea.id} onClick={() => openDraft(idea, idea.days, '')}>
                <span className="pick-meta">0{index + 1} / {idea.theme}</span>
                <strong>{idea.title}</strong>
                <span className="pick-description">{idea.subtitle}</span>
                <span className="pick-action">Открыть идею <span aria-hidden="true">↗</span></span>
              </button>
            ))}
          </div>
        </section>
      </div>}

      {view === 'plan' && <div className="content-layout route-page"><section className="page-intro"><span className="section-kicker">02 / ТВОЙ МАРШРУТ</span><h1>{chosenIdea?.title ?? 'Мой план'}<span className="title-star">✳</span></h1><p>{chosenIdea?.subtitle ?? 'Добавляй места из каталога или записывай свои.'}</p>{request && <div className="request-quote"><span>ТЫ НАПИСАЛ</span><p>«{request}»</p></div>}</section>
        <details className="plan-settings">
          <summary>Настройки и подбор по пожеланию</summary>
        <section className="planner-panel" aria-labelledby="planner-title"><div className="panel-heading"><div><span className="section-kicker">01 / РАССКАЖИ О СЕБЕ</span><h2 id="planner-title">Каким будет твой день?</h2><p>Пара слов или несколько настроек — начни как удобно.</p></div><span className="sun-icon" aria-hidden="true">✳</span></div>
          <label className="field-label" htmlFor="wish-input">Что хочется?</label><div className="prompt-box"><textarea id="wish-input" value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submitRequest() }} placeholder="Например: хочу старые дворы, выставку и кофе без спешки…" rows={3} /><button type="button" onClick={submitRequest} disabled={!message.trim()} aria-label="Подобрать черновик по пожеланию">↗</button></div><p className="input-hint">Подбор работает по темам и словам. Живой помощник будет подключён позже.</p><div className="divider"><span>уточни детали</span></div>
          <div className="form-grid"><label className="field"><span>Район начала</span><select value={area} onChange={event => setArea(event.target.value)}>{['Тверской', 'Пресненский', 'Арбат', 'Хамовники', 'Басманный', 'Мещанский', 'Якиманка', 'Останкинский', 'Бутырский'].map(item => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Первый день</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label></div>
          <div className="field-row"><span className="field-label">Сколько дней</span><div className="segmented" role="group" aria-label="Количество дней"><button className={daysCount === 1 ? 'selected' : ''} onClick={() => changeDays(1)}>Один день</button><button className={daysCount === 2 ? 'selected' : ''} onClick={() => changeDays(2)}>Два дня</button></div></div>
          <div className="form-grid time-grid"><label className="field"><span>Начало</span><input type="time" value={start} onChange={event => setStart(event.target.value)} /></label><label className="field"><span>Окончание</span><input type="time" value={end} onChange={event => setEnd(event.target.value)} /></label></div>
          <div className="field-row interest-row"><span className="field-label">Интересно</span><div className="chips">{['Искусство', 'Прогулки', 'Еда', 'Архитектура', 'Парки', 'История', 'Виды', 'Дизайн', 'Кино', 'Спорт', 'Животные', 'Йога'].map(item => <button key={item} className={interests.includes(item) ? 'chip selected' : 'chip'} onClick={() => toggleInterest(item)} aria-pressed={interests.includes(item)}>{item}</button>)}</div></div>
          {notice && <p className="form-notice" role="status">{notice}</p>}<button className="wide-button" onClick={() => openDraft(rankIdeas(message, interests, area)[0], daysCount, message.trim())}>Подобрать идеи <span>→</span></button><p className="panel-footnote">Места в плане можно менять и переставлять.</p>
        </section>
        </details>
        <div className="status-banner" role="status"><span className="status-icon">i</span><div><strong>Черновик, ещё не готовый маршрут</strong><p>Проверьте часы и стоимость на дату визита. Адреса открываются в Яндекс Картах.</p></div></div>{notice && <p className="notice" role="status">{notice}</p>}
        <div className="plan-summary"><span>{daysCount} {daysCount === 1 ? 'день' : 'дня'} · {stopCount} {placeWord(stopCount)}</span><button onClick={() => openCatalog('places')}>Выбрать места ↗</button></div>
        {daysCount === 2 && <div className="day-switch" role="group" aria-label="Выбор дня">{days.slice(0, 2).map(day => <button key={day.id} className={activeDay === day.id ? 'active' : ''} onClick={() => { setActiveDay(day.id); setSelectedStopId(day.stops[0]?.id ?? null) }}>День {day.id} · {formatDate(date, day.id - 1)}</button>)}</div>}
        <div className="days-list"><section className="day-card" aria-labelledby="day-heading"><div className="day-heading"><span className="day-number">0{activeDay}</span><div><span className="section-kicker">ДЕНЬ {activeDay}</span><h2 id="day-heading">{formatDate(date, activeDay - 1)}</h2><p>{start}–{end} · старт в районе {area}</p></div></div>
          {activeStops.length === 0 ? <p className="empty-day">Здесь пока нет мест. Добавь точку из каталога или перенеси её из другого дня.</p> : <ol className="stop-list">{activeStops.map((stop, index) => <li className={`stop ${selectedStopId === stop.id ? 'selected' : ''}`} key={stop.id}><span className="stop-index">{String(index + 1).padStart(2, '0')}</span><div className="stop-body"><div className="stop-tags"><span>{stop.kind}</span><span>·</span><span>{stop.area}</span></div><h3>{stop.title}</h3><PlaceDetails place={stop} /><span className="duration">Около {stop.duration} мин на месте</span><div className="stop-actions"><button onClick={() => moveStop(activeDay, index, -1)} disabled={index === 0} aria-label={`Поднять ${stop.title}`}>↑ Вверх</button><button onClick={() => moveStop(activeDay, index, 1)} disabled={index === activeStops.length - 1} aria-label={`Опустить ${stop.title}`}>↓ Вниз</button><button onClick={() => setReplaceId(replaceId === stop.id ? null : stop.id)}>Заменить</button>{daysCount === 2 && <button onClick={() => transferStop(activeDay, stop.id)}>В другой день</button>}<button onClick={() => removeStop(activeDay, stop.id)} className="remove-button">Убрать</button></div>{replaceId === stop.id && <label className="replace-picker">Другое место<select defaultValue="" onChange={event => replaceStop(activeDay, stop.id, event.target.value)}><option value="" disabled>Выберите место</option>{places.filter(place => !days.slice(0, daysCount).some(day => day.stops.some(item => item.id === place.id))).map(place => <option key={place.id} value={place.id}>{place.title} · {place.area}</option>)}</select></label>}</div></li>)}</ol>}</section>
          <section className="add-card"><div><span className="section-kicker">ДОПОЛНИ МАРШРУТ</span><h2>Добавь своё место</h2><p>Укажите название и, если знаете, адрес.</p></div><div className="add-form"><label><span>Название</span><input value={customTitle} onChange={event => setCustomTitle(event.target.value)} placeholder="Куда хочешь зайти?" onKeyDown={event => { if (event.key === 'Enter') addCustomStop() }} /></label><label><span>Адрес</span><input value={customAddress} onChange={event => setCustomAddress(event.target.value)} placeholder="Улица и дом" /></label><label><span>Минут на месте</span><input type="number" min="15" max="480" step="5" value={customDuration} onChange={event => setCustomDuration(Number(event.target.value))} /></label><button onClick={addCustomStop} disabled={!customTitle.trim()}>Добавить +</button></div><button className="catalog-link" onClick={() => { openCatalog('places') }}>Или выбери из {places.length} мест →</button></section>
        </div>
      </div>}

      {view === 'catalog' && <div className="content-layout catalog-page"><section className="page-intro"><span className="section-kicker">03 / ИДЕИ И МЕСТА</span><h1>{catalogTab === 'routes' ? 'Идеи на выходные' : 'Места Москвы'}<span className="title-star">✳</span></h1><p>{catalogTab === 'routes' ? 'Готовые подборки, которые можно взять за основу.' : 'Выбирай места и добавляй их в свой план.'}</p></section><div className="catalog-tools"><div className="catalog-tabs" role="group" aria-label="Раздел каталога"><button className={catalogTab === 'routes' ? 'active' : ''} onClick={() => setCatalogTab('routes')}>Идеи <span>{routeIdeas.length}</span></button><button className={catalogTab === 'places' ? 'active' : ''} onClick={() => setCatalogTab('places')}>Места <span>{places.length}</span></button></div><label className="catalog-search"><span className="visually-hidden">Поиск по каталогу</span><input value={catalogQuery} onChange={event => setCatalogQuery(event.target.value)} placeholder="Поиск: музей, парк, Арбат…" /></label></div>
        <div className="idea-actions">{(catalogQuery || catalogTheme !== 'Все') && <button className="text-button" onClick={() => { setCatalogQuery(''); setCatalogTheme('Все') }}>Сбросить поиск и фильтры ×</button>}</div>
        {catalogTab === 'routes' ? <><div className="catalog-filters" role="group" aria-label="Тема идеи">{themes.map(theme => <button key={theme} className={catalogTheme === theme ? 'active' : ''} onClick={() => setCatalogTheme(theme)}>{theme}</button>)}</div>{visibleIdeas.length ? <div className="catalog-grid">{visibleIdeas.map(idea => <article className="catalog-card" key={idea.id}><div className="catalog-card-body"><div className="catalog-meta"><span>{idea.theme}</span><span>{idea.days === 1 ? '1 день' : '2 дня'}</span></div><h2>{idea.title}</h2><p>{idea.subtitle}</p><div className="catalog-place-list">{getIdeaPlaces(idea).slice(0, 4).map(place => place.title).join(' · ')}</div><div className="catalog-bottom"><span>{idea.area} · {idea.places.length} {placeWord(idea.places.length)}</span><button onClick={() => openDraft(idea, idea.days, '')} aria-label={`Взять за основу: ${idea.title}`}>Взять за основу ↗</button></div></div></article>)}</div> : <p className="catalog-empty">По этому запросу нет идей. Попробуй другое слово или открой вкладку «Места».</p>}</> : visiblePlaces.length ? <div className="places-grid">{visiblePlaces.map((place, index) => <article className="place-card" key={place.id}><span className="place-number">{String(index + 1).padStart(2, '0')}</span><div><span className="section-kicker">{place.kind} · {place.area}</span><h2>{place.title}</h2><PlaceDetails place={place} /></div><button onClick={() => addStop(place, true)} aria-label={`Добавить ${place.title} в план`}>В план +</button></article>)}</div> : <p className="catalog-empty">Мест по этому запросу нет. Попробуй другое название или район.</p>}
      </div>}
    </main>
    <footer><span className="footer-brand">weekend search ✳</span><span>Каталог мест и план на выходные</span></footer>
  </div>
}

export default App

