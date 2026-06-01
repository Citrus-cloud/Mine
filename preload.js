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
    getBetaHealth: () => ipcRenderer.invoke('system:get-beta-health'),
    getReleaseStatus: () => ipcRenderer.invoke('system:get-release-status'),
    setExecutionRunning: (running) => ipcRenderer.invoke('app-state:set-execution-running-status', running)
  },
  // Step 25 — Screen Capture Foundation. Preview-only:
  // - never persists to disk, never executes real clicks,
  //   never runs OCR or image recognition;
  // - the renderer cannot reach ipcRenderer directly.
  screenCapture: {
    listSources: () => ipcRenderer.invoke('screen-capture:list-sources'),
    capturePreview: (sourceId) => ipcRenderer.invoke('screen-capture:capture-preview', sourceId),
    getStatus: () => ipcRenderer.invoke('screen-capture:get-status')
  },
  // Step 27 — Template Asset Manager. Storage-only:
  // - import goes through dialog.showOpenDialog (png/jpg/jpeg/webp);
  // - templates.json holds metadata only — never base64 / pixel data;
  // - load returns previewDataUrl in memory only, never written back;
  // - no matching / OCR / real clicks.
  templates: {
    load: () => ipcRenderer.invoke('templates:load'),
    importImage: () => ipcRenderer.invoke('templates:import-image'),
    saveMetadata: (templateId, updates) => ipcRenderer.invoke('templates:save-metadata', templateId, updates),
    delete: (templateId) => ipcRenderer.invoke('templates:delete', templateId),
    reset: () => ipcRenderer.invoke('templates:reset'),
    getStats: () => ipcRenderer.invoke('templates:get-stats')
  },
  // Step 47 — Real Desktop Adapter prototype. Three narrow channels
  // only; the renderer never reaches ipcRenderer directly and there is
  // no generic action runner. executeCoordinateClick is coordinate-
  // click specific and main re-validates the full hard context.
  realAdapter: {
    getStatus: () => ipcRenderer.invoke('real-adapter:get-status'),
    checkAvailability: () => ipcRenderer.invoke('real-adapter:check-availability'),
    executeCoordinateClick: (action, context) => ipcRenderer.invoke('real-adapter:execute-coordinate-click', action, context)
  }
});
