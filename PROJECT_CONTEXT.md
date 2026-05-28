# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный автоматизатор. Electron + JavaScript. Без фреймворков (React/Vue/Angular).

## Текущий шаг

Шаг 10 завершён.

## Стек

- JavaScript (ES2020+)
- Electron 28+
- HTML/CSS (без препроцессоров)
- Node.js (main process)
- Нет сборщиков (webpack/vite) — используются script tags

## Архитектурные правила

1. **contextIsolation: true**, nodeIntegration: false — всегда.
2. Renderer не имеет доступа к Node.js — только через preload.js (contextBridge).
3. Файлы разделены по ответственности:
   - `app-state.js` — состояние
   - `logger.js` — логи
   - `error-manager.js` — ошибки и диагностика
   - `scenario-manager.js` — CRUD сценариев + импорт/экспорт
   - `profile-manager.js` — профили сценариев
   - `click-engine.js` — выполнение (имитация)
   - `settings-manager.js` — настройки
   - `i18n.js` — локализация
   - `renderer.js` — UI + связывание + advanced dashboard
4. Все функции глобальные (script tags, без ES modules).
5. IPC: scenarios (load/save/reset/export/import-file), settings (load/save/reset/export/import-file), profiles (load/save/reset).
6. Файлы данных в `app.getPath('userData')`.
7. Все пользовательские тексты — через систему локализации (data-i18n).
8. DOM-безопасность: createElement + textContent.
9. Главный экран минималистичный (520px), advanced mode шире (720px).
10. Системные file dialogs только через main process.
11. Hotkeys работают внутри окна. Глобальные hotkeys планируются через main process.
12. Тема: system/light/dark через `data-theme` на `<html>`.
13. Будущие desktop actions — только через main process + IPC, никогда напрямую из renderer.

## Важные ограничения

- НЕТ реальных системных кликов (robotjs, nut.js, iohook запрещены).
- НЕТ OCR, OpenCV, распознавания изображений.
- НЕТ мобильной версии.
- НЕТ React/Vue/Angular.
- nodeIntegration ВСЕГДА false.
- Desktop adapter задокументирован, но НЕ реализован.

## Документация

| Файл | Назначение |
|------|-----------|
| docs/TEST_PLAN.md | 26 ручных тестов |
| docs/MVP_CHECKLIST.md | Чеклист готовности MVP |
| docs/DESKTOP_ADAPTER_PLAN.md | Архитектура будущего desktop adapter |
| docs/ACTION_SCHEMA.md | Схема действий (click + 8 future types) |

## История шагов

| Шаг | Что сделано |
|-----|-------------|
| 1 | Базовый Electron-проект, окно, Start/Stop, preload |
| 2 | app-state, logger, scenario-manager, логи на экране |
| 3 | CRUD сценариев, список, форма, IPC сохранение |
| 4 | click-engine (имитация), прогресс, остановка |
| 5 | Настройки, i18n RU/EN, горячие клавиши, emergency stop, safety limits |
| 6 | Advanced dashboard (7 вкладок), полные логи, фильтрация, safety, future |
| 7 | Импорт/экспорт сценариев, backup, профили, импорт/экспорт настроек |
| 8 | error-manager, диагностика, улучшенные hotkeys, подготовка к desktop adapter |
| 9 | TEST_PLAN, MVP_CHECKLIST, accessibility, UX-polish, theme support, form hints |
| 10 | DESKTOP_ADAPTER_PLAN, ACTION_SCHEMA, readiness checklist, execution mode docs |

## Шаг 11 (план)

- Глобальные горячие клавиши (globalShortcut через main process)
- Системное меню приложения
- Tray icon
- Улучшение lifecycle
- Подготовка к упаковке (electron-builder)
- Real desktop clicks только после отдельной проверки безопасности
