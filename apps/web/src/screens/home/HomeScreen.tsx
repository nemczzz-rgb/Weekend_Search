// S01 «Главная» (docs/ux/screens.md, information-architecture.md «Главная: состав»).
import { useState } from 'react'
import { getContentSource, type ContentSource } from '../../content/load.ts'
import type { Activity, DayIdea, Place, Route } from '../../content/types.ts'
import { Button, Eyebrow, IdeaCard, LoadError, RouteCard, Skeleton, TextLink, WishInput } from '../../ui/components.tsx'
import { activeMinutes } from '../../plan/today.ts'
import { MODES, audienceText, availability, formatMinutes, ideaActivities, imageProps, needsOf } from '../day-ideas/model.ts'
import { useResource } from '../../app/resource.ts'
import { viewHref } from '../../app/routing.ts'
import { setPendingWish } from '../../app/wish-intent.ts'
import './home.css'

const WISH_EXAMPLES = ['музей, а вечером дома фильм', 'парк и спа-вечер', 'хочу весь день дома', 'пицца и кино']

type HomeData = { ideas: DayIdea[]; activities: Activity[]; routes: Route[]; places: Place[] }

async function loadHome(source: ContentSource): Promise<HomeData> {
  const [ideas, activities, routes, places] = await Promise.all([
    source.getCollection('day-ideas'), source.getCollection('activities'), source.getCollection('routes'), source.getCollection('places'),
  ])
  return { ideas, activities, routes, places }
}

export function HomeScreen({ navigate, source = getContentSource(), now = () => new Date() }: { navigate: (href: string) => void; source?: ContentSource; now?: () => Date }) {
  const [wish, setWish] = useState('')
  const resource = useResource(() => loadHome(source), [source])
  const submit = (text: string) => { setPendingWish(text); navigate(viewHref('plan')) }

  return <div className="ws-home">
    <section className="ws-home-poster" aria-labelledby="home-title">
      <Eyebrow>Москва</Eyebrow>
      <h1 id="home-title"><span>Выходные</span><span className="ws-home-accent">в Москве</span></h1>
      <p className="ws-home-lead">Идеи для дня дома и в городе, маршруты и места. Соберите свой день.</p>
      <p className="ws-home-actions"><TextLink href={viewHref('day-ideas')}>Идеи для дня</TextLink><TextLink href={viewHref('places')}>Найти место</TextLink></p>
      <div className="ws-home-wish">
        <WishInput value={wish} onChange={setWish} onSubmit={submit} />
        <p className="ws-caption">Подбор работает по словам и темам.</p>
        <div className="ws-home-examples">{WISH_EXAMPLES.map(text => <Button key={text} variant="secondary" onClick={() => { setWish(text); submit(text) }}>{text}</Button>)}</div>
      </div>
    </section>

    {!resource.data ? (resource.error ? <LoadError onRetry={resource.retry} /> : <Skeleton />) : <HomeSections data={resource.data} now={now()} />}
  </div>
}

function HomeSections({ data, now }: { data: HomeData; now: Date }) {
  // Question 13: one idea per kind — the first in the file for home, city and mixed.
  const picks = (['home', 'city', 'mixed'] as const).flatMap(mode => {
    const idea = data.ideas.find(x => x.mode === mode && ideaActivities(x, data.activities).length === x.activityIds.length)
    return idea ? [idea] : []
  })
  const placeTitle = new Map(data.places.map(p => [p.id, p.title]))
  return <>
    {picks.length > 0 && <section className="ws-home-section" aria-labelledby="home-ideas">
      <div className="ws-home-section-head"><div><Eyebrow>Идеи для дня</Eyebrow><h2 id="home-ideas">Чем заняться</h2></div><TextLink href={viewHref('day-ideas')}>Все идеи для дня ({data.ideas.length})</TextLink></div>
      <div className="ws-home-grid">{picks.map(idea => {
        const activities = ideaActivities(idea, data.activities), needs = needsOf(activities)
        return <IdeaCard key={idea.id} href={viewHref('day-ideas', { idea: idea.id })}
          eyebrow={[MODES.find(x => x.value === idea.mode)?.label, audienceText(activities)].filter(Boolean).join(' · ')}
          title={idea.title} summary={idea.summary} time={`Около ${formatMinutes(activeMinutes(activities))}`}
          needs={needs.slice(0, 3).join(', ') + (needs.length > 3 ? ` и ещё ${needs.length - 3}` : '')}
          availability={availability(activities, now)} image={imageProps(idea, import.meta.env.BASE_URL)} />
      })}</div>
    </section>}
    <section className="ws-home-section" aria-labelledby="home-routes">
      <div className="ws-home-section-head"><div><Eyebrow>Маршруты</Eyebrow><h2 id="home-routes">По городу</h2></div><TextLink href={viewHref('routes')}>Все маршруты ({data.routes.length})</TextLink></div>
      <div className="ws-home-grid">{data.routes.slice(0, 3).map(route => <RouteCard key={route.id} href={viewHref('routes', { route: route.id })}
        theme={route.theme} title={route.title} subtitle={route.subtitle} area={route.area} days={route.days}
        places={route.placeIds.map(id => placeTitle.get(id)).filter((x): x is string => Boolean(x))} />)}</div>
    </section>
  </>
}
