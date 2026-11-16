// One plan for the whole site (rule P2): screens share this store instead of keeping their own copies.
import { useEffect, useState } from 'react'
import { LocalStoragePlanRepository } from '../plan/repository-local.ts'
import { PlanStore } from '../plan/store.ts'
import type { Plan } from '../plan/model.ts'

export const planStore = new PlanStore(new LocalStoragePlanRepository())
export const planReady: Promise<Plan | null> = planStore.init()

export function usePlanState(store: PlanStore = planStore): { plan: Plan | null; storageAvailable: boolean } {
  const [state, setState] = useState(() => ({ plan: store.get(), storageAvailable: store.storageAvailable }))
  useEffect(() => store.subscribe(plan => setState({ plan, storageAvailable: store.storageAvailable })), [store])
  return state
}

/** R-ADD-2: «В план +» in catalogs adds to the day last opened on the plan screen (first by default). */
let activeDay = 0
export const getActiveDay = (plan: Plan | null) => (plan && activeDay < plan.days.length ? activeDay : 0)
export const setActiveDay = (index: number) => { activeDay = index }
