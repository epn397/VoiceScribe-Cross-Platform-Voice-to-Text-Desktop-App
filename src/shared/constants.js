// Kept ESM-friendly for the renderer; main uses its own copies where needed.
export const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'bn-BD', label: 'বাংলা (Bangla)' }
];
export const PROVIDERS = ['azure', 'google', 'whisper'];
export const ERRORS = {
  NO_MIC: 'No microphone found. Please connect a microphone and try again.',
  MIC_DENIED: 'Microphone permission denied. Enable it in your system settings.',
  OFFLINE: 'No internet connection. VoiceScribe needs an active connection.',
  API_KEY: 'Invalid or missing API key. Check Settings → API Key.',
  API_ERROR: 'Speech service error. Please try again.',
  TIMEOUT: 'Recognition timed out due to inactivity. Restarting…'
};
