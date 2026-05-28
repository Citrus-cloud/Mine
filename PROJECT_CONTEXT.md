# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный
автоматизатор. Electron + ванильный JavaScript. Без фреймворков.

## Текущий шаг

**Шаг 24 завершён.** Final beta release preparation. Проект
остаётся в стадии `0.1.0-beta pre-release preparation`
(simulation-only). На шаге 24 добавлены
[`docs/FINAL_RELEASE_SUMMARY.md`](./docs/FINAL_RELEASE_SUMMARY.md)
(single-page snapshot релиза),
[`docs/PRE_RELEASE_CHECKLIST.md`](./docs/PRE_RELEASE_CHECKLIST.md)
(manual checklist перед тэгом),
[`docs/RELEASE_TAG_PLAN.md`](./docs/RELEASE_TAG_PLAN.md)
(manual command sequence для tag/push/publish), и
[`docs/RELEASE_COMMIT_MESSAGE.md`](./docs/RELEASE_COMMIT_MESSAGE.md)
(recommended commit message + список запрещённых body lines).
Обновлены `docs/RELEASE_FINAL_CHECK.md` (ссылки на 4 новых
документа, Release decision = "Ready for beta pre-release after
manual packaged-app QA"), `docs/RELEASE_BLOCKERS.md` (status
"No automated/static release blockers at this stage"),
`docs/GITHUB_RELEASE_DRAFT.md` (Step 24 в highlights),
`RELEASE_NOTES.md` (Steps 1—24 + Step 24 раздел). IPC
`system:get-release-status` дополнен полями
`finalReleaseSummaryPresent`, `preReleaseChecklistPresent`,
`releaseTagPlanPresent`, `releaseCommitMessagePresent`,
`readyForPreReleaseAfterManualQa`. Карточка Release status в
Advanced → Safety расширена до 18 строк (4 новые) и
переключилась на бейдж `Ready for pre-release after manual QA`.
`Copy diagnostics` дополнен. Smoke-check расширен до
**193 проверок**. Добавлено 7 новых i18n-ключей RU + EN.
**Реальные действия по-прежнему отключены** на всех шести слоях
защиты. **Tag и публикация GitHub Release остаются ручными
действиями.** Финальный гейт перед тэгом — manual packaged-app
QA + tick `PRE_RELEASE_CHECKLIST.md` + Release decision
"Ready" в `RELEASE_BLOCKERS.md`.

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

## Статус реализации (на конец шага 24)

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

- **Beta release packaging pass (шаг 21):**
  - **`package.json`**: добавлен `directories.output: "dist"`;
    расширен `files`-массив до `[main.js, preload.js, src/**/*,
    assets/**/*, docs/**/*, README.md, PROJECT_CONTEXT.md,
    CHANGELOG.md, RELEASE_NOTES.md, CONTRIBUTING.md, package.json]`;
    добавлены явные исключения `!**/*.broken-*`, `!**/.DS_Store`,
    `!**/Thumbs.db`, `!**/.git`, `!**/.gitignore`; добавлены
    `mac.category: public.app-category.utilities` и
    `linux.category: Utility`. **Версия `0.1.0` сохранена.**
  - **`.gitignore`** (новый): `node_modules/`, `dist/`, `out/`,
    `build/`, `release/`, OS junk (`.DS_Store`, `Thumbs.db`),
    логи, IDE-каталоги, временные файлы, `.env*`, `userData/`,
    `*.broken-*` и локальные `clickflow-*-*.json` backup-файлы.
  - **Документы (новые):**
    [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md) —
    9-секционный чеклист (pre-release / security / simulation-only
    / packaging / documentation / localization / manual QA /
    GitHub release / post-release).
    [`docs/BUILD_ARTIFACTS.md`](./docs/BUILD_ARTIFACTS.md) —
    описание выходов `npm run pack` / `npm run dist`, naming-схема
    GitHub release assets, что не должно попадать в артефакты,
    как верифицировать каждый файл перед загрузкой.
    [`docs/GITHUB_RELEASE_DRAFT.md`](./docs/GITHUB_RELEASE_DRAFT.md) —
    готовый текст pre-release для GitHub: title, summary,
    highlights, safety model (six layers), what works, what is not
    included, installation, testing notes, known limitations,
    download artifacts placeholder, feedback links, security note.
    [`docs/VERSIONING.md`](./docs/VERSIONING.md) — semver-подход,
    что считается patch / minor / major, план линий 0.1.x — 0.2.x
    — 0.3.x — 0.4.x, hard rule про real-input гейт.
  - **IPC `system:get-release-status`** (новый, в `main.js`) —
    read-only, читает только из `app.getAppPath()`. Возвращает
    `appVersion`, `beta`, `simulationOnly`, `realActionsImplemented`,
    `smokeCheckScript`, `packagingConfigured`,
    `releaseChecklistPresent`, `buildArtifactsPresent`,
    `githubReleaseDraftPresent`, `versioningPresent`,
    `changelogPresent`, `releaseNotesPresent`, `gitignorePresent`,
    `releaseDocsReady`. Никаких приватных путей.
  - **Карточка Release status** в Advanced → Safety с 12 строками
    + итоговый бейдж `Ready for beta release` / `Not ready for
    release`.
  - **`Copy diagnostics`** теперь содержит строку `Release: …`.
  - **Smoke-check расширен до 113 проверок** (с 96): добавлены
    проверки `.gitignore` (включая ключевые токены node_modules /
    dist / .DS_Store / Thumbs.db / *.log), `package.json` scripts
    `pack` и `dist`, `electron-builder` как devDependency,
    `build.appId` / `build.productName` / `build.files` /
    `build.directories.output` / `build.directories.buildResources`,
    наличие 4 новых release-документов, упоминания «step 21» в
    README или PROJECT_CONTEXT, упоминания simulation-only в
    `RELEASE_NOTES.md`, утверждений simulation-only и no real
    clicks/OCR/image-recognition в `RELEASE_CHECKLIST.md` и
    `GITHUB_RELEASE_DRAFT.md`.
  - **i18n**: 19 новых ключей RU + EN (`releaseStatus`,
    `betaVersion21`, `smokeCheckScript`, `packagingConfigured`,
    `releaseChecklistPresent`, `changelogPresent`,
    `releaseNotesPresent`, `githubReleaseDraftPresent`,
    `buildArtifacts`, `releaseReady`, `releaseNotReady`,
    `betaRelease`, `simulationOnlyRelease`,
    `realActionsNotIncluded`, `packagingDocs`, `versioning`,
    `present`, `absent`).
  - **`RELEASE_NOTES.md`** проверен и остаётся актуальным (текст
    `0.1.0-beta`, simulation-only, no real clicks / OCR / image
    recognition, dry-run sandbox упоминается); конкретных правок
    не потребовалось.
  - **Гейт перед публикацией тэга:** прохождение всех пунктов
    `docs/RELEASE_CHECKLIST.md`. Без `npm run dist` локально и
    без manual smoke (Step 20 #115–#134) тэг не публикуется.

- **GitHub beta release finalization (шаг 22):**
  - **Документы (новые):**
    [`docs/RELEASE_FINAL_CHECK.md`](./docs/RELEASE_FINAL_CHECK.md)
    — короткий pre-tag sign-off page с разделами Release target /
    Required checks / Safety checks / Documentation checks / Manual
    QA checks / Release decision = "Ready after manual verification";
    содержит maintainer sign-off строки в конце.
    [`docs/TAG_AND_RELEASE_GUIDE.md`](./docs/TAG_AND_RELEASE_GUIDE.md)
    — manual git/GitHub-команды (git status / npm install /
    npm run smoke / npm start / npm run pack / npm run dist /
    git tag -a v0.1.0-beta / git push origin v0.1.0-beta /
    создание GitHub Release через web UI или `gh` CLI с
    `--prerelease` флагом / post-publication checks / regression
    rollback). Документ явно говорит «things this guide will
    NEVER do for you».
  - **Финализация существующих docs:**
    [`docs/GITHUB_RELEASE_DRAFT.md`](./docs/GITHUB_RELEASE_DRAFT.md)
    — обновлён до Steps 1—22, секция «What is intentionally not
    included» переработана, добавлены явные «dry-run sandbox is
    preview-only» и «mock adapter only», добавлено упоминание
    Authenticode для Windows.
    [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) — обновлён до
    Steps 1—22, добавлены разделы для шагов 17—22, добавлен
    quick safety summary в начале, ссылки на
    `docs/RELEASE_FINAL_CHECK.md` и `docs/SMOKE_TESTS.md`
    Step 22.
    [`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md)
    — добавлена секция «Final release security» с 10
    обязательными чекбоксами.
    [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)
    — добавлена секция 8 (Beta release) с 7 подсекциями
    (simulation-only contract, dry-run preview-only, mock adapter
    only, packaging needs OS-specific verification, global
    hotkeys vary by OS, tray varies by OS, no automated CI yet).
    [`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md)
    — добавлена секция «Step 22 — Release smoke sequence»
    (#135–#150).
  - **IPC `system:get-release-status`** дополнен полями
    `releaseTarget` (`"0.1.0-beta"`), `releaseFinalCheckPresent`,
    `tagAndReleaseGuidePresent`, `readyForManualRelease`
    (= `releaseDocsReady && simulationOnly && !realActionsImplemented`).
  - **Карточка Release status** в Advanced → Safety теперь
    содержит 12 строк (добавлены `Final release check` и
    `Tag and release guide`) и переключилась на бейдж
    `Ready for manual release` / `Not ready for release`.
  - **`Copy diagnostics`** дополнен полями `releaseTarget`,
    `releaseFinalCheckPresent`, `tagAndReleaseGuidePresent`,
    `readyForManualRelease`.
  - **smoke-check расширен до 137 проверок** (с 113):
    наличие новых документов, sanity-проверки текста
    `docs/RELEASE_FINAL_CHECK.md` и
    `docs/TAG_AND_RELEASE_GUIDE.md` (упоминания `0.1.0-beta`,
    `git tag -a v0.1.0-beta`, `git push origin v0.1.0-beta`,
    `pre-release`); проверки `RELEASE_NOTES.md`, `README.md`,
    `docs/GITHUB_RELEASE_DRAFT.md` на упоминание `0.1.0-beta`;
    `package.json.version === "0.1.0"`; `scripts.smoke` ссылается
    на `scripts/smoke-check.js`; `RELEASE_CHECKLIST.md` ссылается
    на `RELEASE_NOTES.md` и `GITHUB_RELEASE_DRAFT.md`;
    `SECURITY_CHECKLIST.md` имеет «Final release security»
    секцию; `KNOWN_LIMITATIONS.md` упоминает «dry-run sandbox is
    preview-only» и «mock adapter only»; README или
    PROJECT_CONTEXT упоминает шаг 22.
  - **i18n**: 9 новых ключей RU + EN (`releaseFinalization`,
    `releaseTarget`, `finalReleaseCheck`, `tagAndReleaseGuide`,
    `readyForManualRelease`, `githubReleaseDraft`,
    `betaPrerelease`, `releaseDocsReady`,
    `manualVerificationRequired`).
  - **`git tag` и публикация GitHub Release остаются ручными
    действиями** — реализованы только подготовительные
    инструкции; никакой автоматизации тэгирования или загрузки
    артефактов.

- **Post-pack QA and release blocker pass (шаг 23):**
  - **Audit отделил release blockers от non-blocking known
    issues**: 0 forbidden modules, 0 dup ids, 0 missing refs,
    perfect i18n parity 368/368; runtime-харнес подтвердил, что
    все шесть слоёв защиты по-прежнему refuse real input;
    смок прошёл 141/141 на старте и 168/168 после расширения.
    **Release blockers не найдены.**
  - **Документы (новые):**
    [`docs/RELEASE_BLOCKERS.md`](./docs/RELEASE_BLOCKERS.md)
    — 6 секций: Status / Blockers (пустая таблица) /
    Non-blocking known issues (7 ID: KNI-1..7 — code signing,
    tray icon, audit persistence, CI, Linux hotkeys,
    cross-builds) / Verification notes (smoke-check, manual QA,
    packaging, security, localization) / Release decision =
    "Ready after manual packaged-app QA".
    [`docs/PACKAGED_APP_QA.md`](./docs/PACKAGED_APP_QA.md)
    — 16 секций: Build context / Launch / Main screen /
    Scenarios / Simulation Start-Stop / Emergency Stop / RU-EN
    switch / Settings persistence / Import-export / Advanced
    dashboard / Diagnostics / Mock adapter self-test / Dry-run
    sandbox / **No real clicks verification (mandatory)** /
    Quit-reopen / Known packaged issues + Sign-off.
  - **Финализация существующих docs:**
    `docs/RELEASE_FINAL_CHECK.md` — обновлён до Step 23,
    добавлен «Walk PACKAGED_APP_QA» step в Required checks,
    Release decision = "Ready for beta release after packaged
    app QA"; добавлены ссылки на RELEASE_BLOCKERS и
    PACKAGED_APP_QA в Documentation checks.
    `docs/TAG_AND_RELEASE_GUIDE.md` — добавлена секция
    «0a. Before creating the tag» с обязательным прохождением
    PACKAGED_APP_QA и обновлением RELEASE_BLOCKERS, плюс
    предупреждение «do not tag from a broken working tree».
    `docs/GITHUB_RELEASE_DRAFT.md` — добавлена секция
    «Beta QA status» с упоминанием `PACKAGED_APP_QA.md`,
    `RELEASE_BLOCKERS.md`, явным «No real actions are included»
    предупреждением и «Manual packaged-app testing
    recommended».
    `RELEASE_NOTES.md` — добавлены упоминания manual packaged-app
    testing, Steps 1—23.
  - **IPC `system:get-release-status`** дополнен полями
    `releaseBlockersPresent`, `packagedAppQaPresent`,
    `packagedAppTested` (всегда `false` — manual-only),
    `readyAfterManualQa` (= readyForManualRelease, чтобы будущие
    шаги могли ужесточить условия).
  - **Карточка Release status** в Advanced → Safety теперь
    содержит 14 строк (добавлены `Release blockers`,
    `Packaged app QA`, `Packaged app tested`); бейдж переключился
    на `Ready after manual QA` / `Not ready for release`.
  - **`Copy diagnostics`** дополнен полями
    `releaseBlockersPresent`, `packagedAppQaPresent`,
    `packagedAppTested`, `readyAfterManualQa`.
  - **smoke-check расширен до 168 проверок** (с 141): наличие
    новых документов, content sanity (RELEASE_BLOCKERS упоминает
    `0.1.0-beta`, имеет «Release decision» секцию, явно говорит
    об отсутствии known release blockers; PACKAGED_APP_QA
    содержит `npm run pack` / `npm run dist`, явный «no real
    cursor movement» check, утверждение simulation-only);
    cross-references RELEASE_FINAL_CHECK ↔ RELEASE_BLOCKERS /
    PACKAGED_APP_QA; TAG_AND_RELEASE_GUIDE ↔ RELEASE_BLOCKERS /
    PACKAGED_APP_QA + warning «do not tag from a broken working
    tree»; GITHUB_RELEASE_DRAFT имеет «Beta QA status» секцию;
    README или PROJECT_CONTEXT упоминают шаг 23; RELEASE_NOTES
    упоминает packaged-app testing; SECURITY_CHECKLIST явно
    утверждает `contextIsolation: true` и `nodeIntegration: false`.
  - **i18n**: 7 новых ключей RU + EN (`releaseBlockers`,
    `packagedAppQa`, `readyAfterManualQa`,
    `manualPackagedTestingRequired`, `packagedAppTested`,
    `noKnownReleaseBlockers`, `releaseBlocked`).
  - **Реальные действия** проверены ещё раз: 6 слоёв защиты,
    нет prohibited dependencies, нет реального desktop adapter,
    нет mouse/keyboard system calls, нет OCR/OpenCV. **Release
    blockers по статическим проверкам отсутствуют.** Финальный
    гейт — manual packaged-app QA (`docs/PACKAGED_APP_QA.md`)
    и обновление `docs/RELEASE_BLOCKERS.md`.

- **Final beta release preparation (шаг 24):**
  - **Документы (новые, по 4 шт.):**
    [`docs/FINAL_RELEASE_SUMMARY.md`](./docs/FINAL_RELEASE_SUMMARY.md)
    — single-page snapshot релиза (release / current status /
    included / not included / safety status / required steps /
    release recommendation = "Ready for beta pre-release after
    manual packaged-app QA").
    [`docs/PRE_RELEASE_CHECKLIST.md`](./docs/PRE_RELEASE_CHECKLIST.md)
    — manual checklist (Repo / Static smoke / Run from source /
    Manual main flow / Packaged app / Safety invariants /
    Documentation freshness / Sign-offs / Pre-release flag /
    Result).
    [`docs/RELEASE_TAG_PLAN.md`](./docs/RELEASE_TAG_PLAN.md)
    — manual command sequence (Pre-tag verification → optional
    release-prep commit → tag commands → publish via web UI или
    `gh` CLI с `--prerelease` → post-publication checks → hard
    rules: no automation, no force-push, no retag, no flag flip).
    [`docs/RELEASE_COMMIT_MESSAGE.md`](./docs/RELEASE_COMMIT_MESSAGE.md)
    — recommended commit title и body + **forbidden body
    lines** (запрещено заявлять о real input / OCR / image
    recognition / mobile / `realDesktopActions` flip).
  - **Финализация существующих docs:**
    `docs/RELEASE_FINAL_CHECK.md` — добавлены ссылки на 4
    новых документа в Documentation checks; Release decision =
    "Ready for beta pre-release after manual packaged-app QA";
    cross-references блок дополнен.
    `docs/RELEASE_BLOCKERS.md` — Status обновлён: "No
    automated/static release blockers at this stage";
    Last updated → end of Step 24.
    `docs/GITHUB_RELEASE_DRAFT.md` — Step 24 добавлен в
    highlights; добавлен intro к Feedback section.
    `RELEASE_NOTES.md` — Steps 1—24 + новый Step 24 раздел;
    "Beta note" дополнен ссылкой на `PRE_RELEASE_CHECKLIST.md`.
  - **IPC `system:get-release-status`** дополнен полями
    `finalReleaseSummaryPresent`, `preReleaseChecklistPresent`,
    `releaseTagPlanPresent`, `releaseCommitMessagePresent`,
    `readyForPreReleaseAfterManualQa`
    (= readyAfterManualQa AND все 4 шаг-24 документа present).
  - **Карточка Release status** в Advanced → Safety расширена
    4 новыми строками (всего 18) и переключилась на бейдж
    `Ready for pre-release after manual QA` /
    `Not ready for release`.
  - **`Copy diagnostics`** дополнен 5 новыми полями.
  - **Smoke-check расширен до 193 проверок** (с 168):
    наличие 4 новых документов; content sanity для каждого
    (FINAL_RELEASE_SUMMARY → mentions 0.1.0-beta + asserts
    simulation-only + Release recommendation mentions
    packaged-app QA + lists six safety layers;
    PRE_RELEASE_CHECKLIST → uses `[ ]` checkboxes + mentions
    `npm run smoke` + references PACKAGED_APP_QA + asserts no
    real clicks; RELEASE_TAG_PLAN → mentions `git tag -a
    v0.1.0-beta` + `git push origin v0.1.0-beta` + manual +
    pre-release; RELEASE_COMMIT_MESSAGE → recommended title +
    forbidden body lines section); cross-references
    RELEASE_FINAL_CHECK → 4 новых документа; README.md
    содержит 0.1.0-beta; RELEASE_NOTES asserts no real clicks;
    RELEASE_BLOCKERS asserts no automated/static release blockers
    + manual QA required.
  - **i18n**: 7 новых ключей RU + EN
    (`finalReleaseSummary`, `preReleaseChecklist`,
    `releaseTagPlan`, `readyForPreRelease`, `manualQaRequired`,
    `releaseCommitMessage`, `readyForPreReleaseAfterManualQa`).
  - **Реальные действия** проверены ещё раз: i18n parity
    382/382, 0 mismatches, runtime-харнес подтверждает
    блокировку real input на всех 6 слоях.
  - **Гейт перед тэгом:** ручная QA + tick
    `PRE_RELEASE_CHECKLIST.md` + Release decision "Ready" в
    `RELEASE_BLOCKERS.md`. **Tag и публикация GitHub Release
    остаются ручными действиями.**

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
| 21 | Beta release packaging pass: `.gitignore`, extended package.json `build` block, RELEASE_CHECKLIST / BUILD_ARTIFACTS / GITHUB_RELEASE_DRAFT / VERSIONING docs, Release status diagnostics, smoke-check 113 checks. |
| 22 | GitHub beta release finalization: `RELEASE_FINAL_CHECK.md`, `TAG_AND_RELEASE_GUIDE.md`, finalized RELEASE_NOTES / GITHUB_RELEASE_DRAFT, expanded Release status card (12 rows + manual-release badge), smoke-check 137 checks. Tag and publication remain manual. |
| 23 | Post-pack QA and release blocker pass: `RELEASE_BLOCKERS.md`, `PACKAGED_APP_QA.md`, expanded Release status card (14 rows + ready-after-manual-QA badge), smoke-check 168 checks. Manual packaged-app QA remains the last gate. |
| 24 | Final beta release preparation: `FINAL_RELEASE_SUMMARY.md`, `PRE_RELEASE_CHECKLIST.md`, `RELEASE_TAG_PLAN.md`, `RELEASE_COMMIT_MESSAGE.md`, expanded Release status card (18 rows + ready-for-pre-release-after-manual-QA badge), smoke-check 193 checks. Tag and publication remain manual; explicit list of forbidden commit body lines. |

## Что логично делать после шага 24

- **Manual packaged-app QA** на хотя бы одной целевой ОС:
  локально выполнить `npm run pack` / `npm run dist`, пройти
  [`docs/PACKAGED_APP_QA.md`](./docs/PACKAGED_APP_QA.md)
  end-to-end, подписать sign-off строки, проверить отсутствие
  реальных кликов на packaged binary.
- **Tick all boxes** в
  [`docs/PRE_RELEASE_CHECKLIST.md`](./docs/PRE_RELEASE_CHECKLIST.md).
- **Release decision = Ready** в
  [`docs/RELEASE_BLOCKERS.md`](./docs/RELEASE_BLOCKERS.md).
- **Создать tag** `v0.1.0-beta` и **опубликовать GitHub
  pre-release** по
  [`docs/RELEASE_TAG_PLAN.md`](./docs/RELEASE_TAG_PLAN.md)
  с body из `docs/GITHUB_RELEASE_DRAFT.md`.
- **Реальные tray-иконки** PNG/ICO/ICNS, сгенерированные из
  `assets/icons/clickflow-icon.svg`.
- **Code signing notes** (Windows + macOS) и первый подписанный build.
- **GitHub Actions CI**: `actions/setup-node` + `npm install` +
  `npm run smoke` на каждый push и PR.
- **Accessibility-аудит**: `aria-label`, `aria-live`, полная
  клавиатурная навигация по 7 вкладкам Advanced.
- **Smoke-harness 2.0** (Playwright или альтернатива):
  поднимает Electron headless и проверяет no-real-input invariants
  на всех 6 слоях защиты.
- **Audit events UI 1.0**: отдельный sub-tab «Audit» с фильтрами
  и экспортом в JSON/JSONL (всё ещё in-memory).
- **Dry-run replay viewer**: in-memory история dry-run планов
  с возможностью повторно открыть и сравнить два плана.
