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
python -I -m unittest discover -s tests -v
```

Новый каталог с Python-тестами внутри `tests/` должен содержать `__init__.py`, иначе `unittest discover` его не найдёт.
