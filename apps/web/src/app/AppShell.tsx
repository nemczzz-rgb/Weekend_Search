// Host of the new site (TASK-050): one navigation, one plan, shared header and footer.
// Until the release switch (TASK-053) it is reachable only in development via ?app=next (D11).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DayIdeasScreen } from '../screens/day-ideas/index.ts'
import { BottomNav, EmptyState, Footer, Header, PageHeading, TextLink, type Accent } from '../ui/components.tsx'
import { itemsWord } from './format.ts'
import { planStore, usePlanState } from './plan-state.ts'
import { interceptLinks, useShellRoute, viewHref, type View } from './routing.ts'
import '../ui/ui.css'
import './app.css'

const NAV: { id: View; label: string }[] = [
  { id: 'day-ideas', label: 'Идеи для дня' },
  { id: 'routes', label: 'Маршруты' },
  { id: 'places', label: 'Места' },
  { id: 'plan', label: 'Мой план' },
]

export function AppShell() {
  const { route, navigate } = useShellRoute()
  const [accent, setAccent] = useState<Accent>('violet')
  const main = useRef<HTMLDivElement>(null)
  const items = NAV.map(item => ({ id: item.id, label: item.label, href: viewHref(item.id) }))

  // R-NAV-1 for shell screens; the day-ideas screen focuses and scrolls itself.
  useEffect(() => {
    if (route.view === 'day-ideas' || route.action === 'initial') return
    requestAnimationFrame(() => {
      const heading = main.current?.querySelector('h1')
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
      scrollTo(0, route.action === 'back' ? Number(history.state?.scrollY ?? 0) : 0)
    })
  }, [route.serial, route.view, route.action])

  return <div className="ws-ui ws-app" data-accent={accent} onClick={event => interceptLinks(event, navigate)}>
    <Header items={items} current={route.view} accent={accent} onAccentChange={setAccent} homeHref={viewHref('home')} />
    <div ref={main} className="ws-app-main">
      {route.view === 'day-ideas'
        ? <DayIdeasScreen key={route.serial} store={planStore} />
        : <main id="main" className="ws-app-screen"><Screen view={route.view} /></main>}
    </div>
    <Footer accent={accent} onAccentChange={setAccent} />
    <BottomNav items={items} current={route.view} />
  </div>
}

function Screen({ view }: { view: View }): ReactNode {
  switch (view) {
    case 'home': return <HomeStub />
    case 'routes': return <Pending title="Маршруты по городу" eyebrow="Маршруты" />
    case 'places': return <Pending title="Места Москвы" eyebrow="Места" />
    case 'plan': return <PlanStub />
    default: return null
  }
}

function HomeStub() {
  return <>
    <PageHeading eyebrow="Москва" description="Идеи для дня дома и в городе, маршруты и места. Соберите свой день.">Выходные в Москве</PageHeading>
    <p className="ws-app-links"><TextLink href={viewHref('day-ideas')}>Идеи для дня</TextLink> <TextLink href={viewHref('places')}>Найти место</TextLink></p>
    <p className="ws-caption">Главная собирается в TASK-050.</p>
  </>
}

function PlanStub() {
  const { plan, storageAvailable } = usePlanState()
  const count = plan?.days.reduce((total, day) => total + day.items.length, 0) ?? 0
  return <>
    <PageHeading eyebrow="Мой план">{plan?.sourceTitle ?? 'Мой план'}</PageHeading>
    {count === 0
      ? <EmptyState title="Здесь пока пусто" action={<TextLink href={viewHref('day-ideas')}>Выбрать идею для дня</TextLink>}>Напишите, чего хочется, или выберите идею, маршрут или место.</EmptyState>
      : <p>В плане {count} {itemsWord(count)}. Экран плана собирается в TASK-050.</p>}
    {!storageAvailable && <p role="status">План сохранится только до закрытия страницы.</p>}
  </>
}

function Pending({ title, eyebrow }: { title: string; eyebrow: string }) {
  return <>
    <PageHeading eyebrow={eyebrow}>{title}</PageHeading>
    <p className="ws-caption">Экран собирается в TASK-050.</p>
  </>
}
