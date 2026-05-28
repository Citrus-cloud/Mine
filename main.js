const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getScenariosPath() {
  return path.join(app.getPath('userData'), 'scenarios.json');
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function getProfilesPath() {
  return path.join(app.getPath('userData'), 'profiles.json');
}

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC: Сценарии ---

ipcMain.handle('scenarios:load', async () => {
  try {
    const filePath = getScenariosPath();
    if (!fs.existsSync(filePath)) return { success: true, data: null };
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(raw) };
  } catch (err) {
    return { success: false, error: 'Failed to load scenarios' };
  }
});

ipcMain.handle('scenarios:save', async (event, scenarios) => {
  try {
    if (!Array.isArray(scenarios)) return { success: false, error: 'Data must be an array' };
    fs.writeFileSync(getScenariosPath(), JSON.stringify(scenarios, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to save scenarios' };
  }
});

ipcMain.handle('scenarios:reset', async () => {
  try {
    const filePath = getScenariosPath();
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to reset scenarios' };
  }
});

ipcMain.handle('scenarios:export', async (event, options) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const defaultName = (options && options.mode === 'backup')
      ? `clickflow-backup-scenarios-${date}.json`
      : `clickflow-scenarios-${date}.json`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Scenarios',
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled) return { success: false, cancelled: true };

    const data = options && options.data;
    if (!data) return { success: false, error: 'No data provided' };

    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: 'Export failed' };
  }
});

ipcMain.handle('scenarios:import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Scenarios',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (result.canceled) return { success: false, cancelled: true };

    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const parsed = JSON.parse(raw);

    // Validate format
    if (!parsed || !parsed.format || parsed.format !== 'clickflow-scenarios') {
      return { success: false, error: 'Invalid file format' };
    }
    if (!Array.isArray(parsed.scenarios)) {
      return { success: false, error: 'No scenarios found in file' };
    }

    return { success: true, data: { scenarios: parsed.scenarios } };
  } catch (err) {
    return { success: false, error: 'Import failed: invalid JSON' };
  }
});

// --- IPC: Настройки ---

ipcMain.handle('settings:load', async () => {
  try {
    const filePath = getSettingsPath();
    if (!fs.existsSync(filePath)) return { success: true, data: null };
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(raw) };
  } catch (err) {
    return { success: false, error: 'Failed to load settings' };
  }
});

ipcMain.handle('settings:save', async (event, settings) => {
  try {
    if (!settings || typeof settings !== 'object') return { success: false, error: 'Data must be an object' };
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to save settings' };
  }
});

ipcMain.handle('settings:reset', async () => {
  try {
    const filePath = getSettingsPath();
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to reset settings' };
  }
});

ipcMain.handle('settings:export', async (event, data) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Settings',
      defaultPath: `clickflow-settings-${date}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (result.canceled) return { success: false, cancelled: true };
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: 'Export failed' };
  }
});

ipcMain.handle('settings:import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Settings',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (result.canceled) return { success: false, cancelled: true };
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.format !== 'clickflow-settings') {
      return { success: false, error: 'Invalid settings file format' };
    }
    return { success: true, data: parsed.settings };
  } catch (err) {
    return { success: false, error: 'Import failed: invalid JSON' };
  }
});

// --- IPC: Профили ---

ipcMain.handle('profiles:load', async () => {
  try {
    const filePath = getProfilesPath();
    if (!fs.existsSync(filePath)) return { success: true, data: null };
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(raw) };
  } catch (err) {
    return { success: false, error: 'Failed to load profiles' };
  }
});

ipcMain.handle('profiles:save', async (event, data) => {
  try {
    if (!data || typeof data !== 'object') return { success: false, error: 'Data must be an object' };
    fs.writeFileSync(getProfilesPath(), JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to save profiles' };
  }
});

ipcMain.handle('profiles:reset', async () => {
  try {
    const filePath = getProfilesPath();
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to reset profiles' };
  }
});

// --- Lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
