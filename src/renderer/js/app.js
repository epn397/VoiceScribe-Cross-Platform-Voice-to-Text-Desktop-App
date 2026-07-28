// UI controller — wires DOM, engine, exporters, history, shortcuts.
(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    mic: $('micBtn'), start: $('startBtn'), stop: $('stopBtn'),
    lang: $('langSelect'), transcript: $('transcript'), interim: $('interim'),
    words: $('wordCount'), chars: $('charCount'), conn: $('connStatus'),
    rec: $('recIndicator'), toast: $('toast'), theme: $('themeToggle'),
    settings: $('settingsBtn'), search: $('searchInput'), replace: $('replaceInput')
  };

  let engine = null;
  let recording = false;
  let fontSize = 16;

  // ---------- Toast + status helpers ----------
  const toast = (msg, ms = 2500) => {
    els.toast.textContent = msg; els.toast.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => els.toast.classList.add('hidden'), ms);
  };
  const setConn = (state, label) => {
    els.conn.className = 'badge ' + (state === 'online' ? 'online' : 'offline');
    els.conn.textContent = '● ' + label;
  };

  // ---------- Counts + autoscroll ----------
  function updateCounts() {
    const t = els.transcript.value.trim();
    els.words.textContent = 'Words: ' + (t ? t.split(/\s+/).length : 0);
    els.chars.textContent = 'Characters: ' + els.transcript.value.length;
  }
  const autoScroll = () => (els.transcript.scrollTop = els.transcript.scrollHeight);

  // ---------- Load settings + theme + font ----------
  async function applySettings() {
    const s = await window.api.settings.getAll();
    document.body.setAttribute('data-theme', s.theme || 'dark');
    fontSize = s.fontSize || 16;
    els.transcript.style.fontSize = fontSize + 'px';
    els.lang.value = s.language || 'en-US';
  }

  // ---------- Engine callbacks ----------
  function buildEngine(settings) {
    return new STTEngine({
      provider: settings.provider, apiKey: settings.apiKey, region: settings.region,
      language: els.lang.value, autoPunctuation: settings.autoPunctuation,
      onInterim: (text) => { els.interim.textContent = text; },
      onFinal: (text) => {
        els.interim.textContent = '';
        if (!text) return;
        const stamp = `\n[${new Date().toLocaleTimeString()}] `;
        const needStamp = /\n\s*$/.test(els.transcript.value) || els.transcript.value === '';
        els.transcript.value += (needStamp ? stamp : '') + text + ' ';
        updateCounts(); autoScroll();
        if (settings.autoCopy) navigator.clipboard.writeText(els.transcript.value).catch(() => {});
      },
      onStatus: (state, label) => setConn(state, label),
      onError: (msg) => toast('⚠ ' + msg, 4000)
    });
  }

  // ---------- Start / Stop ----------
  async function startRecording() {
    if (recording) return;
    const s = await window.api.settings.getAll();
    if (!s.apiKey) { toast('⚠ Set your API key in Settings first.'); window.api.settings.open(); return; }
    try {
      engine = buildEngine(s);
      await engine.start();  // requests mic + opens stream
      recording = true;
      els.mic.classList.add('active'); els.rec.classList.remove('hidden');
      els.start.disabled = true; els.stop.disabled = false;
    } catch (err) {
      toast('⚠ ' + err.message, 4000);
    }
  }
  async function stopRecording() {
    if (!recording) return;
    try { await engine?.stop(); } catch (_) {}
    recording = false;
    els.mic.classList.remove('active'); els.rec.classList.add('hidden');
    els.start.disabled = false; els.stop.disabled = true;
    setConn('offline', 'Idle');
    if (els.transcript.value.trim()) History.add(els.transcript.value);
  }
  const toggle = () => (recording ? stopRecording() : startRecording());

  // ---------- Text actions ----------
  els.mic.onclick = toggle;
  els.start.onclick = startRecording;
  els.stop.onclick = stopRecording;
  els.lang.onchange = () => {
    window.api.settings.set('language', els.lang.value);
    if (recording && engine) engine.switchLanguage(els.lang.value); // instant switch
  };

  $('copyBtn').onclick = () => { navigator.clipboard.writeText(els.transcript.value); toast('Copied ✓'); };
  $('clearBtn').onclick = () => { if (els.transcript.value && confirm('Clear all text?')) { els.transcript.value = ''; updateCounts(); } };

  $('saveBtn').onclick = () => Exporters.txt(els.transcript.value).then(r => r?.ok && toast('Saved ✓'));
  $('docxBtn').onclick = () => Exporters.docx(els.transcript.value).then(r => r?.ok && toast('DOCX saved ✓'));
  $('pdfBtn').onclick = () => Exporters.pdf(els.transcript.value).then(r => r?.ok && toast('PDF saved ✓'));

  $('zoomIn').onclick = () => { fontSize = Math.min(40, fontSize + 2); els.transcript.style.fontSize = fontSize + 'px'; window.api.settings.set('fontSize', fontSize); };
  $('zoomOut').onclick = () => { fontSize = Math.max(10, fontSize - 2); els.transcript.style.fontSize = fontSize + 'px'; window.api.settings.set('fontSize', fontSize); };

  // Search + replace
  els.search.oninput = () => {
    const q = els.search.value; if (!q) return;
    const idx = els.transcript.value.toLowerCase().indexOf(q.toLowerCase());
    if (idx >= 0) { els.transcript.focus(); els.transcript.setSelectionRange(idx, idx + q.length); }
  };
  $('replaceBtn').onclick = () => {
    const q = els.search.value, r = els.replace.value;
    if (!q) return;
    els.transcript.value = els.transcript.value.split(q).join(r);
    updateCounts(); toast('Replaced ✓');
  };

  // Theme toggle
  els.theme.onclick = async () => {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    await window.api.settings.set('theme', next);
  };
  els.settings.onclick = () => window.api.settings.open();

  // Editing keeps counts fresh; browser gives native Undo/Redo in textarea
  els.transcript.oninput = updateCounts;

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'r') { e.preventDefault(); toggle(); }
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); $('saveBtn').click(); }
    if (e.ctrlKey && e.key === '=') { e.preventDefault(); $('zoomIn').click(); }
    if (e.ctrlKey && e.key === '-') { e.preventDefault(); $('zoomOut').click(); }
  });

  // Global hotkey from main process + settings reload
  window.api.onHotkeyToggle(() => toggle());
  window.api.settings.onReload(() => applySettings());

  // Online/offline detection
  window.addEventListener('offline', () => { setConn('offline', 'No Internet'); toast('⚠ Internet disconnected'); });
  window.addEventListener('online', () => setConn('online', 'Online'));

  // Init
  applySettings().then(() => { updateCounts(); setConn(navigator.onLine ? 'online' : 'offline', navigator.onLine ? 'Ready' : 'No Internet'); });
})();
