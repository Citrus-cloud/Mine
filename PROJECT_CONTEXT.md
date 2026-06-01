# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный
автоматизатор. Electron + ванильный JavaScript. Без фреймворков.

## Текущий шаг

**Шаг 48 завершён.** Real coordinate click stabilization + safety QA.
Текущий шаг — **48**.

Главное: **реальные клики выключены по умолчанию; новых типов real
actions не добавлено.** Прототип реального клика по координатам
стабилизирован: session-only, one click per confirmation.

Что сделано на Step 48:

- feature-flags: добавлен `keyboardAutomation: false` (hard-coded, не
  runtime-togglable); `isRealCoordinateClickSessionEnabled()`; при
  попытке включить запрещённый флаг — ошибка + audit
  (`feature.flag.toggle.rejected`); runtime-флаги не сохраняются,
  сбрасываются при перезапуске;
- action-pipeline: `getRealDesktopActionBlockReason` (стабильные
  blocked reasons), новые требования контекста
  (`sessionRealCoordinateClickEnabled`, `adapterAvailable`,
  `oneClickOnly`), блокировка repeat/batch;
- safety-gates: `getRealCoordinateClickGateStatus(settings, flags,
  permissions, adapterStatus, context)` (default-deny; click only; one
  click per confirmation; no batch/repeat; no image/text/keyboard);
- main/real-desktop-adapter.js: обязательны `oneClickOnly` и
  `sessionRealCoordinateClickEnabled`, отказ repeat/batch, поле
  `reason`, безопасный fallback при отсутствии зависимости;
- Safety Center: status badges, fresh confirmation на каждый клик
  (чекбокс), Test real click disabled при unavailable adapter,
  диагностика (`getRealCoordinateClickDiagnostics`); emergency stop
  проверяется перед real click;
- audit: `realCoordinate.session.*`, `realCoordinate.safetyCheck.*`,
  `realCoordinate.confirmation.*`, `realCoordinate.click.*`,
  `realCoordinate.adapter.unavailable`,
  `realCoordinate.unsupportedAction.blocked`, `emergencyStop.*`,
  `feature.flag.toggle.rejected`;
- permissions расширены; i18n RU/EN; docs:
  `REAL_COORDINATE_CLICK_STABILIZATION.md`,
  `REAL_COORDINATE_CLICK_QA.md` + обновления; smoke-check расширен
  Step-48 инвариантами.

Безопасность:

- real clicks disabled by default; realCoordinateClick disabled;
- real click требует session enable + fresh confirmation; one click per
  confirmation; repeat/batch заблокированы;
- image_click real blocked; text_click real blocked; keyboard
  automation blocked; scroll/hotkey real нет;
- no real click при smoke / при старте; нет robotjs/iohook/uiohook-napi/
  opencv; `contextIsolation: true`, `nodeIntegration: false`, CSP не
  ослаблен; renderer без прямого Node-доступа; screenshots/base64 не
  пишутся.

**Next step:** при наличии безопасного backend — только за полным
safety review: persisted audit, OS permission probes, target
allow/deny-list; image/text real и keyboard — вне scope.

## Шаг 47 (real adapter prototype)

**Шаг 47 завершён.** Real desktop adapter prototype behind hard safety
gate. Текущий шаг — **47**.

Главное: **реальные клики выключены по умолчанию.** Добавлен первый
*прототип* реального desktop-адаптера — **только coordinate click**,
**session-only**, **один клик на одно подтверждение**. ClickFlow по
умолчанию остаётся simulation-only.

Что сделано на Step 47:

- `main/real-desktop-adapter.js` (main process only): функции
  `getRealDesktopAdapterInfo`, `checkRealDesktopAdapterAvailability`,
  `validateRealClickAction`, `executeRealCoordinateClick`,
  `blockRealDesktopAction`, `getRealDesktopAdapterStatus` +
  `registerRealDesktopAdapterIpc`. Опциональный backend
  `@nut-tree/nut-js` / `nut-js` грузится через try/catch; **в
  зависимости не добавлен** (network INTEGRATIONS_ONLY) → adapter
  unavailable, сборка не ломается;
- IPC (main.js): `real-adapter:get-status`,
  `real-adapter:check-availability`,
  `real-adapter:execute-coordinate-click` (требует полный hard context,
  re-validation в main, нет универсального action-runner);
- preload: `realAdapter.getStatus/checkAvailability/executeCoordinateClick`;
- feature-flags: `realCoordinateClick`/`realImageClick`/`realTextClick`
  (все false); whitelist runtime-toggle = `realOcr`, `tesseractProvider`,
  `realDesktopActions`, `realCoordinateClick`; image/text/keyboard real
  **нельзя** включить runtime; session-flags не сохраняются;
- action-pipeline: `canExecuteRealDesktopAction`,
  `executeRealDesktopAction`, `createRealActionBlockedResult` — real
  mode blocked by default, делегирует в main;
- safety-gates: `getRealDesktopActionGateStatus` (default deny);
- Safety Center UI: карточка Experimental Real Coordinate Click,
  enable-for-session с подтверждением, dry-run, test real click с
  отдельным подтверждением, диагностика прототипа; без
  image/text real;
- audit events Step 47; permission-manager + diagnostics расширены;
  i18n RU/EN; docs REAL_ADAPTER_PROTOTYPE.md +
  REAL_CLICK_TESTING_GUIDE.md + обновления v1/security/limitations;
- smoke-check расширен Step-47 инвариантами.

Безопасность (по умолчанию):

- real clicks disabled by default; realCoordinateClick disabled;
- image_click / text_click real mode blocked; keyboard automation
  отсутствует; scroll/hotkey real — нет;
- один real click требует явного подтверждения; action-pipeline и main
  блокируют real без gates;
- real click не происходит при smoke / при старте приложения;
- нет robotjs / iohook / uiohook-napi / opencv;
- `realDesktopActions: false`, `simulationOnly: true`,
  `contextIsolation: true`, `nodeIntegration: false`, CSP не ослаблен;
- renderer без прямого Node-доступа; screenshots/base64 не пишутся в
  scenarios/settings/audit logs.

**Next step:** при наличии безопасного backend — расширять только за
полным safety review (`docs/REAL_ACTIONS_GO_NO_GO.md`,
`docs/V1_RELEASE_CRITERIA.md`): persisted audit, confirmation hardening,
target allow/deny-list; image/text real остаются вне scope до отдельного
ревью.

## Шаг 46 (Desktop v1 foundation)

**Шаг 46 завершён.** Desktop v1 architecture + safety foundation.
Проект **перешёл к Desktop v1 foundation**. Текущий шаг — **46**.

Главное: **реальные системные клики НЕ добавлены. real clicks still
disabled.** ClickFlow остаётся simulation-only.

Что сделано на Step 46:

- начата полноценная ветка разработки Desktop v1 (архитектура +
  безопасность, без реального ввода);
- созданы v1-документы: `docs/V1_DESKTOP_PRODUCT_PLAN.md`,
  `docs/V1_IMPLEMENTATION_CHECKLIST.md`,
  `docs/FULL_PRODUCT_BRANCH_PLAN.md`, `docs/V1_SAFETY_MODEL.md`,
  `docs/V1_ACTION_PIPELINE.md`, `docs/V1_REAL_ADAPTER_REQUIREMENTS.md`,
  `docs/V1_AUDIT_LOGS.md`, `docs/V1_PERMISSION_MODEL.md`,
  `docs/V1_RELEASE_CRITERIA.md`, `docs/NUTJS_INTEGRATION_PLAN.md`
  (nut.js — только план, без зависимости);
- action pipeline приведён к v1-ready: таксономия типов
  (`click`/`image_click`/`text_click`/`wait` активны;
  `move_mouse`/`scroll`/`key_press`/`hotkey` planned/disabled), единый
  формат результата, многоусловный real-mode gate
  (`evaluateRealModeReadiness`), который блокирует real по умолчанию;
- добавлен persistent audit log manager (`src/audit-log-manager.js`):
  in-memory + строгая redaction (без screenshot/base64/imageDataUrl/
  путей/PII), file persistence prepared/planned;
- добавлен permission manager (`src/permission-manager.js`): только
  status/guidance, без кнопки включения real;
- добавлен real desktop adapter interface
  (`src/real-desktop-adapter-interface.js`): контракт, но real
  execution disabled — каждый `executeReal*` блокирует;
- добавлен Safety Center UI (`src/safety-center-ui.js`) и вкладка
  Advanced → Safety Center: current mode, V1 readiness, permissions
  checklist, audit logs (фильтры/refresh/clear/export), кнопки Run
  safety check / Export diagnostics; **без Enable Real Clicks**;
- миграция scenario metadata к `version: 1`
  (`migrateScenarioToV1` / `migrateScenariosToV1`, аддитивно, старые
  сценарии не ломаются) + run summaries (последние 10,
  `realActionsPerformed: false`);
- i18n RU/EN расширен, smoke-check расширен Step-46 инвариантами.

Безопасность (без изменений):

- real desktop clicks disabled; action-pipeline блокирует
  `realClick: true` и любой real-mode запрос по умолчанию;
- image_click / text_click simulation-only; OCR не кликает;
- Visual Builder drafts only; presets не запускаются автоматически;
- `realDesktopActions: false`, `simulationOnly: true`;
- `contextIsolation: true`, `nodeIntegration: false`, CSP не ослаблен;
- нет robotjs / nut.js / iohook / uiohook-napi / opencv; renderer не
  получает прямой Node-доступ; screenshot не сохраняется на диск;
  imageDataUrl не сохраняется в scenario/settings.

**Next step:** real adapter prototype за hard gate в отдельной ветке
`v1-desktop` — только после прохождения safety review
(`docs/REAL_ACTIONS_GO_NO_GO.md`, `docs/V1_RELEASE_CRITERIA.md`).

## Шаг 45 (post-release cleanup)

**Шаг 45 завершён.** Post-release cleanup and feedback tracking.
Проект дошёл до **шага 45**. ClickFlow остаётся simulation-only
desktop MVP.

Контекст релиза:

- **`v0.2.0-smart-beta` готов / опубликован как Smart Desktop Beta
  pre-release** (`package.json` `version: "0.2.0-beta"`, release
  tag `v0.2.0-smart-beta`, pre-release).
- **Step 44 был release / testing milestone, а не отдельная
  runtime-фича.** Он не имеет файлов вроде `src/step-44.js`; это был
  финальный этап проверки и релизной подготовки Smart Beta.
- На Step 44 `v0.2.0-smart-beta` прошёл финальные команды:
  - `npm install`;
  - `npm run smoke`;
  - `npm start`;
  - `npm run pack`;
  - `npm run dist`.
- Packaged app был запущен вручную и **работает**.

Что сделано на Step 45:

- уточнено, что Step 44 был release/testing milestone, а не
  отдельной runtime-фичей;
- начат **post-release cleanup** — зафиксирован post-release /
  post-smart-beta статус;
- **feedback tracking prepared** — проверены GitHub issue-шаблоны
  (bug_report / feature_request / safety_report), добавлен triage-
  гайд;
- создан [`docs/POST_RELEASE_CHECKLIST.md`](./docs/POST_RELEASE_CHECKLIST.md)
  (release verification / smoke after release / feedback tracking /
  follow-up);
- создан [`docs/FEEDBACK_TRIAGE.md`](./docs/FEEDBACK_TRIAGE.md)
  (purpose, issue labels, severity S0–S4, priority P0–P3, bug /
  feature / safety processes, release-blocker criteria, when to make
  v0.2.1 / defer to v0.3.0);
- **v0.2.1 patch plan added** —
  [`docs/V0_2_1_PATCH_PLAN.md`](./docs/V0_2_1_PATCH_PLAN.md)
  (bugfix-only: crashes / broken UI / missing translations /
  packaging / smoke-check / docs / minor UX; **не разрешены** real
  desktop clicks / new OCR engine changes / new OpenCV / mobile /
  major refactor);
- **v0.3.0 real adapter branch plan added** —
  [`docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`](./docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md)
  (только план; **real desktop actions must remain disabled until
  safety review passes**; **no captcha / anti-bot / ad-click /
  banking automation**; **real adapter behind feature flag**;
  **action-pipeline blocks by default**);
- обновлены README, PROJECT_CONTEXT, CHANGELOG, ROADMAP;
- smoke-check расширен Step-45 инвариантами (наличие 4 новых docs +
  README/PROJECT_CONTEXT/CHANGELOG mention Step 45 +
  README/PROJECT_CONTEXT explain Step 44 was a release/testing
  milestone + no robotjs/nut.js/iohook/uiohook-napi/opencv +
  realDesktopActions false). Smoke-check НЕ запускает Electron / OCR
  / screenshot / pack / dist / git / системные действия.

Безопасность (без изменений):

- **simulation-only remains. real clicks still disabled.**
- real desktop clicks disabled, action-pipeline блокирует
  `realClick: true`;
- image_click simulation-only; text_click simulation-only;
- Visual Builder creates drafts only; presets do not execute
  automatically; OCR does not perform clicks;
- `realDesktopActions: false` (hard-coded, не в runtime whitelist),
  `simulationOnly: true`;
- `contextIsolation: true`, `nodeIntegration: false`, CSP не
  ослаблен;
- никаких новых runtime-зависимостей; **нет robotjs / nut.js /
  iohook / uiohook-napi / opencv**.

На Step 45 **специально не сделано**: реальные системные клики,
real desktop adapter, robotjs / nut.js / iohook / uiohook-napi,
OpenCV / opencv.js, мобильная версия, обход капчи / антибот-систем /
банковских приложений, любые новые большие функции. Логичный
следующий шаг: собирать feedback, приоритизировать blockers, при
необходимости выпустить `v0.2.1` (bugfixes), и начать `v0.3.0` как
research/planning ветку реального адаптера за safety review. Real
clicks остаются вне scope.

## Шаги 42–44 (release preparation)

**Шаги 42 и 43 завершены вместе.** Smart OCR/Image QA + Bugfix
Pass + Smart Beta Packaging/Release Pass. Проект готовится к
выпуску **`v0.2.0-smart-beta`** (Smart Desktop Beta).
`package.json` `version` обновлён `0.1.0` → **`0.2.0-beta`**
(semver-clean pre-release identifier; релизный тег с
человекочитаемым суффиксом — `v0.2.0-smart-beta`).
ClickFlow остаётся simulation-only desktop MVP.

Step 42 — Smart OCR/Image QA + Bugfix Pass:

- Проведён сквозной audit пяти smart-features цепочек:
  Coordinate flow / Image flow / OCR-Text flow / Visual
  Builder / Presets, плюс Diagnostics и Packaging surface.
- Найдены и исправлены пять багов:
  1. `src/scenario-presets.js` `preset-text-click-basic` не
     нёс поле `ocrProvider` (Step-41 регрессия). Добавлен
     `ocrProvider: 'mock'`, валидатор `presetOcrProviderInvalid`,
     whitelist clone-ключей расширен `ocrProvider`.
  2. `applyVisualContextToPreset` не переносил активный
     OCR-провайдер из визуального контекста — добавлен мап.
  3. `buildVisualContextFromState` не консультировал
     `getActiveOcrProvider()` — теперь использует.
  4. `isRealOcrAllowed` (`src/ocr-provider-interface.js`)
     был Step-38 hard-stop возвращавшим всегда `false` —
     теперь честно отражает merged base+runtime snapshot
     (true только когда `realOcr === true &&
     tesseractProvider === true && simulationOnly !== true`).
     В production-сборке (где `simulationOnly: true`) функция
     по-прежнему `false`, но семантика теперь корректна для
     unit-тестов и будущих проектов.
  5. `getOcrProviderRegistryStatus` сообщал
     `realOcrEnabled: false` даже после session opt-in —
     теперь читает `realOcrEnabledForSession` из
     `getOcrFeatureStatus()`, чтобы UI и diagnostics видели
     актуальное состояние.
- Создан новый renderer-only модуль
  [`src/smart-beta-health.js`](./src/smart-beta-health.js)
  (`getSmartBetaHealth`, `getSmartBetaHealthDiagnostics`,
  `countSmartBetaReleaseBlockers`). Он считывает 10
  smart-features readiness-флагов
  (`screenCaptureReady`, `regionSelectorReady`,
  `templatesReady`, `templateMatchingReady`,
  `imageClickReady`, `ocrMockReady`,
  `tesseractProviderReady`, `textClickReady`,
  `visualBuilderReady`, `presetsReady`) плюс
  `releaseBlockersCount`. Никаких системных вызовов, никакого
  OCR.
- В `Copy diagnostics` — новая строка `Smart beta:` со всеми
  readiness-флагами + `simulationOnly=true`, `realClick=false`.
- В `src/audit-events.js` — 5 новых allowlisted типов:
  `smartBeta.qa.started`, `smartBeta.qa.completed`,
  `smartBeta.blocker.found`, `smartBeta.blocker.fixed`,
  `smartBeta.releaseCandidate.checked`.
- В `src/i18n.js` — 16 новых ключей RU+EN, parity 835/835.
- Созданы документы
  [`docs/SMART_BETA_QA_REPORT.md`](./docs/SMART_BETA_QA_REPORT.md)
  (audit + bugfix report — scope, environment, checked flows,
  results, known issues, blockers, safety verification, release
  recommendation) и
  [`docs/SMART_BETA_MANUAL_TESTS.md`](./docs/SMART_BETA_MANUAL_TESTS.md)
  (15-секционный manual checklist с
  `Status: Not tested` placeholders).
- Обновлены `docs/SMOKE_TESTS.md` (S1-S18 smart-beta
  end-to-end sequence), `docs/SECURITY_CHECKLIST.md` (smart
  beta safety section), `docs/KNOWN_LIMITATIONS.md` (раздел
  21 — smart-beta limitations).
- Smoke-check расширен Step-42 invariants. Также retired
  Step-38 invariant `isRealOcrAllowed never returns true`
  (теперь функция отражает реальное состояние) и заменён на
  два более конкретных: `short-circuits on simulationOnly` и
  `checks the tesseractProvider gate`.

Step 43 — Smart Beta Packaging/Release Pass:

- В `package.json`:
  - `version` обновлён `0.1.0` → **`0.2.0-beta`**.
  - `description` дополнен "smart desktop beta".
  - `build.files` ужесточён:
    - явные include для tesseract.js node_modules
      (`node_modules/tesseract.js/**/*`,
      `tesseract.js-core`, `wasm-feature-detect`,
      `idb-keyval`, `bmp-js`, `regenerator-runtime`,
      `zlibjs`, `is-electron`, `opencollective-postinstall`),
      чтобы packaged build мог запустить настоящий OCR;
    - exclude новых паттернов:
      `!**/userData/**`, `!**/.env`, `!**/.env.*`,
      `!**/*.tmp`, `!**/*.log`,
      `!**/screenshots/**`, `!**/screenshot-*.png`,
      `!**/screenshot-*.jpg`, `!dist/**`, `!coverage/**`,
      `!.cache/**`, `!.npm/**`.
- Создан
  [`docs/SMART_BETA_RELEASE_NOTES.md`](./docs/SMART_BETA_RELEASE_NOTES.md)
  — полные release notes: summary, new smart features
  (Screen Capture / Region Selector / Templates / Image
  matching / image_click / OCR mock and real OCR session /
  text_click / Visual Builder / Presets), safety model, what
  is still not included (real cursor / OpenCV / mobile /
  bundled language packs), known limitations, how to test,
  feedback.
- Создан
  [`docs/SMART_BETA_RELEASE_CHECKLIST.md`](./docs/SMART_BETA_RELEASE_CHECKLIST.md)
  — engineering / smart-features dev-mode QA / packaging /
  documentation / release sign-off (Engineering + Documentation
  + Manual QA per Windows / macOS / Linux).
- Создан
  [`docs/SMART_BETA_RELEASE_DRAFT.md`](./docs/SMART_BETA_RELEASE_DRAFT.md)
  — готовый body для GitHub release editor: Summary,
  Highlights, Safety model, How to run, How to test, Known
  limitations, What is not included, Feedback, Security note.
- [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) дополнен секцией
  "Smart Desktop Beta — `v0.2.0-smart-beta`".
- [`docs/TAG_AND_RELEASE_GUIDE.md`](./docs/TAG_AND_RELEASE_GUIDE.md)
  получил smart-beta tag plan: 10-шаговая процедура,
  rollback guidance.
- Smoke-check расширен Step-43 invariants (новые docs +
  package.json `version: "0.2.0-beta"` + `build.files`
  ужесточение + README/PROJECT_CONTEXT/CHANGELOG mention
  Step 43).

**Реальных кликов нет. tesseract.js — единственная новая
runtime-зависимость; tesseract-ocr / node-tesseract-ocr /
opencv* / sharp / jimp / pixelmatch / looks-same / robotjs /
nut-js / iohook / uiohook-napi / node-key-sender НЕ объявлены.
realDesktopActions=false (hard-coded, не в runtime
whitelist). simulationOnly=true. realOcr/tesseractProvider
включаются только session-scoped через явное действие
пользователя в OCR tab. action-pipeline блокирует
realClick=true. CSP не ослаблен. contextIsolation: true,
nodeIntegration: false. Никаких новых IPC-каналов.** На
шагах 42-43 **специально не сделано**: bundling local
language packs (`eng.traineddata` / `rus.traineddata`),
worker-based OCR cancellation, real cursor / keyboard,
robotjs / nut.js / iohook / uiohook-napi / node-key-sender,
OpenCV, мобильная версия, обход капчи / антибот-систем /
банковских приложений, multi-action drafts в Visual Builder.
Логичный следующий шаг (Step 44): final smart beta release
preparation — bundle local Tesseract language packs,
worker-based cancellation, manual QA passes per OS,
GitHub release publication. Real clicks остаются вне scope.

## Прошлый шаг

**Шаги 40 и 41 завершены вместе.** Real OCR UI Activation +
Real OCR for text_click and Visual Builder. Проект остаётся в
стадии `0.1.0-beta` (simulation-only desktop MVP). На этих
шагах настоящий OCR можно вручную включить в OCR tab на
текущую сессию и использовать в text_click / Visual Builder,
но без реальных кликов.

Step 40 — Real OCR UI Activation:

- В `src/feature-flags.js` добавлен runtime overlay
  (`setRuntimeFeatureFlag(flag, value)`,
  `getRuntimeFeatureFlags()`,
  `resetRuntimeFeatureFlags()`,
  `getRuntimeTogglableFlags()`). Whitelist
  `_RUNTIME_TOGGLABLE_FLAGS` содержит ТОЛЬКО `realOcr` и
  `tesseractProvider`. Любая попытка переключить
  `realDesktopActions`, `simulationOnly`, `ocr`,
  `imageRecognition`, `globalHotkeys`, `profiles`,
  `importExport`, `ocrProviderRegistry`, `ocrMockProvider`
  возвращает `{ ok: false, error: 'flagNotRuntimeTogglable' }`.
  `getFeatureFlags()` теперь возвращает merged-снимок (base +
  runtime overlay). `getOcrFeatureStatus()` тоже консультирует
  merged-снимок и добавляет поле `realOcrEnabledForSession`.
  Runtime overlay живёт только в renderer-памяти,
  НЕ записывается в settings/profiles/диск, и сбрасывается
  при перезапуске рендерера.
- Tesseract OCR provider в `src/tesseract-ocr-provider.js`
  теперь реализует фактический async вызов
  `recognizeTextWithTesseract(input, options)`: проверяет
  feature flags, ищет engine через test-seam → renderer global
  `window.Tesseract` → `require('tesseract.js')` в try/catch,
  best-effort cropит регион через canvas (`<canvas>` API), мапит
  языки `ru→rus`, `en→eng`, `ru+en→rus+eng`, прокидывает progress
  callback (`{ stage, progress }`), эмитит audit `ocr.real.*`
  на каждой стадии, нормализует результат в unified envelope
  с `mode: 'real-ocr'`, `provider: 'tesseract'`, `realOcr: true`,
  `realClick: false` плюс `actionPreview` (text_click preview).
  Cancel — через token-based logic (Tesseract.js v5 не имеет
  abort-handle; worker-based cancellation запланирован).
  Если flags off — возвращается `{ success: false, blocked: true,
  error: 'Real OCR provider is disabled by feature flag' }`.
  Если engine не загружен — graceful fallback с error
  message без падения. `runTesseractSelfTest` теперь тоже
  async, выполняет один настоящий recognise по synthetic
  blank PNG; refusal path работает идентично.
- В Advanced → OCR карточка **Статус OCR-провайдера** теперь
  имеет 4 кнопки provider control:
  **Use Mock OCR** (`setActiveOcrProvider('mock')`),
  **Enable Tesseract for this session** (через `confirm()`
  диалог + `setRuntimeFeatureFlag('realOcr', true)` +
  `setRuntimeFeatureFlag('tesseractProvider', true)`),
  **Use Tesseract OCR** (`setActiveOcrProvider('tesseract')`,
  отключена пока не выполнены условия),
  **Disable Real OCR** (`resetRuntimeFeatureFlags()` +
  `setActiveOcrProvider('mock')`). На уровне OCR tab появилась
  новая кнопка **Run Real OCR** (рядом с Run Mock OCR) —
  отключена пока: runtime `realOcrEnabledForSession` true,
  active provider `tesseract`, screen preview доступен.
  При нажатии вызывает `recognizeTextWithTesseract` async с
  `onProgress` callback'ом и обновляет карточку **Real OCR
  progress** (stage + percent bar + cancel button). Результат
  показывается через существующие OCR result panels.
- В `src/audit-events.js` добавлены 8 новых allowlisted типов:
  `ocr.real.enabledForSession`, `ocr.real.disabled`,
  `ocr.real.started`, `ocr.real.progress`,
  `ocr.real.completed`, `ocr.real.failed`,
  `ocr.real.blocked`, `ocr.provider.switched`.
- В `Copy diagnostics` строка `Real OCR: ...` теперь учитывает
  runtime overlay (`realOcrRuntimeEnabled`,
  `lastRealOcrRunAt`, `lastRealOcrDurationMs`,
  `lastRealOcrBlocksCount`, `lastRealOcrMatched`,
  `tesseractReady`).

Step 41 — Real OCR for text_click and Visual Builder:

- В `src/scenario-manager.js` text_click scenarios получили
  поле `settings.ocrProvider` (`mock` | `tesseract`, default
  `mock`). `validateTextClickScenario` валидирует значение;
  `_buildTextClickScenarioFromInput` персистит default mock
  для legacy scenarios.
- В `src/index.html` form-section text_click добавлен select
  `#input-text-ocr-provider` со значениями `mock` (default) и
  `tesseract` + hint "Tesseract must be enabled for this
  session before running."
- В `src/renderer.js` обновлены `getScenarioFormData`,
  `fillScenarioForm`, `clearScenarioForm`, чтобы пробрасывать
  `ocrProvider` через форму.
- В `src/click-engine.js` `runTextClickScenario` ветвится на
  `desiredOcrProvider`: для tesseract проверяет
  `getOcrFeatureStatus().realOcrEnabledForSession` —
  если off, возвращает понятную ошибку
  `Tesseract OCR is disabled. Enable it for this session or
  use mock OCR.` Если on, вызывает
  `recognizeTextWithTesseract(input, {})` async, адаптирует
  результат к legacy mock-engine shape, идёт по тому же пути
  match → simulated `text_click` action. Action всегда
  `realClick: false`; `realOcr` отражает реальный источник.
- В `src/text-click-test-tools.js` `runTextClickTest` теперь
  async, читает `input.ocrProvider`, ветвится между
  `runMockOcr` и `recognizeTextWithTesseract`. При выбранном
  tesseract без session opt-in возвращает
  `tesseractDisabledByFeatureFlag` error id. `text-click-test-ui.js`
  awaits новую async функцию.
- `createTextClickDebugResult` помечает actionPreview
  `realOcr: providerForPreview === 'tesseract'`, `realClick: false`,
  плюс `ocrProvider` поле. Audit
  `textClick.test.actionPreview.created` тоже несёт provider.
- В `src/visual-builder.js` `buildDraftPreviewFromState` для
  text_click ветви копирует `getActiveOcrProvider().id` в
  `settings.ocrProvider` (default mock). В `visual-builder-ui.js`
  draft preview карточка показывает `OCR provider used` +
  `Real OCR: true|false`. `_fillScenarioFormFromDraft` устанавливает
  `#input-text-ocr-provider` из draft.
- В `src/action-pipeline.js` validateAction для text_click
  больше НЕ блокирует `realOcr === true` — это теперь source
  marker. Hard-stop на `realClick === true` остаётся; action
  всё равно идёт через simulate path. Audit
  `action.textClick.simulated` пробрасывает `realOcr` и
  `ocrProvider`.

Документация — создан
[`docs/REAL_OCR_USAGE.md`](./docs/REAL_OCR_USAGE.md):
how to enable Tesseract for current session, how to run real
OCR manually, OCR provider selection, text_click with provider,
Visual Builder with provider, safety notes, limitations,
troubleshooting. Обновлены
[`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md).

Smoke-check расширен Step-40-41-инвариантами:
- runtime overlay surface (`setRuntimeFeatureFlag`,
  `getRuntimeFeatureFlags`, `resetRuntimeFeatureFlags`)
  присутствует;
- whitelist runtime-togglable flags содержит ТОЛЬКО
  `realOcr` и `tesseractProvider`;
- `recognizeTextWithTesseract` объявлен как `async`;
- engine.recognize вызывается;
- `realClick: true` НЕ ставится;
- text_click scenario validates ocrProvider;
- click-engine ветвится на `desiredOcrProvider`;
- click-engine отказывается от tesseract без session opt-in;
- ocr-ui рендерит 4 provider-control кнопки + Run Real OCR +
  progress card;
- 8 новых audit types в allowlist;
- text_click форма имеет select OCR provider;
- Visual Builder draft персистит ocrProvider;
- new docs present;
- README/PROJECT_CONTEXT/CHANGELOG mention Steps 40-41.

Также relaxed исторический Step-25–Step-38 чек на разрешение
script src `../node_modules/tesseract.js/dist/tesseract.min.js`
(best-effort load, fallback graceful). action-pipeline.js
больше не требует rejection text_click `realOcr=true`.
Smoke-check итог — все checks passing. Network-ограничение
sandbox: `npm install` против публичного npm registry
возвращает 403, поэтому `package-lock.json` НЕ генерируется
здесь; пользователь делает `npm install` локально.

**Real clicks отсутствуют. text_click с tesseract требует
session enable — иначе блокируется с понятной ошибкой. Mock
OCR и existing flows (simple_click, image_click, OCR tab mock
run, Visual Builder) работают без изменений. Real OCR не
запускается автоматически. После перезапуска real OCR снова
выключен. CSP не ослаблен. realDesktopActions=false,
simulationOnly=true, realOcr=false (base default),
tesseractProvider=false (base default), realOcrAutoRun=false,
contextIsolation: true, nodeIntegration: false — без
изменений.** На шагах 40-41 **специально не сделано**:
реальные системные клики, real desktop adapter, robotjs /
nut.js / iohook / uiohook-napi, OpenCV, мобильная версия,
обход капчи / антибот-систем / банковских приложений,
автоматическое включение real OCR, persisting runtime
overlay в settings/scenarios, переключение
`realDesktopActions` через UI. Логичный следующий шаг
(Step 42): bundle local `eng.traineddata` + `rus.traineddata`
(чтобы Tesseract.js не зависел от CDN при нашем CSP),
worker-based cancellation, реальные benchmarks/QA, settings
toggle "Try real OCR by default" (со скоупом per-machine,
не per-scenario), и manual QA pass на Windows / macOS / Linux.
Real clicks остаются вне scope.

## Шаг 39 (компактно)

**Шаг 39 завершён.** Real OCR Provider Integration — Phase 1.
Проект остаётся в стадии `0.1.0-beta` (simulation-only desktop
MVP). На этом шаге сделана **архитектурная подготовка к
настоящему OCR**, но без реального запуска: в `package.json`
объявлена runtime-dependency `tesseract.js` (`^5.0.4`); создан
новый модуль
[`src/tesseract-ocr-provider.js`](./src/tesseract-ocr-provider.js)
со всем публичным surface (`getTesseractProviderInfo`,
`isTesseractProviderAvailable`,
`checkTesseractProviderReadiness(flags)`,
`runTesseractSelfTest(options)` — НЕ запускает реальный OCR,
`recognizeTextWithTesseract(input, options)` — на шаге 39
ВСЕГДА возвращает blocked-envelope, `normalizeTesseractResult`,
`mapTesseractBlocks`, `terminateTesseractWorker`,
`getTesseractProviderDiagnostics`,
`setTesseractEngineForTesting`). Engine resolver — defensive
trio: test-seam → renderer global `window.Tesseract` → CommonJS
`require('tesseract.js')` в `try/catch`. Если engine не
найден, провайдер возвращает `unavailable`, приложение не
падает. В `src/ocr-provider-registry.js` запись `tesseract`
перешла из `planned: true` (Step 38) в Step-39-режим:
`setActiveOcrProvider('tesseract')` блокируется, пока **оба**
флага (`realOcr` AND `tesseractProvider`) не будут `true` И
engine-resolver не отчитается о `engineLoadable: true` —
иначе возвращается
`{ ok: false, error: { id: 'realOcrBlocked', reason: '…' } }`
плюс audit-события `ocr.provider.selection.blocked` +
`ocr.provider.real.unavailable`. Активный провайдер по
умолчанию остаётся `mock`. Добавлена
`getTesseractProviderStatus()`. В `src/feature-flags.js` —
четыре safe-default OCR-флага (`realOcr: false`,
`tesseractProvider: false`, `ocrMockProvider: true`,
`simulationOnly: true` — без изменений) и новая публичная
функция `getOcrFeatureStatus()` (flat snapshot:
`realOcrAllowed = realOcr && tesseractProvider &&
!simulationOnly`, `realOcrAutoRun: false`). В
`src/audit-events.js` — 6 новых allowlisted типов
(`ocr.tesseract.readiness.requested`,
`ocr.tesseract.readiness.completed`,
`ocr.tesseract.readiness.failed`,
`ocr.tesseract.blockedByFeatureFlag`,
`ocr.provider.tesseract.detected`,
`ocr.provider.tesseract.unavailable`); payload содержит
только flag booleans, error counts, stable reason ids,
durations, engine-loadability — **никогда** полный target
text, **никогда** `imageDataUrl`, **никогда** PII. В
Advanced → OCR — новая карточка **Статус OCR-провайдера /
OCR provider status** с информационным баннером
("Real OCR provider disabled by default / Real OCR auto-run
disabled / Real OCR will be enabled later, after manual
review."), строками Active OCR provider, Tesseract
installed, Tesseract enabled, Real OCR feature flag, Real
OCR auto-run disabled, Real clicks disabled, и кнопкой
**Check Tesseract readiness / Проверить готовность
Tesseract**. Кнопка НЕ запускает настоящий OCR — вызывает
`checkTesseractProviderReadiness`, эмитит audit-события и
выводит inline-результат. **Кнопки "Enable real OCR" на
этом шаге нет** (Phase 1 ограничение). В `Copy
diagnostics` — новая строка
`Real OCR: tesseractDependencyPresent=…,
tesseractProviderAvailable=…,
tesseractProviderEnabled=false,
tesseractEngineLoadable=…, realOcrFeatureFlag=false,
activeOcrProvider=mock, realOcrAutoRun=false,
lastTesseractReadinessCheck=…, lastTesseractError=…,
tesseractDisabledReason=…, realOcr=false, realClick=false`.
Добавлено ~18 новых i18n-ключей RU + EN, parity 795/795.
Создан документ
[`docs/TESSERACT_PROVIDER.md`](./docs/TESSERACT_PROVIDER.md)
с разделами Purpose / Current status / Dependency / Feature
flags / Why disabled by default / Provider readiness /
Future activation plan / Privacy model / Performance risks
/ Known limitations / Safety notes. Обновлены
`docs/OCR_FOUNDATION.md` (Tesseract provider — prepared but
disabled), `docs/OCR_PROVIDER_INTERFACE.md` (Tesseract
implementation notes — engine resolution / readiness /
recognise hard-stop / result mapping / audit / worker),
`docs/REAL_OCR_INTEGRATION_PLAN.md` (Step 39 Phase 1
progress appendix), `docs/TEXT_CLICK_SCENARIO.md` (text_click
still uses mock OCR by default at Step 39),
`docs/SECURITY_CHECKLIST.md` (новый раздел Tesseract OCR
Provider с поведенческими / audit / diagnostics /
Electron-security инвариантами),
`docs/KNOWN_LIMITATIONS.md` (новый раздел 19 — Tesseract
provider installed/prepared but disabled by feature flag),
[`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md).
Smoke-check расширен Step-39-инвариантами + relaxed
исторических Step-25–Step-38 пакет-чеков, чтобы
`tesseract.js` в `package.json` не считался запрещённым;
исходные модули Step-25–Step-38 по-прежнему запрещены
импортировать `tesseract.js` через `require()`. Smoke-check
итог — все checks passing. **Network restrictions: в
sandbox-окружении нельзя запустить `npm install` против
публичного npm registry, поэтому `package-lock.json` НЕ
сгенерирован в этом PR — пользователь/CI должен сделать
`npm install` локально.** Real OCR на шаге 39 **не
запускается**: `recognizeTextWithTesseract()` ВСЕГДА
возвращает `{ success: false, blocked: true, error: 'Real
OCR provider is disabled by feature flag' }` пока флаги
`false`, и даже при флагах `true` возвращает defensive
blocked-envelope (Phase 1 hard-stop — реальный
`Tesseract.recognize` будет добавлен на Step 40+ за свежим
`docs/REAL_OCR_GO_NO_GO.md`-ревью). text_click продолжает
работать через mock OCR. Visual Builder продолжает работать.
Реальных кликов нет. На шаге 39 **специально не сделано**:
реальный `Tesseract.recognize` call site, загрузка
`tesseract.min.js` через `<script>` тэг, language packs
(`eng.traineddata`, `rus.traineddata`), worker process,
автоматический OCR при старте, UI-toggle "Enable real OCR",
переключение active provider на tesseract по умолчанию,
real desktop adapter, реальные клики, OpenCV / robotjs /
nut.js / iohook / uiohook-napi, мобильная версия. ClickFlow
остаётся **simulation-only desktop MVP**.
**`realDesktopActions=false`, `simulationOnly=true`,
`realOcr=false`, `tesseractProvider=false`,
`realOcrAutoRun=false`, `realOcrAllowed=false`,
`activeOcrProvider=mock`, `tesseractProviderEnabled=false`,
`tesseractProviderAvailable=false` (engine не загружен в
production-build), `tesseractDependencyPresent=true`,
`ocrEngineImplemented=false`, `ocrMockOnly=true`,
`realOcrEnabled=false`, `realTextClickEnabled=false`,
`realImageClickEnabled=false`, `autoSavesScenarios=false`,
`autoRunsScenarios=false`, `contextIsolation: true`,
`nodeIntegration: false`, CSP — без изменений.** Логичный
следующий шаг (Step 40): Real OCR Phase 2 — собственно
запустить `Tesseract.recognize` за свежим
`docs/REAL_OCR_GO_NO_GO.md`-ревью, добавить worker shell,
language packs, fallback path, UI progress, settings
toggle, manual QA на Windows / macOS / Linux. Real clicks
остаются вне scope и для шага 40.

## Шаг 38 (компактно)

**Шаг 38 завершён.** Real OCR Research + Safe Integration Plan.
Проект остаётся в стадии `0.1.0-beta` (simulation-only desktop
MVP). На этом шаге начата ветка A (Real OCR) — но как
архитектура: добавлены два новых модуля
[`src/ocr-provider-interface.js`](./src/ocr-provider-interface.js)
(`createOcrProviderResult`, `validateOcrProviderInput`,
`normalizeOcrProviderOptions`, `getOcrProviderContract`,
`getSupportedOcrLanguages`, `isRealOcrAllowed` — всегда
возвращает `false` на шаге 38, `createOcrProviderStatus`) и
[`src/ocr-provider-registry.js`](./src/ocr-provider-registry.js)
(реестр с двумя провайдерами: `mock` — активный, `tesseract`
— planned/unavailable; `getOcrProviders`,
`getOcrProviderById`, `getActiveOcrProvider`,
`setActiveOcrProvider` — БЛОКИРУЕТ выбор `tesseract`,
`getOcrProviderRegistryStatus`,
`isRealOcrProviderRegistered`, `runOcrProviderSelfTest`,
`runActiveOcrProvider`). В Advanced → OCR — новая карточка
**OCR readiness / Готовность OCR**: список провайдеров (mock
= active, tesseract = planned/unavailable), флаги
`realOcrEnabled=no`, `realOcrAllowed=no`, поддерживаемые
языки (ru / en / ru+en), `OCR images not stored: yes`,
кнопка **Run provider self-test** (запускает mock-провайдер
на синтетических метаданных preview без скриншота). В
`src/feature-flags.js` — четыре новых safe-default флага:
`realOcr: false`, `ocrProviderRegistry: true`,
`ocrMockProvider: true`, `tesseractProvider: false`. В
`src/audit-events.js` — 6 новых allowlisted типов
(`ocr.provider.selftest.started`,
`ocr.provider.selftest.completed`,
`ocr.provider.selftest.failed`,
`ocr.provider.selection.blocked`,
`ocr.provider.mock.active`,
`ocr.provider.real.unavailable`); payload содержит только
provider ids, durations, counts, stable error IDs —
**никогда** полный target text, **никогда** `imageDataUrl`,
**никогда** PII. В `Copy diagnostics` — новая строка
`OCR provider: activeProviderId=mock,
mockProviderAvailable=true, tesseractProviderAvailable=false,
realOcrEnabled=false, realOcrAllowed=false,
tesseractAvailable=false, realOcr=false, realClick=false,
providerRegistryReady=true, lastProviderSelfTestOk=…`.
Добавлено ~26 новых i18n-ключей RU + EN, parity 771/771.
Созданы документы
[`docs/REAL_OCR_INTEGRATION_PLAN.md`](./docs/REAL_OCR_INTEGRATION_PLAN.md)
(roadmap до Tesseract worker'а: библиотека, language packs,
worker model, performance, privacy, security, UI progress,
fallback, no real click) и
[`docs/OCR_PROVIDER_INTERFACE.md`](./docs/OCR_PROVIDER_INTERFACE.md)
(reference контракта: input/output shape, error IDs,
registry, self-test, safety rules). Обновлены
`docs/OCR_FOUNDATION.md` (provider architecture note),
`docs/TEXT_CLICK_SCENARIO.md` (provider architecture note —
text_click продолжает использовать mock provider),
`docs/TEXT_CLICK_TEST_TOOLS.md` (Test OCR uses active
provider, currently mock),
`docs/NEXT_BRANCH_PLAN.md` (Branch A — progress note: ветка
A начата как architecture, без real OCR runtime),
`docs/SECURITY_CHECKLIST.md` (новый раздел OCR Provider
Registry с поведенческими / audit / diagnostics /
Electron-security инвариантами),
`docs/KNOWN_LIMITATIONS.md` (новый раздел 18 — Real OCR
planned, not connected),
[`README.md`](./README.md),
[`CHANGELOG.md`](./CHANGELOG.md). Smoke-check расширен
Step-38-инвариантами (новые модули + новые доки + audit
allowlist + i18n parity + нет prohibited dependencies).
**Real OCR на шаге 38 НЕ запускается. `tesseract.js`,
`tesseract`, `tesseract-ocr`, `node-tesseract-ocr`, OpenCV,
sharp, jimp, pixelmatch, looks-same, robotjs, nut.js,
iohook, uiohook-napi не подключены и не объявлены в
`package.json`. `setActiveOcrProvider('tesseract')`
возвращает `{ ok: false, error: { id: 'realOcrBlocked' } }`
и эмитит `ocr.provider.selection.blocked` +
`ocr.provider.real.unavailable`; активный провайдер
остаётся `mock`. self-test использует только mock и
синтетические метаданные `1280×720` без скриншота.
text_click продолжает работать через mock OCR. Visual
Builder продолжает работать. Реальных кликов нет.
`isRealOcrAllowed(flags, settings) === false` всегда. Новых
IPC-каналов нет. Сохранение в файлы не добавлено. CSP не
ослаблен. На шаге 38 **специально не сделано**: установка
`tesseract.js` / `tesseract`, реальный OCR engine, real
desktop adapter, реальные клики, OpenCV, мобильная
версия — это сознательные ограничения. ClickFlow остаётся
**simulation-only desktop MVP**. **`realDesktopActions=false`,
`simulationOnly=true`, `realOcr=false`,
`tesseractProvider=false`, `ocrMockProvider=true`,
`ocrProviderRegistry=true`, `ocrEngineImplemented=false`,
`tesseractAvailable=false`, `ocrMockOnly=true`,
`realOcrEnabled=false`, `realTextClickEnabled=false`,
`realImageClickEnabled=false`, `autoSavesScenarios=false`,
`autoRunsScenarios=false`, `contextIsolation: true`,
`nodeIntegration: false`, CSP — без изменений.** Логичный
следующий шаг (Step 39): подключить `tesseract.js` за
`docs/REAL_OCR_GO_NO_GO.md`-чеклистом — отдельная PR с
worker-shell, language packs, fallback path, и без real
clicks.

## Шаги 36–37 (компактно)

**Шаги 36 и 37 завершены вместе.** Visual Builder UX Polish +
Scenario Presets + Smart Features QA + Next Branch Preparation.
Проект остаётся в стадии `0.1.0-beta` (simulation-only desktop
MVP). На этих шагах добавлены три новых модуля
[`src/scenario-presets.js`](./src/scenario-presets.js)
(frozen preset definitions + `getScenarioPresets`,
`getScenarioPresetById`, `createScenarioDraftFromPreset`,
`applyVisualContextToPreset`, `validateScenarioPreset`,
`getScenarioPresetsStatus`),
[`src/visual-builder.js`](./src/visual-builder.js)
(`getVisualBuilderState`, `setOverlaySetting`,
`showAllOverlays`, `hideAllOverlays`, `clearOverlays`,
`setSelectedActionType`, `buildVisualContextFromState`,
`buildDraftPreviewFromState`, `clearDraftPreview`,
`getMissingRequirements`, `getOverlayLayers`,
`getVisualBuilderDiagnostics`) и
[`src/visual-builder-ui.js`](./src/visual-builder-ui.js)
(`renderVisualBuilderTab` со status row,
onboarding hints, action-type selector, preview + overlay
layers, overlay legend, six overlay checkboxes + Show all /
Hide all / Clear overlays, quick-action panel, scenario
presets cards, draft preview card). Новая вкладка **Visual
Builder / Визуальный конструктор** в Advanced dashboard. В
`src/audit-events.js` — 6 новых allowlisted типов
(`scenarioPreset.selected`, `scenarioPreset.draft.created`,
`scenarioPreset.form.opened`,
`visualBuilder.overlay.changed`,
`visualBuilder.requirement.missing`,
`visualBuilder.draft.preview.created`); payload содержит
только ids, type, hasRegion, hasTemplate, targetTextLen,
missingCount, withVisualContext — **никогда** полный target
text, **никогда** `imageDataUrl`, **никогда** PII. В
`Copy diagnostics` — новая строка `Visual Builder: …,
autoSavesScenarios=false, autoRunsScenarios=false,
realClick=false, realOcr=false`. Pre-fill сценарной формы из
preset / draft через `setTimeout(..., 0)` поверх существующего
`openCreateScenarioForm()`. Добавлено ~70 новых i18n-ключей
RU + EN, `ru` и `en` имеют одинаковый набор (parity 745/745).
Step 37 — три новых документа:
[`docs/SMART_FEATURES_QA.md`](./docs/SMART_FEATURES_QA.md)
(manual QA-чеклист на цепочку Screen Capture → Region →
Templates → Matching → Image Click → OCR Mock → Text Click →
Visual Builder → Scenario Presets с `Status: Not tested`,
плюс Safety checks, Known issues, Release recommendation),
[`docs/NEXT_BRANCH_PLAN.md`](./docs/NEXT_BRANCH_PLAN.md)
(Branch A — Real OCR Integration, Branch B — Real Desktop
Adapter, Branch C — Android Research; **рекомендация: сначала
Branch A**, потому что real OCR без реальных кликов менее
рискованно, чем real desktop adapter), и
[`docs/SMART_FEATURES_LIMITATIONS.md`](./docs/SMART_FEATURES_LIMITATIONS.md)
(консолидированный список: screen capture permissions, simple
matcher, mock OCR, simulation-only image_click / text_click,
Visual Builder foundation, drafts require manual save, no real
click). Обновлены
[`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) (#359–#388 —
Step 36 + Step 37 smoke checks),
[`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md)
(новый раздел Visual Builder + Scenario Presets с
поведенческими / audit / diagnostics / Electron-security
инвариантами),
[`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)
(новый раздел 17 — Visual Builder + Scenario Presets are
foundation-only),
[`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md).
Smoke-check расширен Step-37-инвариантами.
**Visual Builder никогда не сохраняет сценарий автоматически,
никогда не запускает сценарий автоматически, никогда не
кликает, никогда не выполняет настоящий OCR, никогда не
открывает новый IPC канал, никогда не пишет screenshot / debug
result на диск, никогда не сохраняет imageDataUrl в preset /
draft / scenario / audit / diagnostics. Presets никогда не
выполняют сценарии автоматически, никогда не сохраняют
автоматически — открывается форма с предзаполненными полями,
сохранение делается вручную.** Settings сохраняются через
существующий save-flow (нет новых IPC). На шагах 36–37
**специально не сделано**: реальные клики, real desktop
adapter, настоящий OCR, Tesseract / tesseract.js, OpenCV /
opencv*, robotjs, nut.js, iohook, uiohook-napi, мобильная
версия, обход капчи, обход антибот-систем — это сознательные
ограничения. ClickFlow остаётся **simulation-only desktop
MVP**. **`realDesktopActions=false`, `simulationOnly=true`,
`ocrEngineImplemented=false`, `tesseractAvailable=false`,
`ocrMockOnly=true`, `realOcrEnabled=false`,
`realTextClickEnabled=false`, `realImageClickEnabled=false`,
`autoSavesScenarios=false`, `autoRunsScenarios=false`,
`contextIsolation: true`, `nodeIntegration: false`, CSP — без
изменений.** Следующая большая ветка по рекомендации Step 37
— **Branch A (Real OCR Integration)** в отдельной ветке.

## Шаг 34 (компактно)

**Шаг 34 завершён.** Text Click Test Tools + OCR UX Polish.
Проект остаётся в стадии `0.1.0-beta` (simulation-only). На
шаге 34 в форму `text_click` сценария (шаг 33) добавлен блок
**Text click test tools**: три информационные карточки
(Screen preview status / Region summary / OCR settings),
кнопка **Test OCR**, кнопка **Clear OCR result**, и кнопки
быстрой навигации (Open OCR / Open Screen Capture / Open
Region Selector). Test OCR запускает Step-32 mock OCR над
текущими значениями формы и captured preview и рисует:
цветной headline (matched / no-match / failed), метрики
(target text / language / match mode / case sensitive /
matched text / confidence / bbox / target / duration), список
**OCR blocks** (matched row с зелёной подсветкой и
MATCHED-бейджем), визуальный **OCR blocks overlay** поверх
preview (region — пунктирный синий, mock blocks — оранжевые
dashed, matched block — сплошной зелёный с label, target
dot — красный круг с белым ореолом), и **`text_click` action
preview** (JSON через `<pre>.textContent`, `realClick: false`,
`realOcr: false`). Понятные локализованные ошибки
(`Target text is required`, `Capture a screen preview first`,
`Region is invalid`, `Mock OCR engine is unavailable`,
`Target text was not found`, `Unsupported match mode`,
`Unsupported OCR language`). **Test OCR никогда не сохраняет
сценарий**, **никогда не выполняет click**, **никогда не
запускает scenario**, **никогда не использует настоящий OCR**,
**никогда не пишет скриншот / debug result на диск**,
**никогда не открывает новый IPC канал**. Добавлены два новых
модуля
[`src/text-click-test-tools.js`](./src/text-click-test-tools.js)
(pure logic: `buildTextClickTestInput`,
`validateTextClickTestInput`, `runTextClickTest`,
`createTextClickDebugResult`, `clearTextClickTestResult`,
`getTextClickTestStatus`, `getLastTextClickTestResult`) и
[`src/text-click-test-ui.js`](./src/text-click-test-ui.js)
(DOM/UI: `initTextClickTestUi`, `refreshTextClickTestPanel`,
`renderTextClickScreenPreviewStatus`,
`renderTextClickRegionSummary`, `renderTextClickOcrSettings`,
`runTextClickTestFromForm`, `renderTextClickTestResult`,
`clearTextClickTestResultUi`, `renderTextClickBlocksList`,
`renderTextClickOcrOverlay`, `renderTextClickActionPreview`).
В `src/audit-events.js` — 6 новых allowlisted типов
(`textClick.test.started/completed/failed/noMatch/cleared/actionPreview.created`).
В Advanced → Safety — карточка **Text click test diagnostics**
(`Last text_click test at`, `Last text_click test matched`,
`Last text_click test confidence`,
`Last text_click test duration`,
`Last text_click test target length`,
`Last text_click test errors`, `OCR language`, `Match mode`,
`Region used`, `Last OCR blocks count`, `Mock OCR only =
enabled`, `Real OCR disabled = enabled`,
`Real text_click disabled = enabled`,
`Test Match does not click = enabled`); в `Copy diagnostics`
— новая строка `Text click test: …, ocrMockOnly=true,
realOcrEnabled=false, realTextClickEnabled=false,
testDoesNotClick=true, realClick=false, realOcr=false`
(только числа, id и `targetTextLen`, никогда полный target
text). Создан
[`docs/TEXT_CLICK_TEST_TOOLS.md`](./docs/TEXT_CLICK_TEST_TOOLS.md);
обновлены
[`docs/TEXT_CLICK_SCENARIO.md`](./docs/TEXT_CLICK_SCENARIO.md)
(новый раздел Test OCR / Test Match),
[`docs/OCR_FOUNDATION.md`](./docs/OCR_FOUNDATION.md) (mock
now also used by text_click test tools),
[`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md)
(новый раздел «text_click test tools (Step 34)»),
[`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) (Step 34
checks #337–#358),
[`README.md`](./README.md),
[`CHANGELOG.md`](./CHANGELOG.md).
Smoke-check расширен Step-34-инвариантами. Добавлено 30 новых
i18n-ключей RU + EN.
**Реальный OCR / Tesseract / tesseract.js / OpenCV /
opencv4nodejs / @u4/opencv4nodejs / opencv.js / opencv-js /
sharp / jimp / pixelmatch / looks-same / robotjs / nut.js /
iohook / uiohook-napi по-прежнему не реализованы.** Test OCR
никогда не выполняет настоящий OCR, никогда не вызывает
click-engine `runScenario` / `runTextClickScenario`, никогда
не вызывает `executeAction({ executionMode: 'real' })`,
никогда не пишет screenshot / blocks / debug result на диск.
simple_click, image_click и text_click сценарии работают без
изменений. **`realDesktopActions=false`, `simulationOnly=true`,
`ocrEngineImplemented=false`, `tesseractAvailable=false`,
`ocrMockOnly=true`, `realOcrEnabled=false`,
`realTextClickEnabled=false`, `contextIsolation: true`,
`nodeIntegration: false`, CSP — без изменений.**

## Шаг 33 (компактно)

**Шаг 33 завершён.** Text Click Scenario Type Foundation. Проект
остаётся в стадии `0.1.0-beta` (simulation-only). На шаге 33
добавлен новый тип сценария **`text_click`**: третья опция в
селекторе `Тип сценария`, новый блок формы с target text input,
language (`ru` / `en` / `ru+en`), match mode (`contains` /
`exact`), case-sensitive checkbox, optional region (с кнопками
Use selected region / Clear scenario region), timeoutMs,
intervalMs, repeatCount. Жёлтая mock-OCR плашка + красная
плашка «Сначала получите screenshot preview.», когда preview
отсутствует. `scenario-manager.js` дополнен
`validateTextClickScenario`, `createTextClickScenario`,
`updateTextClickScenario`, `getTextClickScenarios`;
`createScenario` / `updateScenario` теперь диспатчат на три
типа. `click-engine.js` дополнен
`runTextClickScenario(scenario, callbacks, options)`: каждая
итерация → `createOcrInput` → `runMockOcr` (Step 32 mock) →
если match найден, **симулированный** `text_click` action
через `executeAction(action, ctx)` с `executionMode:
"simulation"`. `action-pipeline.js` понимает `text_click`
action shape: `validateAction` отказывает `realClick: true` и
`realOcr: true` outright, мок-адаптер `text_click` не
выполняет (он знает только `click`), dry-run sandbox `text_click`
не выполняет (он принимает только `simple_click`). `safety-gates.js`
дублирует валидацию. 9 новых allowlisted audit-типов
(`scenario.textClick.started/ocr.started/ocr.completed/textFound/noTextFound/simulated/failed`,
`action.textClick.simulated/realBlocked`); payload содержит
только числа, id, language, matchMode, hasRegion, durationMs,
confidence, target X/Y и `textLen` — **никогда** полный target
text. Карточка **text_click scenario** в Advanced → Safety с
count, last result, confidence, target, target text present,
`textClickSimulationOnly = on`, `realTextClickDisabled = on`,
`realOcrDisabled = on`. Новая строка `Text click scenario:
…, textClickSimulationOnly=true, realTextClickEnabled=false,
realOcrEnabled=false, tesseractAvailable=false,
ocrEngineImplemented=false` в `Copy diagnostics` (только
metadata, никогда полный target text). 22 новых i18n-ключа
RU + EN. Создан
[`docs/TEXT_CLICK_SCENARIO.md`](./docs/TEXT_CLICK_SCENARIO.md);
обновлены
[`docs/ACTION_SCHEMA.md`](./docs/ACTION_SCHEMA.md) (text_click
action shape + routing + audit),
[`docs/REGION_SELECTOR.md`](./docs/REGION_SELECTOR.md) (region
can scope text_click),
[`docs/OCR_FOUNDATION.md`](./docs/OCR_FOUNDATION.md) (mock now
used by text_click scenario),
[`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md) (новый
раздел «text_click scenario (Step 33)»),
[`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) (Step 33 checks
#319–#336), [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)
(новый раздел «16. text_click uses mock OCR only»),
[`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md).
Smoke-check расширен Step-33-инвариантами.
**Реальный OCR / Tesseract / tesseract.js / OpenCV / opencv4nodejs /
@u4/opencv4nodejs / opencv.js / opencv-js / sharp / jimp /
pixelmatch / looks-same / robotjs / nut.js / iohook / uiohook-napi
по-прежнему не реализованы.** `text_click` сценарий никогда не
выполняет настоящий OCR, никогда не выполняет click, никогда не
открывает новый IPC канал, никогда не пишет screenshot / blocks /
result / debug overlay на диск, никогда не сохраняет
`imageDataUrl` в сценарий / audit / diagnostics; `realClick: true`
и `realOcr: true` блокируются на уровне action-pipeline и
safety-gates. simple_click и image_click сценарии работают без
изменений. **`realDesktopActions=false`, `simulationOnly=true`,
`ocrEngineImplemented=false`, `tesseractAvailable=false`,
`contextIsolation: true`, `nodeIntegration: false`, CSP — без
изменений.**

## Шаг 32 (компактно)

**Шаг 32 завершён.** OCR Foundation (mock only). Проект остаётся
в стадии `0.1.0-beta` (simulation-only). На шаге 32 добавлен
новый Advanced → **OCR** таб + новый mock-движок
[`src/ocr-mock-engine.js`](./src/ocr-mock-engine.js) + UI-модуль
[`src/ocr-ui.js`](./src/ocr-ui.js). Пользователь вводит target
text, выбирает language (`ru` / `en` / `ru+en`), match mode
(`contains` / `exact`), case-sensitive флаг и опциональный
region; кнопка **Run mock OCR** запускает mock-движок, который
фабрикует список recognized blocks (target block + 1–3
surrounding labels `OK` / `Cancel` / `Settings`) из метаданных
preview, выбирает best match и строит **`text_click` action
preview** (`type: "text_click"`, `mode: "preview"`,
`realClick: false`, `realOcr: false`). Render: цветной headline
(matched / failed / no-match), метрики, recognized blocks list
(matched row подсвечен), debug overlay (region — пунктирный
синий, blocks — оранжевые dashed, matched — сплошной зелёный с
label, target point — красная точка), action preview JSON через
`<pre>.textContent`. Добавлен `appState.ocr` slice + 11 setters,
5 новых allowlisted audit-типов
(`ocr.mock.requested/completed/failed/cleared`,
`text.click.preview.created`), 56 новых i18n-ключей RU + EN, 25+
новых CSS-классов под `.ocr-*`, новая карточка **OCR
diagnostics** в Advanced → Safety и новая строка
`OCR: ocrMockAvailable=…, realOcrAvailable=false, …,
tesseractAvailable=false, ocrEngineImplemented=false` в
`Copy diagnostics`. Создан
[`docs/OCR_FOUNDATION.md`](./docs/OCR_FOUNDATION.md); обновлены
[`docs/ACTION_SCHEMA.md`](./docs/ACTION_SCHEMA.md) (planned
`text_click` preview-only entry),
[`docs/SCREEN_CAPTURE.md`](./docs/SCREEN_CAPTURE.md),
[`docs/REGION_SELECTOR.md`](./docs/REGION_SELECTOR.md),
[`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md),
[`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) (Step 32 checks
#299–#318), [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md)
(новый раздел «15. OCR is mock only»),
[`README.md`](./README.md), [`CHANGELOG.md`](./CHANGELOG.md).
Smoke-check расширен Step-32-инвариантами.
**Реальный OCR / Tesseract / tesseract.js / OpenCV / opencv4nodejs /
@u4/opencv4nodejs / opencv.js / opencv-js / sharp / jimp /
pixelmatch / looks-same / robotjs / nut.js / iohook / uiohook-napi
по-прежнему не реализованы.** Mock OCR никогда не выполняет
настоящее распознавание, никогда не выполняет click, никогда не
открывает новый IPC канал, никогда не пишет screenshot / blocks /
result на диск, никогда не сохраняет `imageDataUrl` в OCR slice
/ audit / diagnostics. **`realDesktopActions=false`,
`simulationOnly=true`, `ocrEngineImplemented=false`,
`tesseractAvailable=false`, `contextIsolation: true`,
`nodeIntegration: false`, CSP — без изменений.**

## Шаг 31 (компактно)

**Шаг 31 завершён.** Image Click Scenario UX Polish + Visual
Test Tools. Проект остаётся в стадии `0.1.0-beta`
(simulation-only). На шаге 31 в форму `image_click` сценария
(шаг 30) добавлен блок **Image click test tools**: три
информационные карточки (Template preview / Screen preview
status / Region summary), кнопка **Run Test Match**,
визуальный debug overlay поверх preview (region — пунктирный
синий, bbox — сплошной зелёный или dashed orange при низкой
достоверности, бейдж confidence, красная точка target point),
action preview JSON (через `<pre>.textContent`,
`realClick: false`), быстрая навигация (Open Templates /
Open Screen Capture / Open Region Selector → `setAdvancedTab(tab)`).
Test Match запускает Step-29 matcher над текущими значениями
формы и captured preview; **никогда не выполняет click**,
**никогда не запускает scenario**, **никогда не пишет
скриншот / debug result на диск**, **никогда не открывает
новый IPC канал**. Понятные локализованные ошибки
(`No template selected` / `Template image is missing` /
`Capture a screen preview first` / `Region is invalid` /
`Template is larger than search area` / `Match confidence is
below threshold` / `Matching took too long` /
`Matching engine unavailable`). Добавлены два новых модуля
[`src/image-click-test-tools.js`](./src/image-click-test-tools.js)
(pure logic) и
[`src/image-click-test-ui.js`](./src/image-click-test-ui.js)
(DOM/UI). В `src/audit-events.js` — 5 новых allowlisted типов
(`imageClick.test.started/completed/failed/lowConfidence/cleared`).
В Advanced → Safety — карточка **Image click test diagnostics**
(`Last test at`, `Last test matched`, `Last test confidence`,
`Last test duration`, `Last test template`, `Last test errors`,
`Test Match does not click = enabled`, `Real matching disabled`,
`Real click disabled`); в `Copy diagnostics` — новая строка
`Image click test: …, testDoesNotClick=true, realMatching=false,
realClick=false` (только числа и id, никогда `imageDataUrl`).
Создан [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./docs/IMAGE_CLICK_TEST_TOOLS.md);
обновлены `docs/IMAGE_CLICK_SCENARIO.md`,
`docs/TEMPLATE_MATCHING_ENGINE.md`,
`docs/SECURITY_CHECKLIST.md`, `docs/SMOKE_TESTS.md` (Step 31
checks #278–#298). Smoke-check расширен Step-31-инвариантами.
Добавлено 47 новых i18n-ключей RU + EN.
**Реальные клики / OCR / image recognition / template matching
на live screen / OpenCV / Tesseract / robotjs / nut.js / iohook /
uiohook-napi по-прежнему не реализованы. realDesktopActions=false,
simulationOnly=true, contextIsolation: true, nodeIntegration:
false, CSP — без изменений.**

## Шаги 25–30 (компактно)

**Шаг 26 завершён.** Region Selector Foundation. Проект остаётся
в стадии `0.1.0-beta` (simulation-only). На шаге 26 поверх
Screen Capture preview из шага 25 добавлен **прямоугольный
region-selector**, на котором будут строиться будущие умные
функции (image matching, OCR, клик по картинке/тексту,
визуальный конструктор) — **сами умные функции по-прежнему
не реализованы**. Добавлены два модуля:
[`src/region-selector.js`](./src/region-selector.js) с чистой
логикой (`createRegion`, `normalizeRegion`, `validateRegion`,
`scaleRegionToImage` / `scaleRegionToPreview`, `getRegionArea`,
`formatRegion`, `createEmptyRegionState`; нет DOM, нет IPC, нет
диска, нет сетевых вызовов) и
[`src/region-selector-ui.js`](./src/region-selector-ui.js) с
drag-overlay поверх `<img>` (mousedown/move/up; mousemove и
mouseup биндятся ТОЛЬКО на время активного drag и отвязываются
на mouseup), кнопками **Enable/Disable region selection**,
**Clear region**, **Save region**, **Attach to active scenario**,
карточкой info с двумя пространствами координат (preview и
image). В `src/app-state.js` добавлен slice `regionSelector`
(`selectedRegion`, `normalizedRegion`, `isSelecting`,
`previewSize`, `imageSize`, `lastUpdatedAt`, `lastError`) с 8
мутаторами; `getState()` делает deep-copy. В
`src/scenario-manager.js` — `validateRegionSettings`,
`updateScenarioRegion`, `clearScenarioRegion`. Опциональное поле
`scenario.settings.region = { x, y, width, height }` (image-space
координаты) — старые сценарии без `region` продолжают работать
как раньше, движок сценариев его игнорирует. В
`src/audit-events.js` — 6 новых allowlisted типов
(`region.selection.started/updated/completed/cleared`,
`region.attached.toScenario`, `region.validation.failed`); payload
содержит только числа и id, **никогда** `imageDataUrl`. В Advanced
→ Safety добавлена компактная карточка **Region selector status**
(selectedRegion, normalizedRegion, previewCoordinates,
imageCoordinates, regionArea, attachedToScenario, lastUpdatedAt,
lastError); в `Copy diagnostics` — строка `Region selector:
selectedRegion=…, normalizedRegion=…, regionWidth=…, regionHeight=…,
regionArea=…, attachedScenario=…, lastUpdatedAt=…, lastError=…,
ocrImplemented=false, imageMatchingImplemented=false,
realClicksImplemented=false`. Добавлено 22 новых i18n-ключа RU + EN
(parity 428/428). Создан
[`docs/REGION_SELECTOR.md`](./docs/REGION_SELECTOR.md); обновлены
`docs/SCREEN_CAPTURE.md`, `docs/ACTION_SCHEMA.md`,
`docs/SECURITY_CHECKLIST.md`, `docs/KNOWN_LIMITATIONS.md`,
`docs/SMOKE_TESTS.md`. Smoke-check расширен Step-26-инвариантами.
Скриншот **никогда не сохраняется на диск**; регион хранится
только как четыре числа, **никогда** как `imageDataUrl`.
**Реальные клики / OCR / image matching / template matching /
OpenCV / robotjs / nut.js / iohook по-прежнему не реализованы.**
`realDesktopActions=false`, `simulationOnly=true`,
`contextIsolation: true`, `nodeIntegration: false`, CSP — без
изменений.

## Прошлые шаги

**Шаг 25.** Screen Capture Foundation. Проект остаётся
в стадии `0.1.0-beta` (simulation-only) и параллельно открывает
**новую линию умных визуальных функций** (поиск картинки/иконки,
поиск текста, выбор области экрана, template matching, OCR,
визуальный конструктор) — **сами функции на этом шаге не
реализованы**, только foundation. На шаге 25 добавлены:
три IPC-обработчика через Electron `desktopCapturer` в `main.js`
(`screen-capture:list-sources`, `screen-capture:capture-preview`,
`screen-capture:get-status`); безопасный `window.clickflow.screenCapture`
API в `preload.js`; `src/screen-capture-client.js` с валидацией и
in-memory cache; `src/screen-capture-ui.js` с новой вкладкой
**Screen Capture** в Advanced dashboard (safety notice, Refresh
sources / Capture preview / Clear preview, sources grid с
thumbnails, preview-карточка с metadata); state slice
`appState.screenCapture` (`sources`, `selectedSourceId`, `preview`,
`isLoading`, `lastError`, `lastCapturedAt`) с 7 мутаторами в
`src/app-state.js`; шесть новых allowlisted audit-типов
(`screen.capture.sources.requested`,
`screen.capture.sources.loaded`,
`screen.capture.preview.requested`,
`screen.capture.preview.created`,
`screen.capture.preview.cleared`,
`screen.capture.error`); компактный диагностический блок Screen
capture status в Advanced → Safety; новая строка `Screen capture: ...`
в `Copy diagnostics`; 24 новых i18n-ключа RU + EN;
[`docs/SCREEN_CAPTURE.md`](./docs/SCREEN_CAPTURE.md). Скриншот
**никогда не сохраняется на диск**, рендерится только через
`img.src` (textContent для всего остального), preview хранится
только в памяти renderer.
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

- **Screen Capture Foundation (шаг 25 — новая линия умных
  визуальных функций):**
  - **`main.js`** — добавлен импорт `desktopCapturer` и три IPC
    handler'а (`screen-capture:list-sources`,
    `screen-capture:capture-preview`,
    `screen-capture:get-status`). Sources нормализуются к
    безопасной форме `{id, name, type, thumbnailDataUrl,
    display_id, [width, height]}`; sourceId валидируется по
    префиксу `screen:` / `window:` и длине ≤ 200; ошибки
    маппятся в безопасные generic-строки; никогда не
    бросает; никогда не пишет на диск; никогда не вызывает
    OCR / image recognition.
  - **`preload.js`** — `window.clickflow.screenCapture` API
    (`listSources`, `capturePreview`, `getStatus`). Сырой
    `ipcRenderer` по-прежнему не выходит за пределы preload.
  - **`src/screen-capture-client.js`** — wrapper для
    renderer'а: `listScreenSources`, `captureScreenPreview`,
    `getScreenCaptureStatus`, `validateScreenSource`,
    in-memory cache (`getLastScreenCapturePreview`,
    `setLastScreenCapturePreview`, `clearScreenCapturePreview`).
  - **`src/screen-capture-ui.js`** — новая вкладка **Screen
    Capture** в Advanced dashboard: header, safety notice,
    кнопки **Refresh sources / Capture preview / Clear preview**,
    sources grid с thumbnails (`img.src` = `thumbnailDataUrl`,
    name через `textContent`), selected source card, preview
    card с metadata (name / type / id / size / capturedAt /
    "Preview only" reminder). Все пользовательские строки
    через `textContent`; `innerHTML` использован только для
    `= ''` (очистка контейнера).
  - **`src/app-state.js`** — добавлен slice
    `appState.screenCapture` (`sources`, `selectedSourceId`,
    `preview`, `isLoading`, `lastError`, `lastCapturedAt`),
    7 мутаторов (`setScreenCaptureSources`,
    `setSelectedScreenSource`, `setScreenCapturePreview`,
    `setScreenCaptureLoading`, `setScreenCaptureError`,
    `clearScreenCapturePreview`, `resetScreenCaptureState`);
    `getState()` возвращает копию.
  - **`src/audit-events.js`** — 6 новых allowlisted типов
    (`screen.capture.sources.requested`,
    `screen.capture.sources.loaded`,
    `screen.capture.preview.requested`,
    `screen.capture.preview.created`,
    `screen.capture.preview.cleared`,
    `screen.capture.error`). Payload-ы содержат только
    counts/ids/source-types — никогда не `imageDataUrl`.
  - **Renderer:** `renderAdvancedDashboard` диспатчит
    `screenCapture` в `renderScreenCapture()`; в Advanced →
    Safety добавлена компактная карточка **Screen capture
    status** (available / sourcesCount / selectedSource /
    previewAvailable / capturedAt / lastError); `Copy
    diagnostics` дополнен строкой `Screen capture: ...`.
  - **`src/index.html`** — добавлена 8-я вкладка
    `screenCapture`, секция `#advanced-tab-screenCapture`,
    подключены `screen-capture-client.js` и
    `screen-capture-ui.js` (после `i18n.js`, до
    `renderer.js`).
  - **`src/styles.css`** — секция 17 со стилями
    `.screen-capture-*` (sources grid auto-fill 180px,
    selected highlight, thumb max-height 110px, preview image
    `max-width: 100%; max-height: 360px`, light/dark theme,
    responsive 760px).
  - **i18n:** 24 новых ключа RU + EN (`screenCapture`,
    `refreshSources`, `capturePreview`, `clearPreview`,
    `screenSources`, `noScreenSources`, `selectedSource`,
    `noSelectedSource`, `screenPreview`, `noPreview`,
    `previewOnly`, `sourceType`, `sourceScreen`,
    `sourceWindow`, `capturedAt`, `captureFailed`,
    `sourcesLoadFailed`, `screenCaptureSafetyNotice`,
    `previewNotSaved`, `permissionMayBeRequired`,
    `screenCaptureStatus`, `previewAvailable`,
    `selectedScreenSource`, `sourcesCount`). Парность
    406/406, без дубликатов.
  - **Документация:** новый
    [`docs/SCREEN_CAPTURE.md`](./docs/SCREEN_CAPTURE.md);
    `docs/SECURITY_CHECKLIST.md`,
    `docs/KNOWN_LIMITATIONS.md`, `docs/SMOKE_TESTS.md`
    дополнены секциями Step 25.
  - **Smoke-check** расширен Step-25-инвариантами (наличие
    `src/screen-capture-client.js`, `src/screen-capture-ui.js`,
    `docs/SCREEN_CAPTURE.md`; `preload.js` содержит
    `screenCapture`; `main.js` содержит
    `screen-capture:list-sources`; README/PROJECT_CONTEXT
    упоминает screen capture / захват экрана; `package.json`
    не содержит OCR / OpenCV / robotjs / nut.js).
  - **Безопасность:** скриншот **никогда не сохраняется на
    диск**; preview хранится только в памяти renderer и
    сбрасывается на Clear preview / `resetScreenCaptureState()`;
    нет автозахвата при старте; renderer не получает сырой
    `ipcRenderer`; `contextIsolation: true`,
    `nodeIntegration: false`, CSP не ослаблены; реальные
    клики / OCR / image recognition / template matching
    по-прежнему отсутствуют.

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
- `main/template-assets.js` — main-process module for the
  Step 27 Template Asset Manager (`templates:*` IPC handlers,
  png/jpg/jpeg/webp allow-list, magic-bytes verification, header-
  only width/height parsing, `userData/templates/` storage).
- `preload.js` — contextBridge `window.clickflow.*`.
- `src/` — renderer modules + `index.html` + `styles.css` + `i18n.js`.
  Включает `feature-flags.js`, `action-pipeline.js`, `safety-gates.js`,
  `audit-events.js` (Step 16-17), а также
  `desktop-adapter-interface.js`, `mock-desktop-adapter.js`,
  `adapter-registry.js` (Step 18),
  `real-action-sandbox.js` (Step 19),
- `screen-capture-client.js` / `screen-capture-ui.js` (Step 25),
  `region-selector.js` / `region-selector-ui.js` (Step 26),
  `template-manager.js` / `template-ui.js` (Step 27),
  `template-matching-mock.js` / `template-matching-ui.js` (Step 28),
  и `template-matching-engine.js` (Step 29).
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
| 25 | Screen Capture Foundation (new line of smart visual features — features themselves not implemented yet): three IPC handlers via `desktopCapturer`, safe `window.clickflow.screenCapture` preload API, `screen-capture-client.js` (validation + memory cache), `screen-capture-ui.js` (new Advanced → Screen Capture tab with safety notice, sources grid with thumbnails, preview card), `appState.screenCapture` slice, six new audit-event types, compact Screen capture status diagnostics card, 24 RU + EN i18n keys, `docs/SCREEN_CAPTURE.md`. Screenshots never written to disk. **Real clicks / OCR / image recognition / template matching / OpenCV / robotjs / nut.js / iohook still absent.** |
| 26 | Region Selector Foundation (rectangular drag selector on top of the Step 25 preview — features themselves still not implemented): pure-logic `region-selector.js` (`createRegion`, `validateRegion`, `scaleRegionToImage` / `scaleRegionToPreview`, `getRegionArea`, `formatRegion`, `createEmptyRegionState`), `region-selector-ui.js` (drag overlay; mousemove/mouseup bound only during drag), `appState.regionSelector` slice + 8 mutators, optional `scenario.settings.region` via new scenario-manager helpers (`validateRegionSettings`, `updateScenarioRegion`, `clearScenarioRegion`; old scenarios untouched), six new audit-event types (`region.selection.started/updated/completed/cleared`, `region.attached.toScenario`, `region.validation.failed`), compact Region selector status diagnostics card + new `Region selector: …` line in Copy diagnostics, 22 RU + EN i18n keys (parity 428/428), `docs/REGION_SELECTOR.md`. Region stored as four numbers only — never pixels. **Real clicks / OCR / image matching / template matching / OpenCV / robotjs / nut.js / iohook still absent.** |
| 27 | Template Asset Manager (storage layer for the future smart-visual line — features themselves still not implemented): new `main/template-assets.js` with five `templates:*` IPC handlers (`load` / `import-image` / `save-metadata` / `delete` / `reset`) + `templates:get-stats`. Imports go through `dialog.showOpenDialog` with a `png/jpg/jpeg/webp` allow-list, magic-bytes verification, a ≤16 MiB cap, and header-only width/height parsing (no pixel decoding, no native deps). Storage lives at `userData/templates/templates.json` + `userData/templates/images/template-<id>.<ext>` — metadata only, no base64 / no pixel data, no original filesystem path. Corrupt JSON → quarantine + safe defaults. `preload.js` exposes `window.clickflow.templates`. Renderer modules: `src/template-manager.js` (`initTemplates`, `getTemplates`, `getTemplateById`, `getActiveTemplate`, `setActiveTemplate`, `importTemplateImage`, `updateTemplateMetadata`, `deleteTemplate`, `resetTemplates`, `validateTemplateMetadata`) and `src/template-ui.js` (`renderTemplatesTab`, `renderTemplateList`, `renderTemplateCard`, `renderActiveTemplate`, `openTemplateImport`, `openTemplateEdit`, `saveTemplateEdit`, `cancelTemplateEdit`, `deleteTemplateById`, `resetTemplateAssets`, `refreshTemplates`). `appState.templates` slice + 5 mutators (`setTemplates`, `setActiveTemplateId`, `setTemplatesLoading`, `setTemplatesError`, `resetTemplatesState`). Eight new audit-event types (`template.import.requested/completed/cancelled/failed`, `template.metadata.updated`, `template.selected`, `template.deleted`, `template.reset`). New 9th Advanced tab **Templates / Шаблоны**: header «Image Templates / Шаблоны изображений», safety notice, Import / Reset / Refresh buttons, grid of cards (preview, name, description, originalFileName, image size, file size, createdAt, Select / Edit / Delete), inline edit form (name + description, validated locally), active-template card. Diagnostics: compact **Image templates** card in Advanced → Safety + new `Templates: …` line in Copy diagnostics. 27 new RU + EN i18n keys. `docs/TEMPLATE_ASSETS.md`. `previewDataUrl` lives only in renderer memory and is **never** written back to settings / scenarios / profiles / templates.json. **Real clicks / OCR / image matching / template matching / OpenCV / robotjs / nut.js / iohook / sharp / jimp / pixelmatch still absent. realDesktopActions=false, simulationOnly=true, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 28 | Template Matching Mock / Dry-run (mock-only pipeline that wires the Step 25 preview, the Step 26 region, and the Step 27 templates into a deterministic mock match — features themselves still not implemented): new pure-logic `src/template-matching-mock.js` (`createTemplateMatchInput`, `validateTemplateMatchInput`, `runMockTemplateMatch`, `createMockMatchResult`, `getMockTargetPoint`, `createImageClickActionPreview`, `clearMockMatchResult`, `getLastMockMatchResult`, `getTemplateMatchingMockStatus`). The matcher is mock — it never decodes a single pixel and only consumes widths, heights, ids, and rectangles. The result is a `{ id, mode: "mock", matched, confidence, boundingBox, targetPoint, usedRegion, templateId, templateName, sourceId, sourceName, previewSize, createdAt, realMatching: false, realClick: false }` record. Confidence is deterministic — picked from a frozen set by hashing the input metadata. New `src/template-matching-ui.js` (`renderTemplateMatchingTab`, `buildTemplateMatchInputFromState`, `runTemplateMatchingMock`, `clearTemplateMatchingMockResult`, `renderTemplateMatchingRequirements`, `renderTemplateMatchingInputSummary`, `renderTemplateMatchingResult`, `renderTemplateMatchingOverlay`, `renderActionPreview`). New 10th Advanced tab **Template Matching / Поиск шаблона**: mock notice, five-row requirements checklist (preview / template / region / real-matching disabled / real-click disabled), input summary, Run / Clear buttons, visual overlay (bounding box + target point + dashed region) on top of the screen-capture preview, result card, `image_click` action-preview JSON block (rendered via `<pre>.textContent`, never submitted to the click engine). `appState.templateMatching` slice (`lastInput`, `lastResult`, `isRunning`, `lastError`, `lastRunAt`) + 6 mutators (`setTemplateMatchingInput`, `setTemplateMatchingResult`, `setTemplateMatchingRunning`, `setTemplateMatchingError`, `clearTemplateMatchingResult`, `resetTemplateMatchingState`) — strips any `imageDataUrl` / `previewDataUrl` a buggy caller might pass. Five new audit-event types (`template.match.mock.requested/completed/failed/cleared`, `image.click.preview.created`); payloads carry only ids and numeric metadata. Diagnostics: compact **Template matching (mock)** card in Advanced → Safety + new `Template matching mock: …` line in Copy diagnostics (numeric / metadata only — never base64). 27 new RU + EN i18n keys. `docs/TEMPLATE_MATCHING_MOCK.md`. **No real image matching, no OCR, no real clicks, no OpenCV / opencv.js / opencv4nodejs / @u4/opencv4nodejs, no Tesseract / tesseract.js, no `image_click` scenario execution. The matcher is pure metadata math — `realMatching=false`, `realClick=false`, `matcherImplemented=false`, `imageClickScenarioImplemented=false` hold across every status response and audit event. realDesktopActions=false, simulationOnly=true, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 29 | Real Template Matching Engine Foundation (renderer-side plain-JS template matching producing a real confidence score against the captured preview — not the live screen, not a real click): new `src/template-matching-engine.js` (`loadImageFromDataUrl`, `imageToCanvas`, `getImageDataFromDataUrl`, `cropImageData`, `resizeImageDataIfNeeded`, `runTemplateMatch`, `findBestMatch`, `calculatePatchScore`, `createTemplateMatchResult`, `getTemplateMatchEngineStatus`, `estimateSearchCost`). Mock mode from Step 28 is **kept**. The Template Matching tab gains a Match-mode selector (Mock / Real preview), a Threshold input (default `0.75`), and a Step selector (`1 / 2 / 4 / 8 / 16`, default `4`). Algorithm: mean RGB absolute difference over a regular grid (`step` pixels apart) with a per-template sub-step (`1 / 2 / 3 / 4` depending on template area). Big previews are downscaled to ≤ 1200×800; big templates are downscaled to ≤ 320×320; the bounding box is mapped back to the original preview coordinates. Cost guard raises the effective step when the estimate exceeds 16 M comparisons and emits a `template.match.engine.warning` audit event. `appState.templateMatching` gains `mode` / `threshold` / `step` + three setters (`setTemplateMatchingMode`, `setTemplateMatchingThreshold`, `setTemplateMatchingStep`). `_cloneTemplateMatchResult` carries the new `threshold / durationMs / step / requestedStep / pixelStep / scannedPositions / downscaledSearch / downscaledTemplate` fields. Five new audit-event types (`template.match.realPreview.requested/completed/failed`, `template.match.lowConfidence`, `template.match.engine.warning`). Result card gains a `Match found` / `Low confidence — showing best candidate` headline; the visual overlay paints solid green for matches and dashed for low-confidence candidates. Diagnostics card gains `Match mode`, `Threshold`, `Step`, `Duration`, `Engine available`, `Search region used`. `Copy diagnostics` line is broadened to `Template matching: …, mode=…, threshold=…, step=…, engineAvailable=…, lastDurationMs=…, lastMode=…, realMatching=false, realClick=false, ocrImplemented=false, opencvAvailable=false, matcherImplemented=true, imageClickScenarioImplemented=false`. 27 new RU + EN i18n keys. `docs/TEMPLATE_MATCHING_ENGINE.md`. **The engine analyses the captured preview, NOT the live screen. No real cursor movement, no real click, no OCR, no OpenCV / opencv.js / opencv-js / sharp / jimp / pixelmatch / looks-same / robotjs / nut.js / iohook / uiohook-napi. The `image_click` action preview is still rendered through `<pre>.textContent` and never reaches the click engine, the action pipeline, the mock adapter, or the dry-run sandbox. realDesktopActions=false, simulationOnly=true, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 30 | Image Click Scenario Type Foundation (new scenario type `image_click` orchestrating the Step 25–29 building blocks into a simulation-only end-to-end flow — features themselves still not implemented): `src/scenario-manager.js` gains `validateImageClickScenario`, `createImageClickScenario`, `updateImageClickScenario`, `getScenariosByType`. `createScenario` / `updateScenario` dispatch on `type`; missing `type` is treated as `simple_click` for backward compatibility. `src/click-engine.js` gains `runImageClickScenario(scenario, callbacks, options)` (capture preview → run Step-29 matcher → simulated `image_click` action via the action-pipeline). The dispatcher in `runScenario` routes by `scenario.type`. `src/action-pipeline.js` learns the `image_click` action shape; `validateAction` accepts `{ type: 'image_click', templateId, targetPoint: {x>=0, y>=0}, boundingBox?, confidence?, realClick: false }`; `realClick: true` is rejected outright. `image_click` flows through the legacy simulate path (the mock adapter only knows `click`) and emits `action.imageClick.simulated`. `src/safety-gates.js` mirrors the validation. New scenario form: `Scenario type` select (`Coordinate click` / `Image click`); image_click-only fields (template select, region summary + Use selected region / Clear region buttons, threshold, step, timeoutMs, intervalMs, repeatCount). The form auto-detects scenario type on edit and renders the right section. `formatLastAction(action)` renders both types. New scenario card badge `image_click`. New 9 audit-event types (`scenario.imageClick.started / stopped / match.started / match.completed / noMatch / simulated / failed`, `action.imageClick.simulated`, `action.imageClick.realBlocked`); payloads carry only ids / numeric metadata. New compact `image_click scenario` diagnostics card + new `Image click scenario: …, imageClickSimulationOnly=true, realImageClickEnabled=false, ocrImplemented=false` line in `Copy diagnostics`. 26 new RU + EN i18n keys. `docs/IMAGE_CLICK_SCENARIO.md`. **simple_click scenarios unchanged. No real cursor movement, no real click, no OCR / Tesseract, no OpenCV / opencv.js / opencv-js / sharp / jimp / pixelmatch / looks-same / robotjs / nut-js / iohook / uiohook-napi. `realClick: true` on `image_click` is always blocked. realDesktopActions=false, simulationOnly=true, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 31 | Image Click Scenario UX Polish + Visual Test Tools (Test Match flow inside the `image_click` scenario form — never executes the scenario, never clicks): two new pure renderer modules. `src/image-click-test-tools.js` is pure logic (`buildImageClickTestInput(formData, appState)`, `validateImageClickTestInput(input)`, `runImageClickTest(input)`, `createImageClickDebugResult(matchResult, input)`, `clearImageClickTestResult()`, `getImageClickTestStatus()`, `getLastImageClickTestResult()`). Stable error IDs map to localised strings (`noTemplateSelected`, `templateImageMissing`, `captureScreenPreviewFirst`, `invalidRegion`, `templateLargerThanSearchArea`, `matchingTookTooLong`, `matchingEngineUnavailable`, `thresholdInvalid`, `stepInvalid`). Stable warning IDs (`matchBelowThreshold`, `searchAreaCostHigh`, `stepRaisedByEngine`, `templateDownscaled`, `searchAreaDownscaled`). Soft 8-second timeout cap on top of the engine's own cost guards. Module-local `_lastTestResult` + `_diagnostics` (`lastImageClickTestAt / Matched / Confidence / DurationMs / TemplateId / ErrorsCount`) — never `imageDataUrl`, never thumbnails. `src/image-click-test-ui.js` is the DOM/UI layer (`initImageClickTestUi`, `refreshImageClickTestPanel`, `renderImageClickTemplatePreview`, `renderImageClickScreenPreviewStatus`, `renderImageClickRegionSummary`, `runImageClickTestFromForm`, `renderImageClickTestResult`, `clearImageClickTestResultUi`, `renderImageClickDebugOverlay`, `renderImageClickActionPreview`). The panel sits inside `#form-section-image-click` with: header + Test-Match-does-not-click subtitle, three quick navigation buttons (Open Templates / Open Screen Capture / Open Region Selector → `setAdvancedTab(tab)`), three info cards (template preview / screen preview status / region summary), Run Test Match (primary) + Clear result buttons, errors block (red), warnings block (yellow), result panel with coloured headline (matched=green / failed=red / no-match=yellow) and metric rows, debug overlay (region=dashed blue, bbox=solid green or dashed orange "candidate", confidence badge, target dot — all percentage-positioned over the preview `<img>`), action preview (`<pre>.textContent`, `realClick: false`). All user-visible text via `textContent`; image previews via `<img>.src` only; `innerHTML` only as `= ''`. Result mirrors into `appState.templateMatching.lastResult` (numbers / ids only) so the existing Template Matching tab and the Advanced → Safety diagnostics card see the same numbers. New 5 audit-event types (`imageClick.test.started / completed / failed / lowConfidence / cleared`); payloads carry only ids and numeric metadata. New compact **Image click test diagnostics** card in Advanced → Safety with `Last test at`, `Last test matched`, `Last test confidence`, `Last test duration`, `Last test template`, `Last test errors`, `Test Match does not click = enabled`, `Real matching disabled = enabled`, `Real click disabled = enabled`. New `Image click test: …, testDoesNotClick=true, realMatching=false, realClick=false` line in `Copy diagnostics` (numeric / metadata only — never base64). New `docs/IMAGE_CLICK_TEST_TOOLS.md`. Updated `docs/IMAGE_CLICK_SCENARIO.md` (new Test Match section), `docs/TEMPLATE_MATCHING_ENGINE.md` (engine is also used by Test Match), `docs/SECURITY_CHECKLIST.md` (new "image_click test tools (Step 31)" section), `docs/SMOKE_TESTS.md` (Step 31 smoke checks #278–#298). 47 new RU + EN i18n keys. **Test Match never executes the scenario, never moves the cursor, never clicks, never opens a new IPC channel, never persists the screenshot or the debug result on disk. The action preview is always `mode: "preview"`, `realClick: false`, `realMatching: false` and is never consumed by the click engine, the action pipeline, the mock adapter, or the dry-run sandbox. No OCR / OpenCV / Tesseract / robotjs / nut.js / iohook / uiohook-napi. realDesktopActions=false, simulationOnly=true, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 32 | OCR Foundation (mock only — renderer-side mock OCR engine + Advanced → OCR tab + `text_click` action PREVIEW; no real text recognition, no Tesseract, no OpenCV, no real click): new `src/ocr-mock-engine.js` (pure logic — `createOcrInput(screenPreview, region, options)`, `validateOcrInput(input)`, `runMockOcr(input)`, `createMockOcrBlocks(input)`, `findTextInOcrBlocks(blocks, targetText, matchMode, opts)`, `createOcrResult(input, blocks, match, runMeta)`, `createTextClickActionPreview(match, input)`, `getOcrMockStatus()`, `clearOcrMockResult()`, `getLastOcrMockResult()`). Stable error IDs (`captureScreenPreviewFirst`, `targetTextRequired`, `invalidOcrLanguage`, `invalidMatchMode`, `invalidRegion`). Mock blocks: target block centred inside the region (or near the centre of the preview) with the user's target text + 1–3 surrounding labels (`OK` / `Cancel` / `Settings`). Confidences in `[0.80, 0.95]`. New `src/ocr-ui.js` (DOM/UI — `renderOcrTab`, `renderOcrScreenPreviewStatus`, `renderOcrSettings`, `renderOcrRegionSummary`, `runMockOcrFromUi`, `clearOcrResultUi`, `renderOcrResult`, `renderOcrBlocks`, `renderOcrOverlay`, `renderTextClickActionPreview`, `buildOcrInputFromState`). New Advanced → **OCR** tab with: yellow MOCK notice ("Real text recognition is not connected yet."), Screen preview status card, OCR settings card (target text input, language select `ru` / `en` / `ru+en`, match mode select `contains` / `exact`, case-sensitive checkbox, use-selected-region checkbox), Region summary card, Run mock OCR / Clear result / Open Screen Capture / Open Region Selector buttons, result card with coloured headline (matched=green / failed=red / no-match=yellow) and metric rows, recognised-blocks list (matched row highlighted), debug overlay (preview `<img>` + dashed blue region + yellow-dashed candidate blocks + green solid matched block with label + red target dot), `text_click` action preview (`<pre>.textContent`, `mode: "preview"`, `realClick: false`, `realOcr: false`, `note: "Preview only…"`). New `appState.ocr` slice (`targetText`, `language`, `matchMode`, `caseSensitive`, `useSelectedRegion`, `lastInput`, `lastResult`, `isRunning`, `lastError`, `lastRunAt`) with setters (`setOcrTargetText`, `setOcrLanguage`, `setOcrMatchMode`, `setOcrCaseSensitive`, `setOcrUseSelectedRegion`, `setOcrRunning`, `setOcrInput`, `setOcrResult`, `setOcrError`, `clearOcrResult`, `resetOcrState`); cloning helpers strip `imageDataUrl` defensively. New 5 audit-event types (`ocr.mock.requested / completed / failed / cleared`, `text.click.preview.created`); payloads carry only short metadata (matchMode, language, hasRegion, blocksCount, durationMs, target text length — never the full target text). New compact **OCR diagnostics** card in Advanced → Safety with `Mock OCR available`, `Real OCR available`, `Last OCR run at`, `Last OCR matched`, `Last OCR confidence`, `Last OCR duration`, `Last OCR language`, `Last OCR match mode`, `Last OCR blocks count`, `Target text present`, `Region used`, `Real OCR disabled = enabled`, `Text recognition is not implemented yet = enabled`, `Real click disabled = enabled`. New `OCR: ocrMockAvailable=…, realOcrAvailable=false, lastOcrRunAt=…, lastOcrMatched=…, lastOcrConfidence=…, lastOcrDurationMs=…, ocrLanguage=…, ocrMatchMode=…, targetTextPresent=…, lastOcrBlocksCount=…, regionUsed=…, realOcr=false, realClick=false, tesseractAvailable=false, ocrEngineImplemented=false` line in `Copy diagnostics` (metadata only — never base64). 56 new RU + EN i18n keys (ocr / mockOcr / runMockOcr / clearOcrResult / ocrResult / realOcrNotConnected / targetText / targetTextPlaceholder / ocrLanguage / matchMode / contains / exact / caseSensitive / useSelectedRegion / recognizedBlocks / matchedText / textClickPreview / realOcrDisabled / textRecognitionNotImplemented / ocrMockNotice / noOcrResult / ocrMatched / ocrNoMatch / ocrConfidence / ocrBlocks / ocrDiagnostics / realOcrAvailable / ocrMockAvailable / targetTextRequired / invalidOcrLanguage / invalidMatchMode / ocrMockBadge / languageRu / languageEn / languageRuEn / matchModeContains / matchModeExact / lastOcrRunAt / lastOcrMatched / lastOcrConfidence / lastOcrDurationMs / lastOcrLanguage / lastOcrMatchMode / lastOcrBlocksCount / targetTextPresent / regionUsed / textClickActionPreview / textClickNotExecuted / ocrSettings / ocrTabTitle / ocrFoundation / ocrRunStarted / ocrRunCompleted / ocrRunFailed / ocrRunCleared / confidenceLabel). New `docs/OCR_FOUNDATION.md`. Updated `docs/ACTION_SCHEMA.md` (planned `text_click` preview-only entry), `docs/SCREEN_CAPTURE.md` (preview is also consumed by the OCR mock), `docs/REGION_SELECTOR.md` (region can scope the OCR mock), `docs/SECURITY_CHECKLIST.md` (new "OCR Foundation (Step 32)" section), `docs/SMOKE_TESTS.md` (Step 32 smoke checks #299–#318), `docs/KNOWN_LIMITATIONS.md` (new "15. OCR is mock only" section). **Mock OCR never recognises real text. The `text_click` action preview is rendered via `<pre>.textContent` and is rejected by the click engine, the action pipeline, the mock adapter, and the dry-run sandbox. No `text_click` scenario type — `validateScenario` still accepts only `simple_click` and `image_click`. No new IPC channel — `main.js` registers no `ocr.*` handler, `preload.js` exposes no `ocr.*` API. No Tesseract / tesseract.js / OpenCV / robotjs / nut.js / iohook / uiohook-napi. `imageDataUrl` never enters the OCR slice, the audit payloads, or the diagnostics line. realDesktopActions=false, simulationOnly=true, ocrEngineImplemented=false, tesseractAvailable=false, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 33 | Text Click Scenario Type Foundation (new scenario type `text_click` orchestrating the Step 25, 26 and 32 building blocks into a simulation-only end-to-end flow — real OCR / real click still NOT implemented): `src/scenario-manager.js` gains `validateTextClickScenario`, `createTextClickScenario`, `updateTextClickScenario`, `getTextClickScenarios`. `createScenario` / `updateScenario` dispatch on `type` for all three types now (simple_click / image_click / text_click); missing `type` is treated as `simple_click` for backward compatibility. `src/click-engine.js` gains `runTextClickScenario(scenario, callbacks, options)` (build OCR input → run Step-32 mock OCR → simulated `text_click` action via the action-pipeline). The dispatcher in `runScenario` and `validateRunnableScenario` route by `scenario.type` for the third type. `src/action-pipeline.js` learns the `text_click` action shape; `validateAction` accepts `{ type: ~text_click~, text, targetPoint: {x>=0, y>=0}, boundingBox?, confidence?, language?, matchMode?, caseSensitive?, realClick: false, realOcr: false }`; `realClick: true` is rejected outright AND `realOcr: true` is rejected outright. `text_click` flows through the legacy simulate path (the mock adapter only knows `click`, the dry-run sandbox only accepts `simple_click`) and emits `action.textClick.simulated`. `src/safety-gates.js` mirrors the validation. New scenario form: third option `Text click` in the type selector; text_click-only fields (target text input, language `ru`/`en`/`ru+en` select, match mode `contains`/`exact` select, case-sensitive checkbox, region summary + Use selected region / Clear scenario region buttons, timeoutMs, intervalMs, repeatCount). The form auto-detects scenario type on edit and renders the right section. Mock-OCR notice (yellow) and "Capture screen preview first" warning (red) inside the text_click form. `formatLastAction(action)` and `formatScenarioSettingsLine(sc)` render all three types; the target text is truncated to 24/40/60 chars in the various surfaces so long inputs don't blow up the UI. New scenario card badge `text_click`. New 9 audit-event types (`scenario.textClick.started / ocr.started / ocr.completed / textFound / noTextFound / simulated / failed`, `action.textClick.simulated`, `action.textClick.realBlocked`); payloads carry only ids, numeric metadata, language, matchMode, hasRegion, durationMs, confidence, target X/Y, AND `textLen` (NEVER the full target text). New compact `text_click scenario` diagnostics card (count, last result, confidence, target, target text present, simulationOnly=on, realTextClickDisabled=on, realOcrDisabled=on) + new `Text click scenario: textClickScenariosCount=…, lastTextClickStatus=…, lastTextClickConfidence=…, lastTextClickTargetPoint=…, lastTextClickTextLen=…, lastTextClickLanguage=…, lastTextClickMatchMode=…, textClickSimulationOnly=true, realTextClickEnabled=false, realOcrEnabled=false, tesseractAvailable=false, ocrEngineImplemented=false` line in `Copy diagnostics` (metadata only — NEVER the full target text, only its length). 22 new RU + EN i18n keys (textClick, textClickScenario, createTextClickScenario, editTextClickScenario, textClickSettings, clearScenarioRegion, mockOcrOnlyNotice, textClickSimulated, textClickNoMatch, textClickMissingPreview, textClickMissingTargetText, mockOcrStarted, targetTextFound, textClickTarget, realTextClickDisabled, lastTextClickResult, textClickScenariosCount, textClickSimulationOnly, textClickScenarioCompleted, textClickScenarioFailed, textClickRealOcrDisabled). New `docs/TEXT_CLICK_SCENARIO.md`. Updated `docs/ACTION_SCHEMA.md` (text_click action shape, validation, routing, audit), `docs/REGION_SELECTOR.md` (region can scope text_click), `docs/OCR_FOUNDATION.md` (mock now used by text_click scenario), `docs/SECURITY_CHECKLIST.md` (new "text_click scenario (Step 33)" section), `docs/SMOKE_TESTS.md` (Step 33 smoke checks #319–#336), `docs/KNOWN_LIMITATIONS.md` (new "16. text_click uses mock OCR only" section). **simple_click and image_click scenarios unchanged. The mock desktop adapter does not consume text_click. The dry-run sandbox does not consume text_click. No real cursor movement, no real click, no real OCR / Tesseract / tesseract.js, no OpenCV / opencv.js / opencv-js / sharp / jimp / pixelmatch / looks-same / robotjs / nut-js / iohook / uiohook-napi. `realClick: true` on `text_click` is always blocked. `realOcr: true` on `text_click` is always blocked. realDesktopActions=false, simulationOnly=true, ocrEngineImplemented=false, tesseractAvailable=false, contextIsolation: true, nodeIntegration: false — unchanged.** |
| 34 | Text Click Test Tools + OCR UX Polish (Test OCR / Test Text Match flow inside the `text_click` scenario form — never executes the scenario, never clicks, never performs real OCR): two new pure renderer modules. `src/text-click-test-tools.js` is pure logic (`buildTextClickTestInput(formData, appState)`, `validateTextClickTestInput(input)`, `runTextClickTest(input)`, `createTextClickDebugResult(ocrResult, input)`, `clearTextClickTestResult()`, `getTextClickTestStatus()`, `getLastTextClickTestResult()`). Stable error IDs map to localised strings (`targetTextRequired`, `captureScreenPreviewFirst`, `invalidRegion`, `invalidOcrLanguage`, `invalidMatchMode`, `mockOcrEngineUnavailable`, `targetTextWasNotFound`). The module delegates to the Step-32 mock engine (`createOcrInput` / `runMockOcr`) — it never imports / calls a real OCR backend. Module-local `_lastTextClickTestResult` + `_textClickTestDiagnostics` (`lastTextClickTestAt / Matched / Confidence / DurationMs / TargetTextLen / ErrorsCount / Language / MatchMode / RegionUsed / BlocksCount`, `ocrMockOnly: true`, `realOcrEnabled: false`, `realTextClickEnabled: false`) — never `imageDataUrl`, never the full target text. `src/text-click-test-ui.js` is the DOM/UI layer (`initTextClickTestUi`, `refreshTextClickTestPanel`, `renderTextClickScreenPreviewStatus`, `renderTextClickRegionSummary`, `renderTextClickOcrSettings`, `runTextClickTestFromForm`, `renderTextClickTestResult`, `clearTextClickTestResultUi`, `renderTextClickBlocksList`, `renderTextClickOcrOverlay`, `renderTextClickActionPreview`). The panel sits inside `#form-section-text-click` with: header + Test-OCR-does-not-click subtitle + Mock-OCR-only subtitle, three quick navigation buttons (Open OCR / Open Screen Capture / Open Region Selector → `setAdvancedTab(tab)`), three info cards (screen preview status / region summary / OCR settings — the OCR card auto-refreshes on every form change), Test OCR (primary) + Clear OCR result buttons, errors block (red, downgraded to soft yellow when the only error is `targetTextWasNotFound`), warnings block (yellow), result panel with coloured headline (matched=green / failed=red / no-match=yellow) and metric rows, OCR blocks list (matched row highlighted with a MATCHED badge), debug overlay (region=dashed blue, blocks=yellow-dashed, matched block=solid green with label, target dot=red — all percentage-positioned over the preview `<img>`), action preview (`<pre>.textContent`, `realClick: false`, `realOcr: false`). All user-visible text via `textContent`; image previews via `<img>.src` only; `innerHTML` only as `= `. Long target texts are truncated to 24/40/60 chars in the various surfaces so the layout never breaks. New 6 audit-event types (`textClick.test.started / completed / failed / noMatch / cleared / actionPreview.created`); payloads carry only ids, numeric metadata, language, matchMode, hasRegion, durationMs, confidence, target X/Y, AND `targetTextLen` / `textLen` (NEVER the full target text). New compact **Text click test diagnostics** card in Advanced → Safety with `Last text_click test at`, `Last text_click test matched`, `Last text_click test confidence`, `Last text_click test duration`, `Last text_click test target length`, `Last text_click test errors`, `OCR language`, `Match mode`, `Region used`, `Last OCR blocks count`, `Mock OCR only = enabled`, `Real OCR disabled = enabled`, `Real text_click disabled = enabled`, `Test Match does not click = enabled`. New `Text click test: hasResult=…, lastTextClickTestAt=…, lastTextClickTestMatched=…, lastTextClickTestConfidence=…, lastTextClickTestDurationMs=…, lastTextClickTestTargetTextLen=…, lastTextClickTestErrorsCount=…, lastTextClickTestLanguage=…, lastTextClickTestMatchMode=…, lastTextClickTestRegionUsed=…, lastTextClickTestBlocksCount=…, ocrMockOnly=true, realOcrEnabled=false, realTextClickEnabled=false, testDoesNotClick=true, realClick=false, realOcr=false` line in `Copy diagnostics` (numeric / metadata only — NEVER the full target text, NEVER base64, NEVER `imageDataUrl`). 30 new RU + EN i18n keys (testOcr, testTextMatch, runTextClickTest, textClickTestTools, textClickTestResult, textClickBlocks, ocrBlocksOverlay, matchedBlock, targetTextWasNotFound, mockOcrEngineUnavailable, openOcr, textClickTestStarted, textClickTestCompleted, textClickTestFailed, textClickTestNoMatch, textClickTestCleared, ocrMockOnly, testDoesNotUseRealOcr, textClickDebugPanel, matchedTextBlock, noTextClickTestResult, textClickTestDiagnostics, lastTextClickTestAt, lastTextClickTestMatched, lastTextClickTestConfidence, lastTextClickTestDurationMs, lastTextClickTestTargetTextLen, lastTextClickTestErrorsCount, textClickTestFormTypeMismatch, openingAdvancedTab — last two reused). New `docs/TEXT_CLICK_TEST_TOOLS.md`. Updated `docs/TEXT_CLICK_SCENARIO.md` (new Test OCR / Test Match section), `docs/OCR_FOUNDATION.md` (mock is now used by text_click test tools), `docs/SECURITY_CHECKLIST.md` (new "text_click test tools (Step 34)" section), `docs/SMOKE_TESTS.md` (Step 34 smoke checks #337–#358). **Test OCR never executes the scenario, never moves the cursor, never clicks, never performs real OCR, never opens a new IPC channel, never persists the screenshot or the debug result on disk. The action preview is always `mode: "preview"`, `realClick: false`, `realOcr: false` and is never consumed by the click engine, the action pipeline, the mock adapter, or the dry-run sandbox. No new dependencies (no Tesseract, no tesseract.js, no OpenCV, no robotjs, no nut.js, no iohook, no uiohook-napi). simple_click, image_click, and text_click scenarios all keep working unchanged. realDesktopActions=false, simulationOnly=true, ocrEngineImplemented=false, tesseractAvailable=false, ocrMockOnly=true, realOcrEnabled=false, realTextClickEnabled=false, contextIsolation: true, nodeIntegration: false — unchanged.** |

## Что логично делать после шага 31

- **Шаг 32 — Image Click Scenario Live Test Run (всё ещё
  simulation-only).** Логичные кандидаты на шаг 32 (выбрать
  **один**):
  1. **Test Run from form.** Кнопка «Test run» рядом с Test Match,
     которая запускает уже сохранённый сценарий через тот же
     click-engine но с лимитом `repeatCount = 1`, и показывает
     лог-стрим в самой форме. Реальные клики **по-прежнему**
     отсутствуют — это полная simulation-цепочка.
  2. **Persistent Test Match log.** Вкладка «Test Match log» в
     Advanced с историей последних N запусков (число из
     diagnostics, не imageDataUrl) — для отладки нестабильных
     шаблонов.
  3. **Multi-match preview.** Top-N кандидатов на overlay с
     убывающим confidence и серой dashed-рамкой, плюс таблица
     результатов. Клик-движок продолжает использовать только
     лучший кандидат.
  4. **Threshold suggestion.** Test Match подсказывает «попробуйте
     порог N% — лучший кандидат сейчас на M%». Без авто-применения.
- **OCR / text detection** — отдельная safety-gated линия. До
  начала кодинга обязательно пройти
  [`docs/REAL_ACTIONS_GO_NO_GO.md`](./docs/REAL_ACTIONS_GO_NO_GO.md).
- **Visual scenario builder** — drag-drop конструктор image_click
  / region / template-набора в одну сцену. **Не** в `0.1.x` линии.

## Что логично делать после шага 34

- **Шаг 35 — Visual Scenario Builder skeleton (всё ещё
  simulation-only).** Логичные кандидаты на шаг 35 (выбрать
  **один**):
  1. **Visual scenario builder skeleton.** Подготовительная
     архитектура для drag-drop конструктора, который позволит
     собирать в одну сцену несколько шагов: image_click +
     text_click + region + capture. Только данные, без
     рантайм-исполнения многоступенчатых сценариев — это
     подготовка для будущего Step 36+.
  2. **Multi-match preview для image_click и text_click.**
     Top-N кандидатов с убывающим confidence на overlay; mock
     возвращает несколько blocks; click-engine использует
     только лучший. По-прежнему simulation-only.
  3. **Persistent test log (Image / Text click test logs).**
     Вкладка с историей последних N запусков (только числа /
     id / textLen, никогда полный текст / `imageDataUrl`).
  4. **OCR confidence threshold для text_click.** Поле
     `minConfidence` в форме text_click сценария; click-engine
     отсеивает блоки ниже порога; mock-блоки возвращают
     стабильный confidence в [0.80, 0.95].
- **Real OCR engine (Tesseract / native)** — отдельная
  safety-gated линия. До начала интеграции обязательно пройти
  [`docs/REAL_ACTIONS_GO_NO_GO.md`](./docs/REAL_ACTIONS_GO_NO_GO.md)
  с фокусом на text recognition: какие документы / сайты /
  приложения OCR может видеть, как обращаться с PII в
  распознанном тексте, какой контракт `text_click` execution.
- **Real `text_click` / `image_click` execution** — отдельный
  go/no-go review. До этого момента action-pipeline отказывает
  любой попытке `executionMode: "real"` или `realClick: true`
  или `realOcr: true`.

## Что логично делать после шага 33

- **Шаг 34 — `text_click` Test Match panel (всё ещё simulation-only).**
  Логичные кандидаты на шаг 34 (выбрать **один**):
  1. **Text Click Test Match (по аналогии со Step 31).** Внутри
     формы `text_click` — кнопка `Run Test Match`, которая
     запускает Step-32 mock OCR над текущими значениями формы
     и captured preview, рисует debug overlay (region + matched
     block + target dot) и `text_click` action preview, **без
     сохранения сценария** и **без выполнения action**. Полная
     simulation-цепочка.
  2. **OCR multi-match preview.** Top-N кандидатов с
     убывающим confidence на overlay; mock возвращает несколько
     blocks; click-engine использует только лучший. По-прежнему
     simulation-only.
  3. **Persistent text_click test log.** Вкладка с историей
     последних N запусков mock OCR (только числа / id / textLen,
     никогда полный текст).
  4. **Visual scenario builder skeleton.** Drag-drop конструктор
     `image_click` / `text_click` / region / template-набора в
     одну сцену. Полная simulation-цепочка. **Не** в `0.1.x`
     линии — только подготовительная архитектура.
- **Real OCR engine (Tesseract / native)** — отдельная
  safety-gated линия. До начала интеграции обязательно пройти
  [`docs/REAL_ACTIONS_GO_NO_GO.md`](./docs/REAL_ACTIONS_GO_NO_GO.md)
  с фокусом на text recognition: какие документы / сайты /
  приложения OCR может видеть, как обращаться с PII в
  распознанном тексте, какой контракт `text_click` execution.
- **Real `text_click` / `image_click` execution** — отдельный
  go/no-go review. До этого момента action-pipeline отказывает
  любой попытке `executionMode: "real"` или `realClick: true`
  или `realOcr: true`.

## Что логично делать после шага 32

- **Шаг 33 — `text_click` simulation-only scenario type.**
  Логичные кандидаты на шаг 33 (выбрать **один**):
  1. **`text_click` scenario type (simulation-only).** Тот же
     путь, что и `image_click` на шагах 30–31: новый тип
     сценария с настройками `targetText` / `language` /
     `matchMode` / `caseSensitive` / опциональной `region`,
     `validateTextClickScenario` в `scenario-manager.js`,
     `runTextClickScenario` в `click-engine.js` который вызывает
     mock OCR и эмитит **симулированный** `text_click` action
     через action-pipeline. Реального клика по-прежнему нет.
  2. **OCR Test Match (по аналогии со Step 31).** Внутри будущей
     формы `text_click` — кнопка Run mock OCR без сохранения
     сценария.
  3. **OCR multi-match.** Top-N кандидатов с убывающим
     confidence на overlay; mock возвращает несколько blocks.
  4. **Persistent OCR mock log** в Advanced → OCR.
- **Real OCR engine (Tesseract / native)** — отдельная
  safety-gated линия. До начала интеграции обязательно пройти
  [`docs/REAL_ACTIONS_GO_NO_GO.md`](./docs/REAL_ACTIONS_GO_NO_GO.md)
  с фокусом на text recognition: какие документы / сайты /
  приложения OCR может видеть, как обращаться с PII в
  распознанном тексте, какой контракт `text_click` execution.
- **Visual scenario builder** — drag-drop конструктор image_click
  / text_click / region / template-набора в одну сцену. **Не** в
  `0.1.x` линии.

- **Шаг 28 — Template gallery / matcher prep (всё ещё simulation-only).**
  Активный шаблон уже выбирается, но никуда не «прикрепляется».
  Логичные кандидаты на шаг 28 (выбрать **один**):
  1. **Привязка шаблона к сценарию.** Расширить `scenario-manager.js`
     полями `validateTemplateRef`, `updateScenarioTemplate`,
     `clearScenarioTemplate`. `scenario.settings.templateId`
     становится опциональным полем (как `settings.region` после
     шага 26). Click-engine **по-прежнему игнорирует** поле.
  2. **Экспорт / импорт шаблонов.** `templates:export-bundle` /
     `templates:import-bundle`: ZIP-подобный JSON-блок с
     метаданными + base64 копий изображений, через
     `dialog.showSaveDialog` / `showOpenDialog`. Полезно для
     синхронизации шаблонов между машинами **без** сети.
  3. **Drag-and-drop импорт.** Renderer ловит файлы, передаёт
     путь main-процессу, main применяет тот же allow-list /
     magic-bytes / size-cap, что и `templates:import-image`.
- **Шаг 29 (запланировано, всё ещё simulation-only) — image
  matching dry-run preview.** Параллельно с уже существующим
  Step-19 dry-run sandbox добавить «match preview»: показать на
  preview-скриншоте найденную позицию шаблона как прямоугольник.
  **Без** реальных кликов; результат — чисто визуальный.
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
  клавиатурная навигация по 9 вкладкам Advanced.
- **Smoke-harness 2.0** (Playwright или альтернатива):
  поднимает Electron headless и проверяет no-real-input invariants
  на всех 6 слоях защиты.
- **Audit events UI 1.0**: отдельный sub-tab «Audit» с фильтрами
  и экспортом в JSON/JSONL (всё ещё in-memory).
- **Dry-run replay viewer**: in-memory история dry-run планов
  с возможностью повторно открыть и сравнить два плана.
