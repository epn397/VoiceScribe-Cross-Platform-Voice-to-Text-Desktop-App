// Google Cloud Speech-to-Text (streaming via REST/gRPC-web proxy).
// Placeholder adapter with the same interface — plug in your streaming endpoint.
class GoogleProvider {
  constructor(opts) { this.o = opts; this.rec = new Recorder({ onError: opts.onError }); }
  async start() {
    await this.rec.requestMic();
    // Recommended: stream 16k PCM chunks to Google Speech streamingRecognize
    // through a lightweight secured relay (keeps key off the client if desired).
    this.o.onError?.('Google provider stub — configure streaming endpoint in google.js');
    this.rec.attachVAD((speaking) => this.o.onStatus?.('online', speaking ? 'Speaking…' : 'Listening…'));
  }
  async restart() { await this.stop(); return this.start(); }
  setLanguage(lang) { this.o.language = lang; }
  async stop() { this.rec.stop(); }
}
window.GoogleProvider = GoogleProvider;
