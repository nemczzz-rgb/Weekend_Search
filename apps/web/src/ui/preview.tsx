import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { TowerBackground } from '../TowerBackground'
import { places, placeRecordById } from '../data'
import { getVisit, placeMapUrl } from '../visit'
import { previewFilm } from './preview-film'
import { previewRecipe } from './preview-recipe'
import { Header, BottomNav, Footer, PageHeading, Eyebrow, Button, FilterChip, Field, WishInput, Segmented, StatusBadge, IdeaCard, RouteCard, PlaceCard, Accordion, RecipeBlocks, FilmChoice, AddToDay, IdeaSummary, Banner, PlanDayCard, PlanItemCard, EveningDivider, StorageBar, Dialog, Toast, Skeleton, EmptyState, LoadError, TextLink, type Accent } from './components'
import './ui.css'
import './preview.css'

function Preview() {
  const [accent, setAccent] = useState<Accent>('violet')
  const [mode, setMode] = useState('all'), [chip, setChip] = useState(false), [wish, setWish] = useState(''), [name, setName] = useState('')
  const [selected, setSelected] = useState(true), [filmSelected, setFilmSelected] = useState(false), [dialog, setDialog] = useState(false)
  const [toast, setToast] = useState<string | undefined>()
  const sample = () => setToast('Пример действия выполнен')
  const nav = [{ id: 'ideas', label: 'Идеи для дня', href: '#ideas' }, { id: 'routes', label: 'Маршруты', href: '#routes' }, { id: 'places', label: 'Места', href: '#places' }, { id: 'plan', label: 'Мой план', href: '#plan' }]
  const place = places.find(x => x.id === 'kolibri')!, record = placeRecordById.get(place.id)!, visit = getVisit(place)
  return <div className="ws-ui" data-accent={accent}>
    <div className="ws-preview-tower"><TowerBackground /></div>
    <Header items={nav} current="ideas" accent={accent} onAccentChange={setAccent} mainId="preview-main" homeHref="#preview-main" />
    <main id="preview-main" className="ws-preview-main" tabIndex={-1}>
      <PageHeading eyebrow="Weekend Search · дизайн-система" description="Бумага, чернила и ваш цвет. Кнопки, карточки и состояния в одном месте.">Витрина компонентов</PageHeading>
      <section className="ws-preview-section" id="controls"><Eyebrow>Основа</Eyebrow><h2>Кнопки и выбор</h2>
        <div className="ws-preview-row"><Button onClick={sample}>Добавить в план +</Button><Button variant="secondary" onClick={sample}>Найти место →</Button><Button variant="text" onClick={sample}>← Все идеи</Button><Button variant="item" onClick={sample}>Поднять ↑</Button><Button variant="danger" onClick={() => setDialog(true)}>Очистить</Button><Button disabled>Добавить +</Button></div>
        <div className="ws-preview-row"><FilterChip selected={chip} onClick={() => setChip(!chip)}>С семьёй</FilterChip><FilterChip selected={false} onClick={sample}>До 2 ч</FilterChip><FilterChip selected={false} disabled>Недоступен</FilterChip></div>
        <Segmented label="Вид идеи" value={mode} onChange={setMode} options={[{ value: 'all', label: 'Все' }, { value: 'home', label: 'Дома' }, { value: 'city', label: 'В городе' }, { value: 'mixed', label: 'Дома и в городе' }]} />
      </section>
      <section className="ws-preview-section"><Eyebrow>Поля</Eyebrow><h2>Своими словами</h2><div className="ws-preview-grid ws-preview-grid--two"><Field label="Название своего пункта" value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Например: кофе с собой" hint="До 60 знаков" /><Field label="Название с ошибкой" defaultValue="" error="Введите название" /><Field label="Адрес" placeholder="Улица и дом" /><Field label="Неактивное поле" value="Будет доступно позже" disabled readOnly /></div>
        <WishInput value={wish} onChange={setWish} onSubmit={text => setToast(`Пожелание: ${text}`)} />
      </section>
      <section className="ws-preview-section" id="ideas"><Eyebrow>Идеи для дня</Eyebrow><h2>Три настроения</h2><div className="ws-preview-grid">
        <IdeaCard href="#recipe" eyebrow="Дома · одному, вдвоём" title="Римская пицца под киновечер" summary="Готовим пиццу и выбираем фильм. Тесто нужно выдержать в холодильнике заранее." time="Около 5 ч" needs="Мука, вода, оливковое масло и ещё 7" availability={{ kind: 'lead', label: 'Начать за 2–3 дня', reason: 'Тесто 48–72 ч в холодильнике' }} />
        <IdeaCard href="#places" eyebrow="В городе · одному, вдвоём" title="Сад, бульвар и пруды" summary="Неспешная городская прогулка с паузой среди деревьев." time="Около 2 ч 5 мин" needs="Одежда по погоде" availability={{ kind: 'today' }} />
        <IdeaCard href="#recipe" eyebrow="Дома и в городе · одному, вдвоём" title="«Зарядье» и римская пицца дома" summary="Прогулка и домашний вечер, для которого стоит заранее подготовить тесто." time="Около 3 ч 55 мин" availability={{ kind: 'later' }} />
      </div></section>
      <section className="ws-preview-section" id="routes"><Eyebrow>Маршруты</Eyebrow><h2>По городу</h2><div className="ws-preview-grid ws-preview-grid--two">
        <RouteCard href="#places" title="Начать день с завтрака" theme="Еда" subtitle="Завтрак в Nothing Fancy, затем прогулка в саду «Эрмитаж»" places={['Nothing Fancy', 'Сад «Эрмитаж»']} area="Москва" />
        <RouteCard href="#plan" title="Большие выходные" theme="Два дня" subtitle="Два разных настроения за два дня" places={['Патриаршие пруды', 'Музей импрессионизма', 'Сад «Эрмитаж»', 'Третьяковская галерея', 'Музеон', 'Парк Горького']} area="Разные районы" days={2} />
      </div></section>
      <section className="ws-preview-section" id="places"><Eyebrow>Места</Eyebrow><h2>Факты и источники</h2><div className="ws-preview-grid ws-preview-grid--two">
        <PlaceCard number={1} kind={place.kind} area={place.area} title={place.title} description={place.note} address={visit.address} addressFact={record.address} mapHref={placeMapUrl(place, visit.address)} facts={[{ label: 'Часы', fact: record.hours }, { label: 'Стоимость', fact: record.price }]} duration="Около 2 ч 10 мин" onAdd={sample} />
        <PlaceCard kind="Общественное пространство" area="Пресненский" title="Патриаршие пруды" description="Прогулка у пруда в своём темпе." mapHref="https://yandex.ru/maps/?text=Патриаршие%20пруды%20Москва" facts={[{ label: 'Часы' }, { label: 'Стоимость' }]} duration="Около 55 мин" onAdd={sample} />
      </div></section>
      <section className="ws-preview-section" id="recipe"><Eyebrow>Подробнее об идее</Eyebrow><h2>Один вечер — несколько шагов</h2><div className="ws-preview-detail"><div>
        <Accordion title="Рецепт" defaultOpen><RecipeBlocks recipe={previewRecipe} /></Accordion>
        <Accordion title="Выберите фильм" defaultOpen><FilmChoice film={previewFilm} selected={filmSelected} posterSrc={previewFilm.poster ? `${import.meta.env.BASE_URL}${previewFilm.poster.src}` : undefined} onSelect={() => setFilmSelected(!filmSelected)} /></Accordion>
      </div><IdeaSummary><Eyebrow>Для вашего дня</Eyebrow><h3>Пицца и киновечер</h3><p>Одному, вдвоём</p><p>Около 5 ч</p><StatusBadge kind="lead" label="Начать за 2–3 дня" reason="Тесто 48–72 ч в холодильнике" /><h3>Что понадобится</h3><p>Мука, вода, масло, ингредиенты для начинки</p><AddToDay state={{ kind: 'single', onAdd: sample }} /></IdeaSummary></div></section>
      <section className="ws-preview-section"><Eyebrow>Добавление</Eyebrow><h2>В мой день</h2><div className="ws-preview-grid ws-preview-grid--two">
        <AddToDay state={{ kind: 'days', days: [{ id: 'sat', label: 'В субботу, 21 ноября', onAdd: sample }, { id: 'sun', label: 'В воскресенье, 22 ноября', onAdd: sample }] }} />
        <AddToDay state={{ kind: 'two-days', onAdd: sample }} /><AddToDay state={{ kind: 'create-two-days', onAdd: sample }} /><AddToDay state={{ kind: 'partial', existing: 1, total: 3, onAdd: sample }} />
        <AddToDay state={{ kind: 'partial', existing: 2, total: 3, onAdd: sample, days: [{ id: 'sat', label: 'В субботу', onAdd: sample }, { id: 'sun', label: 'В воскресенье', onAdd: sample, disabled: true }] }} /><AddToDay state={{ kind: 'added', dayLabel: 'суббота и воскресенье', planHref: '#plan' }} />
      </div></section>
      <section className="ws-preview-section" id="plan"><Eyebrow>Мой план</Eyebrow><h2>Город и вечер дома</h2>
        <Banner title="Черновик"><p>Открывайте карточки и собирайте свой день.</p></Banner>
        <PlanDayCard number={1} date="суббота, 21 ноября" area="Тверской"><PlanItemCard number={1} kind="Место · сад" title="Сад «Эрмитаж»" selected={selected} onSelect={() => setSelected(!selected)} actions={<><Button variant="item" onClick={sample}>Поднять ↑</Button><Button variant="item" onClick={sample}>Перенести</Button><Button variant="danger" onClick={() => setToast('Пример удаления выполнен')}>Убрать</Button></>}><p>Пауза среди деревьев</p><p className="ws-caption">Около 45 мин</p></PlanItemCard>
          <EveningDivider /><PlanItemCard number={2} kind="Занятие · дома" title="Римская пицца" actions={<Button variant="item" onClick={sample}>Открыть рецепт →</Button>}><Banner title="Начать за 2–3 дня" tone="preparation"><p>Тесто 48–72 ч в холодильнике</p></Banner></PlanItemCard>
        </PlanDayCard><StorageBar onClear={() => setDialog(true)}>Пример строки состояния хранения</StorageBar>
      </section>
      <section className="ws-preview-section"><Eyebrow>Состояния</Eyebrow><h2>Когда что-то меняется</h2><div className="ws-preview-grid ws-preview-grid--two"><Skeleton /><LoadError onRetry={() => setToast('Пример повторной загрузки')} /><EmptyState title="Под такие условия идей нет" action={<Button variant="secondary" onClick={sample}>Сбросить фильтры</Button>}>Попробуйте изменить фильтры</EmptyState><EmptyState title="Идея не найдена" action={<TextLink href="#ideas">Ко всем идеям</TextLink>}>Вернитесь к каталогу, чтобы выбрать другую</EmptyState><Banner title="Событие уже прошло" tone="error">Выберите другое событие</Banner><Banner title="Хранилище недоступно" tone="error">Изменения могут потеряться после закрытия страницы</Banner><Toast onUndo={sample}>Добавлено в субботу</Toast><Toast error>В этом дне уже 6 пунктов</Toast></div></section>
      {toast && <div className="ws-preview-live"><Toast onUndo={toast.startsWith('Пример очистки') ? undefined : () => setToast(undefined)}>{toast}</Toast></div>}
    </main><BottomNav items={nav} current="ideas" /><Footer accent={accent} onAccentChange={setAccent} />
    <Dialog open={dialog} title="Очистить план?" confirmLabel="Очистить" onDismiss={() => setDialog(false)} onConfirm={() => { setDialog(false); setToast('Пример очистки выполнен') }} destructive>Все пункты будут удалены. Дни останутся.</Dialog>
  </div>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Preview />)