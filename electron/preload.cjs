const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Printer Management
  getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
  silentPrint: (options) => ipcRenderer.invoke('print:silent', options),
  printReceiptHtml: (html, options) => ipcRenderer.invoke('print:receiptHtml', { html, options }),
  printDialog: (options) => ipcRenderer.invoke('print:dialog', options),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // System & Metadata
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
});
