// Loads + persists settings; validates input.
(async () => {
  const $ = (id) => document.getElementById(id);
  const s = await window.api.settings.getAll();
  document.body.setAttribute('data-theme', s.theme || 'dark');

  const map = ['provider','apiKey','region','language','fontSize','theme','globalHotkey','outputFolder'];
  map.forEach(k => { if ($(k) && s[k] != null) $(k).value = s[k]; });
  ['autoSave','autoCopy','autoPunctuation','minimizeToTray'].forEach(k => { if ($(k)) $(k).checked = !!s[k]; });

  $('pickFolder').onclick = async () => { const f = await window.api.file.pickFolder(); if (f) $('outputFolder').value = f; };

  $('save').onclick = async () => {
    const fs = parseInt($('fontSize').value, 10);
    if (isNaN(fs) || fs < 10 || fs > 40) return alert('Font size must be 10–40.');
    if (!$('apiKey').value.trim()) if (!confirm('API key is empty. Save anyway?')) return;

    await window.api.settings.set('provider', $('provider').value);
    await window.api.settings.set('apiKey', $('apiKey').value.trim());
    await window.api.settings.set('region', $('region').value.trim());
    await window.api.settings.set('language', $('language').value);
    await window.api.settings.set('fontSize', fs);
    await window.api.settings.set('theme', $('theme').value);
    await window.api.settings.set('globalHotkey', $('globalHotkey').value.trim() || 'CommandOrControl+Shift+R');
    await window.api.settings.set('outputFolder', $('outputFolder').value);
    await window.api.settings.set('autoSave', $('autoSave').checked);
    await window.api.settings.set('autoCopy', $('autoCopy').checked);
    await window.api.settings.set('autoPunctuation', $('autoPunctuation').checked);
    await window.api.settings.set('minimizeToTray', $('minimizeToTray').checked);
    window.api.settings.notifyChanged();
    window.close();
  };
  $('cancel').onclick = () => window.close();
})();
