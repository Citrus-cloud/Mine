// Модуль локализации ClickFlow

const translations = {
  ru: {
    // Главный экран
    appTitle: "ClickFlow",
    appDescription: "Минималистичный кликер для быстрых сценариев",
    status: "Статус",
    running: "Работает",
    stopped: "Остановлен",
    scenario: "Сценарий",
    start: "Start",
    stop: "Stop",
    chooseScenario: "Выбрать сценарий",
    advancedMode: "Расширенный режим",
    settings: "Настройки",
    latestEvents: "Последние события",
    safeModeEnabled: "Безопасный режим включён",
    progress: "Прогресс",
    lastAction: "Последнее действие",
    none: "нет",
    noEvents: "Нет событий",

    // Сценарии
    scenariosTitle: "Сценарии",
    scenariosDescription: "Выберите сценарий для быстрого запуска",
    createScenario: "+ Создать сценарий",
    back: "← Назад",
    select: "Выбрать",
    edit: "Изменить",
    delete: "Удалить",
    defaultBadge: "базовый",
    noScenarios: "Нет сценариев",

    // Форма сценария
    createScenarioTitle: "Создать сценарий",
    editScenarioTitle: "Редактировать сценарий",
    scenarioName: "Название",
    scenarioDescription: "Описание",
    scenarioX: "X",
    scenarioY: "Y",
    intervalMs: "Интервал, мс",
    repeatCount: "Повторы",
    mouseButton: "Кнопка мыши",
    mouseLeft: "Левая (left)",
    mouseRight: "Правая (right)",
    mouseMiddle: "Средняя (middle)",
    save: "Сохранить",
    cancel: "Отмена",

    // Расширенный режим
    advancedTitle: "Расширенный режим",
    advancedDescription: "Панель управления и мониторинга ClickFlow",
    advancedPlaceholder: "Этот раздел находится в разработке.",

    // Вкладки advanced
    tabOverview: "Обзор",
    tabScenarios: "Сценарии",
    tabExecution: "Выполнение",
    tabLogs: "Логи",
    tabSettings: "Настройки",
    tabSafety: "Безопасность",
    tabFuture: "Будущее",

    // Overview
    activeScenario: "Активный сценарий",
    executionStatus: "Статус выполнения",
    settingsSummary: "Сводка настроек",
    statistics: "Статистика",
    recentEvents: "Последние события",
    scenarioCount: "Сценариев",
    logCount: "Записей в логе",
    noData: "Нет данных",
    type: "Тип",
    coordinates: "Координаты",
    interval: "Интервал",
    repeats: "Повторы",

    // Scenarios tab
    openScenarioList: "Открыть список сценариев",

    // Execution tab
    executionMode: "Режим выполнения",
    simulationMode: "Имитация",
    startedAt: "Начало",
    finishedAt: "Завершение",

    // Logs tab
    fullLogs: "Полный журнал",
    clearLogs: "Очистить логи",
    logFilterAll: "Все",
    logFilterInfo: "Инфо",
    logFilterSuccess: "Успех",
    logFilterWarning: "Внимание",
    logFilterError: "Ошибки",
    noLogs: "Нет записей",

    // Settings tab
    openSettings: "Открыть настройки",

    // Safety tab
    safetyOverview: "Обзор безопасности",
    simulationModeNotice: "ClickFlow сейчас работает в безопасном режиме имитации. Реальные системные клики пока не реализованы.",

    // Future tab
    futureFeatures: "Будущие возможности",
    planned: "Запланировано",
    ocrTextDetection: "OCR-распознавание текста",
    imageRecognition: "Распознавание изображений",
    visualActionBuilder: "Визуальный конструктор действий",
    realDesktopClicks: "Реальные desktop-клики",
    globalHotkeysPlanned: "Глобальные горячие клавиши",
    desktopActionAdapter: "Desktop action adapter",

    // Настройки
    settingsTitle: "Настройки",
    interfaceSection: "Интерфейс",
    language: "Язык",
    langRu: "Русский",
    langEn: "English",
    theme: "Тема",
    themeSystem: "Системная",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    hotkeysSection: "Горячие клавиши",
    hotkeyStart: "Запуск",
    hotkeyStop: "Остановка",
    hotkeyEmergency: "Аварийная остановка",
    safetySection: "Безопасность",
    safeMode: "Безопасный режим",
    emergencyStop: "Аварийная остановка",
    enabled: "включён",
    disabled: "выключен",
    minInterval: "Мин. интервал (мс)",
    maxRepeats: "Макс. повторов",
    saveSettings: "Сохранить",

    // Логи
    logAppReady: "Приложение готово",
    logScenarioStarted: "Сценарий запущен",
    logScenarioStopped: "Сценарий остановлен пользователем",
    logScenarioComplete: "Сценарий завершён",
    logEmergencyStop: "Аварийная остановка",
    logAlreadyRunning: "Сценарий уже выполняется",
    logNoScenario: "Активный сценарий не найден",
    logNoActiveStop: "Нет активного сценария для остановки",
    logStopping: "Остановка сценария...",
    logSettingsSaved: "Настройки сохранены",
    logLanguageChanged: "Язык изменён",
    logScenariosOpened: "Открыт список сценариев",
    logAdvancedOpened: "Открыт расширенный режим",
    logMainOpened: "Открыто главное меню",
    logSettingsOpened: "Открыты настройки",

    // Импорт/экспорт (Step 7)
    importExport: "Импорт/экспорт",
    exportSelected: "Экспорт выбранного",
    exportAll: "Экспорт всех",
    exportCustom: "Экспорт пользовательских",
    backupScenarios: "Резервная копия",
    importScenarios: "Импорт сценариев",
    importPreview: "Предварительный просмотр",
    confirmImport: "Подтвердить импорт",
    cancelImport: "Отмена",
    importedScenarios: "Сценарии импортированы",
    exportedScenarios: "Сценарии экспортированы",
    operationCancelled: "Операция отменена",
    invalidImportFile: "Неверный формат файла",
    conflictDetected: "Обнаружены конфликты имён",
    scenariosToImport: "Сценариев для импорта",

    // Профили (Step 7)
    profiles: "Профили",
    activeProfile: "Активный профиль",
    createProfile: "Создать профиль",
    editProfile: "Изменить профиль",
    deleteProfile: "Удалить профиль",
    profileName: "Название профиля",
    profileDescription: "Описание профиля",
    profileScenarioCount: "Сценариев в профиле",
    allProfiles: "Все профили",
    defaultProfile: "Основной",
    workProfile: "Работа",
    testingProfile: "Тестирование",
    personalProfile: "Личное",
    profileCount: "Профилей",
    confirmDeleteProfile: "Удалить профиль?",

    // Настройки backup (Step 7)
    exportSettings: "Экспорт настроек",
    importSettings: "Импорт настроек",
    resetSettings: "Сброс настроек",
    settingsExported: "Настройки экспортированы",
    settingsImported: "Настройки импортированы",
    settingsReset: "Настройки сброшены",
    confirmResetSettings: "Сбросить настройки?",
    confirmImportSettings: "Импортировать настройки?",

    // Горячие клавиши (Step 8)
    hotkeysFocusedOnly: "Горячие клавиши работают, когда окно ClickFlow активно. Глобальные горячие клавиши будут добавлены позже.",
    emergencyStopHint: "Escape мгновенно останавливает выполнение",

    // Ошибки и диагностика (Step 8)
    diagnostics: "Диагностика",
    copyDiagnostics: "Скопировать диагностику",
    diagnosticsCopied: "Диагностика скопирована",
    diagnosticsCopyFailed: "Не удалось скопировать",
    errorHistory: "История ошибок",
    clearErrors: "Очистить ошибки",
    noErrors: "Нет ошибок",
    errorCount: "Ошибок",
    settingsLoaded: "Настройки загружены",
    scenariosLoaded: "Сценарии загружены",
    profilesLoaded: "Профили загружены",
    currentView: "Текущий вид",
    executionRunning: "Выполнение",

    // Future (Step 8)
    simulationOnly: "Только имитация",
    notImplemented: "Не реализовано",
    confirmClearLogs: "Очистить все логи?",

    // Steps 9-10: Readiness, accessibility, UX
    desktopAdapterReadiness: "Готовность desktop adapter",
    readinessChecklist: "Чеклист готовности",
    safeModeEnabledCheck: "Безопасный режим включён",
    emergencyStopEnabledCheck: "Аварийная остановка включена",
    safetyLimitsConfigured: "Лимиты безопасности настроены",
    userConfirmationRequired: "Требуется подтверждение пользователя",
    simulationModeActive: "Режим имитации активен",
    adapterNotInstalled: "Адаптер не установлен",
    realClicksNotImplemented: "Реальные клики не реализованы",
    auditLogsPlanned: "Аудит-логи запланированы",
    osPermissionsPlanned: "Разрешения ОС запланированы",
    ready: "Готово",
    missing: "Отсутствует",
    fieldRequired: "Обязательное поле",
    minValueHint: "Мин: ",
    maxValueHint: "Макс: ",
    safetyLimitHint: "Ограничено настройками безопасности",
    formHasErrors: "Форма содержит ошибки",
    testPlan: "Тест-план",
    mvpChecklist: "MVP чеклист",
    documentation: "Документация",
    statusUpdated: "Статус обновлён",
    executionModeSimulation: "Режим: только имитация",
    realModePlanned: "Реальный режим запланирован",

    // Steps 11-12: Global hotkeys, menu, tray, packaging
    globalHotkeys: "Глобальные горячие клавиши",
    registerHotkeys: "Зарегистрировать",
    unregisterHotkeys: "Отключить",
    refreshHotkeyStatus: "Обновить статус",
    hotkeyRegistered: "Горячие клавиши зарегистрированы",
    hotkeyRegistrationFailed: "Не удалось зарегистрировать",
    hotkeyUnregistered: "Горячие клавиши отключены",
    hotkeyStatus: "Статус горячих клавиш",
    globalHotkeysEnabled: "Глобальные клавиши активны",
    globalHotkeysDisabled: "Глобальные клавиши неактивны",
    startHotkey: "Запуск: CmdOrCtrl+Alt+S",
    stopHotkey: "Остановка: CmdOrCtrl+Alt+X",
    emergencyHotkey: "Аварийная: CmdOrCtrl+Alt+E",
    aboutClickFlow: "О ClickFlow",
    simulationOnlyMvp: "Безопасный MVP — только имитация",
    safetyNotice: "ClickFlow работает в режиме имитации. Реальные клики не реализованы. Не используйте автоматизацию для обхода правил, капчи или защищённых приложений.",
    trayAvailable: "Tray доступен",
    trayUnavailable: "Tray недоступен",
    showApp: "Показать",
    quitApp: "Выход",
    confirmBeforeQuit: "Подтверждение перед выходом",
    quitWhileRunning: "Сценарий выполняется. Выйти?",
    noActiveExecution: "Нет активного выполнения",
    electronVersion: "Electron",
    platformInfo: "Платформа",
    isPackaged: "Упакован",
    systemInfo: "Системная информация",
    packaging: "Упаковка",
    packagingReady: "Готовность упаковки",

    // Steps 13-14: Beta polish & release
    beta: "Бета",
    release: "Релиз",
    betaVersion: "0.1.0-beta",
    simulationBadge: "Режим имитации",
    safeBadge: "Безопасный режим",
    readyStatus: "Готово",
    appReady: "Приложение готово",
    packagingStatus: "Упаковка готова",
    knownLimitations: "Известные ограничения",
    roadmap: "Roadmap",
    releaseNotes: "Заметки к релизу",
    changelog: "История изменений",
    contributing: "Контрибьютинг",
    noRealClicks: "Реальные клики не реализованы",
    simulationOnlyShort: "Только имитация",
    yes: "да",
    no: "нет"
  },
  en: {
    // Main screen
    appTitle: "ClickFlow",
    appDescription: "Minimal clicker for quick scenarios",
    status: "Status",
    running: "Running",
    stopped: "Stopped",
    scenario: "Scenario",
    start: "Start",
    stop: "Stop",
    chooseScenario: "Choose scenario",
    advancedMode: "Advanced mode",
    settings: "Settings",
    latestEvents: "Latest events",
    safeModeEnabled: "Safe mode enabled",
    progress: "Progress",
    lastAction: "Last action",
    none: "none",
    noEvents: "No events",

    // Scenarios
    scenariosTitle: "Scenarios",
    scenariosDescription: "Choose a scenario for quick launch",
    createScenario: "+ Create scenario",
    back: "← Back",
    select: "Select",
    edit: "Edit",
    delete: "Delete",
    defaultBadge: "default",
    noScenarios: "No scenarios",

    // Scenario form
    createScenarioTitle: "Create scenario",
    editScenarioTitle: "Edit scenario",
    scenarioName: "Name",
    scenarioDescription: "Description",
    scenarioX: "X",
    scenarioY: "Y",
    intervalMs: "Interval, ms",
    repeatCount: "Repeats",
    mouseButton: "Mouse button",
    mouseLeft: "Left",
    mouseRight: "Right",
    mouseMiddle: "Middle",
    save: "Save",
    cancel: "Cancel",

    // Advanced mode
    advancedTitle: "Advanced mode",
    advancedDescription: "ClickFlow control and monitoring panel",
    advancedPlaceholder: "This section is under development.",

    // Advanced tabs
    tabOverview: "Overview",
    tabScenarios: "Scenarios",
    tabExecution: "Execution",
    tabLogs: "Logs",
    tabSettings: "Settings",
    tabSafety: "Safety",
    tabFuture: "Future",

    // Overview
    activeScenario: "Active scenario",
    executionStatus: "Execution status",
    settingsSummary: "Settings summary",
    statistics: "Statistics",
    recentEvents: "Recent events",
    scenarioCount: "Scenarios",
    logCount: "Log entries",
    noData: "No data",
    type: "Type",
    coordinates: "Coordinates",
    interval: "Interval",
    repeats: "Repeats",

    // Scenarios tab
    openScenarioList: "Open scenario list",

    // Execution tab
    executionMode: "Execution mode",
    simulationMode: "Simulation",
    startedAt: "Started at",
    finishedAt: "Finished at",

    // Logs tab
    fullLogs: "Full log",
    clearLogs: "Clear logs",
    logFilterAll: "All",
    logFilterInfo: "Info",
    logFilterSuccess: "Success",
    logFilterWarning: "Warning",
    logFilterError: "Error",
    noLogs: "No entries",

    // Settings tab
    openSettings: "Open settings",

    // Safety tab
    safetyOverview: "Safety overview",
    simulationModeNotice: "ClickFlow currently runs in safe simulation mode. Real system clicks are not implemented yet.",

    // Future tab
    futureFeatures: "Future features",
    planned: "Planned",
    ocrTextDetection: "OCR text detection",
    imageRecognition: "Image recognition",
    visualActionBuilder: "Visual action builder",
    realDesktopClicks: "Real desktop clicks",
    globalHotkeysPlanned: "Global hotkeys",
    desktopActionAdapter: "Desktop action adapter",

    // Settings
    settingsTitle: "Settings",
    interfaceSection: "Interface",
    language: "Language",
    langRu: "Русский",
    langEn: "English",
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    hotkeysSection: "Hotkeys",
    hotkeyStart: "Start",
    hotkeyStop: "Stop",
    hotkeyEmergency: "Emergency stop",
    safetySection: "Safety",
    safeMode: "Safe mode",
    emergencyStop: "Emergency stop",
    enabled: "enabled",
    disabled: "disabled",
    minInterval: "Min interval (ms)",
    maxRepeats: "Max repeats",
    saveSettings: "Save",

    // Logs
    logAppReady: "Application ready",
    logScenarioStarted: "Scenario started",
    logScenarioStopped: "Scenario stopped by user",
    logScenarioComplete: "Scenario complete",
    logEmergencyStop: "Emergency stop",
    logAlreadyRunning: "Scenario already running",
    logNoScenario: "Active scenario not found",
    logNoActiveStop: "No active scenario to stop",
    logStopping: "Stopping scenario...",
    logSettingsSaved: "Settings saved",
    logLanguageChanged: "Language changed",
    logScenariosOpened: "Scenario list opened",
    logAdvancedOpened: "Advanced mode opened",
    logMainOpened: "Main menu opened",
    logSettingsOpened: "Settings opened",

    // Import/export (Step 7)
    importExport: "Import/export",
    exportSelected: "Export selected",
    exportAll: "Export all",
    exportCustom: "Export custom",
    backupScenarios: "Backup",
    importScenarios: "Import scenarios",
    importPreview: "Import preview",
    confirmImport: "Confirm import",
    cancelImport: "Cancel",
    importedScenarios: "Scenarios imported",
    exportedScenarios: "Scenarios exported",
    operationCancelled: "Operation cancelled",
    invalidImportFile: "Invalid file format",
    conflictDetected: "Name conflicts detected",
    scenariosToImport: "Scenarios to import",

    // Profiles (Step 7)
    profiles: "Profiles",
    activeProfile: "Active profile",
    createProfile: "Create profile",
    editProfile: "Edit profile",
    deleteProfile: "Delete profile",
    profileName: "Profile name",
    profileDescription: "Profile description",
    profileScenarioCount: "Scenarios in profile",
    allProfiles: "All profiles",
    defaultProfile: "Default",
    workProfile: "Work",
    testingProfile: "Testing",
    personalProfile: "Personal",
    profileCount: "Profiles",
    confirmDeleteProfile: "Delete this profile?",

    // Settings backup (Step 7)
    exportSettings: "Export settings",
    importSettings: "Import settings",
    resetSettings: "Reset settings",
    settingsExported: "Settings exported",
    settingsImported: "Settings imported",
    settingsReset: "Settings reset",
    confirmResetSettings: "Reset settings to defaults?",
    confirmImportSettings: "Import these settings?",

    // Hotkeys (Step 8)
    hotkeysFocusedOnly: "Hotkeys work while the ClickFlow window is focused. Global hotkeys will be added later.",
    emergencyStopHint: "Escape instantly stops execution",

    // Errors and diagnostics (Step 8)
    diagnostics: "Diagnostics",
    copyDiagnostics: "Copy diagnostics",
    diagnosticsCopied: "Diagnostics copied",
    diagnosticsCopyFailed: "Copy failed",
    errorHistory: "Error history",
    clearErrors: "Clear errors",
    noErrors: "No errors",
    errorCount: "Errors",
    settingsLoaded: "Settings loaded",
    scenariosLoaded: "Scenarios loaded",
    profilesLoaded: "Profiles loaded",
    currentView: "Current view",
    executionRunning: "Execution",

    // Future (Step 8)
    simulationOnly: "Simulation only",
    notImplemented: "Not implemented",
    confirmClearLogs: "Clear all logs?",

    // Steps 9-10: Readiness, accessibility, UX
    desktopAdapterReadiness: "Desktop adapter readiness",
    readinessChecklist: "Readiness checklist",
    safeModeEnabledCheck: "Safe mode enabled",
    emergencyStopEnabledCheck: "Emergency stop enabled",
    safetyLimitsConfigured: "Safety limits configured",
    userConfirmationRequired: "User confirmation required",
    simulationModeActive: "Simulation mode active",
    adapterNotInstalled: "Adapter not installed",
    realClicksNotImplemented: "Real clicks not implemented",
    auditLogsPlanned: "Audit logs planned",
    osPermissionsPlanned: "OS permissions planned",
    ready: "Ready",
    missing: "Missing",
    fieldRequired: "Required field",
    minValueHint: "Min: ",
    maxValueHint: "Max: ",
    safetyLimitHint: "Limited by safety settings",
    formHasErrors: "Form has errors",
    testPlan: "Test plan",
    mvpChecklist: "MVP checklist",
    documentation: "Documentation",
    statusUpdated: "Status updated",
    executionModeSimulation: "Mode: simulation only",
    realModePlanned: "Real mode planned",

    // Steps 11-12: Global hotkeys, menu, tray, packaging
    globalHotkeys: "Global hotkeys",
    registerHotkeys: "Register",
    unregisterHotkeys: "Unregister",
    refreshHotkeyStatus: "Refresh status",
    hotkeyRegistered: "Hotkeys registered",
    hotkeyRegistrationFailed: "Registration failed",
    hotkeyUnregistered: "Hotkeys unregistered",
    hotkeyStatus: "Hotkey status",
    globalHotkeysEnabled: "Global hotkeys active",
    globalHotkeysDisabled: "Global hotkeys inactive",
    startHotkey: "Start: CmdOrCtrl+Alt+S",
    stopHotkey: "Stop: CmdOrCtrl+Alt+X",
    emergencyHotkey: "Emergency: CmdOrCtrl+Alt+E",
    aboutClickFlow: "About ClickFlow",
    simulationOnlyMvp: "Safe MVP — simulation only",
    safetyNotice: "ClickFlow runs in simulation mode. Real clicks are not implemented. Do not use automation to bypass rules, captcha, or protected applications.",
    trayAvailable: "Tray available",
    trayUnavailable: "Tray unavailable",
    showApp: "Show",
    quitApp: "Quit",
    confirmBeforeQuit: "Confirm before quit",
    quitWhileRunning: "Scenario is running. Quit anyway?",
    noActiveExecution: "No active execution",
    electronVersion: "Electron",
    platformInfo: "Platform",
    isPackaged: "Packaged",
    systemInfo: "System info",
    packaging: "Packaging",
    packagingReady: "Packaging ready",

    // Steps 13-14: Beta polish & release
    beta: "Beta",
    release: "Release",
    betaVersion: "0.1.0-beta",
    simulationBadge: "Simulation mode",
    safeBadge: "Safe mode",
    readyStatus: "Ready",
    appReady: "Application ready",
    packagingStatus: "Packaging ready",
    knownLimitations: "Known limitations",
    roadmap: "Roadmap",
    releaseNotes: "Release notes",
    changelog: "Changelog",
    contributing: "Contributing",
    noRealClicks: "Real clicks not implemented",
    simulationOnlyShort: "Simulation only",
    yes: "yes",
    no: "no"
  }
};

let currentLanguage = 'ru';

function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
  } else {
    currentLanguage = 'ru';
  }
}

function getLanguage() {
  return currentLanguage;
}

function t(key) {
  const dict = translations[currentLanguage] || translations['ru'];
  return dict[key] !== undefined ? dict[key] : key;
}

function getAvailableLanguages() {
  return Object.keys(translations);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}
