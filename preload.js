const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clickflow', {
  appName: 'ClickFlow',
  version: '0.1.0',
  scenarios: {
    load: () => ipcRenderer.invoke('scenarios:load'),
    save: (scenarios) => ipcRenderer.invoke('scenarios:save', scenarios),
    reset: () => ipcRenderer.invoke('scenarios:reset'),
    export: (options) => ipcRenderer.invoke('scenarios:export', options),
    importFile: () => ipcRenderer.invoke('scenarios:import-file')
  },
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    reset: () => ipcRenderer.invoke('settings:reset'),
    export: (data) => ipcRenderer.invoke('settings:export', data),
    importFile: () => ipcRenderer.invoke('settings:import-file')
  },
  profiles: {
    load: () => ipcRenderer.invoke('profiles:load'),
    save: (data) => ipcRenderer.invoke('profiles:save', data),
    reset: () => ipcRenderer.invoke('profiles:reset')
  }
});
