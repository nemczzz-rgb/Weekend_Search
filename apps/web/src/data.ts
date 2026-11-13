import placeRecords from './content/places.json'
import routeRecords from './content/routes.json'
import type { Place as PlaceRecord, Route as RouteRecord } from './content/types'

// UI shapes used by App, planner and visit. The data itself lives in ./content (knowledge base, TASK-035).
// Temporary adapter: TASK-047 replaces direct JSON imports with content/load.ts (plan section 12, P1).

export type Place = {
  id: string
  title: string
  kind: string
  area: string
  duration: number
  note: string
  address?: string
  sourceUrl?: string
  tags: string[]
  x: number
  y: number
}

export type RouteIdea = {
  id: string
  title: string
  subtitle: string
  theme: string
  area: string
  tone: string
  days: 1 | 2
  places: string[]
  keywords: string[]
}

export const placeRecordById = new Map((placeRecords as PlaceRecord[]).map(record => [record.id, record]))

export const places: Place[] = (placeRecords as PlaceRecord[]).map(record => ({
  id: record.id,
  title: record.title,
  kind: record.kind,
  area: record.area,
  duration: record.durationMinutes,
  note: record.note,
  address: record.mapLink?.address,
  sourceUrl: record.mapLink?.url,
  tags: record.tags,
  x: record.scheme?.x ?? NaN,
  y: record.scheme?.y ?? NaN,
}))

export const placeById = new Map(places.map(place => [place.id, place]))

export const routeIdeas: RouteIdea[] = (routeRecords as RouteRecord[]).map(record => ({
  id: record.id,
  title: record.title,
  subtitle: record.subtitle,
  theme: record.theme,
  area: record.area,
  tone: record.tone,
  days: record.days,
  places: record.placeIds,
  keywords: record.keywords,
}))
