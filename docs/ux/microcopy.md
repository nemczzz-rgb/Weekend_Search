# Тексты интерфейса

- Статус: **на утверждении владелицей** (nemczzz-rgb). Правила тона и форматов — [content-rules.md](content-rules.md).
- Ключ — имя для кода: экраны TASK-048–050 держат тексты в одном модуле. `‹…›` — подставляемое значение; форматы дат, сроков и склонений — по content-rules.
- Стрелка ↗ — только у ссылок на внешние сайты. У переходов внутри сайта — →.

## Навигация и общее

| Ключ | Текст |
| --- | --- |
| `header.note` | МОСКВА / WEEKEND GUIDE |
| `nav.dayIdeas` | Идеи для дня |
| `nav.routes` | Маршруты |
| `nav.places` | Места |
| `nav.plan` | Мой план |
| `nav.city` | Город (только запасной ход, см. IA) |
| `nav.home.aria` | Weekend Search — главная |
| `nav.skip` | Перейти к содержимому |
| `common.back.dayIdeas` | ← Идеи для дня |
| `common.back.routes` | ← Маршруты |
| `common.back.home` | ← Главная |
| `common.back.plan` | ← Мой план |
| `common.reset` | Сбросить × |
| `common.resetFilters` | Сбросить фильтры |
| `common.found` | Найдено ‹N› |
| `common.loading.error` | Не получилось загрузить данные. Обновите страницу |
| `common.reload` | Обновить |
| `common.undo` | Отменить |
| `common.cancel` | Отмена |
| `common.openPlan` | Открыть план |
| `common.external.aria` | откроется в новой вкладке |
| `footer.tagline` | Идеи, маршруты и места на выходные |

## Главная

| Ключ | Текст |
| --- | --- |
| `home.label` | МОСКВА |
| `home.title` | Выходные в Москве |
| `home.description` | Идеи для дня дома и в городе, маршруты и места. Соберите свой день. |
| `home.cta.dayIdeas` | Идеи для дня → |
| `home.cta.places` | Найти место → |
| `wish.label` | Что хочется? |
| `wish.placeholder` | Например: парк и спа-вечер |
| `wish.submit.aria` | Подобрать по пожеланию |
| `wish.hint` | Подбор работает по словам и темам. |
| `wish.examples` | музей, а вечером дома фильм · парк и спа-вечер · хочу весь день дома · пицца и кино |
| `home.dayIdeas.kicker` | 01 / ИДЕИ ДЛЯ ДНЯ |
| `home.dayIdeas.title` | Чем заняться |
| `home.dayIdeas.all` | Все идеи для дня (‹N›) → |
| `home.routes.kicker` | 02 / МАРШРУТЫ |
| `home.routes.title` | По городу |
| `home.routes.all` | Все маршруты (‹N›) → |

## Идеи для дня

| Ключ | Текст |
| --- | --- |
| `dayIdeas.kicker` | 01 / ИДЕИ ДЛЯ ДНЯ |
| `dayIdeas.title` | Идеи для дня |
| `dayIdeas.subtitle` | Сценарии из двух-трёх занятий: дома, в городе или и то и другое. |
| `dayIdeas.filter.mode` | Все · Дома · В городе · Вместе |
| `dayIdeas.filter.for` | Для кого: Одному · Вдвоём · С друзьями · С семьёй |
| `dayIdeas.filter.time` | Время: До 2 ч · 2–4 ч · Больше 4 ч |
| `dayIdeas.empty.filters` | Под такие условия идей нет |
| `dayIdeas.empty.base` | Идей для дня пока нет. Посмотрите маршруты по городу → |
| `dayIdeas.moreRoutes` | Ещё ‹N› маршрутов по городу → |
| `card.open` | Открыть → |
| `card.time` | Около ‹длительность› |
| `card.needs` | Понадобится: ‹список›‹ и ещё N› |
| `status.today` | Можно сегодня |
| `status.later` | Лучше в другой день |
| `status.lead` | Начать за ‹срок› |
| `status.reason.default` | Нужна подготовка заранее |

Причина в статусе — `leadTimeNote` из данных с заглавной буквы («Тесто 48–72 ч в холодильнике»); если поля нет — `status.reason.default`.

## Идея для дня (подробно)

| Ключ | Текст |
| --- | --- |
| `idea.kicker` | ИДЕЯ ДЛЯ ДНЯ · ‹ВИД› |
| `idea.meta` | ‹для кого› · Около ‹длительность› |
| `idea.lead.title` | Начать за ‹срок› |
| `idea.lead.text` | ‹leadTimeNote с заглавной›. Сегодня с нуля не получится. |
| `idea.needs.title` | Что понадобится |
| `idea.noData` | Пока нет данных |
| `idea.prepWarning` | Если заготовки ещё нет, к этому дню она не успеет. Ближайший подходящий день — ‹дата› |
| `recipe.yield` | Выход: ‹yield› |
| `recipe.source.owner` | Рецепт автора сайта |
| `recipe.source.web` | По рецепту ‹домен› ↗ |
| `recipe.ingredients` | Ингредиенты |
| `recipe.tips` | Советы |
| `recipe.toppings` | Начинки |
| `recipe.serving` | Подача |
| `recipe.expandAll` | Раскрыть все |
| `recipe.collapseAll` | Свернуть все |
| `film.chooseGenre` | Выберите жанр |
| `film.choose` | Выбрать |
| `film.chosen` | Выбран ✓ |
| `film.more` | Показать ещё (‹N›) |
| `film.empty` | В этом жанре пока нет фильмов |
| `film.note` | Фильм можно не выбирать. Где смотреть — решаете вы. |

## Добавление в день (S03, S05, S06)

| Ключ | Текст |
| --- | --- |
| `add.button` | В мой день + |
| `add.toDay` | ‹В субботу, 14 ноября› |
| `add.inPlan` | В плане: ‹суббота› · Открыть план |
| `add.inPlanBoth` | В плане: ‹суббота› и ‹воскресенье› · Открыть план |
| `add.rest` | Добавить остальное |
| `add.partInPlan` | ‹N› из ‹M› уже в плане |
| `add.bothDays` | В субботу и воскресенье |
| `add.makeTwoDays` | Сделать план на два дня |

## Маршруты и места

| Ключ | Текст |
| --- | --- |
| `routes.kicker` | 02 / МАРШРУТЫ |
| `routes.title` | Маршруты по городу |
| `routes.subtitle` | Готовые подборки мест, которые можно добавить в свой день. |
| `routes.search` | Поиск: музей, парк, Арбат… |
| `routes.theme` | Тема: Все темы |
| `routes.open` | Открыть маршрут → |
| `routes.days` | 1 день · 2 дня |
| `routes.empty` | По этому запросу маршрутов нет. Попробуйте другое слово или откройте «Места» |
| `route.kicker` | МАРШРУТ · ‹ТЕМА› |
| `route.meta` | ‹район› · ‹N› ‹мест› · ‹1 день / 2 дня› |
| `route.day2` | ДЕНЬ 2 |
| `places.kicker` | 03 / МЕСТА |
| `places.title` | Места Москвы |
| `places.subtitle` | Выбирайте места и добавляйте их в свой план. |
| `places.search` | Поиск: название, район, адрес… |
| `places.add` | В план + |
| `places.add.aria` | Добавить ‹название› в план |
| `places.empty` | Мест по этому запросу нет. Попробуйте другое название или район |
| `events.title` | Ближайшие события |
| `events.all` | Показать все события (‹N›) |
| `events.makePlan` | Сделать план на ‹дату› |
| `events.noDay` | В плане нет дня ‹даты события›. Поменяйте дату в «Уточнить» |
| `fact.hours` | Часы |
| `fact.price` | Стоимость |
| `fact.hours.unknown` | Уточнить перед визитом |
| `fact.price.unknown` | Нет подтверждённой цены |
| `fact.address.search` | Найти на карте ↗ |
| `fact.source` | Источник ↗ |
| `fact.more` | Подробнее ↗ |
| `fact.checked` | Проверено ‹дата› |
| `fact.owner` | по данным автора сайта |

## Мой план

| Ключ | Текст |
| --- | --- |
| `plan.kicker` | 04 / МОЙ ПЛАН |
| `plan.title` | Мой план |
| `plan.subtitle` | Добавляйте идеи, маршруты и места или записывайте свои пункты. |
| `plan.outdated` | Даты плана прошли |
| `plan.outdated.action` | Перенести на ближайшую субботу |
| `plan.youWrote` | Вы написали «‹текст›» |
| `plan.wish.collapsed` | Что хочется?‹ «текст»› · Изменить |
| `plan.wish.fallback` | Не нашли точных слов — показали общий вариант |
| `plan.refine` | Уточнить |
| `plan.area` | Район начала |
| `plan.date` | Первый день |
| `plan.days` | Один день · Два дня |
| `plan.storage` | План хранится в этом браузере |
| `plan.storage.off` | План сохранится только до закрытия страницы |
| `plan.export` | Сохранить в файл |
| `plan.import` | Загрузить |
| `plan.clear` | Очистить план |
| `plan.banner.title` | Черновик, ещё не готовый маршрут |
| `plan.banner.city` | Проверьте часы и стоимость на дату визита. Адреса открываются в Яндекс Картах. |
| `plan.banner.home` | Проверьте, что всё нужное есть дома. |
| `plan.summary` | ‹N› ‹дня› · ‹N› ‹пунктов› |
| `plan.daySwitch` | День ‹N› · ‹суббота, 14 ноября› |
| `plan.day.kicker` | ДЕНЬ ‹N› |
| `plan.day.start` | Старт в районе ‹район› |
| `plan.prep` | Начните подготовку не позже ‹дня недели›, ‹даты›: ‹leadTimeNote› |
| `plan.prep.missed` | Срок подготовки прошёл. Если заготовки нет, выберите дату позже ‹даты› |
| `plan.eveningHome` | ВЕЧЕРОМ ДОМА |
| `plan.empty` | Здесь пока пусто. Напишите, чего хочется, или выберите идею, маршрут или место |
| `plan.emptyDay` | В этом дне пока ничего нет |
| `plan.add.place` | + Место |
| `plan.add.idea` | + Идея для дня |
| `plan.add.custom` | + Свой пункт |
| `custom.title` | Название |
| `custom.titlePlaceholder` | Куда хотите зайти? |
| `custom.titleRequired` | Напишите название |
| `custom.address` | Адрес |
| `custom.addressPlaceholder` | Улица и дом |
| `custom.minutes` | Минут на месте |
| `custom.submit` | Добавить + |
| `item.kind.event` | СОБЫТИЕ |
| `item.kind.activityHome` | ЗАНЯТИЕ · ДОМА |
| `item.kind.activityCity` | ЗАНЯТИЕ · В ГОРОДЕ |
| `item.kind.custom` | СВОЙ ПУНКТ |
| `item.duration` | Около ‹длительность› |
| `item.up` | ↑ Выше |
| `item.down` | ↓ Ниже |
| `item.toDay` | ‹В субботу› |
| `item.replace` | Заменить |
| `item.remove` | Убрать |
| `item.openIdea` | Открыть идею → |
| `item.genre` | Жанр: ‹жанр›‹ · фильм› |
| `item.eventPast` | Событие прошло |
| `item.eventMismatch` | Не совпадает с датой дня |
| `item.unavailable` | Этот пункт больше недоступен |
| `item.up.aria` | Выше: ‹название› |
| `item.down.aria` | Ниже: ‹название› |
| `item.toDay.aria` | ‹В субботу›: ‹название› |
| `item.replace.aria` | Заменить: ‹название› |
| `item.remove.aria` | Убрать: ‹название› |
| `item.position.live` | ‹название›: пункт ‹N› из ‹M› |
| `replace.title` | Другое место |
| `replace.search` | Найти место |
| `replace.empty` | Мест по этому запросу нет |

## Уведомления и диалоги

| Ключ | Текст |
| --- | --- |
| `toast.added` | Добавлено ‹в субботу› · Отменить |
| `toast.addedPartial` | Добавлено ‹N› из ‹M›, остальные уже в плане · Отменить |
| `toast.already` | Уже в плане: ‹суббота› · Открыть план |
| `toast.limit` | ‹В субботе› не хватает места: в дне не больше 6 пунктов |
| `toast.limit.other` | Добавить ‹в воскресенье› |
| `toast.removed` | Убрано · Отменить |
| `toast.moved` | Перенесено ‹в воскресенье› |
| `toast.importError` | Не удалось прочитать план |
| `dialog.replace.title` | В плане уже есть пункты |
| `dialog.replace.replace` | Заменить план |
| `dialog.replace.add` | Добавить ‹в субботу› |
| `dialog.clear.title` | Очистить план? |
| `dialog.clear.text` | Все пункты будут удалены. Отменить это нельзя. |
| `dialog.clear.confirm` | Очистить |
| `dialog.days.title` | Во втором дне есть пункты |
| `dialog.days.move` | Перенести в первый день |
| `dialog.days.delete` | Удалить пункты |
| `dialog.days.noRoom` | В первом дне не хватает места |
| `dialog.import.title` | Заменить текущий план планом из файла? |
| `dialog.import.confirm` | Заменить план |
| `notFound.idea` | Такой идеи нет |
| `notFound.route` | Такого маршрута нет |
| `notFound.toCatalog` | Ко всем идеям для дня → |
| `notFound.toRoutes` | Ко всем маршрутам → |
