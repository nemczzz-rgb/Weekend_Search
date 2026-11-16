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
