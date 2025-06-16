const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
   nodeFetch: async (url, options) => {
    return ipcRenderer.invoke('node-fetch', url, options);
  },
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  onLoadSettings: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('load-settings', subscription);
    
    return () => ipcRenderer.removeListener('load-settings', subscription);
  }
});

contextBridge.exposeInMainWorld('nodeProcess', {
  env: Object.freeze({ ...process.env })
});