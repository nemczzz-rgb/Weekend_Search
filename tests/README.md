# Общие проверки

Раздел для будущих интеграционных и сквозных проверок, охватывающих несколько частей приложения. Тесты отдельных модулей можно хранить рядом с кодом по соглашениям выбранного стека.

Стратегия приложения описана в [docs/testing](../docs/testing/README.md). Основного приложения пока нет; отдельно добавлены стандартные unittest-проверки безопасности [диагностических инструментов](../scripts/probes/README.md), запускаемые до контрольной точки без установки pytest.

## Как запустить

Те же команды выполняет CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) для каждого Pull Request и каждого изменения `main`:

```bash
pnpm --dir apps/web install --frozen-lockfile
node scripts/content/validate.mjs
node tests/content/validate.test.mjs
pnpm --dir apps/web build
node tests/web/tower-background.test.mjs
node tests/web/tower-scene.test.mjs
node tests/web/visit-facts.test.mjs
node tests/web/events-dates.test.mjs
node tests/web/plan-store.test.mjs
node tests/web/plan-today.test.mjs
node tests/web/plan-wish.test.mjs
node tests/web/plan-file.test.mjs
node tests/web/portability.test.mjs
node tests/web/ui-components.test.mjs
node tests/web/day-ideas.test.mjs
python -I -m unittest discover -s tests -v
```

Новый каталог с Python-тестами внутри `tests/` должен содержать `__init__.py`, иначе `unittest discover` его не найдёт.

Тесты `tests/web/plan-*.test.mjs` и `portability.test.mjs` импортируют модули `apps/web/src/**/*.ts` напрямую: Node 24 исполняет TypeScript без сборки. Поэтому в этих модулях импорты пишутся с расширением `.ts`, а JSON — только в `content/static-source.ts` с `with { type: 'json' }` (правило P1).
