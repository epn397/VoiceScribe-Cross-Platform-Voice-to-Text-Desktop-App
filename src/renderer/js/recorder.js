// Microphone capture with Voice Activity Detection (VAD).
// Provides raw audio access + volume gating for providers that need PCM chunks.
class Recorder {
  constructor({ onError } = {}) { this.onError = onError; this.stream = null; this.ctx = null; }

  async requestMic() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('No microphone API available.');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      return this.stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') throw new Error('Microphone permission denied.');
      if (err.name === 'NotFoundError') throw new Error('No microphone found.');
      throw new Error('Microphone error: ' + err.message);
    }
  }

  // Simple VAD: emits speaking=true/false based on RMS energy.
  attachVAD(onVoice) {
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    const analyser = this.ctx.createAnalyser(); analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let speaking = false;
    const loop = () => {
      if (!this.ctx) return;
      analyser.getByteFrequencyData(data);
      const rms = Math.sqrt(data.reduce((a, v) => a + v * v, 0) / data.length);
      const active = rms > 12;
      if (active !== speaking) { speaking = active; onVoice?.(active); }
      requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close(); this.ctx = null; this.stream = null;
  }
}
window.Recorder = Recorder;
