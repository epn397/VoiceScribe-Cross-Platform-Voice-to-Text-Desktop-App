// OpenAI Whisper API — chunked (near-real-time) via periodic uploads.
// Whisper is batch-based; we record ~4s chunks and transcribe sequentially.
class WhisperProvider {
  constructor(opts) { this.o = opts; this.rec = new Recorder({ onError: opts.onError }); this.chunks = []; this.timer = null; }

  async start() {
    const stream = await this.rec.requestMic();
    this.mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    this.mr.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.mr.onstop = () => this._flush();
    this._cycle();
    this.o.onStatus?.('online', 'Listening…');
  }
  _cycle() { this.mr.start(); this.timer = setTimeout(() => { this.mr.stop(); }, 4000); } // 4s windows
  async _flush() {
    if (!this.chunks.length) { if (this.mr.state !== 'inactive') this._cycle(); return; }
    const blob = new Blob(this.chunks, { type: 'audio/webm' }); this.chunks = [];
    try {
      const fd = new FormData();
      fd.append('file', blob, 'audio.webm');
      fd.append('model', 'whisper-1');
      fd.append('language', this.o.language.split('-')[0]); // en / bn
      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST', headers: { Authorization: 'Bearer ' + this.o.apiKey }, body: fd
      });
      if (resp.status === 401) return this.o.onError?.('Invalid API key.');
      if (!resp.ok) return this.o.onError?.('Whisper error ' + resp.status);
      const data = await resp.json();
      if (data.text) this.o.onFinal?.(data.text.trim());
    } catch (e) { this.o.onError?.('Network error — retrying…'); this.o.onReconnectNeeded?.(); }
    if (this.mr && this.mr.state !== 'inactive') return;
    this._cycle(); // continue loop
  }
  async restart() { await this.stop(); return this.start(); }
  setLanguage(lang) { this.o.language = lang; }
  async stop() { clearTimeout(this.timer); try { this.mr?.stop(); } catch(_){} this.rec.stop(); }
}
window.WhisperProvider = WhisperProvider;
