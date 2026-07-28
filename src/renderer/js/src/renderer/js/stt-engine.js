// Provider-agnostic STT engine. Delegates to a provider adapter,
// handles auto-reconnect, language switching, and recognition timeout.
class STTEngine {
  constructor(cfg) {
    this.cfg = cfg;
    this.provider = null;
    this.reconnectAttempts = 0;
    this.maxReconnect = 5;
    this.timeoutMs = 15000;
  }

  _makeProvider() {
    const opts = { ...this.cfg, onReconnectNeeded: () => this._reconnect() };
    switch (this.cfg.provider) {
      case 'azure':   return new AzureProvider(opts);
      case 'google':  return new GoogleProvider(opts);
      case 'whisper': return new WhisperProvider(opts);
      default:        throw new Error('Unknown provider: ' + this.cfg.provider);
    }
  }

  async start() {
    this.provider = this._makeProvider();
    this.cfg.onStatus?.('online', 'Listening…');
    await this.provider.start();
    this._armTimeout();
  }

  _armTimeout() {
    clearTimeout(this._to);
    // If no result within timeoutMs, warn but keep listening.
    this._to = setTimeout(() => this.cfg.onError?.('Recognition timeout — still listening.'), this.timeoutMs);
  }

  async _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) {
      this.cfg.onError?.('Could not reconnect to speech service.');
      this.cfg.onStatus?.('offline', 'Disconnected'); return;
    }
    this.reconnectAttempts++;
    this.cfg.onStatus?.('offline', `Reconnecting (${this.reconnectAttempts})…`);
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 8000);
    setTimeout(async () => {
      try { await this.provider.restart(); this.reconnectAttempts = 0; this.cfg.onStatus?.('online', 'Listening…'); }
      catch (e) { this._reconnect(); }
    }, delay);
  }

  switchLanguage(lang) { this.cfg.language = lang; this.provider?.setLanguage(lang); }

  async stop() { clearTimeout(this._to); await this.provider?.stop(); this.provider = null; }
}
window.STTEngine = STTEngine;
