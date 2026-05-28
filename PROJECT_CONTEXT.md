# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный автоматизатор. Electron + JavaScript. Без фреймворков (React/Vue/Angular).

## Текущий шаг

Шаг 8 завершён.

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
6. Файлы сохраняются в `app.getPath('userData')`.
7. Все пользовательские тексты — через систему локализации (data-i18n).
8. DOM-безопасность: createElement + textContent.
9. Главный экран минималистичный (520px), advanced mode шире (720px).
10. Системные file dialogs только через main process (dialog.showSaveDialog/showOpenDialog).
11. Hotkeys работают внутри окна приложения. Глобальные hotkeys пока не реализованы.

## Важные ограничения

- НЕТ реальных системных кликов (robotjs, nut.js, iohook запрещены).
- НЕТ OCR, OpenCV, распознавания изображений.
- НЕТ мобильной версии.
- НЕТ React/Vue/Angular.
- nodeIntegration ВСЕГДА false.

## История шагов

| Шаг | Что сделано |
|-----|-------------|
| 1 | Базовый Electron-проект, окно, Start/Stop, preload |
| 2 | app-state, logger, scenario-manager, логи на экране |
| 3 | CRUD сценариев, список, форма, IPC сохранение |
| 4 | click-engine (имитация), прогресс, остановка |
| 5 | Настройки, i18n RU/EN, горячие клавиши, emergency stop, safety limits |
| 6 | Advanced dashboard (7 вкладок), полные логи, фильтрация, safety-панель, future-карточки |
| 7 | Импорт/экспорт сценариев, backup, профили, импорт/экспорт настроек |
| 8 | error-manager, диагностика, улучшенные hotkeys, подготовка к desktop adapter |

## Шаг 9 (план)

- Тестирование пользовательских сценариев
- UI-polish
- Accessibility improvements
- Глобальные горячие клавиши через main process
- Подготовка к desktop action adapter (без реальных кликов)
