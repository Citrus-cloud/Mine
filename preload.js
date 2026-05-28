const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickflow', {
  appName: 'ClickFlow',
  version: '0.1.0',
  scenarios: {
    load: () => ipcRenderer.invoke('scenarios:load'),
    save: (scenarios) => ipcRenderer.invoke('scenarios:save', scenarios),
    reset: () => ipcRenderer.invoke('scenarios:reset')
  }
});
