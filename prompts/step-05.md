# Шаг 5 — Настройки, локализация и безопасность

## Краткое ТЗ

На шаге 5 нужно:

1. Добавить экран настроек приложения.
2. Реализовать переключение языка интерфейса RU/EN.
3. Создать систему локализации (src/i18n.js) без внешних библиотек.
4. Добавить горячие клавиши: Ctrl+Alt+S (Start), Ctrl+Alt+X (Stop), Escape (аварийная остановка).
5. Реализовать аварийную остановку (мгновенный stopEngine + сброс состояния).
6. Добавить безопасные лимиты выполнения (minIntervalMs, maxRepeatCount).
7. Сохранять настройки между перезапусками через IPC (settings.json в userData).
8. Все новые тексты интерфейса — через data-i18n.
9. Обновить README.md и создать PROJECT_CONTEXT.md.

## Ключевые файлы

- `src/i18n.js` — модуль локализации (translations, setLanguage, t, applyTranslations)
- `src/settings-manager.js` — менеджер настроек (load/save/reset/normalize)
- `src/app-state.js` — состояние с объектом settings
- `main.js` — IPC-обработчики settings:load/save/reset
- `preload.js` — window.clickflow.settings API
- `src/click-engine.js` — validateRunnableScenario с safetySettings
- `src/renderer.js` — init загружает настройки, hotkeys через keydown
- `src/index.html` — view-settings, data-i18n атрибуты

## Ограничения

- Нет реальных системных кликов.
- Нет OCR/OpenCV.
- Нет фреймворков.
- nodeIntegration: false, contextIsolation: true.
