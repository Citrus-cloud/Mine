# ClickFlow

## Описание

**ClickFlow** — минималистичный кроссплатформенный кликер и визуальный автоматизатор для быстрых сценариев.

## Текущий статус

Проект на шаге 12. Полноценный безопасный MVP с имитацией выполнения. Глобальные горячие клавиши, системное меню, tray, подготовка к упаковке. Реальных системных кликов нет.

## Как запустить

```bash
npm install
npm start
```

## Упаковка

```bash
npm run pack   # unpacked build
npm run dist   # installer
```

## Горячие клавиши

| Комбинация | Действие | Тип |
|---|---|---|
| CmdOrCtrl+Alt+S | Запуск сценария | Глобальная |
| CmdOrCtrl+Alt+X | Остановка | Глобальная |
| CmdOrCtrl+Alt+E | Аварийная остановка | Глобальная |
| Escape | Аварийная (в окне) | Локальная |

## История разработки

### Шаг 1 — Базовый Electron-проект
### Шаг 2 — Состояние, логи, база сценариев
### Шаг 3 — Управление сценариями
### Шаг 4 — Безопасный движок выполнения
### Шаг 5 — Настройки, локализация, безопасность
### Шаг 6 — Расширенный режим (dashboard)
### Шаг 7 — Импорт, экспорт, backup и профили
### Шаг 8 — Hotkeys, диагностика и устойчивость
### Шаг 9 — Стабилизация, тест-план, UX-polish
### Шаг 10 — Подготовка к desktop adapter (docs)

### Шаг 11 — Глобальные горячие клавиши и desktop-интеграция

- Глобальные горячие клавиши через Electron `globalShortcut` (main process)
- CmdOrCtrl+Alt+S (Start), CmdOrCtrl+Alt+X (Stop), CmdOrCtrl+Alt+E (Emergency)
- Системное меню (ClickFlow, Scenario, View, Help)
- Tray icon с контекстным меню (Show, Start, Stop, Emergency, Quit)
- Lifecycle: подтверждение выхода при работающем сценарии
- Renderer получает события от hotkeys и меню через безопасный IPC
- Main process отслеживает execution status для quit confirmation
- Register/Unregister/Status кнопки в Advanced → Safety

### Шаг 12 — Packaging и production readiness

- electron-builder добавлен (pack/dist scripts)
- Build config: Win (NSIS), Mac (DMG), Linux (AppImage)
- docs/PACKAGING.md — инструкция по сборке
- docs/SECURITY_CHECKLIST.md — проверка безопасности
- docs/SMOKE_TESTS.md — быстрые проверки перед релизом
- System info через IPC (Electron version, platform, arch, isPackaged)
- Расширенная диагностика в Advanced → Safety
- ~35 новых ключей локализации RU/EN

## Следующий шаг

На **Шаге 13** планируется:
- Полноценная тёмная тема
- Анимации и transitions
- Notification system
- Auto-update framework
- Desktop adapter prototype (simulation → real, с отдельной проверкой безопасности)
