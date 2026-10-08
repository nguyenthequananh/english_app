import { configureSpeech, englishVoices, speak } from './speech';
import { stubSpeech } from '../test/speechStub';

test('đọc bằng giọng và tốc độ trong hồ sơ', () => {
  const spoken = stubSpeech();
  configureSpeech({ voice: 'Microsoft Ryan', rate: 0.8 });
  expect(speak('hello')).toBe(true);
  expect(spoken).toEqual([{ text: 'hello', voice: 'Microsoft Ryan', rate: 0.8 }]);
});

test('giọng không tồn tại thì dùng giọng en-US', () => {
  const spoken = stubSpeech();
  configureSpeech({ voice: 'Không có', rate: 1 });
  speak('book');
  expect(spoken[0].voice).toBe('Microsoft Aria');
});

test('không có giọng tiếng Anh hoặc không có speechSynthesis thì không crash', () => {
  stubSpeech([{ name: 'Microsoft An', lang: 'vi-VN' }]);
  expect(englishVoices()).toHaveLength(0);
  expect(speak('go')).toBe(false);
  vi.stubGlobal('speechSynthesis', undefined);
  expect(speak('go')).toBe(false);
});
