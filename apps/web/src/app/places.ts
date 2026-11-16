// Shared presentation helpers for places and events (docs/ux/content-rules.md «Факты и источники»).
import type { Event, Place } from '../content/types.ts'
import type { IsoDate } from '../plan/dates.ts'

/** Map link: confirmed address first, then the owner's map card, then a search by name (not an address claim, D10). */
export function placeMapHref(place: Place): string {
  if (place.address && place.mapLink && place.address.value === place.mapLink.address) return place.mapLink.url
  if (place.address) return `https://yandex.ru/maps/?text=${encodeURIComponent(`Москва, ${place.address.value}`)}`
  if (place.mapLink) return place.mapLink.url
  return `https://yandex.ru/maps/?text=${encodeURIComponent(`${place.area === 'Подмосковье' ? 'Московская область' : 'Москва'}, ${place.title}`)}`
}

export function placeAddressText(place: Place): string | undefined {
  return place.address?.value ?? place.hints?.address ?? place.mapLink?.address
}

/** Facts for SourceFacts; public spaces show a generic description instead (content-rules). */
export function placeFacts(place: Place) {
  return place.publicSpace ? [] : [
    { label: 'Часы', fact: place.hours, unknown: place.hints?.hours ?? 'Уточнить перед визитом' },
    { label: 'Стоимость', fact: place.price, unknown: place.hints?.price ?? 'Нет подтверждённой цены' },
  ]
}

/** R-EVENT-1: an event is upcoming until its last day, inclusive. */
export const eventEnd = (event: Event): IsoDate => event.dateEnd ?? event.dateStart
export const isUpcoming = (event: Event, today: IsoDate) => eventEnd(event) >= today
/** R-EVENT-2, R-MOVE-4: the event happens on that date. */
export const eventOn = (event: Event | undefined, date: IsoDate) => Boolean(event && event.dateStart <= date && date <= eventEnd(event))
