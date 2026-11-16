import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { DayIdeasScreen } from './DayIdeasScreen.tsx'
import { getContentSource, setContentSource } from '../../content/load.ts'
import { LocalStoragePlanRepository } from '../../plan/repository-local.ts'
import { PlanStore } from '../../plan/store.ts'
import { Header, BottomNav, Footer, Button, type Accent } from '../../ui/components.tsx'
import '../../ui/ui.css'

const store = new PlanStore(new LocalStoragePlanRepository(undefined, 'weekend-search:ideas-preview:v1'))
// This entire entry is development-only; the host in TASK-050 provides the shared store.
Object.assign(window, { weekendIdeasPreview: { store, getContentSource, setContentSource } })
function Preview() {
  const [ready, setReady] = useState(false), [accent, setAccent] = useState<Accent>('violet')
  useEffect(() => { void store.init().then(() => setReady(true)) }, [])
  return <div className="ws-ui" data-accent={accent}><Header current="ideas" accent={accent} onAccentChange={setAccent} items={[{ id: 'home', label: 'Главная', href: '?ideas-preview=1' }, { id: 'ideas', label: 'Идеи для дня', href: '?ideas-preview=1&view=day-ideas' }, { id: 'places', label: 'Места', href: '?ideas-preview=1&view=places' }, { id: 'plan', label: 'Мой план', href: '?ideas-preview=1&view=plan' }]} />
    <p style={{ maxWidth: 1216, margin: '20px auto', padding: '0 16px' }}>Предпросмотр TASK-049. Экран плана подключается в TASK-050; добавленные пункты сохраняются в отдельном плане предпросмотра.</p>
    {ready ? <DayIdeasScreen store={store} /> : <p>Загрузка плана…</p>}<Footer accent={accent} onAccentChange={setAccent} /><BottomNav current="ideas" items={[{ id: 'home', label: 'Главная', href: '?ideas-preview=1' }, { id: 'ideas', label: 'Идеи для дня', href: '?ideas-preview=1&view=day-ideas' }, { id: 'places', label: 'Места', href: '?ideas-preview=1&view=places' }, { id: 'plan', label: 'Мой план', href: '?ideas-preview=1&view=plan' }]} />
    <div style={{padding:24}}><Button variant="text" onClick={() => { void store.set(null); location.reload() }}>Сбросить план предпросмотра</Button></div>
  </div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Preview /></React.StrictMode>)
