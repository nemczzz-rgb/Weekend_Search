// «В мой день» for routes, places and events (R-ADD-1…6): one place for messages and undo.
import type { ReactNode } from 'react'
import type { NewPlanItem, Plan } from '../plan/model.ts'
import { addItems, createPlan, isPlanEmpty, removeItems, type PlanStore } from '../plan/store.ts'
import { Button, TextLink } from '../ui/components.tsx'
import { capitalize, dayLabel, inDay, toDay } from './format.ts'
import type { NoticeData } from './Notice.tsx'
import { viewHref } from './routing.ts'

type Notify = (message: ReactNode, options?: Omit<NoticeData, 'id' | 'message'>) => void

export function makeAdder(store: PlanStore, notify: Notify, now: () => Date) {
  const add = (items: NewPlanItem[], dayIndex: number, options: { sourceTitle?: string; base?: Plan } = {}): boolean => {
    const before = options.base ?? store.get() ?? createPlan(now())
    const result = addItems(before, dayIndex, items)
    const day = before.days[dayIndex]
    if (result.status === 'already') {
      const days = result.dayIndexes.map(i => dayLabel(before.days[i].date)).join(' и ')
      notify(<span>Уже в плане: {days}. <TextLink href={viewHref('plan', { day: result.dayIndexes[0] ? String(result.dayIndexes[0] + 1) : undefined })}>Открыть план</TextLink></span>)
      return false
    }
    if (result.status === 'limit') {
      const other = before.days.findIndex((d, i) => i !== dayIndex && 6 - d.items.length >= items.length)
      notify(<span>{capitalize(inDay(day.date))} не хватает места: в дне не больше 6 пунктов.{other >= 0 && <> <Button variant="text" onClick={() => add(items, other, options)}>Добавить {toDay(before.days[other].date)}</Button></>}</span>, { error: true })
      return false
    }
    const next = isPlanEmpty(before) && options.sourceTitle ? { ...result.plan, sourceTitle: options.sourceTitle } : result.plan
    void store.set(next)
    const text = result.skipped > 0 ? `Добавлено ${items.length - result.skipped} из ${items.length}, остальные уже в плане` : `Добавлено ${toDay(day.date)}`
    notify(text, { undo: () => { const latest = store.get(); if (latest) void store.set(removeItems(latest, result.addedUids)) } })
    return true
  }
  return add
}
