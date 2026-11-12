import type { Place } from './data'

type Visit = {
  address?: string
  hours?: string
  price?: string
  source?: string
  secondarySource?: string
}

// A snapshot for the demo. Dynamic schedules and tariffs stay linked to their source.
const visitById: Partial<Record<string, Visit>> = {
  izmailovo: {
    address: 'Московский просп., 2 · главный вход',
    hours: 'Территория круглосуточно',
    price: 'Вход свободный; аттракционы отдельно',
    source: 'https://www.izmailovsky-park.ru/adres',
  },
  kolibri: {
    hours: 'По сеансам · ТЦ указывает 09:00–02:00',
    price: '450–800 ₽ по проверенной афише',
    source: 'https://colibricinema.ru/',
    secondarySource: 'https://www.kapitoliy.ru/ru/malls/kapitoliy-sevastopolsky/shopping/kinoteatr-kolibri',
  },
  alpaca: {
    address: 'Воробьёвская наб., 37',
    hours: '10:00–20:00 по главному блоку; на сайте есть другой график',
    price: '1 400 ₽ взрослый · 1 200 ₽ детский',
    source: 'https://moscow.parkalpak.ru/',
  },
  ashram: {
    hours: 'По расписанию занятий',
    price: '3 300 ₽ за ряд очных занятий',
    source: 'https://ashram.pro/schedule/schedule-regular/',
  },
  cooltennis: {
    hours: 'Бронирование корта 07:00–00:00',
    price: 'Теннис 2 300–2 900 ₽/ч; сб–вс 2 500 ₽/ч',
    source: 'https://malevich.cooltennis.ru/',
  },
  mates: {
    hours: 'Пн–пт 09:00–22:00; сб–вс 10:00–23:00',
    price: 'Без входного билета, заказ по меню',
    source: 'https://mates-group.ru/pizza/khamovniki',
  },
  'cable-luzhniki': {
    hours: 'График меняется, проверьте дату поездки',
    price: '700 ₽ в одну сторону · 1 000 ₽ туда и обратно',
    source: 'https://srkvg.ru/kanatnaya-doroga/tarify/',
    secondarySource: 'https://srkvg.ru/kanatnaya-doroga/grafik-raboty/',
  },
  'novodevichy-ponds': { address: 'Новодевичий проезд · парк у прудов', hours: 'Круглосуточно по справочнику', price: 'Прогулка без билета', source: 'https://kudamoscow.ru/place/park-novodevichji-prudy/' },
  dvoyka: {
    hours: 'Вт–ср и вс 18:00–00:00; чт до 03:00; пт–сб до 04:30',
    price: 'Средний чек 1 000–1 500 ₽ по Restoran.ru',
    source: 'https://www.restoran.ru/msk/detailed/restaurants/dvoyka/',
  },
  'standup-patriki': {
    hours: 'По афише, время зависит от концерта',
    price: 'Например, 2 000 ₽ за шоу 14 ноября',
    source: 'https://standuppatriki.com/1411si',
    secondarySource: 'https://standuppatriki.com/afisha',
  },
  chetverg: { price: 'Без входного билета, заказ по меню' },
  'masa-madre': {
    hours: 'Ежедневно 08:00–00:00 по The Taste',
    price: 'Средний чек 1 500–2 000 ₽ по «Москва ресторанная»',
    source: 'https://thetaste.io/moscow/places/masa-madre/',
    secondarySource: 'https://moscowrestaurant.ru/restaurants/masa-madre',
  },
  'nothing-fancy': {
    hours: 'Ежедневно 08:30–21:00',
    price: 'Средний чек 1 000–3 000 ₽ по «Афише»',
    source: 'https://nothingfancy.ru/',
    secondarySource: 'https://www.afisha.ru/msk/restaurant/nothing-fancy-518796/',
  },
  hermitage: {
    address: 'ул. Каретный Ряд, 3',
    hours: 'Круглосуточно',
    price: 'Вход в сад свободный; события отдельно',
    source: 'https://www.mosgorsad.ru/garden/chasto-zadavaemy-voprosy/',
  },
  apothecary: {
    address: 'просп. Мира, 26, стр. 1',
    hours: 'Последний вход в сад до 19:00 по правилам посещения',
    price: '500 ₽ в будни · 600 ₽ в выходные и праздники',
    source: 'https://hortus.msu.ru/ticketprice.html',
    secondarySource: 'https://hortus.msu.ru/rules.html',
  },
  impression: {
    address: 'Ленинградский просп., 15, стр. 11',
    hours: 'Ср–чт 12:00–21:00; остальные дни 11:00–20:00',
    price: 'Стандартный билет от 700 ₽ по афише музея',
    source: 'https://www.rusimp.org/ru/tickets',
    secondarySource: 'https://www.rusimp.su/about',
  },
  depot: {
    address: 'ул. Лесная, 20А',
    hours: 'Пн–чт и вс 10:00–23:00; пт–сб 10:00–02:00',
    price: 'Без входного билета, заказ по меню',
    source: 'https://depomoscow.ru/contacts/',
  },
  tretyakov: {
    address: 'Лаврушинский пер., 10',
    hours: 'Вт–вс 10:00–21:00, вход до 20:00; пн закрыто',
    price: 'Ориентир 700 ₽ за основную экспозицию',
    source: 'https://www.tretyakovgallery.ru/for-visitors/museums/istoricheskoe-zdanie/',
    secondarySource: 'https://tretyakovskaja.ru/cena-bileta/',
  },
  muzeon: { address: 'Крымская набережная · парк искусств «Музеон»', price: 'Прогулка без билета', source: 'https://www.park-gorkogo.ru/faq/' },
  gorky: {
    address: 'ул. Крымский Вал, 9 · главный вход',
    hours: 'Круглосуточно, возможны закрытия из-за погоды',
    price: 'Вход в парк свободный; услуги отдельно',
    source: 'https://www.park-gorkogo.ru/faq/',
  },
  neskuchny: {
    address: 'Нескучный сад · вход со стороны Ленинского проспекта',
    hours: 'Круглосуточно',
    price: 'Прогулка без билета',
    source: 'https://parkgorkogo.ru/areas/neskuchny-garden/',
  },
  zaryadye: {
    address: 'ул. Варварка, 6, стр. 1',
    hours: 'Территория круглосуточно; павильоны по графику',
    price: 'Вход в парк свободный; павильоны отдельно',
    source: 'https://welcome.zaryadyepark.ru/',
    secondarySource: 'https://moy-region.ru/objects/park-zaryadye',
  },
  vakhtangov: {
    address: 'ул. Арбат, 26',
    hours: 'Касса в сезон 12:00–20:00; спектакли по афише',
    price: 'По спектаклю и месту в зале',
    source: 'https://vakhtangov.ru/contacts/',
    secondarySource: 'https://vakhtangov.ru/tickets/',
  },
  pushkin: {
    address: 'ул. Волхонка, 12 · Главное здание',
    hours: 'Вт–ср 11:00–20:00, чт–пт 11:00–21:00, сб 10:00–21:00, вс 10:00–20:00',
    price: 'Ориентир 700 ₽ за билет в Главное здание',
    source: 'https://pushkinmuseum.art/museum/buildings/main/',
    secondarySource: 'https://enfilade.guide/ru/moskva/pushkinskiy-muzey',
  },
  novodevichy: { address: 'Новодевичий проезд, 1', hours: '08:00–18:00 по паломническому справочнику', price: 'Территория свободно; музей отдельно', source: 'https://azbyka.ru/palomnik/Богородице-Смоленский_Новодевичий_женский_монастырь_в_Москве', secondarySource: 'https://novodev.msk.ru/' },
  vorobyovy: { address: 'Воробьёвы горы · смотровая площадка', price: 'Прогулка без билета' },
  vdnh: {
    address: 'просп. Мира, 119 · главный вход',
    hours: 'Территория круглосуточно; павильоны по графику',
    price: 'Вход на территорию свободный; выставки отдельно',
    source: 'https://vdnh.ru/visitors/FAQ/',
  },
  cosmos: {
    address: 'просп. Мира, 111',
    hours: 'Сб 10:00–21:00; вс 10:00–19:00. Будни на сайте',
    price: '500 ₽ взрослый · 350 ₽ детский (7–18 лет)',
    source: 'https://kosmo-museum.ru/static_pages/stoimost-biletov',
  },
  ostankino: { address: 'Останкинский парк · вход от пруда', price: 'Прогулка без билета', source: 'https://vdnh.ru/places/vkhod-v-park-ostankino-so-storony-dvortsovogo-ostankinskogo-pruda/' },
  flacon: {
    address: 'Большая Новодмитровская ул., 36',
    hours: 'Территория круглосуточно; магазины по графику',
    price: 'Вход на территорию свободный; события отдельно',
    source: 'https://design-zavod.ru/contacts',
  },
  hleb: {
    address: 'Новодмитровская ул., 1',
    hours: 'Заведения по своему графику',
    price: 'Прогулка без билета; события отдельно',
    source: 'https://hlebozavod9.ru/contacts',
  },
}

const publicSpaces = new Set([
  'patriarch', 'ermolova', 'mira', 'red-square', 'nikolskaya', 'kitay',
  'khitrovka', 'chistye', 'pokrovka', 'arbat', 'preo', 'savelovsky', 'krymsky', 'bolotnaya',
])

export function getVisit(place: Place): Visit {
  if (publicSpaces.has(place.id)) {
    return {
      address: place.title + ', Москва',
      hours: 'Городское пространство; возможны ограничения',
      price: 'Прогулка без билета',
    }
  }
  return { address: place.address, ...visitById[place.id] }
}

export function placeMapUrl(place: Place, address?: string): string {
  if (place.sourceUrl && (!address || address === place.address)) return place.sourceUrl
  const text = [place.area === 'Подмосковье' ? 'Московская область' : 'Москва', place.title, address].filter(Boolean).join(', ')
  return 'https://yandex.ru/maps/?text=' + encodeURIComponent(text)
}
