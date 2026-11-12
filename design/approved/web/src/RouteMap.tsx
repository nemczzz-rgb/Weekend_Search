import type { Place } from './data'

type Props = {
  stops: Place[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function RouteMap({ stops, selectedId, onSelect }: Props) {
  const located = stops.filter(stop => !Number.isNaN(stop.x) && !Number.isNaN(stop.y))
  const points = located.map(stop => `${stop.x * 10},${stop.y * 6.4}`).join(' ')

  return (
    <section className="route-map" aria-label="Схема точек маршрута">
      <div className="map-heading">
        <div><span className="section-kicker">КАРТА МАРШРУТА</span><h2>Места на схеме</h2></div>
        <span className="map-badge">СХЕМА · НЕ НАВИГАЦИЯ</span>
      </div>
      <div className="map-canvas">
        <svg className="map-drawing" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="paper-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#c7c2b1" strokeWidth="1" opacity=".5" /></pattern>
          </defs>
          <rect width="1000" height="640" fill="#e8e7d8" />
          <rect width="1000" height="640" fill="url(#paper-grid)" />
          <path d="M 70 45 C 250 80 300 210 450 230 S 700 220 930 70" fill="none" stroke="#f7f4e9" strokeWidth="22" opacity=".8" />
          <path d="M 10 350 C 210 310 300 360 450 330 S 710 260 980 320" fill="none" stroke="#f7f4e9" strokeWidth="25" opacity=".8" />
          <path d="M 60 570 C 210 490 400 530 540 480 S 800 410 950 520" fill="none" stroke="#f7f4e9" strokeWidth="20" opacity=".75" />
          <path d="M 170 0 C 230 180 330 200 300 370 S 340 520 410 640" fill="none" stroke="#f8f4e9" strokeWidth="18" opacity=".8" />
          <path d="M 630 0 C 570 160 630 250 610 380 S 640 540 720 640" fill="none" stroke="#f8f4e9" strokeWidth="17" opacity=".8" />
          <path d="M 15 475 C 130 420 150 445 240 475 S 395 585 510 590 S 740 525 985 610" fill="none" stroke="#aebfbd" strokeWidth="42" opacity=".75" />
          <path d="M 15 475 C 130 420 150 445 240 475 S 395 585 510 590 S 740 525 985 610" fill="none" stroke="#d8e0da" strokeWidth="24" opacity=".85" />
          <ellipse cx="710" cy="100" rx="135" ry="75" fill="#d2d9bd" opacity=".7" />
          <ellipse cx="370" cy="545" rx="125" ry="70" fill="#d2d9bd" opacity=".7" />
          {located.length > 1 && <polyline points={points} fill="none" stroke="#a16042" strokeWidth="5" strokeDasharray="9 12" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />}
          <text x="100" y="125" className="map-district">ЗАПАД</text>
          <text x="760" y="240" className="map-district">ВОСТОК</text>
          <text x="425" y="390" className="map-district">ЦЕНТР</text>
          <text x="125" y="595" className="map-district">МОСКВА-РЕКА</text>
        </svg>
        {located.map(stop => <button
          key={stop.id}
          className={`map-marker ${selectedId === stop.id ? 'active' : ''}`}
          style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
          onClick={() => onSelect(stop.id)}
          aria-label={`Точка ${stops.indexOf(stop) + 1}: ${stop.title}`}
          title={stop.title}
        >{stops.indexOf(stop) + 1}</button>)}
      </div>
      {located.length < stops.length && <p className="map-note">Точек без положения на схеме: {stops.length - located.length}. Они остаются в списке; адреса и ссылки доступны в карточках мест.</p>}
      <p className="map-note">Пунктир показывает только порядок точек. Улицы и положение на схеме условные; реальный путь и время в пути пока не рассчитаны.</p>
      <ol className="map-legend">{stops.map((stop, index) => <li key={stop.id}><button className={selectedId === stop.id ? 'active' : ''} onClick={() => onSelect(stop.id)}><span>{index + 1}</span>{stop.title}</button></li>)}</ol>
    </section>
  )
}
