'use strict';
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/** Simple file + console logger with levels. */
class Logger {
  constructor() {
    const dir = app ? app.getPath('userData') : '.';
    this.logFile = path.join(dir, 'voicescribe.log');
  }
  _write(level, msg, meta) {
    const line = `[${new Date().toISOString()}] [${level}] ${msg} ${meta ? JSON.stringify(meta) : ''}\n`;
    try { fs.appendFileSync(this.logFile, line); } catch (_) {}
    // eslint-disable-next-line no-console
    console[level === 'ERROR' ? 'error' : 'log'](line.trim());
  }
  info(msg, meta) { this._write('INFO', msg, meta); }
  warn(msg, meta) { this._write('WARN', msg, meta); }
  error(msg, meta) { this._write('ERROR', msg, meta); }
}
module.exports = new Logger();
