// System tray with show/quit/toggle-recording.
const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');
let tray = null;

function createTray(mainWindow, app) {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('VoiceScribe');
  const menu = Menu.buildFromTemplate([
    { label: 'Show VoiceScribe', click: () => mainWindow.show() },
    { label: 'Start / Stop Recording', click: () => mainWindow.webContents.send('hotkey:toggle-recording') },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu);
  tray.on('double-click', () => mainWindow.show());
  return tray;
}
module.exports = { createTray };
