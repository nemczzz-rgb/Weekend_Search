// Contract of the Weekend Search knowledge base (plan section 9, rule P4).
// These types describe the JSON files in this folder and are the future API contract:
// do not remove or rename fields without a migration; ids are stable.
// Rules for filling the data: ./README.md. Validation: scripts/content/validate.mjs.

/** Kebab-case Latin id, unique within its collection. */
export type Id = string

/** https URL of the page where the fact was checked, or "owner" for material provided by the site owner. */
export type Source = string

/** A checked fact: shown to users only together with its source. Unknown facts are omitted, never guessed. */
export type Fact = {
  value: string
  source: Source
  /** YYYY-MM-DD */
  checkedAt: string
}

export type Place = {
  id: Id
  title: string
  kind: string
  area: string
  durationMinutes: number
  note: string
  tags: string[]
  /** Streets, squares, boulevards: the UI shows a generic "public space" description instead of facts. */
  publicSpace?: true
  address?: Fact
  hours?: Fact
  price?: Fact
  /** Additional pages that confirm the same facts. */
  extraSources?: string[]
  /** Map card link and address text as provided by the owner. */
  mapLink?: { url: string; address: string }
  /** Unsourced descriptive wording kept from earlier versions. Never contains digits; to be replaced by facts (TASK-046). */
  hints?: { address?: string; hours?: string; price?: string }
  /** Position on the legacy schematic map (not geographic). */
  scheme?: { x: number; y: number }
}

export type RouteTone = 'blue' | 'sage' | 'olive' | 'rust' | 'sand' | 'ink'

/** A walking route or day idea in the city: 1–6 places from places.json. */
export type Route = {
  id: Id
  title: string
  subtitle: string
  theme: string
  area: string
  tone: RouteTone
  days: 1 | 2
  placeIds: Id[]
  keywords: string[]
  image?: string
  imageAlt?: string
}

export type Event = {
  id: Id
  title: string
  /** YYYY-MM-DD */
  dateStart: string
  dateEnd?: string
  /** Free text such as "19:00" or "12:00–20:00". */
  time?: string
  placeId?: Id
  address?: string
  price?: string
  source: Source
  checkedAt: string
}

export type GenreId =
  | 'romance'
  | 'comedy'
  | 'drama'
  | 'thriller'
  | 'sci-fi'
  | 'fantasy'
  | 'family'
  | 'animation'
  | 'adventure'
  | 'cozy'

export const GENRES: Record<GenreId, string> = {
  romance: 'Романтика',
  comedy: 'Комедия',
  drama: 'Драма',
  thriller: 'Триллер',
  'sci-fi': 'Фантастика',
  fantasy: 'Фэнтези',
  family: 'Семейное кино',
  animation: 'Мультфильмы',
  adventure: 'Приключения',
  cozy: 'Уютное кино',
}

export type Film = {
  id: Id
  title: string
  originalTitle?: string
  /** Release year, checked at `source`. */
  year: number
  genres: GenreId[]
  /** "owner" — from the owner's list (shown first); "research" — added during research. */
  origin: 'owner' | 'research'
  /** Own short note, up to 100 characters. No plot copied from other sites. */
  note?: string
  source: Source
  checkedAt: string
}

export type Ingredient = {
  name: string
  amount?: number
  unit?: string
  note?: string
}

export type RecipeStep = {
  text: string
  durationMinutes?: number
  temperatureC?: number
}

export type Recipe = {
  id: Id
  title: string
  /** For example "4 основы 30×40 см". */
  yield: string
  leadTimeHours: { min: number; max: number }
  ingredients: { group: string; items: Ingredient[] }[]
  sections: { id: Id; title: string; steps: RecipeStep[] }[]
  tips?: string[]
  toppings?: { title: string; text: string }[]
  serving?: string[]
  source: Source
  checkedAt: string
}

export type Audience = 'solo' | 'pair' | 'friends' | 'family'

export type ActivityDetail =
  | { type: 'recipe'; recipeId: Id }
  | { type: 'films' }
  | { type: 'steps'; steps: string[] }
  | { type: 'places'; placeIds: Id[] }

export type Activity = {
  id: Id
  title: string
  location: 'home' | 'city'
  durationMinutes: number
  audience: Audience[]
  needs: string[]
  detail: ActivityDetail
  leadTimeHours?: { min: number; max: number }
  /** Why preparation starts in advance, up to 60 characters, e.g. "тесто 48–72 ч в холодильнике". Requires leadTimeHours. */
  leadTimeNote?: string
  image?: string
  imageAlt?: string
}

export type DayIdea = {
  id: Id
  title: string
  /** Up to 140 characters. */
  summary: string
  mode: 'home' | 'city' | 'mixed'
  /** 2–3 activities in the order they happen. */
  activityIds: Id[]
  keywords: string[]
  image?: string
  imageAlt?: string
}
