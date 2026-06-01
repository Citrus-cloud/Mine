# ClickFlow

> Минималистичный кроссплатформенный кликер и визуальный
> автоматизатор. **Beta `0.1.0` — режим имитации.** Реальные клики,
> OCR и распознавание изображений сознательно **не реализованы**.

> *English summary.* ClickFlow is a minimal cross-platform
> click-flow automator built on Electron and vanilla JavaScript.
> The current `0.1.0-beta` release is **simulation-only** — no real
> mouse / keyboard input, no OCR, no image recognition. See
> [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) and
> [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md).

---

## 1. Overview

ClickFlow — это lightweight Electron-приложение для авторинга
сценариев кликов. Сценарии запускаются во **внутреннем движке имитации**:
прогресс, лог, статус и аварийная остановка работают, но реальные
системные клики **не выполняются**.

Цель MVP — выстроить безопасную модель, удобный UI и надёжное
хранение сценариев **до** того, как появится возможность реального
ввода (он запланирован на отдельную линию `0.3.x` под обязательным
safety review).

---

## 2. Current status

- Линия: `0.2.x` (smart desktop beta).
- Версия: **`0.2.0-beta`** (`package.json` `version`; release tag — `v0.2.0-smart-beta`, pre-release).
- **`v0.2.0-smart-beta` готов / опубликован как Smart Desktop Beta
  pre-release.** Финальные релизные команды (`npm install`,
  `npm run smoke`, `npm start`, `npm run pack`, `npm run dist`)
  прошли, packaged app запущен вручную и работает.
  **Step 44 был финальным testing / release-preparation milestone**
  (final smart-beta sign-off перед тегом), а не отдельной runtime-
  фичей — у него нет файлов вроде `src/step-44.js`.
- **Текущий шаг — Step 45: post-release cleanup and feedback
  tracking.** Зафиксирован post-release статус, подготовлены каналы
  обратной связи и планы следующих веток. Новые большие функции и
  реальные клики **не добавлялись**. См.
  [`docs/POST_RELEASE_CHECKLIST.md`](./docs/POST_RELEASE_CHECKLIST.md),
  [`docs/FEEDBACK_TRIAGE.md`](./docs/FEEDBACK_TRIAGE.md),
  [`docs/V0_2_1_PATCH_PLAN.md`](./docs/V0_2_1_PATCH_PLAN.md),
  [`docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`](./docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md).
- Состояние: **Smart Desktop Beta released, simulation-only**. Поддерживает coordinate / image / text scenario foundations, Screen Capture (Step 25), Region Selector (Step 26), Templates (Step 27), Template Matching mock + real preview (Step 28–29), `image_click` scenario + Test Match (Step 30–31), OCR mock (Step 32), `text_click` scenario + Test OCR (Step 33–34), **Visual Builder + Scenario Presets (Step 36)**, **Smart Features QA + Next Branch Plan (Step 37)**, **OCR provider architecture (Step 38)**, **Tesseract OCR provider Phase 1 (Step 39)**, **Real OCR UI Activation + text_click / Visual Builder real OCR support (Steps 40-41)**, **Smart OCR/Image QA + bugfix pass (Step 42)**, **Smart Beta Packaging/Release Pass (Step 43)**, **final testing/release milestone (Step 44)**, и **post-release cleanup + feedback tracking (Step 45)**: `package.json` `version: "0.2.0-beta"`, electron-builder `files` ужесточён, smart-beta release docs (QA report / manual tests / release checklist / release notes / GitHub draft / tag-plan) + post-release docs. Реальные клики **по-прежнему не реализованы** (action-pipeline блокирует `realClick: true`), `realDesktopActions` нельзя включить через UI, OpenCV **не подключён**, мобильной версии **нет**.
- **Как отправить feedback:** через GitHub Issues по шаблонам
  [`bug_report`](./.github/ISSUE_TEMPLATE/bug_report.md),
  [`feature_request`](./.github/ISSUE_TEMPLATE/feature_request.md),
  [`safety_report`](./.github/ISSUE_TEMPLATE/safety_report.md).
  Процесс разбора — [`docs/FEEDBACK_TRIAGE.md`](./docs/FEEDBACK_TRIAGE.md).
- **Известные ограничения:**
  [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md).
- **Следующий patch — `v0.2.1`** (только bugfixes, без новых
  функций и без реальных кликов):
  [`docs/V0_2_1_PATCH_PLAN.md`](./docs/V0_2_1_PATCH_PLAN.md).
- **Будущая ветка `v0.3.0`** — real desktop adapter
  research / planning (только план; real clicks остаются
  отключёнными до прохождения safety review):
  [`docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`](./docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md).
  Перед публикацией smart-beta тэга были обязательны:
  [`docs/PRE_RELEASE_CHECKLIST.md`](./docs/PRE_RELEASE_CHECKLIST.md) (все боксы тикнуты),
  [`docs/PACKAGED_APP_QA.md`](./docs/PACKAGED_APP_QA.md) (sign-off на хотя бы одной целевой ОС),
  Release decision = "Ready" в [`docs/RELEASE_BLOCKERS.md`](./docs/RELEASE_BLOCKERS.md).
  Команды публикации — [`docs/RELEASE_TAG_PLAN.md`](./docs/RELEASE_TAG_PLAN.md).
- Последние шаги развития:
  - Шаг 13 — визуальная полировка, дизайн-токены, тёмная тема,
    `assets/`.
  - Шаг 14 — `CHANGELOG`, `RELEASE_NOTES`, `CONTRIBUTING`,
    GitHub-шаблоны, beta-гид, известные ограничения, roadmap.
  - Шаг 15 — финальная стабилизация: `npm run smoke`, Beta health
    диагностика, обработка повреждённых JSON, `FINAL_BETA_REVIEW`.
  - Шаг 16 — handoff design: `src/feature-flags.js` с safe defaults,
    карточка Feature flags, Next safety milestone в Future,
    `REAL_ACTIONS_GO_NO_GO`, `FEATURE_FLAGS`, `AUDIT_LOG_PLAN`,
    `PRIVACY`.
  - Шаг 17 — controlled action pipeline:
    `src/action-pipeline.js`, `src/safety-gates.js`,
    `src/audit-events.js`. Карточки Action pipeline / Safety
    gates / Real actions readiness / Audit events.
  - Шаг 18 — desktop adapter interface + mock adapter:
    `src/desktop-adapter-interface.js`,
    `src/mock-desktop-adapter.js`, `src/adapter-registry.js`.
    Карточка Desktop adapter status с кнопкой
    Run adapter self-test.
  - **Шаг 19 — real-action sandbox / dry-run:**
    `src/real-action-sandbox.js` — read-only preview layer.
    `getSandboxStatus()` возвращает `dryRunAvailable: true`,
    `realActionsAllowed: false`, `realActionsImplemented: false`.
    `evaluateRealActionReadiness()` всегда `allowed: false`.
    Карточка **Real action sandbox** с кнопкой
    **Create dry-run preview** + inline preview-карточка с
    permission checklist (11 пунктов) и blocked reasons (7 ID).
    `executionMode === "dry-run"` обрабатывается в pipeline без
    OS-вызовов. **Реальные клики по-прежнему не реализованы.**
  - **Шаг 20 — Final beta QA and bugfix pass:**
    структурный аудит проекта (0 dup ids, 0 missing refs, 0
    forbidden module imports, perfect i18n parity 342/342);
    расширенный smoke-check (теперь 96 проверок: добавлены
    проверки `preload.js does not expose ipcRenderer directly`,
    `all <script src="…"> in index.html resolve on disk`,
    `Step 20 doc exists: …`, `README or PROJECT_CONTEXT mentions
    step 20`); новые документы
    [`docs/BETA_QA_REPORT.md`](./docs/BETA_QA_REPORT.md) и
    [`docs/I18N_CHECKLIST.md`](./docs/I18N_CHECKLIST.md);
    SMOKE_TESTS.md и MVP_CHECKLIST.md дополнены секциями для
    шага 20. Перед beta-релизом нужен ручной smoke-тест.
  - **Шаг 21 — Beta release packaging pass:**
    `package.json` дополнен (`directories.output: "dist"`,
    расширенный `files`-массив, исключения для broken/DS_Store/
    Thumbs/git, mac/linux `category`); создан `.gitignore`;
    добавлены документы
    [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md),
    [`docs/BUILD_ARTIFACTS.md`](./docs/BUILD_ARTIFACTS.md),
    [`docs/GITHUB_RELEASE_DRAFT.md`](./docs/GITHUB_RELEASE_DRAFT.md),
    [`docs/VERSIONING.md`](./docs/VERSIONING.md); карточка
    **Release status** в Advanced → Safety с проверкой 8
    release-артефактов; smoke-check расширен до 113 проверок;
    19 новых i18n-ключей RU + EN.
  - **Шаг 22 — GitHub beta release finalization:**
    добавлены [`docs/RELEASE_FINAL_CHECK.md`](./docs/RELEASE_FINAL_CHECK.md)
    (короткий pre-tag sign-off) и
    [`docs/TAG_AND_RELEASE_GUIDE.md`](./docs/TAG_AND_RELEASE_GUIDE.md)
    (manual git/GitHub-команды);
    [`docs/GITHUB_RELEASE_DRAFT.md`](./docs/GITHUB_RELEASE_DRAFT.md)
    финализирован (явные «no real clicks / no OCR / no image
    recognition / mock adapter only / dry-run sandbox does not
    execute real actions»); [`RELEASE_NOTES.md`](./RELEASE_NOTES.md)
    обновлён до Steps 1 — 22 с разделами для шагов 17—22;
    `docs/SECURITY_CHECKLIST.md` дополнен секцией
    «Final release security»; `docs/KNOWN_LIMITATIONS.md`
    дополнен секцией 8 (Beta release); `docs/SMOKE_TESTS.md`
    дополнен «Step 22 — Release smoke sequence» (#135–#150);
    карточка Release status расширена двумя новыми строками
    (`Final release check`, `Tag and release guide`) и
    переключилась на бейдж `readyForManualRelease` /
    `releaseNotReady`; `Copy diagnostics` дополнен; smoke-check
    расширен до 137 проверок; 9 новых i18n-ключей RU + EN.
    **Tag и публикация GitHub Release остаются ручными
    действиями** — см. `docs/TAG_AND_RELEASE_GUIDE.md`.
  - **Шаг 23 — Post-pack QA and release blocker pass:**
    структурный аудит подтвердил отсутствие release blockers
    (141 → 168 проверок smoke-check, 0 forbidden, perfect i18n
    parity 368/368, 0 dup ids, 0 missing refs, все 6 слоёв
    защиты refuse real input при runtime-харнесе); добавлены
    [`docs/RELEASE_BLOCKERS.md`](./docs/RELEASE_BLOCKERS.md)
    (status / blockers table / non-blocking known issues /
    verification notes / release decision = "Ready after manual
    packaged-app QA") и
    [`docs/PACKAGED_APP_QA.md`](./docs/PACKAGED_APP_QA.md)
    (manual checklist для проверки собранного `npm run pack` /
    `npm run dist` приложения с обязательной верификацией
    отсутствия реальных кликов); IPC `system:get-release-status`
    дополнен полями `releaseBlockersPresent`,
    `packagedAppQaPresent`, `packagedAppTested`,
    `readyAfterManualQa`; карточка Release status в Advanced →
    Safety теперь содержит 14 строк (3 новые) и переключилась
    на бейдж `Ready after manual QA`; обновлены
    `docs/RELEASE_FINAL_CHECK.md` / `docs/TAG_AND_RELEASE_GUIDE.md`
    / `docs/GITHUB_RELEASE_DRAFT.md` / `RELEASE_NOTES.md`;
    добавлены 7 новых i18n-ключей RU + EN.
  - **Шаг 24 — Final beta release preparation:**
    добавлены [`docs/FINAL_RELEASE_SUMMARY.md`](./docs/FINAL_RELEASE_SUMMARY.md)
    (single-page snapshot релиза),
    [`docs/PRE_RELEASE_CHECKLIST.md`](./docs/PRE_RELEASE_CHECKLIST.md)
    (manual checklist перед тэгом),
    [`docs/RELEASE_TAG_PLAN.md`](./docs/RELEASE_TAG_PLAN.md)
    (manual command sequence для tag/push/publish), и
    [`docs/RELEASE_COMMIT_MESSAGE.md`](./docs/RELEASE_COMMIT_MESSAGE.md)
    (recommended commit title и body + forbidden body lines —
    запрещено заявлять о real input / OCR / image recognition /
    mobile / `realDesktopActions` flip). Обновлены
    `docs/RELEASE_FINAL_CHECK.md` (ссылки на 4 новых документа,
    Release decision = "Ready for beta pre-release after manual
    packaged-app QA"), `docs/RELEASE_BLOCKERS.md` (status
    обновлён до Step 24, Release decision уточнён) и
    `docs/GITHUB_RELEASE_DRAFT.md` (Step 24 в highlights, intro
    к Feedback section). IPC `system:get-release-status`
    дополнен полями `finalReleaseSummaryPresent`,
    `preReleaseChecklistPresent`, `releaseTagPlanPresent`,
    `releaseCommitMessagePresent`,
    `readyForPreReleaseAfterManualQa`. Карточка Release status
    в Advanced → Safety расширена 4 новыми строками (всего 18)
    и переключилась на бейдж `Ready for pre-release after
    manual QA`. Smoke-check расширен до **193 проверок**.
    Добавлено 7 новых i18n-ключей RU + EN. **Tag и публикация
    GitHub Release остаются ручными действиями.**
  - **Шаг 25 — Screen Capture Foundation (новая линия умных
    визуальных функций):**
    добавлен безопасный foundation для будущих умных функций
    (поиск картинки/иконки, поиск текста, выбор области экрана,
    template matching, OCR, визуальный конструктор). На этом
    шаге сами функции **не реализованы** — это только
    инфраструктура. В `main.js` появились три IPC-обработчика
    через Electron `desktopCapturer`
    (`screen-capture:list-sources`,
    `screen-capture:capture-preview`,
    `screen-capture:get-status`); в `preload.js` —
    `window.clickflow.screenCapture` (без сырого `ipcRenderer`);
    в `src/screen-capture-client.js` — валидация и in-memory
    cache; в `src/screen-capture-ui.js` — новая вкладка
    **Screen Capture** в Advanced dashboard с safety notice,
    кнопками Refresh sources / Capture preview / Clear preview,
    grid с thumbnails и preview-карточкой; в `src/app-state.js`
    — `screenCapture` state slice (sources, selectedSourceId,
    preview, isLoading, lastError, lastCapturedAt) с 7
    мутаторами; в `src/audit-events.js` — 6 новых allowlisted
    типов (`screen.capture.sources.requested`,
    `screen.capture.sources.loaded`,
    `screen.capture.preview.requested`,
    `screen.capture.preview.created`,
    `screen.capture.preview.cleared`,
    `screen.capture.error`). Скриншот **никогда** не пишется
    на диск, рендерится только через `img.src` (без
    `innerHTML`), preview хранится только в памяти renderer.
    Добавлен документ
    [`docs/SCREEN_CAPTURE.md`](./docs/SCREEN_CAPTURE.md);
    обновлены `docs/SECURITY_CHECKLIST.md`,
    `docs/KNOWN_LIMITATIONS.md`, `docs/SMOKE_TESTS.md`. Smoke-check
    расширен Step-25-инвариантами. Добавлено 24 новых i18n-ключа
    RU + EN. **Реальные клики / OCR / image recognition /
    template matching / OpenCV / robotjs / nut.js / iohook
    по-прежнему отсутствуют.**
  - **Шаг 26 — Region Selector Foundation (продолжение линии
    умных визуальных функций):**
    поверх preview из шага 25 добавлен прямоугольный
    region-selector. Сами умные функции (image matching, OCR,
    клик по картинке/тексту, визуальный конструктор) **по-прежнему
    не реализованы** — это только координатный примитив. Добавлены
    два модуля: [`src/region-selector.js`](./src/region-selector.js)
    (чистая логика — `createRegion`, `validateRegion`,
    `scaleRegionToImage` / `scaleRegionToPreview`, `getRegionArea`,
    `formatRegion`, `createEmptyRegionState`; нет DOM, нет IPC, нет
    диска) и [`src/region-selector-ui.js`](./src/region-selector-ui.js)
    (drag-overlay поверх `<img>`, кнопки Enable/Disable region
    selection, Clear region, Save region, Attach to active
    scenario; mousemove/mouseup биндятся только во время
    активного drag и отвязываются на mouseup). В
    `src/app-state.js` добавлен slice `regionSelector`
    (`selectedRegion`, `normalizedRegion`, `isSelecting`,
    `previewSize`, `imageSize`, `lastUpdatedAt`, `lastError`)
    с 8 мутаторами. В `src/scenario-manager.js` — новые
    `validateRegionSettings`, `updateScenarioRegion`,
    `clearScenarioRegion` (старые сценарии без `settings.region`
    продолжают работать как раньше). В `src/audit-events.js` —
    6 новых allowlisted типов
    (`region.selection.started/updated/completed/cleared`,
    `region.attached.toScenario`, `region.validation.failed`);
    payload содержит только числа и id, **никогда** пиксели.
    Скриншот **по-прежнему не сохраняется на диск**, регион
    хранится как четыре числа `{x, y, width, height}`. В Advanced
    → Safety добавлена компактная карточка **Region selector
    status** + новая строка `Region selector: …` в `Copy
    diagnostics`. Добавлен документ
    [`docs/REGION_SELECTOR.md`](./docs/REGION_SELECTOR.md);
    обновлены `docs/SCREEN_CAPTURE.md`,
    `docs/ACTION_SCHEMA.md`, `docs/SECURITY_CHECKLIST.md`,
    `docs/KNOWN_LIMITATIONS.md`, `docs/SMOKE_TESTS.md`. Smoke-check
    расширен Step-26-инвариантами. Добавлено 22 новых i18n-ключа
    RU + EN (parity 428/428). **Реальные клики / OCR / image
    recognition / template matching / OpenCV / robotjs / nut.js /
    iohook по-прежнему отсутствуют. realDesktopActions=false,
    simulationOnly=true, contextIsolation: true, nodeIntegration:
    false — без изменений.**
  - **Шаг 27 — Template Asset Manager (продолжение линии умных
    визуальных функций — только assets, без поиска):**
    добавлен менеджер картинок-шаблонов, которые позже будут
    использоваться для поиска на скриншоте. Сами умные функции
    (image matching, OCR, клик по картинке/тексту, визуальный
    конструктор) **по-прежнему не реализованы** — это только
    хранилище. Новый main-модуль
    [`main/template-assets.js`](./main/template-assets.js)
    добавляет 6 IPC-обработчиков (`templates:load`,
    `templates:import-image`, `templates:save-metadata`,
    `templates:delete`, `templates:reset`,
    `templates:get-stats`) с allow-list `png/jpg/jpeg/webp`,
    magic-bytes-проверкой, размером ≤ 16 MiB, header-only
    парсингом ширины/высоты (без декодирования пикселей) и
    quarantine-fallback на повреждённый JSON. В `preload.js` —
    namespace `window.clickflow.templates` (через
    `contextBridge`, без прямого `ipcRenderer`). Добавлены два
    renderer-модуля: [`src/template-manager.js`](./src/template-manager.js)
    (`initTemplates`, `getTemplates`, `getTemplateById`,
    `getActiveTemplate`, `setActiveTemplate`,
    `importTemplateImage`, `updateTemplateMetadata`,
    `deleteTemplate`, `resetTemplates`, `validateTemplateMetadata`)
    и [`src/template-ui.js`](./src/template-ui.js)
    (`renderTemplatesTab`, `renderTemplateList`,
    `renderTemplateCard`, `renderActiveTemplate`,
    `openTemplateImport`, `openTemplateEdit`, `saveTemplateEdit`,
    `cancelTemplateEdit`, `deleteTemplateById`,
    `resetTemplateAssets`, `refreshTemplates`).
    В `src/app-state.js` — slice `templates`
    (`items`, `activeTemplateId`, `isLoading`, `lastError`)
    с 5 мутаторами. В `src/audit-events.js` — 8 новых
    allowlisted типов
    (`template.import.requested/completed/cleansed/failed`,
    `template.metadata.updated`, `template.selected`,
    `template.deleted`, `template.reset`); payload содержит
    только id и короткие метаданные, **никогда** base64 или
    pixel-данные. В Advanced появилась **девятая вкладка
    Templates / Шаблоны**: header «Image Templates / Шаблоны
    изображений», safety-notice, кнопки Import / Reset / Refresh,
    список карточек с preview, name, description, original
    filename, размером в пикселях, размером файла, createdAt и
    кнопками Select / Edit / Delete; inline-форма редактирования
    name/description с валидацией (`name required`,
    `name ≤ 80`, `description ≤ 300`). В Advanced → Safety —
    компактная карточка **Image templates** + новая строка
    `Templates: …` в `Copy diagnostics`.
    Добавлен документ
    [`docs/TEMPLATE_ASSETS.md`](./docs/TEMPLATE_ASSETS.md);
    обновлены `docs/SECURITY_CHECKLIST.md`,
    `docs/KNOWN_LIMITATIONS.md`, `docs/SMOKE_TESTS.md`,
    `docs/ACTION_SCHEMA.md` (planned `image_click`).
    Smoke-check расширен Step-27-инвариантами. Добавлено 27
    новых i18n-ключей RU + EN. **Реальные клики / OCR / image
    recognition / template matching / OpenCV / robotjs / nut.js /
    iohook / sharp / jimp / pixelmatch по-прежнему отсутствуют.
    `previewDataUrl` живёт только в памяти renderer и никогда не
    попадает в `templates.json`, `settings.json`,
    `scenarios.json`, `profiles.json`. realDesktopActions=false,
    simulationOnly=true, contextIsolation: true, nodeIntegration:
    false — без изменений.**

---

## 3. Features

### Главный экран
- Бейдж **Режим имитации** и бейдж версии.
- Карточка статуса со статус-индикатором.
- Карточка прогресса с баром, счётчиком и последним действием.
- Start / Stop / Emergency Stop.
- Безопасный режим в футере.

### Сценарии
- Базовый сценарий `simple_click`.
- Создание / редактирование / удаление пользовательских сценариев.
- Валидация имени и числовых границ.
- Сохранение в `userData/scenarios.json` через main-process IPC.

### Настройки
- Язык: RU / EN. Тема: system / light / dark.
- Безопасность: safe mode, emergency stop, мин. интервал,
  макс. число повторов.
- Импорт / экспорт / сброс настроек.

### Расширенный режим
Десять вкладок: Overview, Scenarios, Execution, Logs, Settings,
Safety, **Screen Capture** (Step 25 — preview only),
**Templates / Шаблоны** (Step 27 — assets only),
**Template Matching / Поиск шаблона** (Step 28 — mock / dry-run only),
Future.
Diagnostics, история ошибок, профили, импорт /
экспорт, readiness-чеклист desktop-адаптера, **Beta health card**
(Step 15), **Feature flags card** (Step 16), **Next safety milestone**
карточка во вкладке Future. **Step 17:** карточки **Action pipeline**,
**Safety gates**, **Real actions readiness** (9-row checklist),
**Audit events** (count + last event) в Advanced → Safety.
**Step 18:** карточка **Desktop adapter status** с кнопкой
**Run adapter self-test**.
**Step 19:** карточка **Real action sandbox** с кнопкой
**Create dry-run preview** + inline preview-карточка с
permission checklist и blocked reasons.
**Step 25:** новая вкладка **Screen Capture** + компактная
карточка **Screen capture status** в Advanced → Safety
(`available`, `sourcesCount`, `selectedSource`, `previewAvailable`,
`lastCapturedAt`, `lastError`).
**Step 26:** **Region Selector** — drag-overlay прямоугольника
поверх preview + карточка **Region selector status** в Advanced
→ Safety (`selectedRegion`, `normalizedRegion`,
`previewCoordinates`, `imageCoordinates`, `regionArea`,
`attachedToScenario`, `lastUpdatedAt`, `lastError`). Регион
можно привязать к активному сценарию как `settings.region`
(image-space координаты, опциональное поле, старые сценарии
работают как раньше).
**Step 27:** новая вкладка **Templates / Шаблоны** с импортом
PNG/JPG/JPEG/WebP через `dialog.showOpenDialog`, preview, именем,
описанием, выбором активного шаблона и удалением + компактная
карточка **Image templates** в Advanced → Safety
(`templatesCount`, `activeTemplateId`, `activeTemplateName`,
`templatesStorageReady`, `lastError`). **Поиск шаблонов на
скриншоте, OCR и клики по найденному не выполняются.**
**Step 28:** новая вкладка **Template Matching / Поиск шаблона**
с requirements checklist, input summary, кнопками Run mock
match / Clear result, визуальным overlay (bounding box + target
point + dashed used region) поверх preview и JSON-предпросмотром
будущего `image_click` action + компактная карточка
**Template matching (mock)** в Advanced → Safety (`Last run at`,
`Last result`, `Confidence`, `Target point`, `activeTemplateId`,
`Preview available`, `regionAvailable`, `Real matching disabled`,
`Real click disabled`). **Это mock/dry-run — настоящего image
matching, OCR и кликов нет.**
**Step 29:** в той же вкладке появился **Match mode** селектор
(Mock / Real preview), Threshold-инпут (default `0.75`) и Step-
селектор (`1 / 2 / 4 / 8 / 16`, default `4`). Real preview —
plain-JS движок над `ImageData`, считающий настоящий confidence
score по preview-картинке (НЕ по live screen). Большие previews
автоматически downscale до ≤ 1200×800, большие шаблоны — до
≤ 320×320, bounding box возвращается в координатах исходного
preview. При низкой достоверности рисуется dashed candidate-rect
и эмитится `template.match.lowConfidence`. **Реального курсора
нет, реального клика нет, OCR нет, OpenCV нет.**
**Step 30:** добавлен новый тип сценария **image_click**: форма
сценария теперь имеет селектор типа (`Coordinate click` /
`Image click`); в режиме `Image click` появляются поля template,
region (с кнопками Use selected region / Clear region),
threshold, step, timeout, interval, repeat. При запуске
`image_click` сценария click-engine итеративно гоняет Step-29
matcher над captured preview и эмитит **симулированные**
`image_click` actions через action-pipeline. **Реального клика
нет**: action-pipeline отказывает любым `image_click` actions с
`realClick: true` и эмитит `action.imageClick.realBlocked`. В
Advanced → Safety появилась карточка **image_click scenario** с
количеством сценариев, последним результатом, confidence,
target и неизменными флагами `imageClickSimulationOnly = on /
realImageClickDisabled = on`. **OCR нет, OpenCV нет, реальные
курсор/клавиатура отсутствуют. simple_click сценарии продолжают
работать без изменений.**
**Step 31:** в форме `image_click` сценария добавлен новый
блок **Image click test tools** с информационными карточками
(Template preview / Screen preview status / Region summary),
кнопкой **Run Test Match** и кнопками быстрой навигации
(Open Templates / Open Screen Capture / Open Region Selector).
Run Test Match запускает Step-29 matcher над текущими значениями
формы и captured preview и рисует цветной headline (matched /
no match / failed), метрики (confidence / threshold / bbox /
target / duration / step), визуальный **debug overlay** поверх
preview (region — пунктирный синий, bbox — сплошной зелёный или
dashed orange при низкой достоверности, бейдж confidence,
красная точка target point) и **action preview** (JSON через
`<pre>.textContent`, `realClick: false`). Понятные локализованные
ошибки (`No template selected`, `Template image is missing`,
`Capture a screen preview first`, `Region is invalid`,
`Template is larger than search area`, `Match confidence is
below threshold`, `Matching took too long`, `Matching engine
unavailable`). **Test Match никогда не сохраняет сценарий**,
**никогда не выполняет click**, **никогда не запускает
scenario**, **никогда не пишет скриншот / debug result на диск**,
**никогда не открывает новый IPC канал**.
**Step 32:** добавлен новый Advanced → **OCR** таб + новый
mock-движок `ocr-mock-engine.js` + новый UI-модуль `ocr-ui.js`.
Пользователь вводит target text, выбирает language (`ru` /
`en` / `ru+en`), match mode (`contains` / `exact`),
case-sensitive флаг, опциональный region; кнопка **Run mock
OCR** запускает mock-движок, который фабрикует список
recognized blocks (`Continue` + `OK` / `Cancel` / `Settings`)
из метаданных preview, выбирает best match и строит
**`text_click` action preview** (`type: "text_click"`,
`mode: "preview"`, `realClick: false`, `realOcr: false`).
Render: цветной headline (matched / failed / no-match),
метрики, recognized blocks list (matched row подсвечен), debug
overlay (region — пунктирный синий, blocks — оранжевые dashed,
matched — сплошной зелёный с label, target point — красная
точка), action preview JSON через `<pre>.textContent`. **Mock
OCR никогда не выполняет настоящее распознавание**,
**никогда не выполняет click**, **никогда не пишет screenshot
/ result / blocks на диск**, **никогда не открывает новый IPC
канал**, **никогда не сохраняет `imageDataUrl`** ни в audit, ни
в diagnostics, ни в OCR slice. **Tesseract / tesseract.js не
подключены и не добавлены в package.json. Реального
`text_click` нет — это только action preview, который click
engine, action pipeline, mock adapter и dry-run sandbox
отказываются выполнять.**
**Step 33:** добавлен новый тип сценария **text_click**: форма
сценария теперь имеет третью опцию `Text click`. В режиме
`Text click` появляются поля target text, OCR language (`ru` /
`en` / `ru+en`), match mode (`contains` / `exact`),
case-sensitive, optional region (с кнопками Use selected region
/ Clear scenario region), timeoutMs, intervalMs, repeatCount.
Жёлтая mock-OCR плашка («На этом этапе используется mock OCR.
Настоящее распознавание текста пока не подключено.»). Красная
плашка «Сначала получите screenshot preview.», когда preview
отсутствует. При запуске `text_click` сценария click-engine
итеративно вызывает Step-32 mock OCR над captured preview и
эмитит **симулированные** `text_click` actions через
action-pipeline. **Реального клика нет**: action-pipeline
отказывает любым `text_click` actions с `realClick: true` или
`realOcr: true` и эмитит `action.textClick.realBlocked`.
Mock-адаптер `text_click` не выполняет (он знает только `click`)
— симуляция идёт через legacy simulate path и эмитит
`action.textClick.simulated`. Dry-run sandbox `text_click` не
выполняет (он принимает только `simple_click`). В Advanced →
Safety появилась карточка **text_click scenario** с количеством
сценариев, последним результатом, confidence, target и
неизменными флагами `textClickSimulationOnly = on /
realTextClickDisabled = on / realOcrDisabled = on`. **Tesseract /
tesseract.js не подключены и не добавлены в package.json. OCR
по-прежнему mock-only. Реальные курсор/клавиатура отсутствуют.
simple_click и image_click сценарии продолжают работать без
изменений.**
**Step 34:** в форме `text_click` сценария добавлен новый блок
**Text click test tools** с тремя информационными карточками
(Screen preview status / Region summary / OCR settings),
кнопкой **Test OCR** и кнопками быстрой навигации
(Open OCR / Open Screen Capture / Open Region Selector). Кнопка
**Test OCR** запускает Step-32 mock OCR над текущими значениями
формы и captured preview и рисует: цветной headline (matched /
no-match / failed), метрики (target text / language / match
mode / case sensitive / matched text / confidence / bbox /
target / duration), список **OCR blocks** (matched row с
зелёной подсветкой и MATCHED-бейджем), визуальный **OCR
blocks overlay** поверх preview (region — пунктирный синий,
mock blocks — оранжевые dashed, matched block — сплошной
зелёный с label, target dot — красный круг), и
**`text_click` action preview** (JSON через
`<pre>.textContent`, `realClick: false`, `realOcr: false`).
Понятные локализованные ошибки (`Target text is required`,
`Capture a screen preview first`, `Region is invalid`,
`Mock OCR engine is unavailable`, `Target text was not found`,
`Unsupported match mode`, `Unsupported OCR language`).
**Test OCR никогда не сохраняет сценарий**, **никогда не
выполняет click**, **никогда не запускает scenario**,
**никогда не использует настоящий OCR**, **никогда не пишет
скриншот / debug result на диск**, **никогда не открывает
новый IPC канал**. Добавлены два новых модуля:
[`src/text-click-test-tools.js`](./src/text-click-test-tools.js)
(pure logic — `buildTextClickTestInput`,
`validateTextClickTestInput`, `runTextClickTest`,
`createTextClickDebugResult`, `clearTextClickTestResult`,
`getTextClickTestStatus`, `getLastTextClickTestResult`) и
[`src/text-click-test-ui.js`](./src/text-click-test-ui.js) (DOM/UI
— `initTextClickTestUi`, `refreshTextClickTestPanel`,
`renderTextClickScreenPreviewStatus`,
`renderTextClickRegionSummary`, `renderTextClickOcrSettings`,
`runTextClickTestFromForm`, `renderTextClickTestResult`,
`clearTextClickTestResultUi`, `renderTextClickBlocksList`,
`renderTextClickOcrOverlay`, `renderTextClickActionPreview`).
В `src/audit-events.js` — 6 новых allowlisted типов
(`textClick.test.started/completed/failed/noMatch/cleared/actionPreview.created`).
В Advanced → Safety — новая карточка **Text click test
diagnostics** с lastTextClickTestAt / Matched / Confidence /
DurationMs / TargetTextLen / ErrorsCount / Language /
MatchMode / RegionUsed / BlocksCount; в `Copy diagnostics`
— новая строка `Text click test: …` (только числа, id и
длина текста, никогда полный target text). Новый документ
[`docs/TEXT_CLICK_TEST_TOOLS.md`](./docs/TEXT_CLICK_TEST_TOOLS.md).
Обновлены `docs/TEXT_CLICK_SCENARIO.md`,
`docs/OCR_FOUNDATION.md`, `docs/SECURITY_CHECKLIST.md`,
`docs/SMOKE_TESTS.md`. Smoke-check расширен Step-34-инвариантами.
Добавлено 30 новых i18n-ключей RU + EN. **Реальные клики /
настоящий OCR / Tesseract / tesseract.js / OpenCV / robotjs /
nut.js / iohook / uiohook-napi по-прежнему отсутствуют.
realDesktopActions=false, simulationOnly=true,
ocrEngineImplemented=false, tesseractAvailable=false,
contextIsolation: true, nodeIntegration: false — без
изменений.**
**Step 36 — Visual Builder UX Polish + Scenario Presets:**
добавлены три новых модуля
[`src/scenario-presets.js`](./src/scenario-presets.js) (frozen
preset definitions + `getScenarioPresets`,
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
(`renderVisualBuilderTab` + status row, onboarding hints
с быстрыми кнопками Open Screen Capture / Open Templates /
Open Region Selector / Open OCR, action-type selector,
preview с overlay-слоями, overlay legend, шесть
overlay-чекбоксов + Show all / Hide all / Clear overlays,
quick-action panel, scenario presets cards с Use preset /
Use with current visual context, draft preview card с Open
draft in form). Новая вкладка **Visual Builder /
Визуальный конструктор** в Advanced dashboard. В
`src/audit-events.js` — 6 новых allowlisted типов
(`scenarioPreset.selected/draft.created/form.opened`,
`visualBuilder.overlay.changed/requirement.missing/draft.preview.created`),
payload содержит только ids, type, hasRegion, hasTemplate,
targetTextLen, missingCount, withVisualContext —
**никогда** полный target text, **никогда** `imageDataUrl`.
В `Copy diagnostics` — новая строка `Visual Builder: …,
autoSavesScenarios=false, autoRunsScenarios=false,
realClick=false, realOcr=false`. Pre-fill сценарной формы
из preset / draft через `setTimeout(..., 0)` поверх
существующего `openCreateScenarioForm()`. Добавлено
~70 новых i18n-ключей RU + EN. CSP не ослаблен. **Visual
Builder никогда не сохраняет сценарий автоматически,
никогда не запускает сценарий автоматически, никогда не
кликает, никогда не выполняет настоящий OCR, никогда не
открывает новый IPC канал, никогда не пишет screenshot /
debug result на диск, никогда не сохраняет imageDataUrl в
preset / draft / scenario / audit / diagnostics.
Tesseract / tesseract.js / OpenCV / robotjs / nut.js /
iohook / uiohook-napi не подключены.
realDesktopActions=false, simulationOnly=true,
ocrEngineImplemented=false, tesseractAvailable=false,
contextIsolation: true, nodeIntegration: false — без
изменений.**
**Step 37 — Smart Features QA + Next Branch Preparation:**
добавлены три новых документа
[`docs/SMART_FEATURES_QA.md`](./docs/SMART_FEATURES_QA.md)
(manual QA-чеклист на всю цепочку Screen Capture → Region →
Templates → Matching → Image Click → OCR Mock → Text Click →
Visual Builder → Scenario Presets с Steps / Expected /
Status: Not tested, плюс Safety checks, Known issues,
Release recommendation),
[`docs/NEXT_BRANCH_PLAN.md`](./docs/NEXT_BRANCH_PLAN.md)
(Branch A — Real OCR Integration, Branch B — Real Desktop
Adapter, Branch C — Android Research; рекомендация
**сначала Branch A** — настоящий OCR без реальных кликов
менее рискованно, чем real desktop adapter), и
[`docs/SMART_FEATURES_LIMITATIONS.md`](./docs/SMART_FEATURES_LIMITATIONS.md)
(консолидированный список ограничений: screen capture,
region, templates, matching, OCR, image_click, text_click,
Visual Builder, presets, real clicks). Обновлены
`docs/SMOKE_TESTS.md` (#359–#388 — Step 36 + Step 37 smoke
checks), `docs/SECURITY_CHECKLIST.md` (новый раздел Visual
Builder + Scenario Presets с поведенческими, audit,
diagnostics и Electron-security инвариантами),
`docs/KNOWN_LIMITATIONS.md` (новый раздел 17 — Visual
Builder + Scenario Presets are foundation-only),
[`README.md`](./README.md), [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md),
[`CHANGELOG.md`](./CHANGELOG.md). Smoke-check расширен
Step-37-инвариантами. **Реальные клики / настоящий OCR /
Tesseract / tesseract.js / OpenCV / robotjs / nut.js /
iohook / uiohook-napi по-прежнему отсутствуют. ClickFlow
остаётся simulation-only desktop MVP.
realDesktopActions=false, simulationOnly=true,
ocrEngineImplemented=false, tesseractAvailable=false,
contextIsolation: true, nodeIntegration: false — без
изменений.**
**Step 38 — Real OCR Research + Safe Integration Plan:**
добавлены два новых модуля
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
**OCR readiness / Готовность OCR** со списком провайдеров,
флагами `realOcrEnabled=no`, `realOcrAllowed=no`, языками,
`OCR images not stored: yes`, кнопкой **Run provider self-
test** (запускает mock-провайдер на синтетических метаданных
preview без скриншота). В `src/feature-flags.js` —
четыре новых safe-default флага: `realOcr: false`,
`ocrProviderRegistry: true`, `ocrMockProvider: true`,
`tesseractProvider: false`. В `src/audit-events.js` —
6 новых allowlisted типов
(`ocr.provider.selftest.started/.completed/.failed`,
`ocr.provider.selection.blocked`,
`ocr.provider.mock.active`,
`ocr.provider.real.unavailable`); payload содержит только
provider id, durations, counts, stable error IDs —
**никогда** полный target text, **никогда** `imageDataUrl`,
**никогда** PII. В `Copy diagnostics` — новая строка
`OCR provider: activeProviderId=mock,
mockProviderAvailable=true, tesseractProviderAvailable=false,
realOcrEnabled=false, realOcrAllowed=false,
tesseractAvailable=false, realOcr=false, realClick=false`.
Добавлено ~26 новых i18n-ключей RU + EN, parity 771/771.
Созданы документы
[`docs/REAL_OCR_INTEGRATION_PLAN.md`](./docs/REAL_OCR_INTEGRATION_PLAN.md)
(roadmap до Tesseract worker'а: библиотека, language packs,
worker model, performance, privacy, security, UI progress,
fallback, no real click) и
[`docs/OCR_PROVIDER_INTERFACE.md`](./docs/OCR_PROVIDER_INTERFACE.md)
(reference контракта, input/output, registry, self-test,
safety rules). Обновлены `docs/OCR_FOUNDATION.md`,
`docs/TEXT_CLICK_SCENARIO.md`,
`docs/TEXT_CLICK_TEST_TOOLS.md`,
`docs/NEXT_BRANCH_PLAN.md` (Branch A — progress note),
`docs/SECURITY_CHECKLIST.md` (новый раздел OCR Provider
Registry с поведенческими / audit / diagnostics /
Electron-security инвариантами),
`docs/KNOWN_LIMITATIONS.md` (новый раздел 18 — Real OCR
planned, not connected),
[`README.md`](./README.md), [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md),
[`CHANGELOG.md`](./CHANGELOG.md). Smoke-check расширен
Step-38-инвариантами. CSP не ослаблен, новых IPC-каналов
нет. **Tesseract / tesseract.js / Tesseract runtime / OpenCV
/ robotjs / nut.js / iohook / uiohook-napi не подключены.
Real OCR не запускается. `setActiveOcrProvider('tesseract')`
блокируется и эмитит `ocr.provider.selection.blocked` +
`ocr.provider.real.unavailable`. text_click продолжает
работать через mock OCR. Visual Builder продолжает работать.
realDesktopActions=false, simulationOnly=true,
realOcr=false, tesseractProvider=false,
ocrProviderRegistry=true, ocrMockProvider=true,
contextIsolation: true, nodeIntegration: false — без
изменений.**
**Step 39 — Real OCR Provider Integration Phase 1:** в
`package.json` объявлена runtime-dependency `tesseract.js`
(`^5.0.4`); создан новый модуль
[`src/tesseract-ocr-provider.js`](./src/tesseract-ocr-provider.js)
(`getTesseractProviderInfo`,
`isTesseractProviderAvailable`,
`checkTesseractProviderReadiness(flags)`,
`runTesseractSelfTest(options)` — НЕ запускает настоящий OCR,
`recognizeTextWithTesseract(input, options)` — на шаге 39
ВСЕГДА возвращает blocked-envelope, `normalizeTesseractResult`,
`mapTesseractBlocks`, `terminateTesseractWorker`,
`getTesseractProviderDiagnostics`). Engine resolver
defensive: ищет engine через test-seam → renderer global
`window.Tesseract` → CommonJS `require('tesseract.js')` в
try/catch. Если engine не найден — провайдер возвращает
unavailable, приложение не падает. В
`src/ocr-provider-registry.js` Tesseract entry перешёл из
`planned: true` в Phase 1 — `setActiveOcrProvider('tesseract')`
заблокирован, пока **оба** флага не будут `true` И
engine-resolver не отчитается о доступности. Добавлена
`getTesseractProviderStatus()`. В `src/feature-flags.js` —
явный Step-39 stance для четырёх OCR-флагов
(`realOcr: false`, `tesseractProvider: false`,
`ocrMockProvider: true`, `simulationOnly: true`) и новая
функция `getOcrFeatureStatus()` (flat snapshot:
`realOcrAllowed = realOcr && tesseractProvider &&
!simulationOnly`, `realOcrAutoRun: false`). В
`src/audit-events.js` — 6 новых allowlisted типов
(`ocr.tesseract.readiness.requested/.completed/.failed`,
`ocr.tesseract.blockedByFeatureFlag`,
`ocr.provider.tesseract.detected`,
`ocr.provider.tesseract.unavailable`). В Advanced → OCR —
новая карточка **OCR provider status / Статус OCR-провайдера**
с активным провайдером, флагами Tesseract installed /
Tesseract enabled / Real OCR feature flag / Real OCR auto-run
disabled / Real clicks disabled, и кнопкой **Check Tesseract
readiness / Проверить готовность Tesseract**. Кнопка НЕ
запускает настоящий OCR — вызывает
`checkTesseractProviderReadiness`, эмитит структурированные
audit-события и логирует результат. В `Copy diagnostics` —
новая строка `Real OCR: tesseractDependencyPresent=…,
tesseractProviderAvailable=…, tesseractProviderEnabled=false,
tesseractEngineLoadable=…, realOcrFeatureFlag=false,
activeOcrProvider=mock, realOcrAutoRun=false,
lastTesseractReadinessCheck=…, lastTesseractError=…,
tesseractDisabledReason=…, realOcr=false, realClick=false`.
Добавлено ~18 новых i18n-ключей RU + EN, parity 795/795.
Создан документ
[`docs/TESSERACT_PROVIDER.md`](./docs/TESSERACT_PROVIDER.md)
(purpose / dependency / feature flags / why disabled by
default / readiness / future activation plan / privacy /
performance / known limitations / safety notes). Обновлены
`docs/OCR_FOUNDATION.md`, `docs/OCR_PROVIDER_INTERFACE.md`,
`docs/REAL_OCR_INTEGRATION_PLAN.md` (Step 39 Phase 1 progress
appendix), `docs/TEXT_CLICK_SCENARIO.md`,
`docs/SECURITY_CHECKLIST.md` (новый раздел Tesseract OCR
Provider с поведенческими / audit / diagnostics /
Electron-security инвариантами),
`docs/KNOWN_LIMITATIONS.md` (новый раздел 19 — Tesseract
provider installed/prepared but disabled), README,
PROJECT_CONTEXT, CHANGELOG. Smoke-check расширен
Step-39-инвариантами (новый модуль + новый док + audit
allowlist + feature flags + tesseract.js в package.json +
no other forbidden modules + no new IPC + CSP unchanged +
ocr-ui.js does NOT add Enable real OCR toggle).
**Active OCR provider всё ещё `mock`. text_click продолжает
работать через mock OCR. Visual Builder продолжает
работать. Real OCR не запускается автоматически. Real OCR
не запускается даже при флагах === true (Phase 1
hard-stop). Реальных кликов нет. realDesktopActions=false,
simulationOnly=true, realOcr=false, tesseractProvider=false,
realOcrAutoRun=false, contextIsolation: true,
nodeIntegration: false, CSP — без изменений.**

**Steps 40–41 — Real OCR UI Activation + Real OCR for text_click
and Visual Builder:** в `src/feature-flags.js` добавлен runtime
overlay (`setRuntimeFeatureFlag`, `getRuntimeFeatureFlags`,
`resetRuntimeFeatureFlags`) — только `realOcr` и
`tesseractProvider` могут быть включены runtime; ни
`realDesktopActions`, ни `simulationOnly` нельзя trip из UI.
Базовые safe defaults остаются `realOcr=false`,
`tesseractProvider=false`, `simulationOnly=true`,
`realDesktopActions=false`. После перезапуска runtime overlay
очищается. Tesseract OCR provider теперь действительно вызывает
`Tesseract.recognize` через async-функцию
`recognizeTextWithTesseract`, но только когда
`getOcrFeatureStatus().realOcrEnabledForSession === true`. В
противном случае возвращается blocked envelope. Engine resolver
defensive — если `tesseract.js` не загружен, провайдер сообщает
`unavailable` без падения. Региональный crop через canvas
(best-effort), language map `ru→rus`, `en→eng`, `ru+en→rus+eng`,
progress callback пробрасывает stages в UI и audit. Cancel
через token (Tesseract.js v5 не имеет abort-handle —
worker-based cancellation запланирован). В Advanced → OCR
добавлены 4 новые кнопки provider-control (Use Mock OCR,
Enable Tesseract for this session, Use Tesseract OCR,
Disable Real OCR), кнопка **Run Real OCR** (отключена пока не
выполнены все условия), карточка **Real OCR progress**
(stage + bar + cancel). text_click scenarios получили поле
`settings.ocrProvider` (`mock` | `tesseract`, default
`mock`); форма text_click имеет select OCR provider; click-engine
ветвится на провайдер: для tesseract проверяет runtime overlay
и вызывает `recognizeTextWithTesseract`, иначе использует
mock OCR. Test OCR панель тоже async и provider-aware.
Visual Builder копирует активный провайдер в text_click draft;
draft preview показывает `OCR provider used` и
`Real OCR: true|false`. Action-pipeline на step 41 принимает
`text_click realOcr=true` как source-маркер (источник —
настоящий OCR), но всё равно блокирует `realClick=true` —
действие остаётся simulation-only. В audit добавлены 8 новых
типов: `ocr.real.enabledForSession`, `ocr.real.disabled`,
`ocr.real.started`, `ocr.real.progress`, `ocr.real.completed`,
`ocr.real.failed`, `ocr.real.blocked`, `ocr.provider.switched`.
В `Copy diagnostics` строка `Real OCR: ...` теперь учитывает
runtime overlay. Добавлено ~24 i18n-ключей RU + EN, parity
819/819. Создан документ
[`docs/REAL_OCR_USAGE.md`](./docs/REAL_OCR_USAGE.md). В
`src/index.html` добавлен best-effort `<script src="../node_modules/tesseract.js/dist/tesseract.min.js">`
(graceful fallback, если `npm install` не выполнен). Smoke-check
расширен step-40-41 инвариантами + relaxed чек на script-resolve
для path-ов `../node_modules/`. **Real clicks отсутствуют. text_click
с tesseract требует session enable — в противном случае
блокируется с понятной ошибкой. Mock OCR и existing flows
(simple_click, image_click, OCR tab mock run, Visual Builder)
работают без изменений. CSP не ослаблен. contextIsolation:
true, nodeIntegration: false. realDesktopActions нельзя
включить через UI.**

contextIsolation: true, nodeIntegration: false. realDesktopActions нельзя
включить через UI.**

**Step 42 — Smart OCR/Image QA + Bugfix Pass:** проведён сквозной
audit smart-features цепочки. Найдены и исправлены 5 багов:
text_click preset не нёс `ocrProvider` (Step-41 регрессия);
`applyVisualContextToPreset` не переносил активный OCR-провайдер;
`buildVisualContextFromState` не консультировал
`getActiveOcrProvider`; `isRealOcrAllowed` был Step-38 hard-stop
(теперь честно отражает merged feature flags);
`getOcrProviderRegistryStatus` сообщал `realOcrEnabled: false` после
session opt-in (теперь читает `realOcrEnabledForSession`). Создан
[`src/smart-beta-health.js`](./src/smart-beta-health.js)
(`getSmartBetaHealth`, `countSmartBetaReleaseBlockers`). В `Copy
diagnostics` — новая строка `Smart beta:` со всеми 10 readiness-
флагами + `releaseBlockersCount`. 5 новых audit-типов в allowlist.
i18n parity 835/835 (16 новых ключей). Созданы
[`docs/SMART_BETA_QA_REPORT.md`](./docs/SMART_BETA_QA_REPORT.md) и
[`docs/SMART_BETA_MANUAL_TESTS.md`](./docs/SMART_BETA_MANUAL_TESTS.md).
Обновлены SMOKE_TESTS, SECURITY_CHECKLIST, KNOWN_LIMITATIONS.

**Step 43 — Smart Beta Packaging/Release Pass:** в `package.json`
`version` обновлён до **`0.2.0-beta`**. Релизный тег:
**`v0.2.0-smart-beta`**. `build.files` ужесточён (явные include
для tesseract.js node_modules + exclude для userData / .env /
screenshots / dist / coverage / cache). Созданы три release-
документа:
[`docs/SMART_BETA_RELEASE_NOTES.md`](./docs/SMART_BETA_RELEASE_NOTES.md),
[`docs/SMART_BETA_RELEASE_CHECKLIST.md`](./docs/SMART_BETA_RELEASE_CHECKLIST.md),
[`docs/SMART_BETA_RELEASE_DRAFT.md`](./docs/SMART_BETA_RELEASE_DRAFT.md).
RELEASE_NOTES + TAG_AND_RELEASE_GUIDE дополнены smart-beta
секциями. **Smart-beta release ready after manual packaged-app
QA. Реальных кликов нет. realDesktopActions=false (hard-coded, не
в runtime whitelist). simulationOnly=true. Все safety invariants
сохранены.**

**Step 44 — Final smart-beta testing / release-preparation
milestone:** Step 44 был **не отдельной продуктовой функцией, а
финальным этапом проверки и релизной подготовки** Smart Beta перед
тегом `v0.2.0-smart-beta`. Выполнены финальные команды и проверки:
`npm install`, `npm run smoke`, `npm start`, `npm run pack`,
`npm run dist`, ручной packaged-app QA, проверка что приложение
запускается, что smoke-check проходит, что packaged app работает,
что real desktop clicks всё ещё отключены, и что release docs /
tag plan / release notes на месте. Поэтому **отдельных runtime-
файлов вроде `src/step-44.js` у Step 44 нет** — он отражён в
release docs / README / PROJECT_CONTEXT / CHANGELOG как
testing/release milestone.

**Step 45 — Post-release cleanup and feedback tracking:**
зафиксирован post-release / post-smart-beta статус и подготовка к
следующей большой ветке. Что сделано:
- уточнено, что Step 44 был release/testing milestone, а не
  отдельной runtime-фичей;
- добавлен post-release checklist
  [`docs/POST_RELEASE_CHECKLIST.md`](./docs/POST_RELEASE_CHECKLIST.md);
- добавлен feedback triage guide
  [`docs/FEEDBACK_TRIAGE.md`](./docs/FEEDBACK_TRIAGE.md)
  (issue labels, severity S0–S4, priority P0–P3, bug/feature/safety
  processes, release-blocker criteria, when to make v0.2.1 / defer
  to v0.3.0);
- добавлен план патча
  [`docs/V0_2_1_PATCH_PLAN.md`](./docs/V0_2_1_PATCH_PLAN.md)
  (bugfix-only: crash / UI / translations / packaging / smoke-check
  / docs / minor UX; запрещены real clicks / new OCR engine /
  OpenCV / mobile / major refactor);
- добавлен план ветки
  [`docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`](./docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md)
  (только план; real desktop actions disabled до прохождения safety
  review; real adapter за feature flag; action-pipeline блокирует по
  умолчанию; никаких captcha / anti-bot / ad-click / banking
  automation);
- обновлён post-release статус, README и PROJECT_CONTEXT;
- smoke-check расширен Step-45 инвариантами;
- подтверждена simulation-only safety model.
**Новые большие функции и реальные клики на Step 45 не
добавлялись. realDesktopActions=false, simulationOnly=true,
contextIsolation: true, nodeIntegration: false, CSP не ослаблен.**

**Step 46 — Desktop v1 architecture and safety foundation:** начало
полноценной ветки Desktop v1. **Реальные системные клики НЕ
добавлены.** Заложена архитектурная и safety-основа:
- v1 product plan, implementation checklist, full product branch plan
  (`docs/V1_DESKTOP_PRODUCT_PLAN.md`,
  `docs/V1_IMPLEMENTATION_CHECKLIST.md`,
  `docs/FULL_PRODUCT_BRANCH_PLAN.md`);
- v1 safety docs (`docs/V1_SAFETY_MODEL.md`,
  `docs/V1_ACTION_PIPELINE.md`,
  `docs/V1_REAL_ADAPTER_REQUIREMENTS.md`, `docs/V1_AUDIT_LOGS.md`,
  `docs/V1_PERMISSION_MODEL.md`, `docs/V1_RELEASE_CRITERIA.md`) +
  `docs/NUTJS_INTEGRATION_PLAN.md` (план, без зависимости);
- action pipeline приведён к v1-ready виду: таксономия типов
  (`click` / `image_click` / `text_click` / `wait` активны;
  `move_mouse` / `scroll` / `key_press` / `hotkey` planned/disabled),
  единый формат результата (`normalizeActionResult`), многоусловный
  real-mode gate (`evaluateRealModeReadiness`), который **блокирует по
  умолчанию**;
- persistent audit log manager (`src/audit-log-manager.js`,
  in-memory + redaction, file persistence prepared);
- permission manager (`src/permission-manager.js`, только
  status/guidance);
- real desktop adapter interface (`src/real-desktop-adapter-interface.js`)
  — контракт, но всё real execution **disabled** (каждый
  `executeReal*` блокирует);
- Safety Center UI (`src/safety-center-ui.js`): текущий режим,
  V1 readiness, permissions checklist, audit logs (фильтры / refresh /
  clear / export), кнопки Run safety check / Export diagnostics;
- миграция scenario metadata к `version: 1` + run summaries (последние
  10 запусков, `realActionsPerformed: false`);
- i18n RU/EN расширен, smoke-check расширен Step-46 инвариантами.
**realDesktopActions=false, simulationOnly=true,
contextIsolation: true, nodeIntegration: false, CSP не ослаблен,
no robotjs/nut.js/iohook/uiohook-napi/opencv.**

**Step 47 — Real desktop adapter prototype behind hard safety gate:**
добавлен первый **прототип** реального desktop-адаптера — **только
coordinate click**, **выключен по умолчанию**, **session-only**, **один
клик на одно подтверждение**.
- main-process модуль `main/real-desktop-adapter.js` (renderer не имеет
  прямого доступа; три узких IPC-канала: status / availability /
  execute-coordinate-click; нет универсального «run any action»);
- опциональный backend `@nut-tree/nut-js` / `nut-js` **не добавлен в
  зависимости** на этом шаге — adapter сообщает *unavailable* и
  блокирует реальный клик, пока backend не установлен (require в
  try/catch, сборка не ломается);
- feature flags: `realCoordinateClick` / `realImageClick` /
  `realTextClick` добавлены (все false); runtime-toggle разрешён только
  для `realDesktopActions` и `realCoordinateClick` (session-only, не
  сохраняется, сбрасывается при перезапуске);
- action-pipeline: `canExecuteRealDesktopAction` /
  `executeRealDesktopAction` / `createRealActionBlockedResult` — real
  mode **заблокирован по умолчанию**, image/text/keyboard real —
  заблокированы;
- safety-gates: строгий `getRealDesktopActionGateStatus` (default
  deny);
- Safety Center: карточка **Experimental Real Coordinate Click**
  (risk warning, dry-run, enable-for-session с модальным подтверждением
  «I understand…», Test real coordinate click с отдельным
  подтверждением, диагностика прототипа); кнопки image_click/text_click
  real **отсутствуют**;
- audit events для real adapter; permission/diagnostics расширены;
  REAL_ADAPTER_PROTOTYPE.md + REAL_CLICK_TESTING_GUIDE.md; i18n RU/EN.
**По умолчанию реальные клики выключены; image/text real clicks
disabled; keyboard automation отсутствует; запрещены
captcha/anti-bot/ad/banking/protected/hidden. realDesktopActions=false
по умолчанию, simulationOnly=true, contextIsolation: true,
nodeIntegration: false, CSP не ослаблен.**

**Step 48 — Real coordinate click stabilization and safety QA:**
прототип реального клика **стабилизирован** (без новых типов real
actions). Реальные клики по-прежнему **выключены по умолчанию**,
**session-only**, **one click per confirmation**.
- feature flags: добавлен `keyboardAutomation: false` (hard-coded, не
  runtime-togglable); `isRealCoordinateClickSessionEnabled()`;
  попытка включить запрещённый флаг — ошибка + audit event;
- action-pipeline: явные blocked reasons
  (`getRealDesktopActionBlockReason`), новые требования контекста
  (`sessionRealCoordinateClickEnabled`, `adapterAvailable`,
  `oneClickOnly`), блокировка repeat/batch;
- safety-gates: `getRealCoordinateClickGateStatus(...)` (default-deny,
  one click per confirmation, click only, no batch/repeat, no
  image/text/keyboard);
- adapter (main): обязательны `oneClickOnly` и
  `sessionRealCoordinateClickEnabled`, отказ repeat/batch, поле
  `reason`, безопасный fallback при отсутствии зависимости;
- Safety Center: status badges, **fresh confirmation на каждый клик**
  (чекбокс «I confirm this single coordinate click.»), кнопка Test real
  click **disabled**, если adapter unavailable, расширенная
  диагностика;
- emergency stop проверяется перед каждым real click; расширены audit
  events (`realCoordinate.*`, `emergencyStop.*`); permissions/diagnostics
  расширены; i18n RU/EN;
- docs: `REAL_COORDINATE_CLICK_STABILIZATION.md`,
  `REAL_COORDINATE_CLICK_QA.md` + обновления.
**One click per confirmation; repeat/batch blocked; image/text real
clicks disabled; keyboard automation disabled; realDesktopActions=false
по умолчанию, simulationOnly=true, contextIsolation: true,
nodeIntegration: false, CSP не ослаблен.**

### Towards Desktop v1

- `v0.2.0-smart-beta` опубликован / готов как Smart Desktop Beta
  pre-release (simulation-only).
- **Desktop v1 foundation начат (Step 46).** Это архитектура и
  безопасность; **реальные клики ещё не реализованы и остаются
  отключёнными до прохождения safety review.**
- Реальный адаптер будет разрабатываться в отдельной ветке
  `v1-desktop` за feature flag; `main` / `v0.2.x` остаются
  simulation-only (см. `docs/FULL_PRODUCT_BRANCH_PLAN.md`).
- Android — позже отдельной веткой `v1-android-research`; iOS
  ограничен системой. Никаких captcha / anti-bot / ad-click /
  banking automation.
- Открыть в приложении: **Advanced → Центр безопасности (Safety
  Center)** — текущий режим, V1 readiness, permissions checklist,
  audit logs.

### Smoke check
`npm run smoke` — статическая проверка целостности репозитория
(файлы, security-флаги, CSP, package.json wiring, отсутствие
real-input модулей). Без Electron, без сетевых вызовов, без
зависимостей — только Node `fs`/`path`. См.
[`scripts/README.md`](./scripts/README.md).

### Глобальные горячие клавиши
- `CmdOrCtrl+Alt+S` — Start.
- `CmdOrCtrl+Alt+X` — Stop.
- `CmdOrCtrl+Alt+E` — Emergency Stop.
- `Escape` (в окне) — Emergency Stop.

### Локализация
RU / EN, все строки UI через `i18n.js` и `data-i18n`.

### Упаковка
`electron-builder` сконфигурирован для Windows (NSIS), macOS (DMG),
Linux (AppImage). Подробнее — [`docs/PACKAGING.md`](./docs/PACKAGING.md).

---

## 4. Safety model

- `contextIsolation: true`, `nodeIntegration: false`.
- Renderer общается с Node только через `preload.js → window.clickflow.*`.
- Все системные операции и file-dialogs — в main process.
- Пользовательские строки рендерятся через `textContent`. `innerHTML`
  используется только для очистки контейнера (`= ''`).
- CSP: `default-src 'self'; script-src 'self'; style-src 'self';`
  не ослабляется.
- Diagnostics не выводят приватные пути файловой системы.
- Emergency Stop всегда доступен и обрывает движок мгновенно.

Подробнее — [`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md)
и [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## 5. What is **not** implemented

ClickFlow `v0.2.0-smart-beta` — **simulation-only**. Сознательно отсутствуют:

- реальные системные клики и реальный ввод с клавиатуры
  (нет `robotjs`, `nut.js`, `iohook`, `uiohook-napi`);
- OCR;
- распознавание изображений / OpenCV / template matching;
- автоклик по найденной картинке / иконке / тексту (Step 25
  добавил preview через `desktopCapturer`, Step 26 — drag-выбор
  области; сами умные функции по-прежнему не реализованы);
- автоматическое действие по выбранной области — region selector
  Step 26 хранит только координаты (`x, y, width, height`),
  движок сценариев игнорирует `settings.region`;
- сохранение скриншотов на диск (preview хранится только в
  памяти renderer и сбрасывается на Clear preview);
- сохранение пиксельных данных выделенной области на диск (регион
  хранится исключительно как четыре числа);
- мобильная версия;
- cloud sync;
- auto-update;
- code signing для инсталляторов.

Permanently out of scope (никогда):

- captcha / antibot bypass;
- ad-click automation;
- автоматизация против банковских / платёжных / защищённых приложений.

Полный список — [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md).

---

## 6. Installation

Требуется Node.js 18+ и npm.

```bash
git clone https://github.com/Citrus-cloud/Mine.git clickflow
cd clickflow
npm install
npm start
```

---

## 7. Development

```bash
npm start        # запустить приложение через Electron
npm run dev      # то же, оставлено для совместимости
npm run pack     # unpacked build (electron-builder --dir)
npm run dist     # инсталлятор / DMG / AppImage
npm run smoke    # статическая smoke-проверка (без Electron)
```

Архитектурные правила и safety review gate — в
[`CONTRIBUTING.md`](./CONTRIBUTING.md).
PR-шаблон и issue-шаблоны — в `.github/`.

---

## 8. Packaging

```bash
npm run pack     # unpacked build для smoke-тестов
npm run dist     # релизные артефакты в dist/
```

Конфигурация: `package.json → build`. Build resources: `assets/`.
Подробности — [`docs/PACKAGING.md`](./docs/PACKAGING.md).

---

## 9. Project structure

```
.
├── main.js                       # Electron main process, IPC, menu, tray, hotkeys
├── preload.js                    # contextBridge — единственная IPC-поверхность
├── package.json                  # name "clickflow", version 0.1.0, build config
├── README.md
├── CHANGELOG.md
├── RELEASE_NOTES.md
├── CONTRIBUTING.md
├── PROJECT_CONTEXT.md
├── assets/
│   ├── README.md
│   └── icons/
│       ├── README.md
│       └── clickflow-icon.svg    # локальный SVG, без внешних ссылок
├── docs/
│   ├── ACTION_SCHEMA.md
│   ├── AUDIT_LOG_PLAN.md
│   ├── BETA_TESTING_GUIDE.md
│   ├── DESKTOP_ADAPTER_PLAN.md
│   ├── FEATURE_FLAGS.md
│   ├── FINAL_BETA_REVIEW.md
│   ├── KNOWN_LIMITATIONS.md
│   ├── MVP_CHECKLIST.md
│   ├── PACKAGING.md
│   ├── PRIVACY.md
│   ├── REAL_ACTIONS_GO_NO_GO.md
│   ├── ROADMAP.md
│   ├── SECURITY_CHECKLIST.md
│   ├── SMOKE_TESTS.md
│   └── TEST_PLAN.md
├── prompts/
│   └── step-05.md
├── scripts/
│   ├── README.md
│   └── smoke-check.js
├── src/
│   ├── action-pipeline.js
│   ├── adapter-registry.js
│   ├── app-state.js
│   ├── audit-events.js
│   ├── click-engine.js
│   ├── desktop-adapter-interface.js
│   ├── error-manager.js
│   ├── feature-flags.js
│   ├── i18n.js
│   ├── index.html
│   ├── logger.js
│   ├── mock-desktop-adapter.js
│   ├── profile-manager.js
│   ├── real-action-sandbox.js
│   ├── renderer.js
│   ├── safety-gates.js
│   ├── scenario-manager.js
│   ├── settings-manager.js
│   └── styles.css
└── .github/
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.md
    │   ├── feature_request.md
    │   └── safety_report.md
    └── pull_request_template.md
```

---

## 10. Documentation

- [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) — что вошло в 0.1.0-beta.
- [`CHANGELOG.md`](./CHANGELOG.md) — история изменений.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — как разрабатывать без
  нарушения safety-модели.
- [`docs/FINAL_BETA_REVIEW.md`](./docs/FINAL_BETA_REVIEW.md) —
  финальный go/no-go review beta-MVP (Step 15).
- [`docs/BETA_TESTING_GUIDE.md`](./docs/BETA_TESTING_GUIDE.md) —
  гид для beta-тестера.
- [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md) —
  что не реализовано и что **никогда** не будет реализовано.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — что планируется дальше.
- [`docs/REAL_ACTIONS_GO_NO_GO.md`](./docs/REAL_ACTIONS_GO_NO_GO.md)
  — обязательный checklist перед любой будущей реализацией реальных
  desktop-кликов.
- [`docs/FEATURE_FLAGS.md`](./docs/FEATURE_FLAGS.md) — слой
  feature-flags и safe defaults.
- [`docs/AUDIT_LOG_PLAN.md`](./docs/AUDIT_LOG_PLAN.md) — design-only
  план audit-логов.
- [`docs/PRIVACY.md`](./docs/PRIVACY.md) — что хранится локально,
  что не отправляется в сеть.
- [`docs/ADAPTER_INTERFACE.md`](./docs/ADAPTER_INTERFACE.md) — контракт desktop adapter, описание mock adapter и блокировки real adapter (Step 18).
- [`docs/REAL_ACTION_SANDBOX.md`](./docs/REAL_ACTION_SANDBOX.md) — sandbox для будущего real adapter, dry-run preview, permission checklist, blocked reasons (Step 19).
- [`docs/BETA_QA_REPORT.md`](./docs/BETA_QA_REPORT.md) — финальный QA-отчёт перед beta-релизом (Step 20).
- [`docs/I18N_CHECKLIST.md`](./docs/I18N_CHECKLIST.md) — manual checklist для review RU/EN-локализации (Step 20).
- [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md) — обязательный чеклист перед публикацией GitHub-тэга (Step 21).
- [`docs/BUILD_ARTIFACTS.md`](./docs/BUILD_ARTIFACTS.md) — описание выходных артефактов `pack`/`dist` и naming-схема для GitHub release assets (Step 21).
- [`docs/GITHUB_RELEASE_DRAFT.md`](./docs/GITHUB_RELEASE_DRAFT.md) — готовый текст для GitHub Release `v0.1.0-beta` (Step 21).
- [`docs/VERSIONING.md`](./docs/VERSIONING.md) — semver-подход и план будущих линий релизов (Step 21).
- [`docs/RELEASE_FINAL_CHECK.md`](./docs/RELEASE_FINAL_CHECK.md) — короткий pre-tag sign-off для maintainer'а (Step 22).
- [`docs/TAG_AND_RELEASE_GUIDE.md`](./docs/TAG_AND_RELEASE_GUIDE.md) — manual git/GitHub-команды для публикации pre-release (Step 22).
- [`docs/RELEASE_BLOCKERS.md`](./docs/RELEASE_BLOCKERS.md) — текущий список release blockers (на конец Step 23 — пусто после автоматических проверок).
- [`docs/PACKAGED_APP_QA.md`](./docs/PACKAGED_APP_QA.md) — manual checklist для проверки собранного приложения после `npm run pack` / `npm run dist` (Step 23).
- [`docs/FINAL_RELEASE_SUMMARY.md`](./docs/FINAL_RELEASE_SUMMARY.md) — single-page snapshot финального beta release (Step 24).
- [`docs/PRE_RELEASE_CHECKLIST.md`](./docs/PRE_RELEASE_CHECKLIST.md) — manual checklist перед тэгом (Step 24).
- [`docs/RELEASE_TAG_PLAN.md`](./docs/RELEASE_TAG_PLAN.md) — manual git/GitHub command sequence для tag/push/publish (Step 24).
- [`docs/RELEASE_COMMIT_MESSAGE.md`](./docs/RELEASE_COMMIT_MESSAGE.md) — recommended commit message для release-prep commit (Step 24).
- [`docs/TEMPLATE_ASSETS.md`](./docs/TEMPLATE_ASSETS.md) — описание Template Asset Manager: модель хранения, формат метаданных, privacy/safety-инварианты, что **не** реализовано, planned `image_click` (Step 27).
- [`docs/TEMPLATE_MATCHING_MOCK.md`](./docs/TEMPLATE_MATCHING_MOCK.md) — описание Template Matching Mock / Dry-run: входной формат, mock result, action preview, safety-инварианты, что **не** реализовано (Step 28).
- [`docs/TEMPLATE_MATCHING_ENGINE.md`](./docs/TEMPLATE_MATCHING_ENGINE.md) — описание Real Template Matching Engine Foundation: алгоритм plain-JS, threshold/step контролы, region scoping, performance limits, что **не** реализовано (Step 29).
- [`docs/IMAGE_CLICK_SCENARIO.md`](./docs/IMAGE_CLICK_SCENARIO.md) — описание Image Click Scenario Type Foundation: формат сценария, обязательный шаблон, опциональная область, threshold/step, execution flow, simulation-only invariants, что **не** реализовано (Step 30).
- [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./docs/IMAGE_CLICK_TEST_TOOLS.md) — описание Image Click Test Tools: Test Match flow, debug overlay, action preview, troubleshooting, safety notes (Step 31).
- [`docs/OCR_FOUNDATION.md`](./docs/OCR_FOUNDATION.md) — описание OCR Foundation: mock OCR flow, input/result format, `text_click` action preview, region support, future Tesseract integration, safety notes (Step 32).
- [`docs/TEXT_CLICK_SCENARIO.md`](./docs/TEXT_CLICK_SCENARIO.md) — описание Text Click Scenario Type Foundation: формат сценария, target text, OCR settings, optional region, execution flow, simulation-only invariants, что **не** реализовано (Step 33).
- [`docs/TEXT_CLICK_TEST_TOOLS.md`](./docs/TEXT_CLICK_TEST_TOOLS.md) — описание Text Click Test Tools: Test OCR flow, OCR blocks overlay, action preview, troubleshooting, safety notes (Step 34).
- [`docs/SMART_FEATURES_QA.md`](./docs/SMART_FEATURES_QA.md) — manual QA checklist на всю smart-features цепочку: Screen Capture → Region → Templates → Matching → Image Click → OCR Mock → Text Click → Visual Builder → Scenario Presets, плюс Safety checks, Known issues, Release recommendation (Step 37).
- [`docs/NEXT_BRANCH_PLAN.md`](./docs/NEXT_BRANCH_PLAN.md) — план следующих больших веток: Branch A (Real OCR Integration), Branch B (Real Desktop Adapter), Branch C (Android Research). Рекомендация: сначала Branch A (Step 37).
- [`docs/SMART_FEATURES_LIMITATIONS.md`](./docs/SMART_FEATURES_LIMITATIONS.md) — консолидированный список ограничений smart-features: screen capture permissions, simple matching engine, mock OCR, simulation-only image_click / text_click, Visual Builder foundation, scenario drafts require manual save, no real click (Step 37).
- [`docs/REAL_OCR_INTEGRATION_PLAN.md`](./docs/REAL_OCR_INTEGRATION_PLAN.md) — план будущей интеграции настоящего OCR: Tesseract.js, language packs, worker model, performance, privacy, security, UI progress, fallback. Real OCR на шаге 38 НЕ запускается (Step 38).
- [`docs/OCR_PROVIDER_INTERFACE.md`](./docs/OCR_PROVIDER_INTERFACE.md) — формальный контракт OCR-провайдера: input/output shape, error IDs, registry, mock provider, planned Tesseract provider, self-test, safety rules (Step 38). Дополнен Step-39-секцией с Tesseract implementation notes.
- [`docs/TESSERACT_PROVIDER.md`](./docs/TESSERACT_PROVIDER.md) — справка по Tesseract OCR provider: dependency, feature flags, why disabled by default, readiness, future activation plan, privacy/performance/safety (Step 39).
- [`docs/REAL_OCR_USAGE.md`](./docs/REAL_OCR_USAGE.md) — пользовательская инструкция по Real OCR (Steps 40-41): как включить Tesseract на сессию, как запустить настоящий OCR вручную, выбор провайдера в OCR tab / text_click форме / Visual Builder, что осталось simulation-only, троuble-shooting, известные ограничения (language data / cancellation / region cropping).
- [`docs/SMART_BETA_QA_REPORT.md`](./docs/SMART_BETA_QA_REPORT.md) — Step-42 audit + bugfix report: scope, environment, checked flows, results, known issues, blockers, safety verification, release recommendation.
- [`docs/SMART_BETA_MANUAL_TESTS.md`](./docs/SMART_BETA_MANUAL_TESTS.md) — manual QA checklist для smart beta: 15 секций (install / smoke / screen capture / region / templates / template matching / image_click / OCR mock / real OCR session / text_click / Visual Builder / presets / diagnostics / safety / packaging) с `Status: Not tested`.
- [`docs/SMART_BETA_RELEASE_NOTES.md`](./docs/SMART_BETA_RELEASE_NOTES.md) — full smart-beta release notes (Step 43).
- [`docs/SMART_BETA_RELEASE_CHECKLIST.md`](./docs/SMART_BETA_RELEASE_CHECKLIST.md) — engineering / packaging / QA sign-off для `v0.2.0-smart-beta`.
- [`docs/SMART_BETA_RELEASE_DRAFT.md`](./docs/SMART_BETA_RELEASE_DRAFT.md) — body для GitHub release editor.
- [`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md) —
  Electron-security и UI-security.
- [`docs/PACKAGING.md`](./docs/PACKAGING.md) — упаковка и
  electron-builder.
- [`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) — быстрая проверка
  перед релизом, включая `npm run smoke`.
- [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) — расширенный
  тест-план.
- [`docs/MVP_CHECKLIST.md`](./docs/MVP_CHECKLIST.md) — статус MVP.
- [`docs/DESKTOP_ADAPTER_PLAN.md`](./docs/DESKTOP_ADAPTER_PLAN.md)
  и [`docs/ACTION_SCHEMA.md`](./docs/ACTION_SCHEMA.md) — будущий
  адаптер реального ввода (за safety-гейтом).
- [`scripts/README.md`](./scripts/README.md) — правила для
  репозиторных helper-скриптов.

---

## 11. Roadmap

- `0.1.x` — beta polish, accessibility audit, smoke harness, code
  signing notes, finalized icons.
- `0.2.x` — улучшения профилей и шаблонов, более богатый импорт /
  экспорт, лучшая обработка ошибок.
- `0.3.x` — прототип desktop action adapter **за safety-гейтом**,
  с обязательным user confirmation, audit-логами и kill switch.
- Будущие исследования (не привязаны к релизу) — OCR, image
  recognition, mobile companion (только локально).

Полный план — [`docs/ROADMAP.md`](./docs/ROADMAP.md).

---

## 12. Development history

| Шаг | Тема | Главное |
|-----|------|---------|
| 1 | Bootstrap | Базовый Electron-проект. |
| 2 | State | `app-state`, `logger`, `scenario-manager`. |
| 3 | Сценарии CRUD | Create / edit / delete; IPC сохранение. |
| 4 | Engine | Безопасный `click-engine` (имитация), прогресс. |
| 5 | UX | Настройки, i18n RU/EN, hotkeys, safety. |
| 6 | Advanced | Dashboard (7 вкладок). |
| 7 | Data ops | Импорт / экспорт, профили. |
| 8 | Resilience | `error-manager`, диагностика. |
| 9 | Stabilization | Test plan, MVP checklist, accessibility. |
| 10 | Adapter docs | `DESKTOP_ADAPTER_PLAN`, `ACTION_SCHEMA`, readiness. |
| 11 | OS integration | Глобальные горячие клавиши, меню, tray, lifecycle. |
| 12 | Packaging | `electron-builder`, packaging & security docs. |
| 13 | Beta polish | UI / dark theme / assets / структура CSS. |
| 14 | Release prep | Этот release-каркас. |
| 15 | Final stabilization | `npm run smoke`, Beta health, JSON corruption guard, `FINAL_BETA_REVIEW`. |
| 16 | Handoff design | Feature flags, go/no-go, audit log plan, privacy doc. |
| 17 | Action pipeline | `action-pipeline.js`, `safety-gates.js`, `audit-events.js` (in-memory). Real actions blocked. |
| 18 | Adapter interface | `desktop-adapter-interface.js`, `mock-desktop-adapter.js`, `adapter-registry.js`. Mock active. Real adapter blocked. |
| 19 | Real-action sandbox | `real-action-sandbox.js`. Dry-run preview, permission checklist, blocked reasons. No real execution. |
| 20 | Final beta QA | Structural audit (0 dup ids, perfect i18n parity 342/342), expanded smoke-check (96 checks), `BETA_QA_REPORT.md`, `I18N_CHECKLIST.md`. Manual testing required before tag. |
| 21 | Beta release packaging pass | `.gitignore`, extended package.json `build` block, `RELEASE_CHECKLIST.md`, `BUILD_ARTIFACTS.md`, `GITHUB_RELEASE_DRAFT.md`, `VERSIONING.md`, Release status diagnostics, smoke-check at 113 checks. |
| 22 | GitHub beta release finalization | `docs/RELEASE_FINAL_CHECK.md`, `docs/TAG_AND_RELEASE_GUIDE.md`, finalized `RELEASE_NOTES.md` / `GITHUB_RELEASE_DRAFT.md`, expanded Release status card, smoke-check at 137 checks. Tag and publication remain manual. |
| 23 | Post-pack QA and release blocker pass | `docs/RELEASE_BLOCKERS.md`, `docs/PACKAGED_APP_QA.md`, expanded Release status card (14 rows, 2 new rows), smoke-check at 168 checks. Manual packaged-app QA remains the last gate. |
| 24 | Final beta release preparation | `docs/FINAL_RELEASE_SUMMARY.md`, `docs/PRE_RELEASE_CHECKLIST.md`, `docs/RELEASE_TAG_PLAN.md`, `docs/RELEASE_COMMIT_MESSAGE.md`, expanded Release status card (18 rows + ready-for-pre-release-after-manual-QA badge), smoke-check at 193 checks. Tag and publication remain manual; explicit list of forbidden commit body lines. |
| 25 | Screen Capture Foundation | Three IPC handlers via `desktopCapturer`, safe `window.clickflow.screenCapture` preload API, `screen-capture-client.js`, `screen-capture-ui.js` (new Advanced → Screen Capture tab with safety notice, sources grid with thumbnails, preview card), `appState.screenCapture` slice, six new audit-event types, compact Screen capture status diagnostics card, 24 RU + EN i18n keys, `docs/SCREEN_CAPTURE.md`. Screenshots never written to disk. **Real clicks / OCR / image recognition / template matching / OpenCV / robotjs / nut.js / iohook still absent.** |
| 26 | Region Selector Foundation | Pure-logic `region-selector.js` (`createRegion`, `validateRegion`, `scaleRegionToImage` / `scaleRegionToPreview`, `getRegionArea`, `formatRegion`, `createEmptyRegionState`), `region-selector-ui.js` (drag overlay; mousemove/mouseup bound only during drag), `appState.regionSelector` slice + 8 mutators, optional `scenario.settings.region` via new scenario-manager helpers (`validateRegionSettings`, `updateScenarioRegion`, `clearScenarioRegion`; old scenarios untouched), six new audit-event types, compact Region selector status diagnostics card + new `Region selector: …` line in Copy diagnostics, 22 RU + EN i18n keys, `docs/REGION_SELECTOR.md`. **Real clicks / OCR / image matching still absent.** |
| 27 | Template Asset Manager | New `main/template-assets.js` with five `templates:*` IPC handlers (`load` / `import-image` / `save-metadata` / `delete` / `reset`) + `templates:get-stats`; png/jpg/jpeg/webp allow-list with magic-bytes verification, ≤16 MiB cap, header-only width/height parsing; `userData/templates/templates.json` + `userData/templates/images/` storage. `preload.js` `window.clickflow.templates`. New `src/template-manager.js` and `src/template-ui.js`. `appState.templates` slice + 5 mutators. Eight new `template.*` audit-event types. New 9th Advanced tab **Templates / Шаблоны** + compact **Image templates** diagnostics card + new `Templates: …` line in Copy diagnostics. 27 new RU + EN i18n keys. `docs/TEMPLATE_ASSETS.md`. **Image matching / OCR / template matching / real clicks / OpenCV / robotjs / nut.js / iohook / sharp / jimp / pixelmatch still absent. Templates are stored ASSETS only.** |
| 28 | Template Matching Mock / Dry-run | New `src/template-matching-mock.js` (pure-logic: `createTemplateMatchInput`, `validateTemplateMatchInput`, `runMockTemplateMatch`, `createMockMatchResult`, `getMockTargetPoint`, `createImageClickActionPreview`, `clearMockMatchResult`, `getTemplateMatchingMockStatus`) and `src/template-matching-ui.js` (`renderTemplateMatchingTab`, `buildTemplateMatchInputFromState`, `runTemplateMatchingMock`, `clearTemplateMatchingMockResult`, `renderTemplateMatchingRequirements`, `renderTemplateMatchingInputSummary`, `renderTemplateMatchingResult`, `renderTemplateMatchingOverlay`, `renderActionPreview`). `appState.templateMatching` slice + 6 mutators. Five new `template.match.mock.*` / `image.click.preview.created` audit-event types. New 10th Advanced tab **Template Matching / Поиск шаблона** with mock notice, requirements checklist, input summary, Run / Clear buttons, visual overlay (bounding box + target point + dashed region) on top of the screen-capture preview, result card, and an `image_click` action-preview JSON block (rendered via `<pre>.textContent`, never executed). New compact **Template matching (mock)** diagnostics card + new `Template matching mock: …` line in Copy diagnostics. 27 new RU + EN i18n keys. `docs/TEMPLATE_MATCHING_MOCK.md`. **No real image matching, no OCR, no real clicks, no OpenCV, no `image_click` scenario execution. The matcher is pure metadata math — it never decodes a single pixel.** |
| 29 | Real Template Matching Engine Foundation | New `src/template-matching-engine.js` (plain-JS template matching over `ImageData` — `loadImageFromDataUrl`, `imageToCanvas`, `getImageDataFromDataUrl`, `cropImageData`, `resizeImageDataIfNeeded`, `runTemplateMatch`, `findBestMatch`, `calculatePatchScore`, `createTemplateMatchResult`, `getTemplateMatchEngineStatus`, `estimateSearchCost`). Mock mode from Step 28 is **kept**. New `Match mode` selector (Mock / Real preview), Threshold input (default `0.75`), Step selector (`1 / 2 / 4 / 8 / 16`, default `4`). `appState.templateMatching` gains `mode` / `threshold` / `step` + three setters; `_cloneTemplateMatchResult` carries the new `threshold / durationMs / step / pixelStep / scannedPositions / downscaledSearch / downscaledTemplate` fields. Five new audit-event types (`template.match.realPreview.requested/completed/failed`, `template.match.lowConfidence`, `template.match.engine.warning`). Real-preview overlay: solid green bbox for matches, dashed bbox for "best candidate" low-confidence runs. Diagnostics card gains `Match mode`, `Threshold`, `Step`, `Duration`, `Engine available`, `Search region used`; `Copy diagnostics` carries a broader `Template matching: …` line including `mode`, `threshold`, `step`, `engineAvailable`, `lastDurationMs`, `lastMode`, `ocrImplemented=false`, `opencvAvailable=false`, `matcherImplemented=true`, `imageClickScenarioImplemented=false`. 27 new RU + EN i18n keys. `docs/TEMPLATE_MATCHING_ENGINE.md`. **The engine analyses the captured preview, NOT the live screen. No real cursor movement, no real click, no OCR, no OpenCV / opencv.js / opencv-js / sharp / jimp / pixelmatch / looks-same / robotjs / nut.js / iohook / uiohook-napi. The `image_click` action preview is still rendered as text only and never reaches the click engine.** |
| 30 | Image Click Scenario Type Foundation | `src/scenario-manager.js` gains `validateImageClickScenario`, `createImageClickScenario`, `updateImageClickScenario`, `getScenariosByType`. `createScenario` / `updateScenario` dispatch on `type` so simple_click stays untouched. `src/click-engine.js` gains `runImageClickScenario` (capture → match → simulated `image_click` action; respects `stopEngine`, `safetySettings`). `src/action-pipeline.js` learns the `image_click` action shape; `validateAction` accepts it; `executeAction` routes it through the simulate path; `realClick: true` is rejected outright. `src/safety-gates.js` mirrors the validation. New scenario form **Scenario type** select (Coordinate click / Image click) + image_click section with template select, region summary + Use selected region / Clear region buttons, threshold (default `0.75`), step (`1 / 2 / 4 / 8`, default `4`), timeout (`>=1000`, default `10000`), interval (`>=100`, default `1000`), repeat (`1..1000`, default `1`). Logs / progress / `lastAction` understand both types via the new `formatLastAction(action)`. New 9 audit-event types (`scenario.imageClick.started / stopped / match.started / match.completed / noMatch / simulated / failed`, `action.imageClick.simulated`, `action.imageClick.realBlocked`). Diagnostics card **image_click scenario** + new `Image click scenario: imageClickScenariosCount=…, lastImageClickStatus=…, lastImageClickConfidence=…, lastImageClickTargetPoint=…, imageClickSimulationOnly=true, realImageClickEnabled=false, ocrImplemented=false` line in Copy diagnostics. 26 new RU + EN i18n keys. `docs/IMAGE_CLICK_SCENARIO.md`. **simple_click scenarios unchanged. No real cursor movement, no real click, no OCR, no OpenCV. `realClick: true` on `image_click` is always blocked.** |

---

## 13. License

MIT. См. поле `license` в [`package.json`](./package.json).
