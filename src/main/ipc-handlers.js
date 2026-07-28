'use strict';
const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const { store, setApiKey, getApiKey } = require('./settings-store');
const exporters = require('./exporters');
const logger = require('./logger');

function registerIpc(getWindow) {
  // ---- Settings ----
  ipcMain.handle('settings:get', () => {
    const all = { ...store.store };
    delete all.apiKeyEncrypted;
    all.apiKey = getApiKey();          // decrypted only for the settings screen
    return all;
  });

  ipcMain.handle('settings:save', (_e, incoming) => {
    const { apiKey, ...rest } = incoming;
    if (apiKey !== undefined) setApiKey(apiKey);
    Object.entries(rest).forEach(([k, v]) => store.set(k, v));
    getWindow()?.webContents.send('settings:changed', incoming);
    return true;
  });

  // Renderer needs the key + region to open a provider connection.
  ipcMain.handle('settings:credentials', () => ({
    provider: store.get('provider'),
    region: store.get('region'),
    apiKey: getApiKey()
  }));

  // ---- File exports ----
  ipcMain.handle('file:export', async (_e, { format, text, silent }) => {
    try {
      let targetPath;
      const autoFolder = store.get('outputFolder');
      const name = `transcript-${Date.now()}.${format}`;
      if (silent && autoFolder) {
        targetPath = path.join(autoFolder, name);
      } else {
        const { canceled, filePath } = await dialog.showSaveDialog(getWindow(), {
          defaultPath: path.join(autoFolder || app.getPath('documents'), name),
          filters: [{ name: format.toUpperCase(), extensions: [format] }]
        });
        if (canceled) return { ok: false, canceled: true };
        targetPath = filePath;
      }
      if (format === 'txt') await exporters.saveTxt(targetPath, text);
      else if (format === 'docx') await exporters.saveDocx(targetPath, text);
      else if (format === 'pdf') await exporters.savePdf(targetPath, text);
      return { ok: true, path: targetPath };
    } catch (e) {
      logger.error('Export failed', { e: e.message });
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle('folder:pick', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(getWindow(), {
      properties: ['openDirectory']
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('log:error', (_e, msg, meta) => logger.error(msg, meta));
}

module.exports = { registerIpc };
