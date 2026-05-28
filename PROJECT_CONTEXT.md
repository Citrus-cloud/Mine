# PROJECT_CONTEXT.md — ClickFlow

## Что такое ClickFlow

Минималистичный кроссплатформенный кликер и визуальный автоматизатор. Electron + JavaScript. Без фреймворков.

## Текущий шаг

Шаг 12 завершён.

## Стек

- JavaScript (ES2020+), Electron 28+, HTML/CSS, Node.js (main process)
- electron-builder для упаковки
- Нет сборщиков для dev (script tags)

## Архитектурные правила

1. contextIsolation: true, nodeIntegration: false — всегда
2. Renderer → Node.js только через preload.js (contextBridge)
3. Глобальные горячие клавиши через main process (globalShortcut)
4. Системное меню через Menu (main process)
5. Tray через main process
6. File dialogs через main process
7. Renderer получает команды от menu/hotkeys/tray через IPC events
8. Main отслеживает execution status для quit confirmation
9. Все тексты через i18n (data-i18n)
10. DOM-безопасность: textContent only
11. Главный экран 520px, advanced 720px

## Важные ограничения

- НЕТ реальных системных кликов
- НЕТ OCR, OpenCV
- НЕТ мобильной версии
- nodeIntegration ВСЕГДА false
- Desktop adapter задокументирован, но НЕ реализован

## История шагов

| Шаг | Что сделано |
|-----|-------------|
| 1 | Базовый Electron-проект |
| 2 | app-state, logger, scenario-manager |
| 3 | CRUD сценариев, IPC сохранение |
| 4 | click-engine (имитация), прогресс |
| 5 | Настройки, i18n, hotkeys, safety |
| 6 | Advanced dashboard (7 вкладок) |
| 7 | Import/export, profiles |
| 8 | error-manager, diagnostics |
| 9 | TEST_PLAN, MVP_CHECKLIST, accessibility |
| 10 | DESKTOP_ADAPTER_PLAN, ACTION_SCHEMA, readiness |
| 11 | globalShortcut, Menu, Tray, lifecycle |
| 12 | electron-builder, PACKAGING, SECURITY_CHECKLIST, SMOKE_TESTS, system info |

## Шаг 13 (план)

- Полноценная тёмная тема
- Notification system
- Auto-update framework
- Desktop adapter prototype
