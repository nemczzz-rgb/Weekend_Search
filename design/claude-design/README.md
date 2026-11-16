# Исходники холста Claude Design

Снимок холста «Weekend Search — макеты» (TASK-041), версия 1794814075-18a2 от 16.11.2026. Живой холст: <https://claude.ai/artifact/NpaER2ADERmgv6688UwJWm> (приватный, открывается у автора и у тех, с кем он поделился).

Что внутри `project/`:

| Файл | Назначение |
| --- | --- |
| `canvas.json` | Индекс: артборды, их положение и размеры, порядок |
| `Main`, `Typography`, `Shape`, `Logo`, `Accent`, `TokenChanges`, `Tower`, `TowerNext`, `Buttons`, `Cards` `.dc.html` | Артборды дизайн-системы |
| `S01`…`S09`, `SLoad` `.dc.html` | Экраны на 1280 px (флаг `mobile` переключает раскладку на 390 px) |
| `S0N-390`, `S0N-empty-*`, `S07-*`, `SLoad-*` `.dc.html` | Версии на 390 px и состояния: подключают экран через `dc-import` |
| `ws.css` | Общие стили компонентов |
| `ws.js` | Данные базы знаний для макетов, модель башни и логотип |

Это формат редактора Design Component: файлы открываются только в холсте (нужен `support.js` самого холста, его здесь нет). В сайт они не подключаются; сайт строится по [docs/design-system/](../../docs/design-system/README.md) и [tokens.css](../../apps/web/src/styles/tokens.css).

Не использовать как источник данных: тексты и факты в макетах — копии записей `apps/web/src/content` на 13.11.2026 и не обновляются.
