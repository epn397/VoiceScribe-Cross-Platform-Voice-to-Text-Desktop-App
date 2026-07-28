// Azure Cognitive Speech — real-time streaming, native bn-BD & en-US.
// SDK loaded from node_modules and exposed via bundling OR window global.
const SpeechSDK = require('microsoft-cognitiveservices-speech-sdk');

class AzureProvider {
  constructor(opts) { this.o = opts; this.recognizer = null; }

  _buildRecognizer() {
    const cfg = SpeechSDK.SpeechConfig.fromSubscription(this.o.apiKey, this.o.region);
    cfg.speechRecognitionLanguage = this.o.language;      // en-US or bn-BD
    if (this.o.autoPunctuation) cfg.enableDictation();     // punctuation + capitalization
    const audio = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const r = new SpeechSDK.SpeechRecognizer(cfg, audio);

    r.recognizing = (_s, e) => this.o.onInterim?.(e.result.text);
    r.recognized = (_s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) this.o.onFinal?.(e.result.text);
    };
    r.canceled = (_s, e) => {
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        const msg = e.errorDetails || '';
        if (/401|forbidden|authentication/i.test(msg)) { this.o.onError?.('Invalid API key or region.'); return; }
        this.o.onError?.('Service error — reconnecting…');
        this.o.onReconnectNeeded?.();
      }
    };
    r.sessionStopped = () => {};
    return r;
  }

  async start() {
    this.recognizer = this._buildRecognizer();
    return new Promise((res, rej) => this.recognizer.startContinuousRecognitionAsync(res, e => rej(new Error(e))));
  }
  async restart() { await this.stop(); return this.start(); }
  setLanguage(lang) { this.o.language = lang; this.restart(); }  // instant switch via restart
  async stop() {
    return new Promise((res) => {
      if (!this.recognizer) return res();
      this.recognizer.stopContinuousRecognitionAsync(() => { this.recognizer.close(); this.recognizer = null; res(); }, () => res());
    });
  }
}
window.AzureProvider = AzureProvider;
