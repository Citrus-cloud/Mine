const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('clickflow', {
  appName: 'ClickFlow',
  version: '0.1.0'
});
