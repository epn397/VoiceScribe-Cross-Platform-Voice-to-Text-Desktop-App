'use strict';
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

/** Save plain text file. */
async function saveTxt(filePath, text) {
  await fs.promises.writeFile(filePath, text, 'utf8');
  return filePath;
}

/** Export a DOCX file. */
async function saveDocx(filePath, text) {
  const paragraphs = text.split('\n').map(
    (line) => new Paragraph({ children: [new TextRun(line)] })
  );
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

/** Export a PDF file (Unicode font recommended for Bangla). */
async function savePdf(filePath, text) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(12).text(text, { align: 'left' });
    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { saveTxt, saveDocx, savePdf };
