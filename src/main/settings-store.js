'use strict';
const Store = require('electron-store');
const { safeStorage } = require('electron');
const logger = require('./logger');

/**
 * Persists settings locally. API keys are encrypted with the OS keychain
 * (safeStorage) so they are never stored in plaintext.
 */
const DEFAULTS = {
  provider: 'azure',          // azure | google | whisper
  apiKeyEncrypted: '',        // encrypted blob
  region: 'eastus',           // Azure region / endpoint hint
  language: 'en-US',          // en-US | bn-BD
  fontSize: 16,
  theme: 'dark',              // dark | light
  autoSave: false,
  autoCopy: false,
  outputFolder: '',
  punctuation: true,
  timestamps: false,
  globalHotkey: 'CommandOrControl+Shift+R'
};

const store = new Store({ name: 'settings', defaults: DEFAULTS });

function setApiKey(plain) {
  if (!plain) { store.set('apiKeyEncrypted', ''); return; }
  try {
    const enc = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(plain).toString('base64')
      : Buffer.from(plain).toString('base64'); // fallback
    store.set('apiKeyEncrypted', enc);
  } catch (e) { logger.error('Failed to encrypt API key', { e: e.message }); }
}

function getApiKey() {
  const enc = store.get('apiKeyEncrypted');
  if (!enc) return '';
  try {
    const buf = Buffer.from(enc, 'base64');
    return safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buf)
      : buf.toString('utf8');
  } catch (e) { logger.error('Failed to decrypt API key', { e: e.message }); return ''; }
}

module.exports = { store, setApiKey, getApiKey, DEFAULTS };
