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

// Редакционные примеры для интерфейса. Координаты ниже — позиции на условной схеме,
// а не географические координаты. Расписание и доступность не проверены.
export const places: Place[] = [
  // Места из сообщения пользователя; ссылки не открывались. Длительность — ориентир для плана.
  { ...{"id":"izmailovo","title":"Измайловский парк культуры и отдыха","kind":"Парк","area":"Москва","address":"Москва, Измайловский парк культуры и отдыха","note":"Большой парк для прогулок на свежем воздухе. Можно устроить спокойный день среди деревьев или выбрать развлечения на месте.","tags":["парки","прогулки","природа"],"sourceUrl":"https://yandex.ru/maps/-/CXCbaYMS","duration":120}, x: NaN, y: NaN },
  { ...{"id":"kolibri","title":"Колибри","kind":"Кинотеатр","area":"Москва","address":"Севастопольский просп., 11Е","note":"Кинотеатр с двумя форматами залов: с кроватями и с кожаными диванами. Идея для необычного похода в кино.","tags":["кино","фильм","свидание"],"sourceUrl":"https://yandex.ru/maps/org/kolibri/54014074111","duration":120}, x: NaN, y: NaN },
  { ...{"id":"alpaca","title":"Парк Альпак Симба","kind":"Животные","area":"Москва","address":"Москва, Воробьёвская набережная","note":"Контактный зоопарк с альпаками, козами и кроликами. Вариант выходного для тех, кто хочет пообщаться с животными.","tags":["животные","альпаки","прогулки"],"sourceUrl":"https://yandex.ru/maps/org/park_alpak_simba/74506249230","duration":60}, x: NaN, y: NaN },
  { ...{"id":"ashram","title":"Ашрам","kind":"Йога","area":"Москва","address":"Малая Никитская ул., 20, стр. 1","note":"Студия с разными практиками: кундалини-йога, цигун, гонг-медитация, аштанга-йога. Можно выбрать занятие под своё настроение.","tags":["йога","медитация","спокойно"],"sourceUrl":"https://yandex.ru/maps/org/ashram/62896534639","duration":90}, x: NaN, y: NaN },
  { ...{"id":"cooltennis","title":"CoolTennis","kind":"Спорт","area":"Подмосковье","address":"Московская область, Одинцовский городской округ, парк Малевича","note":"Падел-клуб для игры в падел и большой теннис на грунтовых кортах. Идея для активной встречи с друзьями за городом.","tags":["спорт","падел","теннис","друзья"],"sourceUrl":"https://yandex.ru/maps/org/cooltennis/194155465381","duration":90}, x: NaN, y: NaN },
  { ...{"id":"mates","title":"Mátes Пицца","kind":"Ресторан","area":"Москва","address":"Усачёва ул., 11А","note":"Пицца, салаты, паста, мясные блюда и десерты. Можно собраться за общим столом и поделиться пиццей.","tags":["еда","пицца","друзья"],"sourceUrl":"https://yandex.ru/maps/org/m_tes_pitstsa/81083329919","duration":60}, x: NaN, y: NaN },
  { ...{"id":"cable-luzhniki","title":"Станция канатной дороги «Лужники»","kind":"Виды","area":"Москва","address":"ул. Лужники, 24, стр. 59","note":"Вариант посмотреть на Москву-реку, «Лужники» и город с высоты. Работу канатной дороги нужно уточнить перед поездкой.","tags":["виды","высота","канатная дорога"],"sourceUrl":"https://yandex.ru/maps/org/stantsiya_kanatnoy_dorogi_luzhniki/222713106182","duration":45}, x: NaN, y: NaN },
  { ...{"id":"novodevichy-ponds","title":"Парк Новодевичьи Пруды","kind":"Парк","area":"Москва","address":"Москва, парк Новодевичьи пруды","note":"Парк рядом с Новодевичьим монастырём: аллеи, пруды и мостик из белого камня. Идея для неспешной прогулки.","tags":["парки","пруды","прогулки","тихо"],"sourceUrl":"https://yandex.ru/maps/org/park_novodevichyi_prudy/90645137331","duration":60}, x: NaN, y: NaN },
  { ...{"id":"dvoyka","title":"Шотошная Двойка на Солянке","kind":"Бар · 18+","area":"Москва","address":"ул. Солянка, 1/2с2","note":"Бар с шотами и авторскими коктейлями для вечерней встречи совершеннолетней компании.","tags":["бар","вечер","коктейли","18+"],"sourceUrl":"https://yandex.ru/maps/org/shotoshnaya_dvoyka_na_solyanke/55653196374","duration":90}, x: NaN, y: NaN },
  { ...{"id":"standup-patriki","title":"Stand Up Патрики","kind":"Стендап","area":"Москва","address":"Садовая-Кудринская ул., 20","note":"Концертный зал недалеко от метро «Баррикадная»: мини-сцена, столики, бар и закуски. Выступления и возрастные ограничения зависят от афиши.","tags":["стендап","юмор","концерт","друзья"],"sourceUrl":"https://yandex.ru/maps/org/stand_up_patriki/96773877521","duration":90}, x: NaN, y: NaN },
  { ...{"id":"chetverg","title":"Четверг","kind":"Кофейня","area":"Москва","address":"2-я Тверская-Ямская ул., 18","note":"Кофейня с тёплым деревянным интерьером, необычными светильниками, скворечниками и выпечкой. Идея для уютной паузы.","tags":["кофе","выпечка","еда","уют"],"sourceUrl":"https://yandex.ru/maps/org/chetverg/145539923127","duration":45}, x: NaN, y: NaN },
  { ...{"id":"masa-madre","title":"Masa Madre","kind":"Пекарня","area":"Москва","address":"ул. Солянка, 1/2с1","note":"Пекарня со свежим хлебом, бриошами и десертами, в том числе лимонным и шоколадным чизкейками.","tags":["выпечка","хлеб","десерты","еда"],"sourceUrl":"https://yandex.ru/maps/org/masa_madre/149289437157","duration":45}, x: NaN, y: NaN },
  { ...{"id":"nothing-fancy","title":"Nothing Fancy","kind":"Кафе","area":"Москва","address":"ул. Петровка, 30/7","note":"Кафе с завтраками, боулами и смузи. Среди вариантов — яйца Бенедикт, омлеты, авокадо-тосты и каши.","tags":["завтрак","еда","кафе","смузи"],"sourceUrl":"https://yandex.ru/maps/org/nothing_fancy/86534115833","duration":60}, x: NaN, y: NaN },

  { id: 'patriarch', title: 'Патриаршие пруды', kind: 'Прогулка', area: 'Пресненский', duration: 45, note: 'Пруд и переулки вокруг', tags: ['прогулки', 'вода', 'тихо'], x: 35, y: 36 },
  { id: 'ermolova', title: 'Тверской бульвар', kind: 'Бульвар', area: 'Тверской', duration: 35, note: 'Зелёный путь по центру', tags: ['прогулки', 'архитектура'], x: 47, y: 40 },
  { id: 'hermitage', title: 'Сад «Эрмитаж»', kind: 'Сад', area: 'Тверской', duration: 45, note: 'Пауза среди деревьев', tags: ['сады', 'прогулки', 'тихо'], x: 55, y: 31 },
  { id: 'mira', title: 'Проспект Мира', kind: 'Улица', area: 'Мещанский', duration: 35, note: 'Городские фасады и кафе', tags: ['архитектура', 'еда'], x: 65, y: 27 },
  { id: 'apothecary', title: 'Аптекарский огород', kind: 'Сад', area: 'Мещанский', duration: 70, note: 'Растения и сезонные экспозиции', tags: ['сады', 'прогулки', 'тихо'], x: 69, y: 25 },
  { id: 'impression', title: 'Музей русского импрессионизма', kind: 'Музей', area: 'Беговой', duration: 85, note: 'Искусство в бывшем фабричном здании', tags: ['искусство', 'музей', 'выставка'], x: 31, y: 24 },
  { id: 'depot', title: 'Депо. Москва', kind: 'Еда', area: 'Марьина Роща', duration: 60, note: 'Остановка на обед', tags: ['еда', 'кафе'], x: 72, y: 19 },
  { id: 'tretyakov', title: 'Третьяковская галерея', kind: 'Музей', area: 'Замоскворечье', duration: 100, note: 'Большая коллекция русского искусства', tags: ['искусство', 'музей', 'выставка'], x: 55, y: 67 },
  { id: 'muzeon', title: 'Музеон', kind: 'Парк', area: 'Якиманка', duration: 60, note: 'Скульптуры и дорожки у реки', tags: ['искусство', 'прогулки', 'парки'], x: 45, y: 71 },
  { id: 'gorky', title: 'Парк Горького', kind: 'Парк', area: 'Якиманка', duration: 80, note: 'Длинная прогулка вдоль Москвы-реки', tags: ['парки', 'прогулки', 'вода'], x: 43, y: 78 },
  { id: 'neskuchny', title: 'Нескучный сад', kind: 'Сад', area: 'Гагаринский', duration: 65, note: 'Аллеи и спокойные тропы', tags: ['сады', 'парки', 'тихо'], x: 35, y: 84 },
  { id: 'zaryadye', title: 'Парк «Зарядье»', kind: 'Парк', area: 'Тверской', duration: 55, note: 'Виды на центр и реку', tags: ['парки', 'архитектура', 'вода'], x: 62, y: 55 },
  { id: 'red-square', title: 'Красная площадь', kind: 'Площадь', area: 'Тверской', duration: 45, note: 'Городская классика', tags: ['история', 'архитектура', 'прогулки'], x: 56, y: 51 },
  { id: 'nikolskaya', title: 'Никольская улица', kind: 'Улица', area: 'Тверской', duration: 35, note: 'Пешеходная улица в центре', tags: ['прогулки', 'архитектура'], x: 61, y: 47 },
  { id: 'kitay', title: 'Китай-город', kind: 'Район', area: 'Басманный', duration: 55, note: 'Сеть старых улиц и переулков', tags: ['история', 'архитектура', 'дворы'], x: 70, y: 48 },
  { id: 'khitrovka', title: 'Хитровская площадь', kind: 'Площадь', area: 'Басманный', duration: 40, note: 'Небольшая площадь старого города', tags: ['история', 'дворы', 'тихо'], x: 76, y: 57 },
  { id: 'chistye', title: 'Чистые пруды', kind: 'Прогулка', area: 'Басманный', duration: 50, note: 'Пруд и бульвар', tags: ['прогулки', 'вода', 'тихо'], x: 72, y: 39 },
  { id: 'pokrovka', title: 'Покровка', kind: 'Улица', area: 'Басманный', duration: 45, note: 'Фасады и небольшие заведения', tags: ['архитектура', 'еда', 'дворы'], x: 78, y: 45 },
  { id: 'arbat', title: 'Старый Арбат', kind: 'Улица', area: 'Арбат', duration: 45, note: 'Пешеходная прогулка', tags: ['прогулки', 'история'], x: 33, y: 54 },
  { id: 'vakhtangov', title: 'Театр Вахтангова', kind: 'Театр', area: 'Арбат', duration: 30, note: 'Знаковое место улицы', tags: ['театр', 'культура', 'архитектура'], x: 31, y: 58 },
  { id: 'pushkin', title: 'Пушкинский музей', kind: 'Музей', area: 'Хамовники', duration: 90, note: 'Искусство разных эпох', tags: ['искусство', 'музей', 'выставка'], x: 40, y: 61 },
  { id: 'preo', title: 'Пречистенка', kind: 'Улица', area: 'Хамовники', duration: 45, note: 'Особняки и спокойный маршрут', tags: ['архитектура', 'история', 'прогулки'], x: 35, y: 67 },
  { id: 'novodevichy', title: 'Новодевичий монастырь', kind: 'Архитектура', area: 'Хамовники', duration: 60, note: 'Исторический ансамбль и пруд', tags: ['история', 'архитектура', 'вода'], x: 24, y: 79 },
  { id: 'vorobyovy', title: 'Воробьёвы горы', kind: 'Парк', area: 'Раменки', duration: 70, note: 'Панорама города', tags: ['виды', 'парки', 'прогулки'], x: 22, y: 88 },
  { id: 'vdnh', title: 'ВДНХ', kind: 'Парк', area: 'Останкинский', duration: 95, note: 'Павильоны и широкие аллеи', tags: ['архитектура', 'парки', 'прогулки'], x: 74, y: 11 },
  { id: 'cosmos', title: 'Музей космонавтики', kind: 'Музей', area: 'Останкинский', duration: 85, note: 'История освоения космоса', tags: ['музей', 'история', 'космос'], x: 79, y: 15 },
  { id: 'ostankino', title: 'Останкинский парк', kind: 'Парк', area: 'Останкинский', duration: 60, note: 'Аллеи для спокойной прогулки', tags: ['парки', 'прогулки', 'тихо'], x: 69, y: 12 },
  { id: 'flacon', title: 'Дизайн-завод «Флакон»', kind: 'Креативное пространство', area: 'Бутырский', duration: 65, note: 'Дизайн, магазины и кафе', tags: ['дизайн', 'еда', 'культура'], x: 54, y: 17 },
  { id: 'hleb', title: 'Хлебозавод № 9', kind: 'Креативное пространство', area: 'Бутырский', duration: 65, note: 'Городская среда и события', tags: ['дизайн', 'еда', 'культура'], x: 58, y: 18 },
  { id: 'savelovsky', title: 'Савёловский район', kind: 'Район', area: 'Савёловский', duration: 40, note: 'Современный городской маршрут', tags: ['дизайн', 'прогулки'], x: 44, y: 19 },
  { id: 'krymsky', title: 'Крымская набережная', kind: 'Набережная', area: 'Якиманка', duration: 55, note: 'Прогулка у воды', tags: ['вода', 'прогулки', 'виды'], x: 43, y: 68 },
  { id: 'bolotnaya', title: 'Болотная набережная', kind: 'Набережная', area: 'Якиманка', duration: 45, note: 'Речной маршрут недалеко от центра', tags: ['вода', 'прогулки', 'виды'], x: 54, y: 60 },
]

export const placeById = new Map(places.map(place => [place.id, place]))

export const routeIdeas: RouteIdea[] = [
  {"id":"breakfast","title":"Начать день с завтрака","subtitle":"Завтрак в Nothing Fancy, затем прогулка в саду «Эрмитаж»","theme":"Еда","area":"Москва","tone":"sand","days":1,"places":["nothing-fancy","hermitage"],"keywords":["завтрак","боул","смузи"]},
  {"id":"cinema","title":"Кино с необычным комфортом","subtitle":"Выбрать фильм и устроиться в зале с кроватями или диванами","theme":"Кино","area":"Москва","tone":"ink","days":1,"places":["kolibri"],"keywords":["кино","фильм","кинотеатр"]},
  {"id":"animals","title":"День с альпаками","subtitle":"Познакомиться с животными на Воробьёвской набережной","theme":"Животные","area":"Москва","tone":"sage","days":1,"places":["alpaca"],"keywords":["альпаки","животные","козы","кролики"]},
  {"id":"yoga","title":"Выдохнуть на йоге","subtitle":"Выбрать практику в «Ашраме» и посвятить время себе","theme":"Спокойно","area":"Москва","tone":"olive","days":1,"places":["ashram"],"keywords":["йога","цигун","медитация","практика"]},
  {"id":"padel","title":"Попробовать падел","subtitle":"Собрать компанию и выбраться в парк Малевича на игру","theme":"Спорт","area":"Подмосковье","tone":"blue","days":1,"places":["cooltennis"],"keywords":["падел","теннис","спорт","активно"]},
  {"id":"pizza-ponds","title":"Пицца и прогулка у прудов","subtitle":"Пообедать в Mátes и выбрать время для Новодевичьих прудов","theme":"С друзьями","area":"Москва","tone":"rust","days":1,"places":["mates","novodevichy-ponds"],"keywords":["пицца","пруды","друзья"]},
  {"id":"height","title":"Посмотреть на город сверху","subtitle":"Выбрать канатную дорогу как главное впечатление дня","theme":"Виды","area":"Москва","tone":"blue","days":1,"places":["cable-luzhniki"],"keywords":["высота","канатная","панорама"]},
  {"id":"forest","title":"Большая парковая пауза","subtitle":"Провести несколько часов в Измайловском парке без спешки","theme":"Прогулки","area":"Москва","tone":"sage","days":1,"places":["izmailovo"],"keywords":["измайлово","измайловский","лес","парк"]},
  {"id":"standup","title":"Вечер со стендапом","subtitle":"Выбрать выступление в Stand Up Патрики по афише","theme":"С друзьями","area":"Москва","tone":"rust","days":1,"places":["standup-patriki"],"keywords":["стендап","юмор","смеяться"]},
  {"id":"coffee","title":"Кофе и уютные детали","subtitle":"Зайти в «Четверг» за выпечкой и рассмотреть интерьер","theme":"Еда","area":"Москва","tone":"sand","days":1,"places":["chetverg"],"keywords":["кофе","кофейня","выпечка","уют"]},
  {"id":"bakery","title":"Выпечка и старые улицы","subtitle":"Masa Madre и прогулка по Китай-городу в своём темпе","theme":"Еда","area":"Москва","tone":"olive","days":1,"places":["masa-madre","kitay"],"keywords":["бриошь","хлеб","десерт","пекарня"]},
  {"id":"bar-evening","title":"Вечер на Солянке · 18+","subtitle":"Встреча совершеннолетней компании в баре «Двойка»","theme":"Вечер · 18+","area":"Москва","tone":"ink","days":1,"places":["dvoyka"],"keywords":["бар","коктейли","шоты","18+"]},

  { id: 'old-city', title: 'Старая Москва', subtitle: 'Переулки, площади и городские истории', theme: 'История', area: 'Центр', tone: 'rust', days: 1, places: ['nikolskaya', 'kitay', 'khitrovka', 'pokrovka'], keywords: ['история', 'старый', 'старинный', 'двор', 'переулок', 'архитектура'] },
  { id: 'art', title: 'День с искусством', subtitle: 'Галереи и прогулка между ними', theme: 'Искусство', area: 'Центр', tone: 'olive', days: 1, places: ['pushkin', 'krymsky', 'tretyakov', 'muzeon'], keywords: ['искусство', 'музей', 'выставка', 'галерея', 'культура'] },
  { id: 'parks', title: 'Зелёный маршрут', subtitle: 'Сады и парки без спешки', theme: 'Прогулки', area: 'Юг', tone: 'sage', days: 1, places: ['muzeon', 'gorky', 'neskuchny', 'vorobyovy'], keywords: ['парк', 'природа', 'зелень', 'сад', 'гулять', 'прогулка'] },
  { id: 'water', title: 'Город у воды', subtitle: 'Набережные и открытые виды', theme: 'Виды', area: 'Центр', tone: 'blue', days: 1, places: ['zaryadye', 'bolotnaya', 'krymsky', 'gorky'], keywords: ['вода', 'река', 'набережная', 'вид', 'закат'] },
  { id: 'arbat', title: 'Арбат и окрестности', subtitle: 'Улица, музей и тихая Пречистенка', theme: 'Культура', area: 'Арбат', tone: 'sand', days: 1, places: ['arbat', 'vakhtangov', 'pushkin', 'preo'], keywords: ['арбат', 'театр', 'центр', 'история', 'искусство'] },
  { id: 'north', title: 'Север города', subtitle: 'Павильоны, космос и аллеи', theme: 'Исследовать', area: 'Останкинский', tone: 'ink', days: 1, places: ['vdnh', 'cosmos', 'ostankino'], keywords: ['вднх', 'космос', 'павильон', 'север', 'музей'] },
  { id: 'creative', title: 'Креативная Москва', subtitle: 'Дизайн, пространства и кафе', theme: 'Современное', area: 'Бутырский', tone: 'rust', days: 1, places: ['savelovsky', 'flacon', 'hleb', 'depot'], keywords: ['дизайн', 'современный', 'кафе', 'еда', 'креатив'] },
  { id: 'quiet', title: 'Медленный день', subtitle: 'Сад, бульвар и прогулка без плана', theme: 'Спокойно', area: 'Центр', tone: 'sage', days: 1, places: ['patriarch', 'ermolova', 'hermitage', 'chistye'], keywords: ['тихо', 'спокойно', 'неторопливо', 'отдохнуть', 'прогулка'] },
  { id: 'classics', title: 'Впервые в Москве', subtitle: 'Главные места и виды города', theme: 'Классика', area: 'Центр', tone: 'blue', days: 1, places: ['red-square', 'nikolskaya', 'zaryadye', 'bolotnaya'], keywords: ['впервые', 'главное', 'классика', 'кремль', 'площадь'] },
  { id: 'weekend', title: 'Большие выходные', subtitle: 'Два разных настроения за два дня', theme: 'Два дня', area: 'Разные районы', tone: 'olive', days: 2, places: ['patriarch', 'impression', 'hermitage', 'tretyakov', 'muzeon', 'gorky'], keywords: ['два дня', 'выходные', 'разное', 'всё'] },
  {"id":"photo","title":"Фотопрогулка по центру","subtitle":"Выбери один цвет и найди его в вывесках, фасадах и отражениях","theme":"Фото","area":"Центр","tone":"rust","days":1,"places":["nikolskaya","kitay","pokrovka"],"keywords":["фото","камера","снимки"]},
  {"id":"date","title":"Свидание без спешки","subtitle":"Прогулка у пруда, любимый напиток с собой и время поговорить","theme":"Вдвоём","area":"Пресненский","tone":"sand","days":1,"places":["patriarch","ermolova"],"keywords":["свидание","вдвоем","романтика"]},
  {"id":"sketch","title":"Город в скетчбуке","subtitle":"Возьми блокнот и зарисуй три детали, которые обычно не замечаешь","theme":"Творчество","area":"Хамовники","tone":"olive","days":1,"places":["preo","pushkin"],"keywords":["рисовать","скетч","творчество"]},
  {"id":"river-break","title":"Час у реки","subtitle":"Оставь наушники в кармане и устрой короткую прогулку у воды","theme":"Спокойно","area":"Якиманка","tone":"blue","days":1,"places":["krymsky","muzeon"],"keywords":["час","коротко","перерыв"]},
  {"id":"friends","title":"Встретиться с друзьями","subtitle":"Посмотреть дизайн-пространства и выбрать место для долгого разговора","theme":"С друзьями","area":"Бутырский","tone":"rust","days":1,"places":["flacon","hleb"],"keywords":["друзья","компания","встреча"]},
  {"id":"solo","title":"День для себя","subtitle":"Неспешная прогулка без списка обязательных впечатлений","theme":"Спокойно","area":"Тверской","tone":"sage","days":1,"places":["hermitage","ermolova"],"keywords":["одному","одной","соло","себя"]},
  {"id":"architecture","title":"Охота за деталями","subtitle":"Найди необычную дверь, балкон и фасад; собери маленькую коллекцию","theme":"Архитектура","area":"Хамовники","tone":"sand","days":1,"places":["preo","arbat"],"keywords":["детали","фасады","особняки"]},
  {"id":"cosmic","title":"Космическое настроение","subtitle":"Выбери музей или прогулку среди павильонов и узнай что-нибудь новое","theme":"Исследовать","area":"Останкинский","tone":"ink","days":1,"places":["cosmos","vdnh"],"keywords":["космос","узнать","наука"]},
  {"id":"green-pause","title":"Пауза среди деревьев","subtitle":"Возьми термос, отложи телефон и прогуляйся в своём темпе","theme":"Прогулки","area":"Якиманка","tone":"sage","days":1,"places":["gorky","neskuchny"],"keywords":["деревья","термос","тишина"]},
  {"id":"postcards","title":"Открытки из Москвы","subtitle":"Сними три городских вида и отправь друзьям свою открытку","theme":"Фото","area":"Центр","tone":"blue","days":1,"places":["red-square","zaryadye","bolotnaya"],"keywords":["открытки","фото","виды"]},
  {"id":"art-slow","title":"Один музей — без марафона","subtitle":"Выбери пять работ и придумай для каждой своё название","theme":"Искусство","area":"Замоскворечье","tone":"olive","days":1,"places":["tretyakov"],"keywords":["музей","картины","дождь"]},
  {"id":"ponds","title":"Разговоры у пруда","subtitle":"Небольшая прогулка, разговор и поиск отражений в воде","theme":"Вдвоём","area":"Басманный","tone":"blue","days":1,"places":["chistye","pokrovka"],"keywords":["пруд","поговорить","вдвоем"]},
]
