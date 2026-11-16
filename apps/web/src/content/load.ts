// Single entry point to the knowledge base for screens and logic (plan section 12, rule P1).
// Screens never import JSON: they ask a ContentSource. Today it is the static bundle;
// on an own server it becomes an API source with the same interface, and screens stay unchanged.
import type { Activity, DayIdea, Event, Film, Place, Recipe, Route } from './types.ts'
import { staticContentSource } from './static-source.ts'

export type Collections = {
  places: Place[]
  routes: Route[]
  events: Event[]
  films: Film[]
  recipes: Recipe[]
  activities: Activity[]
  'day-ideas': DayIdea[]
}

export type CollectionName = keyof Collections

export interface ContentSource {
  getCollection<K extends CollectionName>(name: K): Promise<Collections[K]>
  getById<K extends CollectionName>(name: K, id: string): Promise<Collections[K][number] | undefined>
}

let current: ContentSource = staticContentSource

export function getContentSource(): ContentSource {
  return current
}

/** Swap the source, e.g. for an API-backed implementation after moving to an own server, or in tests. */
export function setContentSource(source: ContentSource): void {
  current = source
}
