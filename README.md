# ClickFlow

## Описание

**ClickFlow** — минималистичный кроссплатформенный кликер и визуальный автоматизатор для быстрых сценариев.

## Главная идея

- **Простое главное меню**: выбрать сценарий → Start → Stop.
- **Расширенный режим**: dashboard с вкладками для сложных функций.
- **Быстрый запуск**: пользователь сразу видит сценарий и кнопку запуска.
- **Два языка**: русский и английский.

## Текущий статус

Проект на шаге 10. ClickFlow является безопасным MVP с имитацией выполнения. Реализованы: система сценариев, импорт/экспорт, профили, безопасный движок (simulation only), настройки, локализация RU/EN, горячие клавиши, диагностика, error manager, тест-план, MVP checklist, документация будущего desktop adapter. Реальных системных кликов нет. OCR/OpenCV/image recognition не реализованы.

## Как запустить

```bash
npm install
npm start
```

## Структура проекта

```
clickflow/
  package.json
  main.js                  — Electron main process, IPC
  preload.js               — contextBridge API
  README.md
  PROJECT_CONTEXT.md
  docs/
    TEST_PLAN.md           — ручной тест-план (26 тестов)
    MVP_CHECKLIST.md       — чеклист готовности MVP
    DESKTOP_ADAPTER_PLAN.md — архитектура будущего desktop adapter
    ACTION_SCHEMA.md       — схема действий (текущих и будущих)
  src/
    index.html             — 5 views: main, scenarios, scenarioForm, settings, advanced
    styles.css             — CSS-переменные, минимализм, dark theme, accessibility
    renderer.js            — UI, advanced dashboard, readiness checklist
    app-state.js           — состояние приложения
    logger.js              — логирование
    error-manager.js       — ошибки и диагностика
    scenario-manager.js    — CRUD сценариев + import/export
    profile-manager.js     — профили сценариев
    click-engine.js        — безопасная имитация выполнения
    settings-manager.js    — настройки (load/save/normalize)
    i18n.js                — локализация RU/EN (~240 ключей)
```

## Горячие клавиши

| Комбинация | Действие |
|---|---|
| Ctrl+Alt+S | Запуск сценария |
| Ctrl+Alt+X | Остановка сценария |
| Escape | Аварийная остановка |

Горячие клавиши работают при активном окне ClickFlow. Глобальные горячие клавиши запланированы на будущее.

## История разработки

### Шаг 1 — Базовый Electron-проект
- Окно, Start/Stop, preload, contextIsolation.

### Шаг 2 — Состояние, логи, база сценариев
- app-state.js, logger.js, scenario-manager.js, блок логов.

### Шаг 3 — Управление сценариями
- Список, создание, редактирование, удаление, IPC-сохранение.

### Шаг 4 — Безопасный движок выполнения
- click-engine.js, имитация, прогресс, остановка, защита от повторного запуска.

### Шаг 5 — Настройки, локализация, безопасность
- i18n RU/EN, экран настроек, горячие клавиши, emergency stop, safety limits.

### Шаг 6 — Расширенный режим
- Dashboard с 7 вкладками: Overview, Scenarios, Execution, Logs, Settings, Safety, Future.

### Шаг 7 — Импорт, экспорт, backup и профили
- Экспорт/импорт сценариев через Electron dialog.
- Preview и подтверждение импорта, обработка конфликтов.
- Профили сценариев (default, work, testing, personal).
- Экспорт/импорт/сброс настроек.

### Шаг 8 — Hotkeys, диагностика и устойчивость
- error-manager.js, история ошибок, diagnostics с copy.
- Улучшенные hotkeys (не перехватываются при вводе).
- Emergency Stop из любого экрана.
- Подтверждения для опасных действий.

### Шаг 9 — Стабилизация, тест-план и UX-polish
- Добавлен docs/TEST_PLAN.md (26 ручных тестов).
- Добавлен docs/MVP_CHECKLIST.md (12 разделов).
- Улучшена доступность: focus-visible, aria-поддержка, contrast.
- Улучшены формы: подсказки по лимитам, focus стили.
- Минимальная поддержка тем: system/light/dark через data-theme.
- Базовая проверка безопасности renderer/preload/main.

### Шаг 10 — Подготовка к desktop adapter
- Добавлен docs/DESKTOP_ADAPTER_PLAN.md (execution flow, security, rollback).
- Добавлен docs/ACTION_SCHEMA.md (click + 8 будущих типов).
- Readiness checklist в advanced dashboard (Future tab).
- Execution mode: simulation only (real mode planned/disabled).
- Описан audit log concept.
- ~30 новых ключей локализации.

## Следующий шаг

На **Шаге 11** планируется:
- Глобальные горячие клавиши через main process (globalShortcut)
- Системное меню приложения
- Tray icon
- Улучшение lifecycle
- Подготовка к упаковке (electron-builder)
- Реальные desktop clicks — только после отдельного шага безопасности
