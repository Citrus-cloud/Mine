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

- Линия: `0.1.x` (beta polish + release prep + final stabilization + handoff design + safety hardening + adapter interface + dry-run sandbox + final beta QA + release packaging).
- Версия: **`0.1.0-beta`**.
- Состояние: simulation-only MVP, `0.1.0-beta packaging pass` готов; перед публикацией тэга `v0.1.0-beta` нужен ручной smoke-run по
  [`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) Step 20 и прохождение [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md).
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
Семь вкладок: Overview, Scenarios, Execution, Logs, Settings,
Safety, Future. Diagnostics, история ошибок, профили, импорт /
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
  (нет `robotjs`, `nut.js`, `iohook`);
- OCR;
- распознавание изображений / OpenCV;
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

---

## 13. License

MIT. См. поле `license` в [`package.json`](./package.json).
