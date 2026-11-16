import type { ContentSource } from '../../content/load.ts'
import type { Activity, DayIdea, Place, Recipe } from '../../content/types.ts'
export type CatalogData = { ideas: DayIdea[]; activities: Activity[]; routeCount: number }
export async function loadCatalog(source: ContentSource): Promise<CatalogData> {
  const [ideas, activities, routes] = await Promise.all([source.getCollection('day-ideas'), source.getCollection('activities'), source.getCollection('routes')])
  return { ideas, activities, routeCount: routes.length }
}
export type IdeaData = { idea?: DayIdea; activities: Activity[]; recipes: Recipe[]; places: Place[]; missingActivity: boolean }
export async function loadIdea(source: ContentSource, id: string): Promise<IdeaData> {
  const idea = await source.getById('day-ideas', id)
  if (!idea) return { activities: [], recipes: [], places: [], missingActivity: false }
  const results = await Promise.all(idea.activityIds.map(id => source.getById('activities', id)))
  const activities = results.filter((x): x is Activity => Boolean(x))
  const recipeIds = [...new Set(activities.flatMap(a => a.detail.type === 'recipe' ? [a.detail.recipeId] : []))]
  const placeIds = [...new Set(activities.flatMap(a => a.detail.type === 'places' ? a.detail.placeIds : []))]
  const [recipes, places] = await Promise.all([Promise.all(recipeIds.map(id => source.getById('recipes', id))), Promise.all(placeIds.map(id => source.getById('places', id)))])
  return { idea, activities, recipes: recipes.filter((x): x is Recipe => Boolean(x)), places: places.filter((x): x is Place => Boolean(x)), missingActivity: activities.length !== idea.activityIds.length }
}
