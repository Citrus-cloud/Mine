// Менеджер настроек ClickFlow

function getDefaultSettings() {
  return {
    language: "ru",
    theme: "system",
    hotkeys: {
      start: "Ctrl+Alt+S",
      stop: "Ctrl+Alt+X",
      emergencyStop: "Escape"
    },
    safety: {
      safeMode: true,
      emergencyStopEnabled: true,
      minIntervalMs: 50,
      maxRepeatCount: 100000
    }
  };
}

function normalizeSettings(settings) {
  const defaults = getDefaultSettings();
  if (!settings || typeof settings !== 'object') return defaults;

  const validLangs = ['ru', 'en'];
  const validThemes = ['system', 'light', 'dark'];

  const language = validLangs.includes(settings.language) ? settings.language : defaults.language;
  const theme = validThemes.includes(settings.theme) ? settings.theme : defaults.theme;

  const hotkeys = {
    start: (settings.hotkeys && settings.hotkeys.start) || defaults.hotkeys.start,
    stop: (settings.hotkeys && settings.hotkeys.stop) || defaults.hotkeys.stop,
    emergencyStop: (settings.hotkeys && settings.hotkeys.emergencyStop) || defaults.hotkeys.emergencyStop
  };

  let minIntervalMs = defaults.safety.minIntervalMs;
  let maxRepeatCount = defaults.safety.maxRepeatCount;
  let safeMode = defaults.safety.safeMode;
  let emergencyStopEnabled = defaults.safety.emergencyStopEnabled;

  if (settings.safety && typeof settings.safety === 'object') {
    if (typeof settings.safety.minIntervalMs === 'number') {
      minIntervalMs = Math.max(50, settings.safety.minIntervalMs);
    }
    if (typeof settings.safety.maxRepeatCount === 'number') {
      maxRepeatCount = Math.min(100000, Math.max(1, settings.safety.maxRepeatCount));
    }
    if (typeof settings.safety.safeMode === 'boolean') {
      safeMode = settings.safety.safeMode;
    }
    if (typeof settings.safety.emergencyStopEnabled === 'boolean') {
      emergencyStopEnabled = settings.safety.emergencyStopEnabled;
    }
  }

  return {
    language,
    theme,
    hotkeys,
    safety: { safeMode, emergencyStopEnabled, minIntervalMs, maxRepeatCount }
  };
}

async function loadSettings() {
  let corrupted = false;
  try {
    const result = await window.clickflow.settings.load();
    if (result && result.corrupted) corrupted = true;
    if (result.success && result.data) {
      const out = normalizeSettings(result.data);
      out.__corrupted = corrupted;
      return out;
    }
  } catch (e) {}
  const defaults = getDefaultSettings();
  defaults.__corrupted = corrupted;
  return defaults;
}

async function saveSettings(settings) {
  const normalized = normalizeSettings(settings);
  return await window.clickflow.settings.save(normalized);
}

async function resetSettings() {
  return await window.clickflow.settings.reset();
}
