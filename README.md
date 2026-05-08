# Project Fonts — Figma plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-ychkydyk%2Ffigma--plugin--fonts-181717?logo=github)](https://github.com/ychkydyk/figma-plugin-fonts)

A Figma plugin that **finds the fonts you actually use** in your file,
tells you which ones are missing on your computer, and **downloads or
installs** them in one click — from open-source catalogs (Google Fonts,
Fontshare) or from your own ZIP.

⚡ Cross-platform: Windows + macOS, identical UX.
⚡ ~170 curated fonts in the catalog + full Fontsource catalog
search (~2000 families).
⚡ No servers, no accounts, no data leaves your machine.

---

## 🚀 Quick install (5 steps)

> **Figma Desktop only.** Local development plugins don't work in the
> browser version of Figma.

1. **Get the plugin**
   ```bash
   git clone https://github.com/ychkydyk/figma-plugin-fonts.git
   ```
   Or hit <kbd>Code → Download ZIP</kbd> on GitHub and unpack it.

2. **Open Figma Desktop** with any file (an open file is required —
   without it, the plugin development menu won't show up).

3. **Import the plugin:** menu (☰ top-left) → **Plugins → Development
   → Import plugin from manifest…** → pick `manifest.json` from the
   plugin folder.

4. **Run it:** <kbd>Ctrl/⌘</kbd>+<kbd>/</kbd> → type *fonts* → select
   **Шрифты проекта — загрузка и предпросмотр**.

5. **Done.** The plugin scans your file, shows what's missing, and
   offers a one-click download or install.

> **Updating:** run `git pull` in the plugin folder, relaunch the
> plugin — Figma reads the latest code from disk.

---

## 🎯 How to use it

### "Project" tab

The plugin opens here and does the work for you:

- **Scans** every page (or only the current selection — toggle in the
  toolbar) and lists all used families × weights × styles.
- For each variant it shows whether it's **on your system** (green
  *в ОС* badge) or **missing** (red *нужен* badge).
- Pre-checks **only what's needed** — nothing extra is suggested.
- **Live preview** of every variant using the real font; sample text
  and size are editable in the toolbar. In selection mode, the preview
  uses real text from the selected layers.

### What to do with what was found

Three buttons at the bottom:

| Button | What it does |
|---|---|
| **⚡ Install** | Drops fonts straight into your system fonts folder (no ZIP, no archive). Asks once which folder to open, then runs silently. *Requires Figma Desktop with File System Access API.* |
| **ZIP** | Builds one archive of all selected `.ttf` files and saves it to your Downloads folder. You install manually (double-click / right-click → Install). |
| **Reset** | Clears all checkboxes. |

After install — **restart Figma Desktop**. Otherwise the new fonts
won't appear in the list.

### When a font is **not** in the open catalog

E.g. Compacta Lt BT, Helvetica Neue, your brand-only font. The plugin
flags such families and offers two buttons:

- **🔎 Find online** — opens a panel that auto-searches the full
  Fontsource open-source catalog (~2000 fonts). If there's no exact
  match, it suggests **stylistically similar** alternatives (for
  Compacta — Bebas Neue, Anton, Oswald, etc., the same compressed
  display sans family). The **Скачать** button next to any result
  bundles every weight into a ZIP and saves it. If nothing matches in
  open-source either, an expandable list links to 8 free font sites
  (Google Fonts, Font Squirrel, 1001 Fonts, DaFont, Fontesk, etc.) —
  opens the search in your browser.
- **Upload ZIP** — switches to the ZIP tab so you can drop your own file.

### "Catalog" tab

All ~170 curated fonts plus search. Useful when you want to *add* a
font that isn't yet in your project.

### "ZIP" tab

Drop a ZIP with fonts (or loose `.ttf` / `.otf` / `.woff` / `.woff2`
files) — the plugin unpacks, infers families from filenames, and
shows variants. Same **⚡ Install** / **ZIP** buttons apply.

---

## 🔧 Installing fonts after a ZIP download

(Skip this if you used **⚡ Install** — that one drops files straight
into the OS fonts folder.)

### Windows

1. Unpack the archive.
2. Select all files → right-click → **Install** (no admin needed, for
   current user) or **Install for all users**.
3. Restart Figma Desktop.

Details + troubleshooting: [INSTALL_WIN.md](INSTALL_WIN.md)

### macOS

1. Unpack (double-click).
2. Select all `.ttf` → double-click → click **Install Font** in Font
   Book. Or drag straight into `~/Library/Fonts/`.
3. Restart Figma Desktop (Cmd+Q, reopen).

Details: [INSTALL_MAC.md](INSTALL_MAC.md)

---

## 📦 Font sources

| Source | What you get | License |
|---|---|---|
| **Google Fonts** via [Fontsource](https://fontsource.org/) | ~150 popular families curated in-plugin (Inter, Roboto, Montserrat, JetBrains Mono, Playfair, Bebas Neue, Onest, Unbounded, etc.) — full weights, Cyrillic where available | OFL / Apache 2.0 |
| **Fontsource API** (search) | Full open-source catalog — ~2000 families, available via the **🔎 Find online** button. Cached in `figma.clientStorage` for 24h. | OFL / Apache 2.0 |
| **Fontshare** (Indian Type Foundry) | ~16 top design families: Satoshi, Cabinet Grotesk, Clash Display, Switzer, Boska, etc. | Free for personal and commercial use |
| **User ZIP** | Any `.ttf` / `.otf` / `.woff` / `.woff2` — brand fonts, paid fonts, custom files | per source license |

External domains are limited via `manifest.json`: the plugin only
talks to `fonts.googleapis.com`, `fonts.gstatic.com`, `fonts.bunny.net`,
`cdn.jsdelivr.net`, `api.fontsource.org`, `api.fontshare.com`,
`cdn.fontshare.com`. Nothing else.

---

## ⚠️ If the plugin won't start

- **No "Development" menu** → open any file in Figma Desktop; without
  an open file, that submenu just doesn't exist.
- **Imported, but the plugin isn't in the list** → menu → **Plugins →
  Development → Open console** — import errors (e.g. broken JSON in
  the manifest) show up there.
- **"This plugin requires a newer version of Figma"** → update Figma
  Desktop.
- **⚡ Install button is greyed out / dimmed** → your Figma Desktop is
  too old for File System Access API. Use **ZIP** — works everywhere.

If something else breaks — open an issue on
[GitHub](https://github.com/ychkydyk/figma-plugin-fonts/issues) or
ping [@mantunamochil](https://t.me/mantunamochil) on Telegram.

---

## 🔒 Security

- Network access is limited to a whitelist of 7 hosts in `manifest.json`.
- Zero external JS dependencies. ZIP-writer (CRC32 + STORE) is hand-rolled,
  ZIP-reader uses standard `DecompressionStream`.
- Every downloaded byte is **magic-byte validated** (TTF/OTF/WOFF/WOFF2/TTC)
  before it lands in FontFace or in the ZIP — protects against file
  spoofing.
- Your ZIP uploads **never leave the sandbox** — everything is processed
  locally.
- Path-traversal protection on names extracted from user ZIPs.

More: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🛣️ Roadmap

The plugin can already drop fonts into the system folder via the
File System Access API (**⚡ Install** button). Still planned:
a small companion helper for a fully seamless auto-install without
the folder picker — see [docs/ROADMAP.md](docs/ROADMAP.md).

---

## 📁 Files

- `manifest.json` — plugin manifest + allowed domains.
- `code.js` — Figma main thread: document scan, selection sample,
  external link opening, Fontsource cache in clientStorage.
- `ui.html` — UI: three tabs, preview, Fontsource auto-search, ZIP
  read/write, install via File System Access API.
- `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` — internals and roadmap.

---

## 📞 Contact

- Telegram: [@mantunamochil](https://t.me/mantunamochil)
- GitHub Issues: [ychkydyk/figma-plugin-fonts/issues](https://github.com/ychkydyk/figma-plugin-fonts/issues)

---
---

# 🇷🇺 Документация на русском

Плагин для Figma, который **сам находит используемые шрифты** в твоём
файле, говорит, чего не хватает на компьютере, и **скачивает или
сразу устанавливает** недостающие из открытых каталогов
(Google Fonts, Fontshare) или из твоего ZIP-архива.

⚡ Кросс-платформа: Windows + macOS, идентично.
⚡ ~170 предустановленных шрифтов в каталоге + поиск по полному
open-source каталогу Fontsource (~2000 семейств).
⚡ Без серверов, без аккаунтов, без отправки данных наружу.

## 🚀 Быстрая установка (5 шагов)

> Только в **Figma Desktop** — в браузерной версии локальные плагины
> не работают.

1. **Скачай плагин**
   ```bash
   git clone https://github.com/ychkydyk/figma-plugin-fonts.git
   ```
   Или нажми <kbd>Code → Download ZIP</kbd> на GitHub и распакуй.

2. **Открой Figma Desktop** и любой файл (если файл не открыт, меню
   плагинов будет пустым).

3. **Импортируй плагин:** меню (☰ слева вверху) → **Plugins →
   Development → Import plugin from manifest…** → выбери
   `manifest.json` из скачанной папки.

4. **Запусти:** <kbd>Ctrl/⌘</kbd>+<kbd>/</kbd> → набери «шрифты» →
   **Шрифты проекта — загрузка и предпросмотр**.

5. **Готово.** Плагин сам просканирует файл, покажет, чего не хватает,
   и предложит скачать одной кнопкой.

> **Обновление до новой версии:** в папке плагина выполни `git pull`
> и просто запусти плагин ещё раз — Figma подтянет свежий код с диска.

## 🎯 Как пользоваться

### Вкладка «Проект»

Плагин открывается на этой вкладке и сразу делает работу:

- **Сканирует** все страницы документа (или только выделение, если
  переключить в тулбаре) и собирает все используемые семейства +
  начертания.
- Для каждого начертания пишет, **есть оно в системе или нет**: бейдж
  «в ОС» (зелёный) или «нужен» (красный).
- **Уже отмечает чекбоксами** только то, что нужно скачать. Лишнее
  не предлагает.
- **Превью каждого начертания** — настоящим шрифтом, текст и размер
  меняются в тулбаре. На «Выделении» в превью автоматически
  подставляется реальный текст из выделенных слоёв.

### Что делать с найденными шрифтами

Внизу окна — три кнопки:

| Кнопка | Что делает |
|---|---|
| **⚡ Установить** | Сразу кладёт шрифты в системную папку (без ZIP, без архивации). Один раз спросит, какую папку открыть — дальше всё на автомате. *Работает в свежих версиях Figma Desktop.* |
| **ZIP** | Собирает один архив со всеми выбранными `.ttf` и кладёт в Загрузки. Дальше — установить руками (двойной клик / ПКМ → Установить). |
| **Сброс** | Снимает все чекбоксы. |

После установки **перезапусти Figma Desktop** — иначе новые шрифты
в списке Figma не появятся.

### Если шрифта **нет** в открытом каталоге

Например, Compacta Lt BT, Helvetica Neue, или твой фирменный шрифт.
Плагин покажет такое семейство с пометкой «нет в каталоге», а под
ним — две кнопки:

- **🔎 Найти в сети** — открывает окно с авто-поиском по полному
  open-source каталогу Fontsource (~2000 шрифтов). Если точного
  совпадения нет, ищет **похожие по стилю** (например, для Compacta
  предложит Bebas Neue, Anton, Oswald — узкие display sans-serif).
  По кнопке **«Скачать»** напротив любой строки соберёт ZIP со всеми
  начертаниями этого шрифта в Загрузки. Если и в open-source ничего
  не нашлось — внизу есть раскрывающийся список с 8 бесплатными
  шрифт-сайтами (Google Fonts, Font Squirrel, 1001 Fonts, DaFont,
  Fontesk и т.д.) — открываются в браузере с уже подставленным поиском.
- **Загрузить ZIP** — переключает на вкладку ZIP, чтобы загрузить свой
  файл шрифта.

### Вкладка «Каталог»

Все ~170 предустановленных шрифтов плюс поиск по названию. Используй,
если хочешь добавить шрифт в проект сверх того, что уже используется.

### Вкладка «ZIP»

Перетащи сюда свой ZIP с шрифтами (или россыпью `.ttf` / `.otf` /
`.woff` / `.woff2`) — плагин распакует, определит семейства по именам
файлов и предложит выбрать начертания. Дальше — те же кнопки
**⚡ Установить** / **ZIP**.

## 🔧 Установка шрифтов после скачивания ZIP

(Этот шаг не нужен, если ты использовал кнопку **⚡ Установить** — она
кладёт сразу в систему.)

### Windows

1. Распакуй архив.
2. Выдели все файлы → ПКМ → **Установить** (без админ-прав, для текущего
   пользователя) или **Установить для всех пользователей**.
3. Перезапусти Figma Desktop.

Подробнее, с траблшутингом: [INSTALL_WIN.md](INSTALL_WIN.md)

### macOS

1. Распакуй архив (двойной клик).
2. Выдели все `.ttf` → двойной клик → в Книге шрифтов нажми **«Установить
   шрифт»**. Или перетащи файлы в `~/Library/Fonts/` напрямую.
3. Перезапусти Figma Desktop (Cmd+Q, открой заново).

Подробнее: [INSTALL_MAC.md](INSTALL_MAC.md)

## 📦 Источники шрифтов

| Источник | Что даёт | Лицензия |
|---|---|---|
| **Google Fonts** через [Fontsource](https://fontsource.org/) | ~150 предустановленных популярных семейств в каталоге плагина (Inter, Roboto, Montserrat, JetBrains Mono, Playfair, Bebas Neue, Onest, Unbounded и т.д.); полный набор весов; кириллица для большинства | OFL / Apache 2.0 |
| **Fontsource API** (поиск) | Полный открытый каталог — ~2000 семейств, доступен через кнопку **🔎 Найти в сети**. Кешируется в `figma.clientStorage` на 24 часа. | OFL / Apache 2.0 |
| **Fontshare** (Indian Type Foundry) | ~16 топовых дизайнерских семейств: Satoshi, Cabinet Grotesk, Clash Display, Switzer, Boska и др. | Бесплатно для личного и коммерческого использования |
| **Пользовательский ZIP** | Любые `.ttf` / `.otf` / `.woff` / `.woff2` — фирменные, платные, кастомные | по лицензии источника |

Внешние домены ограничены `manifest.json` — плагин ходит только на 7
хостов, не больше.

## ⚠️ Если плагин не запустился

- **Нет пункта «Development»** в меню → открой любой файл в Figma Desktop;
  без открытого файла этого подменю просто нет.
- **Импортировал, но плагина нет в списке** → меню → **Plugins →
  Development → Open console** — там будут ошибки импорта (например,
  в JSON манифеста).
- **«This plugin requires a newer version of Figma»** → обнови Figma
  Desktop.
- **Кнопка «⚡ Установить» серая** → у тебя старая Figma Desktop без
  поддержки File System Access API. Используй **ZIP** — работает везде.

Если что-то иначе — открой issue на
[GitHub](https://github.com/ychkydyk/figma-plugin-fonts/issues) или
напиши в Telegram [@mantunamochil](https://t.me/mantunamochil).

## 🔒 Безопасность

- Сетевой доступ ограничен whitelist-доменами в `manifest.json` (7 хостов).
- Нет внешних JS-зависимостей.
- Все скачиваемые байты проверяются на **magic bytes** шрифтовых
  форматов (TTF/OTF/WOFF/WOFF2/TTC) — защита от подмены файлов.
- Содержимое твоих ZIP-аплоадов **не уходит в сеть**.
- Защита от path traversal в именах из ZIP.

Подробнее — в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
