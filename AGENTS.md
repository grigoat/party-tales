# Пуш на GitHub

Для пуша на GitHub используется `gh` (GitHub CLI), установленный в `/tmp/gh_install/bin/gh`.

## Если gh не установлен

```bash
curl -sL -o /tmp/gh.tar.gz "https://github.com/cli/cli/releases/latest/download/gh_2.95.0_linux_amd64.tar.gz"
mkdir -p /tmp/gh_install
tar -xzf /tmp/gh.tar.gz -C /tmp/gh_install --strip-components=1
```

## Настройка credential helper (если сломан)

```bash
GH_BIN=/tmp/gh_install/bin/gh
git config --global credential.https://github.com.helper "!${GH_BIN} auth git-credential"
git config --global credential.https://gist.github.com.helper "!${GH_BIN} auth git-credential"
```

## Пуш

```bash
cd /home/gregory/party-tales
git push
```

# Railway (бэкенд/деплой)

У ассистента есть доступ к Railway через CLI — можно управлять деплоем, переменными и томами самому.

- **CLI:** `~/.local/bin/railway` (v5.23.x). Ставится напрямую бинарником (npm в системе нет):
  ```bash
  curl -sL -o /tmp/railway.tar.gz "https://github.com/railwayapp/cli/releases/download/v5.23.3/railway-v5.23.3-x86_64-unknown-linux-musl.tar.gz"
  tar -xzf /tmp/railway.tar.gz -C /tmp && mkdir -p ~/.local/bin && cp /tmp/railway ~/.local/bin/railway
  ```
- **Вход** (нужен один клик пользователя в браузере): `railway login --browserless` печатает ссылку/код — пользователь подтверждает, токен сохраняется в `~/`.
- **Проект:** `delightful-magic` · окружение `production` · сервис `party-tales`. Привязка уже сделана в `/home/gregory/party-tales` (`railway link -p delightful-magic`).
- **Постоянный том:** `party-tales-volume` примонтирован на `/app/backend/data` (там лежит SQLite `leads.db`). Без тома база обнуляется при каждом деплое — не удалять.

## Частые команды
```bash
export HOME=/home/gregory PATH="$HOME/.local/bin:$PATH"
cd /home/gregory/party-tales
railway status                       # проект/окружение/сервис
railway variables                    # переменные окружения (напр. AI_API_KEY)
railway variables --set "KEY=VALUE"  # задать переменную
railway volume list --json           # тома (authoritative; обычный list врёт про путь)
railway redeploy -y                  # передеплоить текущий образ
railway logs                         # логи
```
Railway сам передеплоивает бэкенд при пуше в `main` (ветка `main` → сервис `party-tales`).
