# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный
автоматизатор. Electron + ванильный JavaScript. Без фреймворков.

## Текущий шаг

**Шаг 20 завершён.** Final beta QA and bugfix pass. Проект остаётся
в стадии `0.1.0-beta preparation` (simulation-only). Готовится
`v0.1.0-beta` GitHub pre-release. На шаге 20:
структурный аудит (0 дубликатов id, 0 broken refs, 0 forbidden
module imports, perfect i18n parity 342/342); smoke-check расширен
(теперь 96 проверок); добавлены [`docs/BETA_QA_REPORT.md`](./docs/BETA_QA_REPORT.md)
и [`docs/I18N_CHECKLIST.md`](./docs/I18N_CHECKLIST.md);
обновлены `SMOKE_TESTS.md`, `MVP_CHECKLIST.md`, `README.md`,
`CHANGELOG.md`. **Реальные действия по-прежнему отключены:
`realDesktopActions = false`, `simulationOnly = true`,
`isRealActionAllowed() → false`, `isRealAdapterAllowed() → false`,
`setActiveAdapter("real-desktop")` блокируется,
`executionMode === "real"` блокируется в `executeAction()`,
`evaluateRealActionReadiness() → { allowed: false, ... }`.**
Перед beta-релизом нужен ручной smoke-тест по
`docs/SMOKE_TESTS.md` Step 20.

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

## Статус реализации (на конец шага 20)

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

- **Desktop adapter interface + mock adapter (шаг 18):**
  - `src/desktop-adapter-interface.js` — `getAdapterContract()`
    (`{ version: 1, supportedActions: ["click"],
    realActionsAllowed: false, simulationOnly: true,
    requiresMainProcess: true, requiresUserConfirmation: true,
    requiresEmergencyStop: true }`),
    `getSupportedAdapterActions()`, `validateAdapterAction()`,
    `normalizeAdapterAction()`, `createAdapterResult()`,
    `isRealAdapterAllowed()` (hard-coded `false`).
  - `src/mock-desktop-adapter.js` — единственный `available: true`
    adapter. `executeMockAction()` (валидация → audit
    `adapter.mock.executed` → структурированный результат),
    `runMockAdapterSelfTest()` (4 проверки: validate click action,
    execute mock action, real action blocked, reject malformed
    action). **Не выполняет реальный системный ввод.**
  - `src/adapter-registry.js` — реестр adapter'ов:
    `mock` (`available: true`, активен по умолчанию) и
    `real-desktop` (`available: false`, `planned: true`,
    `disabledReason: "Real desktop actions are not implemented in
    this build"`). `setActiveAdapter("real-desktop")` всегда
    возвращает `{ success: false, blocked: true, ... }` и эмитит
    `adapter.selection.blocked` + `adapter.real.unavailable`.
  - `src/action-pipeline.js` — simulate-путь идёт через активный
    adapter (mock). Defensive: даже если бы активный adapter
    объявил `realActions: true`, pipeline всё равно вызвал бы
    `blockRealAction()`.
  - `src/audit-events.js` — allowlist расширен 6 новыми типами:
    `adapter.selftest.started`, `adapter.selftest.completed`,
    `adapter.selftest.failed`, `adapter.selection.blocked`,
    `adapter.mock.executed`, `adapter.real.unavailable`.
  - Карточка **Desktop adapter status** в Advanced → Safety с
    кнопкой **Run adapter self-test**. `Copy diagnostics` содержит
    строку `Adapter:`.
  - `docs/ADAPTER_INTERFACE.md` — отдельный документ с контрактом,
    safety gates и future-implementation checklist.
  - 21 новый i18n-ключ RU + EN.
  - `npm run smoke` проверяет наличие трёх новых файлов и
    source-инвариантов: registry содержимое, mock invariants,
    interface contract, расширенный allowlist audit-событий.

- **Real-action sandbox (шаг 19):**
  - `src/real-action-sandbox.js` — read-only preview слой.
    `getSandboxStatus()` → `{ simulationOnly: true,
    realActionsImplemented: false, realActionsAllowed: false,
    dryRunAvailable: true, ... }`.
    `evaluateRealActionReadiness()` — всегда `{ allowed: false }`.
    `getRealActionBlockedReasons()` — 7 stable ID причин.
    `createPermissionChecklist()` — 11 пунктов с
    `ready / missing / planned / blocked`.
    `createDryRunPlan()` — описание-only с превью до 10 действий
    и `truncated`-флагом.
    `createRealActionPreview()`, `confirmDryRunPlan()`,
    `cancelDryRunPlan()` — все возвращают `realExecution: false`.
  - `src/action-pipeline.js` — добавлен `executeDryRunAction()` для
    `executionMode === "dry-run"`. Сообщение блокировки real-mode:
    `Real desktop actions are disabled. Dry-run preview is available only.`
  - `src/audit-events.js` — allowlist расширен 6 sandbox-типами:
    `real.sandbox.preview.created`, `real.sandbox.dryrun.confirmed`,
    `real.sandbox.dryrun.cancelled`, `real.sandbox.blocked`,
    `real.permission.checklist.created`,
    `real.blocked.reason.generated`.
  - Карточка **Real action sandbox** в Advanced → Safety с кнопкой
    **Create dry-run preview**. Inline preview-карточка показывает
    scenario name / action count / estimated duration / превью
    действий (max 10) / permission checklist (11 пунктов) /
    blocked reasons (7 ID) / Confirm/Cancel кнопки + warning
    «No real actions will be executed».
  - `Copy diagnostics` содержит строку `Sandbox:`.
  - `docs/REAL_ACTION_SANDBOX.md` — отдельный документ.
  - 28 новых i18n-ключей RU + EN.
  - `npm run smoke` проверяет наличие нового файла и документа,
    source-инварианты, расширенный allowlist audit-событий,
    обновлённый pipeline block message и упоминание dry-run/sandbox
    в README/PROJECT_CONTEXT.

- **Final beta QA and bugfix pass (шаг 20):**
  - **Структурный аудит:** 0 дубликатов DOM id, 0 broken
    `getElementById` ссылок (renderer ↔ index.html), 0
    forbidden-module imports, все 9 `innerHTML` — только `= ''`.
  - **i18n parity:** 342 ключа в `ru` = 342 ключа в `en`, 0
    mismatches. Все 55 атрибутов `data-i18n` и все 220 вызовов
    `t()` определены в обоих локалях.
  - **smoke-check расширен** до 96 проверок: добавлены
    `preload.js does not expose ipcRenderer directly`
    (через regex без false-positive на import-строку),
    `all <script src="…"> in index.html resolve on disk`,
    `Step 20 doc exists: docs/BETA_QA_REPORT.md`,
    `Step 20 doc exists: docs/I18N_CHECKLIST.md`,
    `README or PROJECT_CONTEXT mentions step 20`.
  - **Corrupted-JSON fallback** перепроверен на изолированном
    temp-dir сценарии: missing → `{success:true, data:null,
    corrupted:false}`; valid → `{success:true, data:<parsed>,
    corrupted:false}`; corrupted → переименование в
    `<file>.broken-<timestamp>` + `{success:true, data:null,
    corrupted:true}`. Поведение в renderer (`init()` → warning log
    + `CORRUPT_*_JSON` в error history) сохранено.
  - **Адаптер self-test** прогнан через vm-харнес — 4/4 passing.
  - **Dry-run preview** прогнан через vm-харнес — короткие
    сценарии не помечаются `truncated`, длинные (50000) корректно
    капаются до 10. `confirmDryRunPlan()` всегда возвращает
    `realExecution: false`. `executionMode: "real"` блокируется
    с буквальным сообщением `Real desktop actions are disabled.
    Dry-run preview is available only.`. `executionMode: "dry-run"`
    возвращает `{ ok: true, mode: "dry-run", simulated: false,
    realExecution: false, blocked: false }`.
  - **`docs/BETA_QA_REPORT.md`** — финальный QA-отчёт с разделами
    Scope / What was checked / Smoke-check status / Manual test
    status / Security status / Localization status / Known issues
    / Blockers / Release recommendation = "Ready for beta after
    manual testing".
  - **`docs/I18N_CHECKLIST.md`** — manual review checklist для
    RU/EN-локализации.
  - **`docs/SMOKE_TESTS.md`** — добавлен раздел Step 20 с тестами
    #115–#134 (npm install / smoke / start / основной флоу /
    self-test / dry-run / corrupted JSON / DevTools real-mode
    блокирован).
  - **`docs/MVP_CHECKLIST.md`** — секция 20 со списком проверок и
    их результатов.
  - README, PROJECT_CONTEXT, CHANGELOG обновлены до шага 20.
  - **Релиз-рекомендация:** ready for beta after manual testing.

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
  `audit-events.js` (Step 16-17), а также
  `desktop-adapter-interface.js`, `mock-desktop-adapter.js`,
  `adapter-registry.js` (Step 18) и
  `real-action-sandbox.js` (Step 19).
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
| 18 | Desktop adapter interface + mock adapter + registry. Mock active. Real adapter blocked. |
| 19 | Real-action sandbox: dry-run preview, permission checklist, blocked reasons. No real execution. |
| 20 | Final beta QA and bugfix pass: structural audit, expanded smoke-check (96 checks), BETA_QA_REPORT, I18N_CHECKLIST. Manual smoke required before tag. |

## Что логично делать на шаге 21

- **`v0.1.0-beta` GitHub pre-release**: тэг + прикреплённые
  `npm run dist` артефакты + README → release notes на GitHub.
  **Гейт:** ручной smoke-run по `docs/SMOKE_TESTS.md` Step 20.
- **Реальные иконки** для tray и packaged-builds (PNG/ICO/ICNS),
  сгенерированные из `assets/icons/clickflow-icon.svg`.
- **Code signing notes** (Windows + macOS) и первый подписанный build.
- **GitHub Actions CI**: `npm run smoke` на каждый push и PR
  (запустить через `actions/setup-node` + `npm install` + `npm run
  smoke`). Никаких реальных Electron-харнесов в CI пока что.
- **Accessibility-аудит**: `aria-label` на icon-only кнопках,
  `aria-live="polite"` на статусе и preview, полная клавиатурная
  навигация по 7 вкладкам Advanced.
- **Smoke-harness 2.0** (Playwright или альтернатива):
  поднимает Electron headless и проверяет — no real input fires;
  DevTools-попытки `executionMode:'real'`, `setActiveAdapter('real-desktop')`,
  `evaluateRealActionReadiness()` блокируются;
  `executionMode:'dry-run'` корректно отрабатывает; RU↔EN; dark
  theme; CSP не ослаблен.
- **Audit events UI 1.0**: отдельный sub-tab «Audit» в Advanced с
  фильтрами и экспортом в JSON/JSONL (всё ещё in-memory).
- **Dry-run replay viewer**: in-memory история dry-run планов с
  возможностью повторно открыть и сравнить два плана. Без реального
  выполнения.
