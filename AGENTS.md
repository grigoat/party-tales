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
