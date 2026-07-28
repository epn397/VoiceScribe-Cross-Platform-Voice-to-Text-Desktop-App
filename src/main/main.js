'use strict';
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const { store } = require('./settings-store');
const { registerIpc } = require('./ipc-handlers');
const logger = require('./logger');

let mainWindow = null;
let settingsWindow = null;
let tray = null;
const isDev = process.argv.includes('--dev');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 960, height: 720, minWidth: 720, minHeight: 560,
    backgroundColor: '#0f1115', show: false,
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,      // security: isolate renderer
      nodeIntegration: false,      // security: no Node in renderer
      sandbox: false               // needed for preload require
    }
  });
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Minimize to tray instead of quitting.
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });
}

function createSettingsWindow() {
  if (settingsWindow) { settingsWindow.focus(); return; }
  settingsWindow = new BrowserWindow({
    width: 560, height: 680, parent: mainWindow, modal: false,
    title: 'Settings', backgroundColor: '#0f1115',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, '../renderer/settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../../assets/tray.png'));
  const menu = Menu.buildFromTemplate([
    { label: 'Show VoiceScribe', click: () => mainWindow.show() },
    { label: 'Toggle Recording', click: () => mainWindow.webContents.send('hotkey:toggle-record') },
    { type: 'separator' },
    { label: 'Settings', click: () => createSettingsWindow() },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('VoiceScribe');
  tray.setContextMenu(menu);
  tray.on('double-click', () => mainWindow.show());
}

function registerGlobalHotkey() {
  const accel = store.get('globalHotkey');
  globalShortcut.unregisterAll();
  if (accel) {
    const ok = globalShortcut.register(accel, () =>
      mainWindow?.webContents.send('hotkey:toggle-record'));
    if (!ok) logger.warn('Global hotkey registration failed', { accel });
  }
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerIpc(() => mainWindow);
  registerGlobalHotkey();

  ipcMain.on('window:open-settings', createSettingsWindow);
  ipcMain.on('settings:changed', registerGlobalHotkey);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
}).catch((e) => logger.error('App init failed', { e: e.message }));

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { /* keep alive in tray */ });
process.on('uncaughtException', (e) => logger.error('Uncaught', { e: e.message }));
