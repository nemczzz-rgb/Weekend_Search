// The only module that imports knowledge base JSON (plan section 12, rule P1).
// Places and routes are needed on the first screen and stay in the main bundle;
// the other collections are loaded on demand so each screen pulls only its data (AC-DI-14).
import placesJson from './places.json' with { type: 'json' }
import routesJson from './routes.json' with { type: 'json' }
import type { Collections, CollectionName, ContentSource } from './load.ts'
import type { Place, Route } from './types.ts'

/** Synchronous access for the current demo screens; TASK-050 moves them to ContentSource. */
export const legacyPlaces = placesJson as unknown as Place[]
export const legacyRoutes = routesJson as unknown as Route[]

const loaders: { [K in CollectionName]: () => Promise<Collections[K]> } = {
  places: async () => legacyPlaces,
  routes: async () => legacyRoutes,
  events: () => import('./events.json', { with: { type: 'json' } }).then(module => module.default as unknown as Collections['events']),
  films: () => import('./films.json', { with: { type: 'json' } }).then(module => module.default as unknown as Collections['films']),
  recipes: () => import('./recipes.json', { with: { type: 'json' } }).then(module => module.default as unknown as Collections['recipes']),
  activities: () => import('./activities.json', { with: { type: 'json' } }).then(module => module.default as unknown as Collections['activities']),
  'day-ideas': () => import('./day-ideas.json', { with: { type: 'json' } }).then(module => module.default as unknown as Collections['day-ideas']),
}

const cache = new Map<CollectionName, Promise<unknown>>()

export const staticContentSource: ContentSource = {
  getCollection<K extends CollectionName>(name: K): Promise<Collections[K]> {
    if (!cache.has(name)) {
      const pending = loaders[name]()
      cache.set(name, pending)
      pending.catch(() => cache.delete(name)) // a failed load can be retried ("Обновить")
    }
    return cache.get(name) as Promise<Collections[K]>
  },
  async getById<K extends CollectionName>(name: K, id: string) {
    const items = await this.getCollection(name)
    return (items as Array<{ id: string }>).find(item => item.id === id) as Collections[K][number] | undefined
  },
}
