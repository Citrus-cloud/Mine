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
  },
  hotkeys: {
    register: () => ipcRenderer.invoke('hotkeys:register'),
    unregister: () => ipcRenderer.invoke('hotkeys:unregister'),
    getStatus: () => ipcRenderer.invoke('hotkeys:get-status'),
    onStart: (callback) => ipcRenderer.on('hotkey:start', callback),
    onStop: (callback) => ipcRenderer.on('hotkey:stop', callback),
    onEmergencyStop: (callback) => ipcRenderer.on('hotkey:emergency-stop', callback)
  },
  appCommands: {
    onStart: (cb) => ipcRenderer.on('app-command:start', cb),
    onStop: (cb) => ipcRenderer.on('app-command:stop', cb),
    onEmergencyStop: (cb) => ipcRenderer.on('app-command:emergency-stop', cb),
    onOpenSettings: (cb) => ipcRenderer.on('app-command:open-settings', cb),
    onOpenScenarios: (cb) => ipcRenderer.on('app-command:open-scenarios', cb),
    onOpenAdvanced: (cb) => ipcRenderer.on('app-command:open-advanced', cb),
    onOpenMain: (cb) => ipcRenderer.on('app-command:open-main', cb),
    onShowSafetyNotice: (cb) => ipcRenderer.on('app-command:show-safety-notice', cb),
    onShowAbout: (cb) => ipcRenderer.on('app-command:show-about', cb)
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:get-info'),
    setExecutionRunning: (running) => ipcRenderer.invoke('app-state:set-execution-running-status', running)
  }
});
