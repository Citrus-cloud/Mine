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

- Линия: `0.1.x` (beta polish + release prep + final stabilization + handoff design + safety hardening + adapter interface + dry-run sandbox + final beta QA + release packaging + release finalization + post-pack QA + final beta release preparation + screen capture foundation + region selector foundation + template asset manager + template matching mock).
- Версия: **`0.1.0-beta`**.
- Состояние: simulation-only MVP, **v0.1.0-beta pre-release preparation готов** + добавлены read-only **Screen Capture Foundation** (Step 25 — preview only), **Region Selector Foundation** (Step 26 — rectangular selection on the preview), **Template Asset Manager** (Step 27 — image assets storage only) и **Template Matching Mock / Dry-run** (Step 28 — mock-only pipeline that combines all three foundations into a bounding-box / target-point preview without ever decoding a pixel). Поиск шаблонов на скриншоте, OCR, image matching и реальные клики **по-прежнему не реализованы**.
  Перед публикацией тэга `v0.1.0-beta` обязательны:
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

ClickFlow `0.1.0-beta` — **simulation-only**. Сознательно отсутствуют:

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

---

## 13. License

MIT. См. поле `license` в [`package.json`](./package.json).
