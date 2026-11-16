/** Общие тексты компонентов. Названия, шаги и описания приходят из базы через props. */
export const UI_COPY = {
  skip: 'Перейти к содержимому', homeAria: 'Weekend Search — главная',
  unknown: 'Уточнить перед визитом', ownerFact: 'по данным автора сайта',
  today: 'Можно сегодня', later: 'Лучше в другой день', lead: 'Начать заранее',
  wish: { label: 'Что хочется?', placeholder: 'Например: парк и спа-вечер', submit: 'Подобрать по пожеланию' },
  cardOpen: 'Открыть →', routeOpen: 'Открыть маршрут →', findMap: 'Найти на карте', addPlace: 'В план +', needs: 'Понадобится:',
  film: { info: 'О фильме', noteSource: 'Источник описания', poster: 'Постер', select: 'Выбрать', selected: 'Выбран ✓' },
  add: { single: 'Добавить в план +', both: 'В субботу и воскресенье', createBoth: 'Сделать план на два дня', rest: 'Добавить остальное' },
  evening: 'Вечером дома', clear: 'Очистить план', cancel: 'Отмена', undo: 'Отменить',
  loading: 'Загрузка данных', loadError: 'Не получилось загрузить данные', reloadHint: 'Обновите страницу', reload: 'Обновить',
  recipe: { ingredients: 'Ингредиенты', tips: 'Советы', toppings: 'Начинки', serving: 'Подача', owner: 'Рецепт автора сайта', source: 'Источник рецепта' },
} as const
