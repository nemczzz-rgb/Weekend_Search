// The only module that touches localStorage (plan section 12, rules P2 and P8).
import { migratePlan } from './migrate.ts'
import type { Plan, PlanRepository } from './model.ts'

export const PLAN_STORAGE_KEY = 'weekend-search:plan:v1'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null // access itself can throw in private modes or with blocked site data
  }
}

export class LocalStoragePlanRepository implements PlanRepository {
  private readonly storage: KeyValueStorage | null
  private readonly key: string

  constructor(storage: KeyValueStorage | null = defaultStorage(), key = PLAN_STORAGE_KEY) {
    this.storage = storage
    this.key = key
  }

  async load(): Promise<Plan | null> {
    if (!this.storage) return null
    try {
      const text = this.storage.getItem(this.key)
      return text ? migratePlan(JSON.parse(text)) : null
    } catch {
      return null
    }
  }

  async save(plan: Plan): Promise<void> {
    if (!this.storage) throw new Error('Plan storage is not available')
    this.storage.setItem(this.key, JSON.stringify(plan))
  }
}
