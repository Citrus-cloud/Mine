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

- Линия: `0.1.x` (beta polish + release prep).
- Версия: **`0.1.0-beta`**.
- Состояние: simulation-only MVP, готов к публичному beta-тестированию.
- Последние шаги развития:
  - Шаг 13 — визуальная полировка, дизайн-токены, тёмная тема,
    `assets/`.
  - Шаг 14 — `CHANGELOG`, `RELEASE_NOTES`, `CONTRIBUTING`,
    GitHub-шаблоны, beta-гид, известные ограничения, roadmap.

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
экспорт, readiness-чеклист desktop-адаптера.

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
│   ├── BETA_TESTING_GUIDE.md
│   ├── DESKTOP_ADAPTER_PLAN.md
│   ├── KNOWN_LIMITATIONS.md
│   ├── MVP_CHECKLIST.md
│   ├── PACKAGING.md
│   ├── ROADMAP.md
│   ├── SECURITY_CHECKLIST.md
│   ├── SMOKE_TESTS.md
│   └── TEST_PLAN.md
├── prompts/
│   └── step-05.md
├── src/
│   ├── app-state.js
│   ├── click-engine.js
│   ├── error-manager.js
│   ├── i18n.js
│   ├── index.html
│   ├── logger.js
│   ├── profile-manager.js
│   ├── renderer.js
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
- [`docs/BETA_TESTING_GUIDE.md`](./docs/BETA_TESTING_GUIDE.md) —
  гид для beta-тестера.
- [`docs/KNOWN_LIMITATIONS.md`](./docs/KNOWN_LIMITATIONS.md) —
  что не реализовано и что **никогда** не будет реализовано.
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — что планируется дальше.
- [`docs/SECURITY_CHECKLIST.md`](./docs/SECURITY_CHECKLIST.md) —
  Electron-security и UI-security.
- [`docs/PACKAGING.md`](./docs/PACKAGING.md) — упаковка и
  electron-builder.
- [`docs/SMOKE_TESTS.md`](./docs/SMOKE_TESTS.md) — быстрая проверка
  перед релизом.
- [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) — расширенный
  тест-план.
- [`docs/MVP_CHECKLIST.md`](./docs/MVP_CHECKLIST.md) — статус MVP.
- [`docs/DESKTOP_ADAPTER_PLAN.md`](./docs/DESKTOP_ADAPTER_PLAN.md)
  и [`docs/ACTION_SCHEMA.md`](./docs/ACTION_SCHEMA.md) — будущий
  адаптер реального ввода (за safety-гейтом).

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

---

## 13. License

MIT. См. поле `license` в [`package.json`](./package.json).
