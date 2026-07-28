// Export helpers: TXT (via main), DOCX (docx lib), PDF (jsPDF).
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { jsPDF } = require('jspdf');

const Exporters = {
  _name(ext) { return `transcript-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.${ext}`; },

  async txt(content) {
    if (!content.trim()) return { ok: false };
    return window.api.file.save({ defaultName: this._name('txt'), content, encoding: 'utf8' });
  },

  async docx(content) {
    if (!content.trim()) return { ok: false };
    const doc = new Document({ sections: [{ children: content.split('\n').map(l => new Paragraph({ children: [new TextRun(l)] })) }] });
    const buf = await Packer.toBase64String(doc);
    return window.api.file.save({ defaultName: this._name('docx'), content: buf, encoding: 'base64' });
  },

  async pdf(content) {
    if (!content.trim()) return { ok: false };
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(content, 180);
    doc.setFontSize(12); doc.text(lines, 12, 18);
    const b64 = doc.output('datauristring').split(',')[1];
    return window.api.file.save({ defaultName: this._name('pdf'), content: b64, encoding: 'base64' });
  }
};
window.Exporters = Exporters;
