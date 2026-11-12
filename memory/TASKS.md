# Задачи и исполнители

Статусы: Запланировано, В работе, Заблокировано, На проверке, Готово, Отменено.

Перед началом назначить исполнителя и область изменений. Таблица не блокирует файлы автоматически. Полные входы, результаты, зависимости и проверки: [план реализации](../docs/project/implementation-plan.md).

| ID | Задача | Статус | Исполнитель | Область изменений | Результат / зависимость |
| --- | --- | --- | --- | --- | --- |
| TASK-001 | Структура, контекст и правила | Готово | codex/bootstrap | Документы, README, memory/ | Начальная структура проверена |
| TASK-002 | Зафиксировать утверждённое ТЗ | Готово | codex/coordinator | Документы, решения, инструкции, память | ТЗ, план, ADR и память сохранены; 80 локальных ссылок в 30 MD-файлах проверены |
| TASK-003 | Проверить живые интеграции | Заблокировано | codex/integrations | scripts/probes/, отчёт интеграций | Codex и ограничения прошли; KudaGo HTTP 403; OSM и пробный OTP работают на компьютере, но точная линия транспорта, метро и физический телефон не подтверждены. [Передача](handoffs/2026-11-08-TASK-003-integrations.md) |
| TASK-004 | Основа и контракты | Запланировано | Не назначен | Конфигурация, apps/, контракты | Только после полного успеха 003 |
| TASK-005 | Дизайн-система | Запланировано | Не назначен | Токены, компоненты, стили | После 004 |
| TASK-006 | Импорт и каталог | Запланировано | Не назначен | Серверные данные | После 004 |
| TASK-007 | Планировщик | Запланировано | Не назначен | Серверная логика планов | После 006 |
| TASK-008 | Помощник Codex | Запланировано | Не назначен | Адаптер, диалоги, SSE | После 004 |
| TASK-009 | Фронтенд | Запланировано | Не назначен | Экраны и клиент | После 005 и контракта 004 |
| TASK-010 | Сквозная интеграция и карта | Запланировано | Не назначен | Клиент, API, проезд | После 007–009 |
| TASK-011 | Аккаунты и сохранение | Запланировано | Не назначен | Сессии, планы, клиент | После 010 |
| TASK-012 | Локальный выпуск | Запланировано | Не назначен | Сборка, запуск, инструкции | После 011 |
| TASK-013 | Итоговая приёмка | Запланировано | Не назначен | Тесты, исправления, отчёт | После 012 |
| TASK-014 | Локальный интерфейс для совместного редактирования | На проверке | codex/web-prototype | apps/web/, память | 10 идей, 32 места, подбор черновика по словам, редактирование и авторская карта-схема; сборка и браузерный сценарий пройдены. [Передача](handoffs/2026-11-08-TASK-014-web-prototype.md) |
| TASK-015 | Пересмотреть бесплатную карту для локального выпуска | На проверке | codex/integration-review | docs/decisions/, docs/architecture/integration-report.md, scripts/probes/, memory/ | ADR-003 согласована; OSM и пробный OTP показали пеший и автобусный путь на компьютере. Не доказаны точная линия автобуса, метро, телефон и полнота данных; TASK-003 заблокирована. [Передача](handoffs/2026-11-09-TASK-015-map-reassessment.md) |
| TASK-016 | HTTPS для локального просмотра интерфейса | На проверке | codex/https-local | apps/web/package.json, apps/web/vite.config.ts, apps/web/README.md, scripts/local-https/, memory/ | HTTPS отвечает на 5174, HTTP просмотр сохранён на 5173. Пользователь отказался доверять локальному сертификату; встроенный браузер отклоняет HTTPS. [Передача](handoffs/2026-11-09-TASK-016-local-https.md) |
| TASK-017 | Идеи для выходных и основные кнопки | Готово | codex/weekend-ideas | apps/web/, memory/ | 34 идеи и 45 мест, включая 13 мест пользователя; основные сценарии, сборка и проверки каталога пройдены. Без веб-поиска и проверки транспорта |
| TASK-018 | Ссылка для просмотра друзьями | Готово | codex/publish | .local/sites-weekend-share/, docs/project/public-sharing.md, memory/, CONTEXT.md | Sites версия 1 опубликована; public, HTTPS; подтверждены succeeded и открытие главной |
| TASK-019 | Упростить интерфейс и подготовить рендер | Готово | codex/frontend | apps/web/, memory/, .local/ | Локальная версия. Сборка, поиск, добавление и навигация проверены. Два PNG |
| TASK-020 | Уточнить визуальный стиль по Swiss Design | Готово | codex/frontend | apps/web/, memory/, .local/ | Фото CC0, слои, сетка, кнопки и переходы. Сборка и браузерная проверка пройдены |
| TASK-021 | Встроить башню в композицию главной | Готово | codex/frontend | apps/web/, memory/, .local/ | Силуэт, типографика, короткие подписи |
| TASK-022 | Фон башни по высоте главной | Готово | codex/frontend | apps/web/, memory/ | Крупный фрагмент решётки и прокрутка |
| TASK-023 | Векторная решётка и стеклянные карточки | Готово | codex/frontend | apps/web/, memory/, .local/ | Геометрический фон, стекло, кнопки |
| TASK-024 | Расширить решётку и усилить поворот | Готово | codex/frontend | apps/web/, memory/, .local/ | Правое кадрирование, высокие ярусы и объём балок |
| TASK-025 | Карточки посещения и единый дизайн | Готово | codex/frontend | apps/web/, memory/, .local/ | Внешние ссылки на карту, расписание, стоимость, локальное демо |
| TASK-026 | Обновить публичное демо | Готово | codex/publish | .local/sites-weekend-share/, docs/project/public-sharing.md, memory/ | Публикация последнего дизайна |
| TASK-027 | Фон башни из HTML-референса с поворотом от прокрутки | Готово | codex/scroll-design | apps/web/src/, tests/web/, memory/ | Перенос геометрии референса, проверка обоих направлений; локально |
| TASK-028 | Публикация вращающегося фона для друга | Готово | codex/publish-scroll | .local/sites-weekend-share/, docs/project/public-sharing.md, memory/ | Обновить существующий публичный сайт |
| TASK-029 | Резервная копия проекта на GitHub | Готово | codex/github-backup | исходники, .gitignore, memory/ | Публичный репозиторий nemczzz-rgb/Weekend_Search, ветка main |
| TASK-030 | Порядок в репозитории и CI | Готово | Alex071004/claude-repo | окончания строк во всех файлах, .github/, tests/, assets/references/, README.md, AGENTS.md, memory/, docs/project/public-sharing.md | PR #1 смержен 12.11.2026. Защиту main включает владелица репозитория |
| TASK-031 | Автопубликация сайта из main на GitHub Pages | Готово | Alex071004/claude-repo | .github/workflows/ci.yml, apps/web/vite.config.ts, docs/decisions/, docs/project/public-sharing.md, AGENTS.md, CONTEXT.md, memory/ | [ADR-004](../docs/decisions/ADR-004-github-pages-autodeploy.md). Pages включён 12.11.2026, deploy зелёный, сайт отвечает 200 |
| TASK-032 | Инструкция подключения агента к репозиторию | На проверке | Alex071004/claude-repo | docs/project/codex-onboarding.md, docs/project/README.md, AGENTS.md, memory/ | [Инструкция](../docs/project/codex-onboarding.md) для Codex владелицы: синхронизация локальной папки, ветки, PR, публикация |
| TASK-033 | План «Идеи для дня» и редизайна | Готово | Alex071004/claude-repo | docs/project/day-ideas-plan.md, memory/ | [План](../docs/project/day-ideas-plan.md): цель, AC-DI, решения D1–D15, спринты, контракты. Утверждён 12.11.2026; [сводка задач #27](https://github.com/nemczzz-rgb/Weekend_Search/issues/27) |
| TASK-034 | Решения и ADR-005 | Запланировано | Alex071004/claude-repo | docs/decisions/, CONTEXT.md, docs/design-system/README.md | После утверждения D1–D15 обоими · [#5](https://github.com/nemczzz-rgb/Weekend_Search/issues/5) |
| TASK-035 | Схема базы знаний и валидатор | Запланировано | Alex071004/claude-repo | apps/web/src/content/, scripts/content/, tests/content/, .github/workflows/ | Раздел 9 плана; перенос мест без изменения сайта · [#6](https://github.com/nemczzz-rgb/Weekend_Search/issues/6) |
| TASK-036 | Рецепт и список фильмов владелицы | Готово | nemczzz-rgb | docs/knowledge-base/owner/ | Нужен к G0 · [#7](https://github.com/nemczzz-rgb/Weekend_Search/issues/7) |
| TASK-037 | Аудит текущего UX | Запланировано | Alex071004/claude-repo | docs/ux/audit* | После G0 · [#8](https://github.com/nemczzz-rgb/Weekend_Search/issues/8) |
| TASK-038 | UX-концепты | Запланировано | Alex071004/fable | docs/ux/concepts.md | После 037; выбор концепта обоими · [#9](https://github.com/nemczzz-rgb/Weekend_Search/issues/9) |
| TASK-039 | UX-спецификация | Запланировано | Alex071004/claude-repo | docs/ux/ | Ворота G1 · [#10](https://github.com/nemczzz-rgb/Weekend_Search/issues/10) |
| TASK-040 | Пакет для Claude Design | Запланировано | Alex071004/claude-repo | docs/design-system/brief/ | Ворота G2 · [#11](https://github.com/nemczzz-rgb/Weekend_Search/issues/11) |
| TASK-041 | Макеты в Claude Design | Запланировано | Alex071004/claude-design | артефакт Claude Design | После G2 · [#12](https://github.com/nemczzz-rgb/Weekend_Search/issues/12) |
| TASK-042 | Приёмка макетов и дизайн-система в репозитории | Запланировано | Alex071004/claude-repo | docs/design-system/, apps/web/src/styles/tokens.css | Ворота G3 · [#13](https://github.com/nemczzz-rgb/Weekend_Search/issues/13) |
| TASK-043 | База знаний: рецепты | Запланировано | chatgpt + Alex071004/codex | apps/web/src/content/recipes.json | После 035 и 036 · [#14](https://github.com/nemczzz-rgb/Weekend_Search/issues/14) |
| TASK-044 | База знаний: фильмы | Запланировано | chatgpt + Alex071004/codex | apps/web/src/content/films.json | После 035 и 036 · [#15](https://github.com/nemczzz-rgb/Weekend_Search/issues/15) |
| TASK-045 | База знаний: занятия и сценарии | Запланировано | chatgpt + Alex071004/codex | apps/web/src/content/activities.json, day-ideas.json | После 035 · [#16](https://github.com/nemczzz-rgb/Weekend_Search/issues/16) |
| TASK-046 | База знаний: проверка мест и события | Запланировано | chatgpt + Alex071004/codex | apps/web/src/content/places.json, events.json | После 035; события еженедельно · [#17](https://github.com/nemczzz-rgb/Weekend_Search/issues/17) |
| TASK-047 | Логика и хранилище плана | Запланировано | Alex071004/claude-repo | apps/web/src/plan/, apps/web/src/planner.ts, tests/web/plan-* | Ветка redesign, после G3 и минимума KB · [#19](https://github.com/nemczzz-rgb/Weekend_Search/issues/19) |
| TASK-048 | Токены и базовые компоненты | Запланировано | Alex071004/codex | apps/web/src/ui/, apps/web/src/styles/, apps/web/public/fonts/ | Ветка redesign · [#20](https://github.com/nemczzz-rgb/Weekend_Search/issues/20) |
| TASK-049 | Экраны «Идеи для дня» | Запланировано | Alex071004/codex | apps/web/src/screens/day-ideas/ | Ветка redesign · [#21](https://github.com/nemczzz-rgb/Weekend_Search/issues/21) |
| TASK-050 | Главная, места, маршруты, план, пожелание | Запланировано | Alex071004/claude-repo | apps/web/src/screens/, apps/web/src/App.tsx | Ветка redesign · [#22](https://github.com/nemczzz-rgb/Weekend_Search/issues/22) |
| TASK-051 | Иллюстрации | Запланировано | Alex071004/codex | apps/web/public/images/ideas/ | После G3 · [#23](https://github.com/nemczzz-rgb/Weekend_Search/issues/23) |
| TASK-052 | QA фичи и редизайна | Запланировано | Alex071004/claude-repo | docs/testing/day-ideas-report.md | Ворота G4 · [#24](https://github.com/nemczzz-rgb/Weekend_Search/issues/24) |
| TASK-053 | Выпуск redesign → main | Запланировано | Alex071004/claude-repo | PR, docs/project/public-sharing.md, memory/ | Ворота G5 · [#25](https://github.com/nemczzz-rgb/Weekend_Search/issues/25) |
| TASK-054 | База знаний: маршруты прогулок | Запланировано | chatgpt + Alex071004/codex | apps/web/src/content/routes.json | После 035 и 046 · [#18](https://github.com/nemczzz-rgb/Weekend_Search/issues/18) |
| TASK-055 | Настройки репозитория владелицы | Готово | nemczzz-rgb | Настройки GitHub | Защита main, скрытие почты, уведомления · [#26](https://github.com/nemczzz-rgb/Weekend_Search/issues/26) |
| TASK-056 | Экспорт и импорт плана | Запланировано | Alex071004/claude-repo | apps/web/src/plan/ | Ветка redesign, после 047; перенос планов между браузерами и адресами · [#28](https://github.com/nemczzz-rgb/Weekend_Search/issues/28) |
| TASK-057 | Инструкция переезда на свой сервер | Запланировано | Alex071004/claude-repo | docs/deployment/self-hosting.md | После 053; раздел 12 плана · [#29](https://github.com/nemczzz-rgb/Weekend_Search/issues/29) |

Контрольная точка TASK-003 остаётся обязательной для живых интеграций и приёмки. TASK-014 — новое ограниченное поручение пользователя от 2026-11-08 на локальный интерфейс до её прохождения; оно не закрывает TASK-003 и не меняет статус TASK-004–013.

| TASK-058 | Сохранить утверждённый дизайн | На проверке | nemczzz-rgb/codex | design/approved/, design/iterations/, memory/ | Снимок текущего фронтенда в отдельной папке, будущие варианты отдельно |
