import { useEffect, useId, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import type { Fact, Film, Recipe } from '../content/types'
import { UI_COPY } from './copy'

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')
export const ACCENTS = [
  ['violet', 'Фиолетовый', '#3932bd'], ['blue', 'Синий', '#0047bb'], ['sky', 'Голубой', '#0072ce'],
  ['green', 'Зелёный', '#00b140'], ['orange', 'Оранжевый', '#fe5000'], ['red', 'Красный', '#e4002b'],
  ['pink', 'Розовый', '#da1884'], ['purple', 'Сиреневый', '#753bbd'], ['ink', 'Чернильный', '#191821'],
] as const
export type Accent = typeof ACCENTS[number][0]

export function Logo({ size = 36 }: { size?: number }) {
  const sections = [[20.25, 16.25, 24, 37.5], [16.25, 12.5, 24, 37.5], [12.5, 9, 24, 45], [9, 6, 24, 45], [6, 3.75, 12, 45], [3.75, 2.5, 12, 45]]
  const point = (r: number, a: number) => `${(r * Math.cos(a * Math.PI / 180)).toFixed(2)} ${(r * Math.sin(a * Math.PI / 180)).toFixed(2)}`
  let ink = '', accent = '', phase = 0
  const rings: number[] = [20.25]
  sections.forEach(([outer, inner, count, angle], index) => {
    if ((size >= 64 || [0, 2, 4].includes(index)) && (size >= 32 || index === 0)) {
      const rods = size >= 64 ? count : count / 2
      for (let i = 0; i < rods; i++) {
        const a = phase + i * 360 / rods
        ink += `M${point(outer, a)}L${point(inner, a - angle)}`
        accent += `M${point(outer, a)}L${point(inner, a + angle)}`
      }
      rings.push(outer, inner)
    }
    phase += angle
  })
  return <svg width={size} height={size} viewBox="-23 -23 46 46" fill="none" aria-hidden="true" focusable="false">
    {size < 20 ? <path d="M0-20V20M-20 0H20M-14-14L14 14M14-14L-14 14" stroke="currentColor" strokeWidth="2.5" /> : <>
      {rings.map((r, i) => <circle key={i} r={r} stroke="var(--ws-ink)" strokeWidth=".65" />)}
      <path d={ink} stroke="var(--ws-ink)" strokeWidth=".65" /><path d={accent} stroke="var(--ws-accent)" strokeWidth=".65" />
      <circle r="2" fill="var(--ws-lamp)" stroke="var(--ws-ink)" strokeWidth=".6" />
    </>}
  </svg>
}

export function AccentPalette({ value, onChange }: { value: Accent; onChange: (value: Accent) => void }) {
  const details = useRef<HTMLDetailsElement>(null)
  const summary = useRef<HTMLElement>(null)
  return <details className="ws-palette" ref={details} onKeyDown={event => {
    if (event.key === 'Escape') { details.current!.open = false; summary.current?.focus() }
  }}>
    <summary ref={summary} aria-label={`Цвет акцента: ${ACCENTS.find(x => x[0] === value)?.[1]}. Выбрать цвет`}>
      <span className="ws-swatches" aria-hidden="true">{ACCENTS.map(([id, , color]) => <i key={id} style={{ background: color, height: value === id ? 22 : 8 }} />)}</span>
    </summary>
    <div className="ws-palette-options" role="group" aria-label="Цвет акцента">{ACCENTS.map(([id, label, color]) => <button key={id} type="button" aria-label={label} aria-pressed={value === id} onClick={() => { onChange(id); details.current!.open = false; summary.current?.focus() }}>
      <span style={{ background: color }} /><span className="ws-sr-only">{label}</span><span aria-hidden="true">{value === id ? '✓' : ''}</span>
    </button>)}</div>
  </details>
}

type NavItem = { id: string; label: string; href: string }
export function Header({ items, current, accent, onAccentChange, mainId = 'main', homeHref = './' }: { items: NavItem[]; current?: string; accent: Accent; onAccentChange: (accent: Accent) => void; mainId?: string; homeHref?: string }) {
  return <><a className="ws-skip" href={`#${mainId}`}>{UI_COPY.skip}</a><header className="ws-header">
    <a className="ws-brand" href={homeHref} aria-label={UI_COPY.homeAria}><Logo /><span>weekend<span>search</span></span></a>
    <nav className="ws-desktop-nav" aria-label="Основная навигация">{items.map(x => <a key={x.id} href={x.href} aria-current={current === x.id ? 'page' : undefined}>{x.label}</a>)}</nav>
    <AccentPalette value={accent} onChange={onAccentChange} />
  </header></>
}
export function BottomNav({ items, current }: { items: NavItem[]; current?: string }) {
  return <nav className="ws-bottom-nav" aria-label="Основная навигация на телефоне">{items.map(x => <a key={x.id} href={x.href} aria-current={current === x.id ? 'page' : undefined}><span>{x.label}</span></a>)}</nav>
}
export function Footer({ accent, onAccentChange }: { accent: Accent; onAccentChange: (accent: Accent) => void }) {
  return <footer className="ws-footer"><p>Идеи, маршруты и места на выходные</p><AccentPalette value={accent} onChange={onAccentChange} /></footer>
}
export function Eyebrow({ children }: { children: ReactNode }) { return <p className="ws-eyebrow"><span aria-hidden="true">✳</span>{children}</p> }
export function PageHeading({ eyebrow, children, description }: { eyebrow: string; children: ReactNode; description?: string }) {
  return <div className="ws-page-heading"><Eyebrow>{eyebrow}</Eyebrow><h1>{children}<span aria-hidden="true">✳</span></h1>{description && <p>{description}</p>}</div>
}
export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'text' | 'item' | 'danger' }) {
  return <button type={type} className={cx('ws-button', `ws-button--${variant}`, className)} {...props} />
}
export function TextLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  return <a className="ws-text-link" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}<span aria-hidden="true"> {external ? '↗' : '→'}</span>{external && <span className="ws-sr-only"> (откроется в новой вкладке)</span>}</a>
}
export function FilterChip({ selected, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return <button type="button" className="ws-chip" aria-pressed={selected} {...props}>{selected && <span aria-hidden="true">✓ </span>}{children}</button>
}
export function Segmented({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return <div className="ws-segmented" role="radiogroup" aria-label={label}>{options.map((x, i) => <button type="button" role="radio" aria-checked={value === x.value} tabIndex={value === x.value || (!options.some(o => o.value === value) && i === 0) ? 0 : -1} key={x.value} ref={el => { refs.current[i] = el }} onClick={() => onChange(x.value)} onKeyDown={event => {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : ['ArrowRight', 'ArrowDown'].includes(event.key) ? (i + 1) % options.length : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? (i - 1 + options.length) % options.length : undefined
    if (next !== undefined) { event.preventDefault(); onChange(options[next].value); refs.current[next]?.focus() }
  }}>{x.label}</button>)}</div>
}
export function Field({ label, hint, error, id, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const autoId = useId(), inputId = id ?? autoId
  return <div className={cx('ws-field', className)}><label htmlFor={inputId}>{label}</label><input {...props} id={inputId} aria-invalid={error ? true : undefined} aria-describedby={[hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined} />
    {hint && <p id={`${inputId}-hint`} className="ws-caption">{hint}</p>}{error && <p id={`${inputId}-error`} className="ws-error"><span aria-hidden="true">! </span>{error}</p>}
  </div>
}
export function WishInput({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: (value: string) => void }) {
  const id = useId()
  return <form className="ws-wish" onSubmit={event => { event.preventDefault(); if (value.trim()) onSubmit(value.trim()) }}><label htmlFor={id}>{UI_COPY.wish.label}</label><div><input id={id} value={value} onChange={e => onChange(e.target.value)} maxLength={200} placeholder={UI_COPY.wish.placeholder} /><Button type="submit" aria-label={UI_COPY.wish.submit} disabled={!value.trim()}>→</Button></div></form>
}
export type Availability = { kind: 'today' | 'later' | 'lead'; label?: string; reason?: string }
export function StatusBadge({ kind, label, reason }: Availability) {
  return <div className={cx('ws-status', `ws-status--${kind}`)}><span aria-hidden="true">{kind === 'today' ? '✓' : kind === 'later' ? '▦' : '◷'}</span><div>{label ?? (kind === 'today' ? UI_COPY.today : kind === 'later' ? UI_COPY.later : UI_COPY.lead)}{reason && <p>{reason}</p>}</div></div>
}
export function IdeaCard({ href, eyebrow, title, summary, time, needs, availability, image }: { href: string; eyebrow: string; title: string; summary: string; time: string; needs?: string; availability: Availability; image?: { src: string; srcSet?: string; alt: string } }) {
  return <a href={href} className="ws-card ws-idea-card">{image && <img className="ws-idea-image" src={image.src} srcSet={image.srcSet} sizes="(max-width: 767px) 100vw, 33vw" alt={image.alt} width="640" height="427" loading="lazy" />}<div className="ws-card-body"><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2><p>{summary}</p><p className="ws-card-time">{time}</p>{needs && <p className="ws-caption">Понадобится: {needs}</p>}<StatusBadge {...availability} /><span className="ws-card-more">{UI_COPY.cardOpen}</span></div></a>
}
export function RouteCard({ href, theme, title, subtitle, places, area, days = 1 }: { href: string; theme: string; title: string; subtitle: string; places: string[]; area: string; days?: 1 | 2 }) {
  return <a href={href} className="ws-card ws-card-body"><Eyebrow>{theme} · {days === 1 ? '1 день' : '2 дня'}</Eyebrow><h2>{title}</h2><p>{subtitle}</p><p className="ws-caption">{places.join(' · ')}</p><p className="ws-caption">{area} · {places.length} {places.length === 1 ? 'место' : places.length < 5 ? 'места' : 'мест'}</p><span className="ws-card-more">{UI_COPY.routeOpen}</span></a>
}
export function SourceFacts({ facts, linkedFacts = [] }: { facts: { label: string; fact?: Fact; unknown?: string }[]; linkedFacts?: { label: string; fact: Fact }[] }) {
  const verified = [...facts, ...linkedFacts]
  const known = verified.flatMap(x => x.fact ? [x.fact] : [])
  const date = known.map(x => x.checkedAt).sort()[0]
  return <div className="ws-source-facts"><dl>{facts.map(({ label, fact, unknown }) => <div key={label}><dt>{label}</dt><dd>{fact?.value ?? unknown ?? UI_COPY.unknown}</dd></div>)}</dl>
    <div className="ws-sources">{verified.filter(x => x.fact).map(({ label, fact }) => fact!.source === 'owner' ? <span key={label}>{label}: по данным автора сайта</span> : <TextLink key={label} href={fact!.source} external>Источник: {label.toLowerCase()}</TextLink>)}
      {date && <span>Проверено {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace(' г.', '')}</span>}
    </div></div>
}
export function PlaceCard({ number, kind, area, title, description, address, addressFact, mapHref, facts, duration, onAdd }: { number?: number; kind: string; area: string; title: string; description: string; address?: string; addressFact?: Fact; mapHref: string; facts: Parameters<typeof SourceFacts>[0]['facts']; duration: string; onAdd?: () => void }) {
  return <article className="ws-card ws-card-body ws-place-card"><div className="ws-place-heading">{number && <span className="ws-number">{number}</span>}<div><Eyebrow>{kind} · {area}</Eyebrow><h2>{title}</h2></div></div><p>{description}</p><TextLink href={mapHref} external>{address ?? UI_COPY.findMap}</TextLink><SourceFacts facts={facts} linkedFacts={addressFact ? [{ label: 'Адрес', fact: addressFact }] : []} /><div className="ws-card-actions"><span className="ws-caption">{duration}</span>{onAdd && <Button variant="item" onClick={onAdd}>{UI_COPY.addPlace}</Button>}</div></article>
}
export function Accordion({ title, children, defaultOpen = false, open: controlledOpen, onOpenChange }: { title: string; children: ReactNode; defaultOpen?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [localOpen, setOpen] = useState(defaultOpen), id = useId(), open = controlledOpen ?? localOpen
  return <section className="ws-accordion"><h3><button type="button" aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); onOpenChange?.(!open) }}>{title}<span aria-hidden="true">{open ? '−' : '+'}</span></button></h3><div id={id} hidden={!open}>{children}</div></section>
}
export function FilmChoice({ film, selected, posterSrc, onSelect }: { film: Film; selected: boolean; posterSrc?: string; onSelect: () => void }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [posterSrc])
  return <article className={cx('ws-film', selected && 'ws-selected')}>
    {posterSrc && film.poster && !failed ? <img src={posterSrc} alt={film.poster.alt} width={film.poster.width} height={film.poster.height} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <div className="ws-poster-fallback"><span aria-hidden="true">✳</span><span>Постер недоступен</span></div>}
    <div><h3>{film.title} <span>({film.year})</span></h3>{film.originalTitle && film.originalTitle !== film.title && <p className="ws-caption">{film.originalTitle}</p>}{film.note && <p>{film.note}</p>}<div className="ws-sources"><TextLink href={film.source} external>{UI_COPY.film.info}</TextLink>{film.noteSource && <TextLink href={film.noteSource} external>{UI_COPY.film.noteSource}</TextLink>}{film.poster && <span>{film.poster.credit} · <TextLink href={film.poster.source} external>{UI_COPY.film.poster}</TextLink></span>}</div><Button variant="item" aria-pressed={selected} onClick={onSelect}>{selected ? UI_COPY.film.selected : UI_COPY.film.select}</Button></div>
  </article>
}
export type AddToDayState =
  | { kind: 'single'; onAdd: () => void }
  | { kind: 'days'; days: { id: string; label: string; onAdd: () => void; disabled?: boolean }[] }
  | { kind: 'two-days'; onAdd: () => void }
  | { kind: 'create-two-days'; onAdd: () => void }
  | { kind: 'partial'; existing: number; total: number; onAdd: () => void; days?: { id: string; label: string; onAdd: () => void; disabled?: boolean }[] }
  | { kind: 'added'; dayLabel: string; planHref: string }
export function AddToDay({ state }: { state: AddToDayState }) {
  if (state.kind === 'added') return <a className="ws-added" href={state.planHref}>✓ В плане: {state.dayLabel} · Открыть план →</a>
  if (state.kind === 'days' || (state.kind === 'partial' && state.days?.length)) return <div className="ws-add-group">{state.kind === 'partial' && <p>{state.existing} из {state.total} уже в плане</p>}<div>{state.days!.map(day => <Button key={day.id} onClick={day.onAdd} disabled={day.disabled}>{state.kind === 'partial' ? `Добавить остальное: ${day.label.toLowerCase()}` : day.label}</Button>)}</div></div>
  return <div className="ws-add-group">{state.kind === 'partial' && <p>{state.existing} из {state.total} уже в плане</p>}<Button onClick={state.onAdd}>{state.kind === 'single' ? UI_COPY.add.single : state.kind === 'two-days' ? UI_COPY.add.both : state.kind === 'create-two-days' ? UI_COPY.add.createBoth : UI_COPY.add.rest}</Button></div>
}
export function IdeaSummary({ children }: { children: ReactNode }) { return <aside className="ws-summary ws-card ws-card-body" aria-label="Сводка идеи">{children}</aside> }
export function Banner({ title, children, tone = 'info' }: { title: string; children?: ReactNode; tone?: 'info' | 'error' | 'preparation' }) {
  return <div className={cx('ws-banner', `ws-banner--${tone}`)} {...(tone === 'error' ? { role: 'alert' } : {})}><strong><span aria-hidden="true">{tone === 'preparation' ? '◷' : tone === 'error' ? '!' : '✳'} </span>{title}</strong>{children && <div>{children}</div>}</div>
}
export function PlanDayCard({ number, date, area, children }: { number: number; date: string; area?: string; children: ReactNode }) {
  return <section className="ws-plan-day"><div className="ws-plan-day-heading"><span className="ws-number">{number}</span><div><Eyebrow>День {number}</Eyebrow><h2>{date}</h2>{area && <p>Старт в районе {area}</p>}</div></div>{children}</section>
}
export function PlanItemCard({ number, title, kind, selected = false, onSelect, children, actions }: { number: number; title: string; kind: string; selected?: boolean; onSelect?: () => void; children?: ReactNode; actions?: ReactNode }) {
  return <article className={cx('ws-card ws-card-body ws-plan-item', selected && 'ws-selected')}><div className="ws-place-heading"><span className="ws-number">{number}</span><div><Eyebrow>{kind}</Eyebrow><h3>{title}</h3></div>{onSelect && <Button variant="item" aria-pressed={selected} aria-label={`Выбрать пункт: ${title}`} onClick={onSelect}>{selected ? '✓' : '+'}</Button>}</div>{children}{actions && <div className="ws-card-actions">{actions}</div>}</article>
}
export function EveningDivider() { return <p className="ws-evening">{UI_COPY.evening}</p> }
export function StorageBar({ children, onClear }: { children: ReactNode; onClear?: () => void }) { return <div className="ws-storage-bar"><p>{children}</p>{onClear && <Button variant="text" className="ws-clear" onClick={onClear}>{UI_COPY.clear}</Button>}</div> }
export function Dialog({ open, title, children, confirmLabel, onConfirm, onDismiss, destructive = false }: { open: boolean; title: string; children: ReactNode; confirmLabel: string; onConfirm: () => void; onDismiss: () => void; destructive?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null), id = useId()
  useEffect(() => {
    const node = dialog.current!
    if (open && !node.open) { node.showModal(); cancel.current?.focus() }
    else if (!open && node.open) node.close()
  }, [open])
  return <dialog aria-modal="true" className="ws-dialog" ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={e => { e.preventDefault(); onDismiss() }}>
    <h2 id={`${id}-title`}>{title}</h2><div id={`${id}-description`}>{children}</div><div className="ws-dialog-actions"><button className="ws-button ws-button--secondary" type="button" ref={cancel} onClick={onDismiss}>{UI_COPY.cancel}</button><Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></div>
  </dialog>
}
export function Toast({ children, onUndo, error = false }: { children: ReactNode; onUndo?: () => void; error?: boolean }) {
  return <div className={cx('ws-toast', error && 'ws-toast--error')} role={error ? 'alert' : 'status'}><span>{error && <span aria-hidden="true">! </span>}{children}</span>{onUndo && <button type="button" onClick={onUndo}>{UI_COPY.undo}</button>}</div>
}
export function Skeleton({ label = UI_COPY.loading }: { label?: string }) { return <div className="ws-skeleton" role="status" aria-label={label}><span /><span /><span /></div> }
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) { return <section className="ws-empty"><h2>{title}</h2>{children && <p>{children}</p>}{action}</section> }
export function LoadError({ onRetry }: { onRetry: () => void }) { return <div className="ws-empty" role="alert"><h2>{UI_COPY.loadError}</h2><p>{UI_COPY.reloadHint}</p><Button variant="secondary" onClick={onRetry}>{UI_COPY.reload}</Button></div> }
export function RecipeBlocks({ recipe }: { recipe: Recipe }) {
  const [opened, setOpened] = useState<Set<string>>(() => new Set(['ingredients']))
  const ids = ['ingredients', ...recipe.sections.map(s => s.id), ...(recipe.tips?.length ? ['tips'] : []), ...(recipe.toppings?.length ? ['toppings'] : []), ...(recipe.serving?.length ? ['serving'] : [])]
  const allOpen = ids.every(id => opened.has(id))
  const disclosure = (id: string) => ({ open: opened.has(id), onOpenChange: (open: boolean) => setOpened(previous => { const next = new Set(previous); if (open) next.add(id); else next.delete(id); return next }) })
  return <div className="ws-recipe"><p className="ws-caption">Выход: {recipe.yield}</p><Button variant="text" onClick={() => setOpened(allOpen ? new Set() : new Set(ids))}>{allOpen ? 'Свернуть все' : 'Раскрыть все'}</Button>
    <Accordion title={UI_COPY.recipe.ingredients} {...disclosure('ingredients')}>{recipe.ingredients.map(group => <div key={group.group}><h4>{group.group}</h4><ul>{group.items.map((item, i) => <li key={i}>{item.name}{item.amount !== undefined ? ' — ' + item.amount + (item.unit ? ' ' + item.unit : '') : ''}{item.note && <span> · {item.note}</span>}</li>)}</ul></div>)}</Accordion>
    {recipe.sections.map(section => <Accordion key={section.id} title={section.title} {...disclosure(section.id)}><ol>{section.steps.map((step, i) => <li key={i}>{step.text}{step.durationMinutes !== undefined && <span> · {step.durationMinutes} мин</span>}{step.temperatureC !== undefined && <span> · {step.temperatureC} °C</span>}</li>)}</ol></Accordion>)}
    {recipe.tips?.length ? <Accordion title={UI_COPY.recipe.tips} {...disclosure('tips')}><ul>{recipe.tips.map((x, i) => <li key={i}>{x}</li>)}</ul></Accordion> : null}
    {recipe.toppings?.length ? <Accordion title={UI_COPY.recipe.toppings} {...disclosure('toppings')}>{recipe.toppings.map((x, i) => <div key={i}><h4>{x.title}</h4><p>{x.text}</p></div>)}</Accordion> : null}
    {recipe.serving?.length ? <Accordion title={UI_COPY.recipe.serving} {...disclosure('serving')}><ul>{recipe.serving.map((x, i) => <li key={i}>{x}</li>)}</ul></Accordion> : null}
    {recipe.source === 'owner' ? <p className="ws-caption">{UI_COPY.recipe.owner}</p> : <TextLink href={recipe.source} external>{UI_COPY.recipe.source}</TextLink>}
  </div>
}
