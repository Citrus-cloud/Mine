# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный
автоматизатор. Electron + ванильный JavaScript. Без фреймворков.

## Текущий шаг

**Шаг 17 завершён.** Проект находится в стадии
`0.1.0-beta preparation` (simulation-only). Готовится `v0.1.0-beta`
GitHub pre-release. На шаге 17 добавлена архитектура controlled
action pipeline + safety gates + in-memory audit events.
**Реальные действия по-прежнему отключены: `realDesktopActions = false`,
`simulationOnly = true`, `isRealActionAllowed()` всегда `false`,
`executionMode === "real"` блокируется в `executeAction()`.**

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
11. **Feature flags safety-sensitive флаги (`realDesktopActions`,
    `ocr`, `imageRecognition`) — frozen в `src/feature-flags.js`.**
    Нет UI / IPC / env-vars, которые могут их перевернуть. Любое
    изменение проходит `docs/REAL_ACTIONS_GO_NO_GO.md`.

## Статус реализации (на конец шага 17)

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
- **Final stabilization (шаг 15):**
  - `scripts/smoke-check.js` + `npm run smoke` (без зависимостей,
    без Electron).
  - Beta-health card в Advanced → Safety
    (simulationOnly, realClicksImplemented, ocrImplemented,
    imageRecognitionImplemented, docsReady, packagingConfigured,
    securityChecklistPresent, actionSchemaPresent).
  - IPC `system:get-beta-health` (read-only, без приватных путей).
  - Corruption-safe загрузка JSON в main: повреждённый файл
    переименовывается в `<file>.broken-<ts>` и используются
    дефолты, без падения. Renderer показывает warning-лог и
    запись `CORRUPT_*_JSON` в error history.
  - `docs/FINAL_BETA_REVIEW.md`.
- **Handoff design (шаг 16):**
  - `src/feature-flags.js` — `Object.freeze`-d safe defaults
    (`realDesktopActions: false`, `ocr: false`,
    `imageRecognition: false`, `simulationOnly: true`,
    `globalHotkeys: true`, `profiles: true`, `importExport: true`).
  - Feature flags card в Advanced → Safety.
  - Next safety milestone card в Advanced → Future.
  - Diagnostics включают строку Feature flags и Beta health.
  - `docs/REAL_ACTIONS_GO_NO_GO.md`, `docs/FEATURE_FLAGS.md`,
    `docs/AUDIT_LOG_PLAN.md`, `docs/PRIVACY.md`.
  - 25 новых i18n-ключей RU + EN.
- **Controlled action pipeline (шаг 17):**
  - `src/action-pipeline.js` — централизованный `executeAction()`,
    `validateAction()`, `evaluateActionSafety()`,
    `createActionContext()`, `executeSimulatedAction()`,
    `blockRealAction()`, `canExecuteRealAction()` (always false),
    `getActionPipelineStatus()`. **Любая попытка
    `executionMode === "real"` блокируется** с сообщением
    "Real desktop actions are disabled in this build" и audit-событием
    `action.real.blocked`.
  - `src/safety-gates.js` — `getSafetyGateStatus`,
    `validateScenarioSafety`, `validateActionSafety`,
    `getRealActionRequirements` (9 пунктов),
    `getMissingRealActionRequirements`, `isSimulationAllowed`,
    `isRealActionAllowed` (always false на этом шаге).
  - `src/audit-events.js` — in-memory модель audit-событий с фиксированным
    allowlist'ом типов (`scenario.start.requested`, `scenario.start.approved`,
    `scenario.stop.requested`, `scenario.completed`, `emergency.stop`,
    `action.simulated`, `action.real.blocked`,
    `safety.validation.failed`, `settings.changed`,
    `import.completed`, `export.completed`). **File persistence НЕ
    реализована** — план в `AUDIT_LOG_PLAN.md`.
  - `click-engine.js` теперь вызывает `executeAction()` вместо прямого
    `simulateClick()`. Прежнее поведение сценариев сохранено;
    `simulateClick()` оставлен как обёртка для обратной совместимости.
  - Карточки Action pipeline / Safety gates / Real actions readiness /
    Audit events в Advanced → Safety. Локализованный warning
    "Real desktop actions are disabled".
  - Расширен `Copy diagnostics`: добавлены строки `Action pipeline`,
    `Safety gates`, `Audit events`.
  - 22 новых i18n-ключа RU + EN.
  - `npm run smoke` проверяет существование новых файлов и
    инвариантов в исходниках.

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
  Включает `feature-flags.js`, `action-pipeline.js`, `safety-gates.js`,
  `audit-events.js` (Step 16-17).
- `assets/` — packaging resources, локальный SVG-икон.
- `docs/` — TEST_PLAN, MVP_CHECKLIST, SECURITY_CHECKLIST,
  SMOKE_TESTS, PACKAGING, DESKTOP_ADAPTER_PLAN, ACTION_SCHEMA,
  BETA_TESTING_GUIDE, KNOWN_LIMITATIONS, ROADMAP,
  **FINAL_BETA_REVIEW** (15), **REAL_ACTIONS_GO_NO_GO** (16),
  **FEATURE_FLAGS** (16), **AUDIT_LOG_PLAN** (16),
  **PRIVACY** (16).
- `scripts/` — `smoke-check.js` (без зависимостей, без Electron) +
  `README.md` с правилами для будущих helper-скриптов.
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
| 15 | Final stabilization: `npm run smoke`, Beta health, JSON corruption guard, `FINAL_BETA_REVIEW`. |
| 16 | Handoff design: feature flags, go/no-go, audit log plan, privacy doc, next safety milestone UI. |
| 17 | Controlled action pipeline + safety gates + in-memory audit events. Real actions blocked. |

## Что логично делать на шаге 18

- **Подготовка `v0.1.0-beta` GitHub pre-release**: тэг,
  `npm run dist` артефакты, README → release notes.
- **Реальные иконки** для tray и packaged-builds (PNG/ICO/ICNS),
  сгенерированные из `assets/icons/clickflow-icon.svg`.
- **Code signing notes** (Windows + macOS) и первый подписанный build.
- **Автоматический CI** — GitHub Actions, который запускает
  `npm run smoke` на push и PR.
- **Accessibility-аудит**: `aria-label` на icon-only кнопках,
  `aria-live="polite"` на статусе выполнения, полная клавиатурная
  навигация по 7 вкладкам Advanced.
- **Smoke-harness 2.0** — Playwright или альтернатива, поднимающая
  Electron headless и проверяющая «no real input fires», RU/EN
  переключение, dark theme, CSP не ослаблен, отказ
  `executionMode: "real"` на уровне DevTools.
- **Audit events UI 1.0** — отдельный sub-tab «Audit» с фильтрами,
  экспортом в JSON / JSONL (всё ещё in-memory; file persistence
  только в шаге, который реализует требования
  `REAL_ACTIONS_GO_NO_GO.md` §4).
