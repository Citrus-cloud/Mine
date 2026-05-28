# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный
автоматизатор. Electron + ванильный JavaScript. Без фреймворков.

## Текущий шаг

**Шаг 14 завершён.** Проект находится в стадии
`0.1.0-beta preparation`.

## Стек

- JavaScript (ES2020+), Electron 28+, HTML/CSS, Node.js (main process).
- `electron-builder` для упаковки.
- Нет сборщиков для dev (script tags в `index.html`).
- Нет React / Vue / Angular / TypeScript.

## Архитектурные правила (обязательные)

1. `contextIsolation: true`, `nodeIntegration: false` — **всегда**.
2. Renderer общается с Node только через `preload.js` (contextBridge).
3. Все системные операции — в main process (file dialogs, hotkeys,
   tray, menu, system info, FS).
4. Renderer не должен получать сырой `ipcRenderer`.
5. Все UI-тексты — через `i18n.js`, **обязательно RU + EN**.
6. DOM-безопасность: пользовательские данные — только через
   `textContent`. `innerHTML` допустим **только** для очистки
   контейнера (`= ''`).
7. CSP `default-src 'self'; script-src 'self'; style-src 'self';`
   не ослаблять.
8. Diagnostics не должны выдавать приватные пути файловой системы.
9. Главный экран остаётся минималистичным (max-width 520px).
   Advanced — 940px (1000x700-friendly).
10. Любая работа над реальным вводом / OCR / image recognition
    проходит **отдельный safety review** до начала кодинга.

## Статус реализации (на конец шага 14)

### Реализовано
- Electron-приложение, главное минималистичное меню.
- Сценарии `simple_click`: CRUD, валидация, persistence.
- Безопасный `click-engine` (имитация), progress, Stop, Emergency Stop.
- Настройки, темы (system / light / dark), safe mode, safety limits.
- Локализация RU/EN, переключение на лету.
- Advanced dashboard: 7 вкладок (Overview, Scenarios, Execution,
  Logs, Settings, Safety, Future).
- Импорт / экспорт сценариев (preview / confirm / cancel),
  бэкап, профили.
- `error-manager`, история ошибок, диагностика, copy-to-clipboard
  без приватных путей.
- Глобальные горячие клавиши (`globalShortcut`):
  `CmdOrCtrl+Alt+S/X/E`. Tray. Application menu. Lifecycle с
  подтверждением выхода при работающем сценарии.
- `electron-builder` сконфигурирован: Win NSIS, macOS DMG,
  Linux AppImage. `assets/` готов.
- Beta polish (шаг 13): дизайн-токены, бейджи `simulationBadge` /
  `badge-version`, переработанный `styles.css` (16 секций),
  переработанный dark theme, responsive 1000x700.
- Release prep (шаг 14): `CHANGELOG.md`, `RELEASE_NOTES.md`,
  `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/*`,
  `.github/pull_request_template.md`,
  `docs/BETA_TESTING_GUIDE.md`, `docs/KNOWN_LIMITATIONS.md`,
  `docs/ROADMAP.md`.

### НЕ реализовано (намеренно)
- **Реальные системные клики.** Нет `robotjs`, `nut.js`, `iohook`,
  `node-key-sender`, нет нативных модулей ввода.
- **OCR.** Нет.
- **Image recognition / OpenCV.** Нет.
- **Мобильная версия.** Нет.
- **Cloud sync.** Нет.
- **Auto-update.** Нет.
- **Code signing.** Не настроено.

### Permanently out of scope
- Captcha / antibot bypass.
- Ad-click automation.
- Автоматизация против банковских / платёжных / защищённых
  приложений.

См. `docs/KNOWN_LIMITATIONS.md` и `docs/ROADMAP.md`.

## Где что лежит

- `main.js` — Electron main, IPC, menu, tray, hotkeys, lifecycle.
- `preload.js` — contextBridge `window.clickflow.*`.
- `src/` — renderer modules + `index.html` + `styles.css` + `i18n.js`.
- `assets/` — packaging resources, локальный SVG-икон.
- `docs/` — TEST_PLAN, MVP_CHECKLIST, SECURITY_CHECKLIST,
  SMOKE_TESTS, PACKAGING, DESKTOP_ADAPTER_PLAN, ACTION_SCHEMA,
  BETA_TESTING_GUIDE, KNOWN_LIMITATIONS, ROADMAP.
- `.github/` — issue + PR templates.
- `CHANGELOG.md`, `RELEASE_NOTES.md`, `CONTRIBUTING.md`, `README.md`,
  `PROJECT_CONTEXT.md` — release-уровневые документы.

## История шагов

| Шаг | Что сделано |
|-----|-------------|
| 1 | Базовый Electron-проект. |
| 2 | `app-state`, `logger`, `scenario-manager`. |
| 3 | CRUD сценариев, IPC сохранение. |
| 4 | `click-engine` (имитация), прогресс. |
| 5 | Настройки, i18n, hotkeys, safety. |
| 6 | Advanced dashboard (7 вкладок). |
| 7 | Импорт / экспорт, профили. |
| 8 | `error-manager`, диагностика. |
| 9 | TEST_PLAN, MVP_CHECKLIST, accessibility baseline. |
| 10 | DESKTOP_ADAPTER_PLAN, ACTION_SCHEMA, readiness checklist. |
| 11 | `globalShortcut`, Menu, Tray, lifecycle. |
| 12 | `electron-builder`, PACKAGING, SECURITY_CHECKLIST, SMOKE_TESTS, system info. |
| 13 | Beta polish: дизайн-токены, dark theme, assets. |
| 14 | Release prep: CHANGELOG / RELEASE_NOTES / CONTRIBUTING / templates / docs. |

## Что логично делать на шаге 15

- Accessibility-аудит: `aria-label` на icon-only кнопках,
  `aria-live` на статусе, полная клавиатурная навигация по
  Advanced dashboard.
- Автоматический smoke-harness (Playwright / альтернатива):
  app boots, no real input fires, dark theme стабильна, RU/EN
  переключается, CSP не ослаблен.
- Реальные иконки для tray и packaged-builds (PNG/ICO/ICNS).
- Заметки по code signing (Windows + macOS) и первый подписанный
  build.
- Подготовка тэга `v0.1.0-beta` и первый GitHub pre-release.
