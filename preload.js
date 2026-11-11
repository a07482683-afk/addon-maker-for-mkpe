const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  exportAddon: (p) => ipcRenderer.invoke('export', p),
  saveProject: (p) => ipcRenderer.invoke('save-project', p),
  openProject: () => ipcRenderer.invoke('open-project')
});
