const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Путь к файлу сценариев в userData
function getScenariosPath() {
  return path.join(app.getPath('userData'), 'scenarios.json');
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

// --- IPC-обработчики для сценариев ---

ipcMain.handle('scenarios:load', async () => {
  try {
    const filePath = getScenariosPath();
    if (!fs.existsSync(filePath)) {
      return { success: true, data: null };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const scenarios = JSON.parse(raw);
    return { success: true, data: scenarios };
  } catch (err) {
    return { success: false, error: 'Не удалось загрузить сценарии' };
  }
});

ipcMain.handle('scenarios:save', async (event, scenarios) => {
  try {
    if (!Array.isArray(scenarios)) {
      return { success: false, error: 'Данные должны быть массивом' };
    }
    const filePath = getScenariosPath();
    fs.writeFileSync(filePath, JSON.stringify(scenarios, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Не удалось сохранить сценарии' };
  }
});

ipcMain.handle('scenarios:reset', async () => {
  try {
    const filePath = getScenariosPath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Не удалось сбросить сценарии' };
  }
});

// --- Lifecycle ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
