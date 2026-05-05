# Архитектура

## Компоненты

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│  code.js (main thread)  │ ◄─────► │  ui.html (iframe / sandbox)  │
│  Figma sandbox API      │  msg    │  - три таба                  │
│  - listAvailableFonts   │         │  - lazy preview (FontFace)   │
│  - сканирование текстов │         │  - ZIP read (Decompress.)    │
│                         │         │  - ZIP write (STORE+CRC32)   │
└─────────────────────────┘         │  - download trigger          │
                                     └──────────────┬───────────────┘
                                                    │ fetch (allowedDomains)
                                                    ▼
                                     ┌──────────────────────────────┐
                                     │  cdn.jsdelivr.net/fontsource │
                                     │  api.fontsource.org          │
                                     │  fonts.gstatic.com (опц.)    │
                                     │  fonts.bunny.net (fallback)  │
                                     └──────────────────────────────┘
```

## Потоки

### 1. Скан документа

1. UI шлёт `{type:"scan"}` → `code.js`.
2. `code.js` обходит `figma.root.children`, собирает все `fontName` (включая
   диапазоны через `getRangeFontName` для mixed-узлов).
3. Через `figma.listAvailableFontsAsync()` помечает каждое начертание как
   доступное / недоступное в системе.
4. Возвращает в UI `{type:"scan-result", families:[...], missingCount}`.

### 2. Превью

1. Пользователь раскрывает карточку семейства.
2. Каждая строка-начертание триггерит `loadRowPreview(row)`:
   - для каталога: `fetchFont(fontsourceUrl(slug, subset, weight, style))` —
     subset выбирается `cyrillic` если есть, иначе `latin`.
   - для пользовательских — берёт `bytes` из `state.uploaded`.
3. `new FontFace(uniqueFamily, bytes, {style, weight})` → `await load()` →
   `document.fonts.add()`.
4. CSS превью-блока переключается на этот уникальный family.

### 3. Сборка ZIP

1. Для каждого выбранного начертания:
   - `state.selected` хранит метаинформацию + (если уже скачано) `bytes`.
   - Если `bytes` нет — `fetchFont(url)` догружает.
2. `buildZip(entries)`:
   - Для каждой записи: local file header (30 байт + UTF-8 name) +
     raw data (STORE — без компрессии).
   - Central directory сразу после всех данных.
   - End of central directory (22 байт).
   - CRC32 — table-based, polynomial `0xEDB88320`.
3. `Blob([zip], {type:"application/zip"})` → `<a download>` → клик.

### 4. Парсинг пользовательского ZIP

1. EOCD ищется сканом с конца буфера (макс. 65557 байт по спецификации).
2. Central directory разбирается полностью; для каждого файла:
   - метод 0 (STORE) — данные берутся напрямую.
   - метод 8 (DEFLATE) — `new DecompressionStream("deflate-raw")` →
     `Blob([compressed]).stream().pipeThrough(ds)`.
3. Файлы фильтруются по расширениям `.ttf`/`.otf`/`.woff`/`.woff2`.
4. `parseFontFilename(path)` извлекает family / weight / style из имени.

## Безопасность

| Угроза | Митигация |
|---|---|
| Внешний JS / supply-chain | Нет npm-зависимостей. Только инлайн-код. |
| Untrusted JS из ZIP | Не исполняется — только бинарные файлы шрифтов. |
| Утечка содержимого документа в сеть | `code.js` шлёт в UI только имена шрифтов; UI не передаёт документные данные ни на один внешний host. |
| Произвольные запросы | `manifest.json.networkAccess.allowedDomains` — белый список. |
| Вредоносный шрифт | Файл записывается в ZIP, в ОС не устанавливается автоматически — юзер сам решает. На этапе B (companion) добавится лимит размера и хеш-журнал. |

## Кросс-платформенность

UI и `code.js` идентичны на Windows и macOS. Различия только в подсказке
после скачивания: `detectOS()` смотрит `navigator.platform`/`userAgent`
и показывает соответствующую инструкцию (пути к папкам шрифтов в
Windows / macOS, метод установки).

Companion (этап B) будет двух-бинарный: `.exe` для Windows, `.pkg`/`.app`
для macOS, общий ядро на Go или Rust.
