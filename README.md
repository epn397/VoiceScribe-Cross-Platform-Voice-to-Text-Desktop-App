# 🎙️ VoiceScribe — Real-time English & Bangla Voice-to-Text

A lightweight, modern Electron desktop app that converts live speech to text
in English (en-US) and Bangla (bn-BD) using cloud Speech-to-Text APIs.

## ✨ Features
- Real-time continuous transcription with auto-scroll
- English ⇄ Bangla instant language switching
- Pluggable providers: **Azure** (default), Google, OpenAI Whisper
- Light/Dark themes, adjustable font, zoom in/out
- Copy, Clear, Save as TXT / DOCX / PDF
- Word & character count, connection status, recording indicator
- Auto punctuation & capitalization, Voice Activity Detection
- Auto-copy, auto-save, timestamped paragraphs
- Search & replace, recent history, undo/redo (native)
- System tray, global hotkey (Ctrl+Shift+R), auto-reconnect
- Secure encrypted local settings — **no hardcoded keys**

## 🔧 Prerequisites
- Node.js 18+ and npm
- Windows 10 / 11
- An API key from your chosen provider

### Getting an Azure Speech key (recommended)
1. Create a **Speech** resource in the Azure Portal.
2. Copy **Key 1** and the **Region** (e.g., `eastus`).

## 🚀 Installation (Development)
```bash
git clone <your-repo-url> voicescribe
cd voicescribe
npm install
npm start
