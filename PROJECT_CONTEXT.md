# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный автоматизатор. Electron + JavaScript. Без фреймворков (React/Vue/Angular).

## Текущий шаг

Шаг 5 завершён.

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
   - `scenario-manager.js` — CRUD сценариев
   - `click-engine.js` — выполнение (сейчас имитация)
   - `settings-manager.js` — настройки
   - `i18n.js` — локализация
   - `renderer.js` — UI + связывание
4. Все функции глобальные (script tags, без ES modules).
5. IPC используется для: scenarios (load/save/reset), settings (load/save/reset).
6. Файлы сохраняются в `app.getPath('userData')`.
7. Все пользовательские тексты — через систему локализации (data-i18n).
8. DOM-безопасность: createElement + textContent (не innerHTML для пользовательских данных).

## Важные ограничения

- НЕТ реальных системных кликов (robotjs, nut.js, iohook запрещены до соответствующего шага).
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

## Шаг 6 (план)

- Расширенный режим с вкладками (Сценарии, Логи, Безопасность)
- Подготовка заглушек для OCR и изображений
