'use strict';
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure bridge: the renderer never touches Node/Electron directly.
 * Only these whitelisted channels are exposed.
 */
contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s) => ipcRenderer.invoke('settings:save', s),
  getCredentials: () => ipcRenderer.invoke('settings:credentials'),
  exportFile: (payload) => ipcRenderer.invoke('file:export', payload),
  pickFolder: () => ipcRenderer.invoke('folder:pick'),
  logError: (msg, meta) => ipcRenderer.invoke('log:error', msg, meta),
  onSettingsChanged: (cb) => ipcRenderer.on('settings:changed', (_e, d) => cb(d)),
  onHotkey: (cb) => ipcRenderer.on('hotkey:toggle-record', () => cb()),
  openSettings: () => ipcRenderer.send('window:open-settings')
});
