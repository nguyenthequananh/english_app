import { useEffect, useState } from 'react';

export interface SpeechSettings { voice: string | null; rate: number }

let current: SpeechSettings = { voice: null, rate: 1 };

export function configureSpeech(settings: SpeechSettings) {
  current = settings;
}

function synth(): SpeechSynthesis | null {
  const s = (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
  return s ?? null;
}

export function englishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  return s ? s.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')) : [];
}

function pickVoice(voices: SpeechSynthesisVoice[], name: string | null) {
  return voices.find((v) => v.name === name) ?? voices.find((v) => v.lang === 'en-US') ?? voices[0] ?? null;
}

/** Đọc một đoạn tiếng Anh. Trả false nếu máy không đọc được (không có giọng tiếng Anh). */
export function speak(text: string, override?: Partial<SpeechSettings>): boolean {
  const s = synth();
  if (!s || !text.trim()) return false;
  const settings = { ...current, ...override };
  const voice = pickVoice(englishVoices(), settings.voice);
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = settings.rate;
  s.cancel();
  s.speak(utterance);
  return true;
}

/** Danh sách giọng tiếng Anh; ready = đã chờ đủ để biết máy có giọng hay không. */
export function useEnglishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(englishVoices);
  const [ready, setReady] = useState(() => englishVoices().length > 0);
  useEffect(() => {
    const s = synth();
    if (!s) {
      setReady(true);
      return;
    }
    const update = () => {
      setVoices(englishVoices());
      setReady(true);
    };
    s.addEventListener('voiceschanged', update);
    const timer = setTimeout(update, 1500);
    return () => {
      s.removeEventListener('voiceschanged', update);
      clearTimeout(timer);
    };
  }, []);
  return { voices, ready };
}
