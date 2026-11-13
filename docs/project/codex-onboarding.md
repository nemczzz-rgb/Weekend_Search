# Подключение агента к репозиторию

Инструкция для Codex или другого агента, который начинает работать с проектом на компьютере владелицы репозитория. Её же можно использовать на любом новом компьютере. Общие правила проекта — в [AGENTS.md](../../AGENTS.md). Этот файл описывает только Git, GitHub и публикацию.

## Кто участвует

| Аккаунт GitHub | Роль | Права |
| --- | --- | --- |
| `nemczzz-rgb` | Владелица репозитория | admin: настройки, Pages, правила веток |
| `Alex071004` | Участник | write: ветки, PR, merge |

- Репозиторий: https://github.com/nemczzz-rgb/Weekend_Search (публичный).
- Сайт: https://nemczzz-rgb.github.io/Weekend_Search/. Он сам обновляется после merge в `main` ([ADR-004](../decisions/ADR-004-github-pages-autodeploy.md)).
- Работа идёт параллельно с разных компьютеров. Единственный общий источник правды — ветка `main` на GitHub, а не локальная папка и не память агента.

## 1. Первое подключение: привести локальную папку к GitHub

До 12.11.2026 проект жил в локальной папке с отдельной Git-историей. С тех пор в `main` на GitHub появились изменения второго участника: CI, публикация на Pages, правила в AGENTS.md и другие. Локальная история может не совпадать с GitHub, поэтому сначала проверяем и только потом меняем.

### 1.1. Проверить, что есть локально

```bash
git status --short
git remote -v
git log --oneline -5
```

- Если в `git status` есть изменения или в `git log` есть коммиты, которых нет на GitHub, это несохранённая работа. Ничего не удалять, сначала показать список пользователю.
- Папка `.local/` (архивы и checkout публикации Sites, рендеры) есть только на этом компьютере и в Git не попадает. Её нужно сохранить.

### 1.2. Вход в GitHub

```bash
gh auth status
```

Если вход не выполнен или выполнен под другим аккаунтом, пользователь сам выполняет `gh auth login`: GitHub.com → HTTPS → браузер. Агент не вводит пароли и токены за пользователя. Затем:

```bash
gh auth setup-git
```

### 1.3. Самый безопасный способ синхронизации — новая копия рядом

```bash
git clone https://github.com/nemczzz-rgb/Weekend_Search.git Weekend_Search_github
```

Затем:

1. Скопировать `.local/` из старой папки в новую.
2. Сравнить старую папку с новой. Если в старой есть файлы или правки, которых нет на GitHub, перенести их в новую копию отдельной веткой и PR (раздел 3), не в `main`.
3. Работать дальше в новой папке. Старую оставить как резервную копию, пока пользователь не решит её удалить.

Другой способ — подключить старую папку к GitHub и переключить её на `origin/main`. Это затирает локальную историю, поэтому допустим только с явного согласия пользователя и после резервной копии:

```bash
git remote add origin https://github.com/nemczzz-rgb/Weekend_Search.git   # или git remote set-url, если origin уже есть
git fetch origin
git branch backup-before-sync          # сохранить локальную историю
git reset --hard origin/main           # только с согласия пользователя
```

### 1.4. Имя и почта для коммитов

Репозиторий публичный, и почта автора видна всем. Используем адрес noreply GitHub:

```bash
gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'
git config user.name "nemczzz-rgb"
git config user.email "<адрес из первой команды>"
```

### 1.5. Проверить, что всё работает

```bash
git status -sb                        # ## main...origin/main без расхождений
gh api repos/nemczzz-rgb/Weekend_Search --jq .permissions.push   # true
pnpm --dir apps/web install --frozen-lockfile
pnpm --dir apps/web build
```

## 2. Однократные настройки владелицы (вручную, в интерфейсе GitHub)

Агент только напоминает о них. Это настройки аккаунта и репозитория, менять их без пользователя нельзя.

- [x] Settings → Pages → Source: **GitHub Actions** (включено 12.11.2026).
- [ ] Settings → Rules → Rulesets → New branch ruleset → Target: default branch. Включить: **Restrict deletions**, **Block force pushes**, **Require a pull request before merging** (approvals: 0), **Require status checks to pass** с проверками `web` и `probes`.
- [ ] Настройки профиля → Emails → **Keep my email addresses private** и **Block command line pushes that expose my email**.

## 3. Ежедневная работа

```bash
git switch main
git pull --ff-only
git switch -c task-NNN-short-name     # NNN — следующий свободный ID из memory/TASKS.md после pull
# ... изменения, проверки ...
git add -A
git commit -m "Короткое описание"
git push -u origin task-NNN-short-name
gh pr create --base main --fill
```

- Задачу записать в `memory/TASKS.md`. В `TASKS.md`, `CURRENT.md` и `LOG.md` только добавлять свои строки и разделы, чужие не переписывать.
- Перед PR выполнить те же проверки, что и CI ([tests/README.md](../../tests/README.md)): сборка, `node tests/web/tower-background.test.mjs`, `python -I -m unittest discover -s tests`.
- CI запускается в PR автоматически. Статус: `gh pr checks` или вкладка Checks в PR.
- Merge делать только после зелёного CI и только с согласия пользователя: `gh pr merge --merge --delete-branch`.
- После merge через 1–3 минуты задача `deploy` публикует сайт. Проверить: `gh run list --branch main --limit 1`.

## 4. Чего не делать

- Не коммитить и не пушить прямо в `main`. Не делать `push --force` и `reset --hard` на общих ветках без явного согласия.
- Не публиковать через Sites как основной способ: основной адрес теперь Pages. Sites ([public-sharing.md](public-sharing.md)) — прежний адрес, обновлять его только по отдельной просьбе.
- Не добавлять в репозиторий `.local/`, `.env`, ключи, токены, сертификаты и личные данные.
- Не добавлять файлы больше 1 МБ без согласования. Имена — латиницей, без пробелов.

## 5. Частые проблемы

| Симптом | Причина и решение |
| --- | --- |
| `Permission denied` или 403 при push | Не тот аккаунт в `gh auth status` или нет входа. Пользователь выполняет `gh auth login`, затем `gh auth setup-git`. |
| `deploy` упал с `Not Found` (404) | Pages выключен. Включить Source: GitHub Actions, затем `gh run rerun <id> --failed`. |
| CI красный в PR | Открыть лог: `gh run view <id> --log-failed`. Исправить в той же ветке и запушить, CI перезапустится сам. |
| На сайте не грузятся картинки или стили | Сайт лежит в подпапке `/Weekend_Search/`. Пути к файлам из `public/` не привязывать к корню домена. |
| В Git Bash на Windows `PAGES_BASE=/Weekend_Search/` превращается в путь `C:/Program Files/Git/...` | Запускать с `MSYS_NO_PATHCONV=1` или из PowerShell. В CI проблемы нет. |
| Git показывает изменённые файлы, которые никто не трогал, или в PR конфликт в `memory/*.md` | Файлы закоммичены со смешанными окончаниями строк (CRLF). Проверить: `git diff --ignore-cr-at-eol` пустой — значит отличие только в окончаниях. Исправить в своей ветке: `git add --renormalize .` и коммит. Ничего не откатывать вслепую. |
| CI `probes` упал на шаге «Line endings match .gitattributes» | В PR попали файлы с CRLF. В своей ветке: `git add --renormalize .`, коммит, push. Чтобы не повторялось, при записи файлов скриптами на Windows писать `\n`, а не `\r\n` |
| Merge PR не проходит, GitHub просит права администратора при зелёном CI | В PR есть коммит с соавтором, не привязанным к аккаунту GitHub (например, `Co-Authored-By: Claude`). Не добавлять такие строки (AGENTS.md). Уже опубликованный коммит не переписывать: перенести изменения в новую ветку от `main` и открыть новый PR либо попросить владелицу одобрить PR |
