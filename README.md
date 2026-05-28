# ClickFlow

## Описание

**ClickFlow** — минималистичный кроссплатформенный кликер и визуальный автоматизатор для быстрых сценариев.

## Главная идея

- **Простое главное меню**: выбрать сценарий → Start → Stop.
- **Расширенный режим**: dashboard с вкладками для сложных функций.
- **Быстрый запуск**: пользователь сразу видит сценарий и кнопку запуска.
- **Два языка**: русский и английский.

## Текущий статус

Проект на шаге 8. Реализованы: система сценариев, импорт/экспорт, профили, безопасный движок (имитация), настройки, локализация RU/EN, горячие клавиши, диагностика, error manager. Реальных системных кликов нет — приложение работает в режиме имитации.

## Как запустить

```bash
npm install
npm start
```

## Структура проекта

```
clickflow/
  package.json
  main.js                  — Electron main process, IPC (scenarios/settings/profiles + export/import)
  preload.js               — contextBridge API
  README.md
  PROJECT_CONTEXT.md
  src/
    index.html             — 5 views: main, scenarios, scenarioForm, settings, advanced
    styles.css             — CSS-переменные, минимализм, dashboard
    renderer.js            — UI, advanced dashboard, import/export, profiles, diagnostics
    app-state.js           — состояние приложения
    logger.js              — логирование
    error-manager.js       — ошибки и диагностика
    scenario-manager.js    — CRUD сценариев + import/export
    profile-manager.js     — профили сценариев
    click-engine.js        — безопасная имитация выполнения
    settings-manager.js    — настройки (load/save/normalize)
    i18n.js                — локализация RU/EN
```

## Горячие клавиши

| Комбинация | Действие |
|---|---|
| Ctrl+Alt+S | Запуск сценария |
| Ctrl+Alt+X | Остановка сценария |
| Escape | Аварийная остановка |

Горячие клавиши работают при активном окне ClickFlow.

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
- Экспорт сценариев (all/custom/backup) через Electron dialog.
- Импорт сценариев из JSON с preview и подтверждением.
- Обработка конфликтов id/name при импорте.
- Базовая система профилей (default, work, testing, personal).
- Сохранение профилей в userData/profiles.json.
- Экспорт/импорт/сброс настроек.
- Расширен preload API и IPC.

### Шаг 8 — Hotkeys, диагностика и устойчивость
- error-manager.js: история ошибок, reportError, clearErrorHistory.
- Диагностика: техническая сводка в Safety tab, copy diagnostics.
- Улучшенные hotkeys: не перехватываются при вводе в input/textarea.
- Emergency Stop работает из любого экрана, даже при фокусе в input.
- Подтверждения для опасных действий (confirm).
- Подготовка к будущему desktop action adapter (карточка в Future).
- ~60 новых ключей локализации.

## Следующий шаг

На **Шаге 9** планируется:
- Тестирование основных пользовательских сценариев
- UI-polish и accessibility
- Глобальные горячие клавиши через main process
- Подготовка к desktop action adapter
- Реальные клики только после отдельной проверки безопасности
