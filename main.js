const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isExecutionRunning = false;
let globalHotkeysRegistered = false;

function getScenariosPath() { return path.join(app.getPath('userData'), 'scenarios.json'); }
function getSettingsPath() { return path.join(app.getPath('userData'), 'settings.json'); }
function getProfilesPath() { return path.join(app.getPath('userData'), 'profiles.json'); }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#f6f7f9',
    title: 'ClickFlow',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('close', (e) => {
    if (isExecutionRunning) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Quit', 'Cancel'],
        defaultId: 1,
        title: 'ClickFlow',
        message: 'A scenario is currently running. Quit anyway?'
      });
      if (choice === 1) { e.preventDefault(); return; }
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// --- App Menu ---
function buildAppMenu() {
  const template = [
    {
      label: 'ClickFlow',
      submenu: [
        { label: 'About ClickFlow', click: () => sendToRenderer('app-command:show-about') },
        { type: 'separator' },
        { label: 'Settings', click: () => sendToRenderer('app-command:open-settings') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Scenario',
      submenu: [
        { label: 'Start', click: () => sendToRenderer('app-command:start') },
        { label: 'Stop', click: () => sendToRenderer('app-command:stop') },
        { label: 'Emergency Stop', click: () => sendToRenderer('app-command:emergency-stop') },
        { type: 'separator' },
        { label: 'Open Scenarios', click: () => sendToRenderer('app-command:open-scenarios') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Main', click: () => sendToRenderer('app-command:open-main') },
        { label: 'Advanced', click: () => sendToRenderer('app-command:open-advanced') },
        { label: 'Settings', click: () => sendToRenderer('app-command:open-settings') },
        { type: 'separator' },
        { label: 'Reload', role: 'reload' },
        { label: 'Toggle DevTools', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Safety Notice', click: () => sendToRenderer('app-command:show-safety-notice') },
        { label: 'About', click: () => sendToRenderer('app-command:show-about') }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

// --- Global Hotkeys ---
function registerGlobalHotkeys() {
  try {
    globalShortcut.unregisterAll();
    const startOk = globalShortcut.register('CommandOrControl+Alt+S', () => {
      sendToRenderer('hotkey:start');
    });
    const stopOk = globalShortcut.register('CommandOrControl+Alt+X', () => {
      sendToRenderer('hotkey:stop');
    });
    const emergencyOk = globalShortcut.register('CommandOrControl+Alt+E', () => {
      sendToRenderer('hotkey:emergency-stop');
    });
    globalHotkeysRegistered = startOk && stopOk && emergencyOk;
    return { success: true, registered: globalHotkeysRegistered };
  } catch (err) {
    globalHotkeysRegistered = false;
    return { success: false, error: err.message };
  }
}

function unregisterGlobalHotkeys() {
  globalShortcut.unregisterAll();
  globalHotkeysRegistered = false;
  return { success: true };
}

ipcMain.handle('hotkeys:register', async () => registerGlobalHotkeys());
ipcMain.handle('hotkeys:unregister', async () => unregisterGlobalHotkeys());
ipcMain.handle('hotkeys:get-status', async () => ({
  registered: globalHotkeysRegistered,
  shortcuts: { start: 'CmdOrCtrl+Alt+S', stop: 'CmdOrCtrl+Alt+X', emergency: 'CmdOrCtrl+Alt+E' }
}));

// --- Tray ---
function createTray() {
  try {
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
    tray.setToolTip('ClickFlow');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show ClickFlow', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { type: 'separator' },
      { label: 'Start', click: () => sendToRenderer('app-command:start') },
      { label: 'Stop', click: () => sendToRenderer('app-command:stop') },
      { label: 'Emergency Stop', click: () => sendToRenderer('app-command:emergency-stop') },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setContextMenu(contextMenu);
  } catch (err) {
    tray = null;
  }
}

// --- IPC: System Info ---
ipcMain.handle('system:get-info', async () => ({
  appName: 'ClickFlow',
  appVersion: app.getVersion(),
  electronVersion: process.versions.electron,
  platform: process.platform,
  arch: process.arch,
  isPackaged: app.isPackaged,
  simulationOnly: true,
  globalHotkeysRegistered,
  trayAvailable: tray !== null
}));

// --- IPC: Beta health (Step 15) ---
// Returns runtime health flags about ClickFlow beta state.
// All paths checked here are *inside* the app installation (app.getAppPath()),
// not the user's home directory, so no private paths leak.
function fileExistsInApp(relPath) {
  try {
    const p = path.join(app.getAppPath(), relPath);
    return fs.existsSync(p);
  } catch (err) {
    return false;
  }
}

ipcMain.handle('system:get-beta-health', async () => {  // Hard-coded simulation guarantees — these reflect what the codebase ships.
  // They are NOT user-controllable feature flags.
  const simulationOnly = true;
  const realClicksImplemented = false;
  const ocrImplemented = false;
  const imageRecognitionImplemented = false;

  // Doc / config presence checks (paths relative to app dir, no user paths).
  const securityChecklistPresent = fileExistsInApp(path.join('docs', 'SECURITY_CHECKLIST.md'));
  const actionSchemaPresent      = fileExistsInApp(path.join('docs', 'ACTION_SCHEMA.md'));
  const knownLimitationsPresent  = fileExistsInApp(path.join('docs', 'KNOWN_LIMITATIONS.md'));
  const privacyPresent           = fileExistsInApp(path.join('docs', 'PRIVACY.md'));
  const goNoGoPresent            = fileExistsInApp(path.join('docs', 'REAL_ACTIONS_GO_NO_GO.md'));
  const featureFlagsDocPresent   = fileExistsInApp(path.join('docs', 'FEATURE_FLAGS.md'));
  const auditLogPlanPresent      = fileExistsInApp(path.join('docs', 'AUDIT_LOG_PLAN.md'));
  const finalReviewPresent       = fileExistsInApp(path.join('docs', 'FINAL_BETA_REVIEW.md'));

  const docsReady = securityChecklistPresent && actionSchemaPresent &&
    knownLimitationsPresent && privacyPresent && goNoGoPresent &&
    featureFlagsDocPresent && auditLogPlanPresent && finalReviewPresent;

  // Packaging is considered configured if package.json declares a `build` block.
  let packagingConfigured = false;
  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      packagingConfigured = !!(pkg && pkg.build && typeof pkg.build === 'object');
    }
  } catch (err) {
    packagingConfigured = false;
  }

  return {
    simulationOnly,
    realClicksImplemented,
    ocrImplemented,
    imageRecognitionImplemented,
    docsReady,
    packagingConfigured,
    securityChecklistPresent,
    actionSchemaPresent,
    knownLimitationsPresent,
    privacyPresent,
    goNoGoPresent,
    featureFlagsDocPresent,
    auditLogPlanPresent,
    finalReviewPresent
  };
});

// --- IPC: Release status (Step 21) ---
// Read-only structural check used by the Advanced > Safety
// "Release status" card. Reads only inside app.getAppPath();
// returns no private filesystem paths to the renderer.
ipcMain.handle('system:get-release-status', async () => {
  const smokeCheckScript = fileExistsInApp(path.join('scripts', 'smoke-check.js'));
  const releaseChecklistPresent  = fileExistsInApp(path.join('docs', 'RELEASE_CHECKLIST.md'));
  const buildArtifactsPresent    = fileExistsInApp(path.join('docs', 'BUILD_ARTIFACTS.md'));
  const githubReleaseDraftPresent = fileExistsInApp(path.join('docs', 'GITHUB_RELEASE_DRAFT.md'));
  const versioningPresent        = fileExistsInApp(path.join('docs', 'VERSIONING.md'));
  const changelogPresent         = fileExistsInApp('CHANGELOG.md');
  const releaseNotesPresent      = fileExistsInApp('RELEASE_NOTES.md');
  const gitignorePresent         = fileExistsInApp('.gitignore');
  // Step 22 docs
  const releaseFinalCheckPresent = fileExistsInApp(path.join('docs', 'RELEASE_FINAL_CHECK.md'));
  const tagAndReleaseGuidePresent = fileExistsInApp(path.join('docs', 'TAG_AND_RELEASE_GUIDE.md'));

  let appVersion = '?';
  let packagingConfigured = false;
  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      appVersion = pkg.version || '?';
      packagingConfigured = !!(pkg && pkg.build && typeof pkg.build === 'object' &&
        pkg.scripts && typeof pkg.scripts.pack === 'string' && typeof pkg.scripts.dist === 'string');
    }
  } catch (err) {
    appVersion = '?';
    packagingConfigured = false;
  }

  // Hard-coded simulation guarantees — these reflect what the build ships.
  const simulationOnly = true;
  const realActionsImplemented = false;
  const beta = true;

  // Aggregate readiness signal (used for the badge).
  const releaseDocsReady = releaseChecklistPresent &&
    buildArtifactsPresent && githubReleaseDraftPresent &&
    versioningPresent && changelogPresent && releaseNotesPresent &&
    smokeCheckScript && gitignorePresent &&
    releaseFinalCheckPresent && tagAndReleaseGuidePresent;

  // Step 22: separate aggregate for the "ready for manual release"
  // signal. We keep it separate from releaseDocsReady so a future
  // tightening (e.g. CI presence) can take effect without breaking
  // the existing badge.
  const readyForManualRelease = releaseDocsReady &&
    simulationOnly && !realActionsImplemented;

  return {
    appVersion,
    releaseTarget: '0.1.0-beta',
    beta,
    simulationOnly,
    realActionsImplemented,
    smokeCheckScript,
    packagingConfigured,
    releaseChecklistPresent,
    buildArtifactsPresent,
    githubReleaseDraftPresent,
    versioningPresent,
    changelogPresent,
    releaseNotesPresent,
    gitignorePresent,
    releaseFinalCheckPresent,
    tagAndReleaseGuidePresent,
    releaseDocsReady,
    readyForManualRelease
  };
});

// --- IPC: Execution status from renderer ---
ipcMain.handle('app-state:set-execution-running-status', async (event, running) => {
  isExecutionRunning = !!running;
  return { success: true };
});

// --- Helper: safe JSON load with corruption handling (Step 15) ---
// If the file exists but is unparseable, rename it to <file>.broken-<timestamp>
// so it is preserved (not overwritten on next save) and return data: null.
// Caller then falls back to defaults. The renderer can also see `corrupted`.
function safeLoadJsonFile(filePath, label) {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: true, data: null, corrupted: false };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
      const parsed = JSON.parse(raw);
      return { success: true, data: parsed, corrupted: false };
    } catch (parseErr) {
      // Quarantine the broken file so it isn't silently overwritten.
      let brokenPath = '';
      try {
        brokenPath = filePath + '.broken-' + Date.now();
        fs.renameSync(filePath, brokenPath);
      } catch (renameErr) {
        // If rename fails (e.g. permissions) — still don't crash. Fall back.
        brokenPath = '';
      }
      // We use console.warn here so we never crash. No PII is logged
      // (only the label and basename, never the full path).
      try { console.warn('[ClickFlow] corrupted ' + label + ' JSON, falling back to defaults'); } catch (e) {}
      return { success: true, data: null, corrupted: true, brokenFileName: brokenPath ? path.basename(brokenPath) : '' };
    }
  } catch (err) {
    return { success: false, error: 'Failed to load ' + label, corrupted: false };
  }
}

// --- IPC: Сценарии ---
ipcMain.handle('scenarios:load', async () => {
  return safeLoadJsonFile(getScenariosPath(), 'scenarios');
});

ipcMain.handle('scenarios:save', async (event, scenarios) => {
  try {
    if (!Array.isArray(scenarios)) return { success: false, error: 'Data must be an array' };
    fs.writeFileSync(getScenariosPath(), JSON.stringify(scenarios, null, 2), 'utf-8');
    return { success: true };
  } catch (err) { return { success: false, error: 'Failed to save scenarios' }; }
});

ipcMain.handle('scenarios:reset', async () => {
  try {
    const fp = getScenariosPath(); if (fs.existsSync(fp)) fs.unlinkSync(fp);
    return { success: true };
  } catch (err) { return { success: false, error: 'Failed to reset scenarios' }; }
});

ipcMain.handle('scenarios:export', async (event, options) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const defaultName = (options && options.mode === 'backup') ? `clickflow-backup-scenarios-${date}.json` : `clickflow-scenarios-${date}.json`;
    const result = await dialog.showSaveDialog(mainWindow, { title: 'Export Scenarios', defaultPath: defaultName, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (result.canceled) return { success: false, cancelled: true };
    const data = options && options.data;
    if (!data) return { success: false, error: 'No data provided' };
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) { return { success: false, error: 'Export failed' }; }
});

ipcMain.handle('scenarios:import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, { title: 'Import Scenarios', filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
    if (result.canceled) return { success: false, cancelled: true };
    const parsed = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
    if (!parsed || parsed.format !== 'clickflow-scenarios' || !Array.isArray(parsed.scenarios)) return { success: false, error: 'Invalid file format' };
    return { success: true, data: { scenarios: parsed.scenarios } };
  } catch (err) { return { success: false, error: 'Import failed: invalid JSON' }; }
});

// --- IPC: Настройки ---
ipcMain.handle('settings:load', async () => {
  return safeLoadJsonFile(getSettingsPath(), 'settings');
});

ipcMain.handle('settings:save', async (event, settings) => {
  try {
    if (!settings || typeof settings !== 'object') return { success: false, error: 'Invalid data' };
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (err) { return { success: false, error: 'Failed to save settings' }; }
});

ipcMain.handle('settings:reset', async () => {
  try { const fp = getSettingsPath(); if (fs.existsSync(fp)) fs.unlinkSync(fp); return { success: true }; }
  catch (err) { return { success: false, error: 'Failed to reset settings' }; }
});

ipcMain.handle('settings:export', async (event, data) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const result = await dialog.showSaveDialog(mainWindow, { title: 'Export Settings', defaultPath: `clickflow-settings-${date}.json`, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (result.canceled) return { success: false, cancelled: true };
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) { return { success: false, error: 'Export failed' }; }
});

ipcMain.handle('settings:import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, { title: 'Import Settings', filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
    if (result.canceled) return { success: false, cancelled: true };
    const parsed = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
    if (!parsed || parsed.format !== 'clickflow-settings') return { success: false, error: 'Invalid settings file' };
    return { success: true, data: parsed.settings };
  } catch (err) { return { success: false, error: 'Import failed' }; }
});

// --- IPC: Профили ---
ipcMain.handle('profiles:load', async () => {
  return safeLoadJsonFile(getProfilesPath(), 'profiles');
});

ipcMain.handle('profiles:save', async (event, data) => {
  try {
    if (!data || typeof data !== 'object') return { success: false, error: 'Invalid data' };
    fs.writeFileSync(getProfilesPath(), JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (err) { return { success: false, error: 'Failed to save profiles' }; }
});

ipcMain.handle('profiles:reset', async () => {
  try { const fp = getProfilesPath(); if (fs.existsSync(fp)) fs.unlinkSync(fp); return { success: true }; }
  catch (err) { return { success: false, error: 'Failed to reset profiles' }; }
});

// --- Lifecycle ---
app.whenReady().then(() => {
  createWindow();
  buildAppMenu();
  createTray();
  registerGlobalHotkeys();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
