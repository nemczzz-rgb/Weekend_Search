import { placeRecordById, type Place } from './data'
import type { Fact } from './content/types'

type Visit = {
  address?: string
  hours?: string
  price?: string
  source?: string
  secondarySource?: string
  checkedAt?: string
}

// Visit facts come from content/places.json; each fact carries its own source and check date.
// Dynamic schedules and tariffs stay linked to their source.
export function getVisit(place: Place): Visit {
  const record = placeRecordById.get(place.id)
  if (record?.publicSpace) {
    return {
      address: place.title + ', Москва',
      hours: 'Городское пространство; возможны ограничения',
      price: 'Прогулка без билета',
    }
  }
  if (!record) return { address: place.address }
  const facts = [record.address, record.hours, record.price].filter((fact): fact is Fact => Boolean(fact))
  const visit: Visit = {
    address: record.address?.value ?? record.hints?.address,
    hours: record.hours?.value ?? record.hints?.hours,
    price: record.price?.value ?? record.hints?.price,
    source: facts.find(fact => fact.source !== 'owner')?.source,
    secondarySource: record.extraSources?.[0],
    checkedAt: facts.map(fact => fact.checkedAt).sort()[0],
  }
  return Object.fromEntries(Object.entries(visit).filter(([, value]) => value !== undefined)) as Visit
}

export function placeMapUrl(place: Place, address?: string): string {
  if (place.sourceUrl && (!address || address === place.address)) return place.sourceUrl
  const text = [place.area === 'Подмосковье' ? 'Московская область' : 'Москва', place.title, address].filter(Boolean).join(', ')
  return 'https://yandex.ru/maps/?text=' + encodeURIComponent(text)
}
