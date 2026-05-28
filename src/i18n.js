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
    advancedDescription: "Здесь позже появятся сценарии, OCR, изображения, логи и безопасность.",
    advancedPlaceholder: "Этот раздел находится в разработке.",

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
    logSettingsOpened: "Открыты настройки"
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
    advancedDescription: "Scenarios, OCR, images, logs and security will appear here later.",
    advancedPlaceholder: "This section is under development.",

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
    logSettingsOpened: "Settings opened"
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
  // Обновить элементы с data-i18n (textContent)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Обновить placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}
