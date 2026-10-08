import { vi } from 'vitest';

export interface FakeVoice { name: string; lang: string }

export function stubSpeech(voices: FakeVoice[] = [
  { name: 'Microsoft Aria', lang: 'en-US' },
  { name: 'Microsoft Ryan', lang: 'en-GB' },
  { name: 'Microsoft An', lang: 'vi-VN' },
]) {
  const spoken: { text: string; voice: string | undefined; rate: number }[] = [];
  class FakeUtterance {
    text: string;
    voice: FakeVoice | null = null;
    lang = '';
    rate = 1;
    constructor(text: string) { this.text = text; }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    speak: (u: FakeUtterance) => spoken.push({ text: u.text, voice: u.voice?.name, rate: u.rate }),
    cancel: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  return spoken;
}
