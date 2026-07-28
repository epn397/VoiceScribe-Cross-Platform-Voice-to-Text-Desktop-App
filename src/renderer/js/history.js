// Recent transcription history stored in localStorage (last 20).
const History = {
  KEY: 'vs_history',
  list() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
  add(text) {
    const items = this.list();
    items.unshift({ text, at: new Date().toISOString() });
    localStorage.setItem(this.KEY, JSON.stringify(items.slice(0, 20)));
  },
  clear() { localStorage.removeItem(this.KEY); }
};
window.History = History;
