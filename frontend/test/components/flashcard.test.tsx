import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcard } from '@/components/flashcard';
import { stubSpeech } from '@test/speech-stub';
import type { Word } from '@/types/api';

const word: Word = {
  id: 5, headword: 'hello', pos: 'exclamation', ipaUs: '/həˈloʊ/', ipaUk: '/həˈləʊ/', meaningVi: 'xin chào',
  exampleEn: 'Hello, I am Lan.', exampleVi: 'Xin chào, tôi là Lan.', cefr: 'A1', source: 'OXFORD',
};

test('mặt trước chỉ có từ, lật thẻ mới thấy nghĩa', async () => {
  stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  expect(screen.getByText('hello')).toBeInTheDocument();
  expect(screen.queryByText('xin chào')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Lật thẻ/ }));
  expect(screen.getByTestId('card-back')).toHaveTextContent('xin chào');
  expect(screen.getByTestId('card-back')).toHaveTextContent('/həˈloʊ/');
});

test('Space lật thẻ, phím 3 chấm Được chỉ khi đã lật', () => {
  stubSpeech();
  const onGrade = vi.fn();
  render(<Flashcard word={word} onGrade={onGrade} />);
  fireEvent.keyDown(window, { key: '3' });
  expect(onGrade).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  expect(screen.getByTestId('card-back')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: '3' });
  expect(onGrade).toHaveBeenCalledWith('GOOD');
});

test('đang gửi (busy) thì không chấm được', () => {
  stubSpeech();
  const onGrade = vi.fn();
  render(<Flashcard word={word} onGrade={onGrade} busy />);
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '1' });
  expect(onGrade).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Quên' })).toBeDisabled();
});

test('nút loa đọc từ và câu ví dụ', async () => {
  const spoken = stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  await userEvent.click(screen.getByRole('button', { name: 'Nghe: hello' }));
  await userEvent.click(screen.getByRole('button', { name: /Lật thẻ/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Nghe câu: Hello, I am Lan.' }));
  expect(spoken.map((s) => s.text)).toEqual(['hello', 'Hello, I am Lan.']);
});

test('phím lặp hoặc có Ctrl/Alt/Meta không chấm thẻ', () => {
  stubSpeech();
  const onGrade = vi.fn();
  render(<Flashcard word={word} onGrade={onGrade} />);
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '3', repeat: true });
  fireEvent.keyDown(window, { key: '3', ctrlKey: true });
  fireEvent.keyDown(window, { key: '3', altKey: true });
  fireEvent.keyDown(window, { key: '3', metaKey: true });
  expect(onGrade).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: '3' });
  expect(onGrade).toHaveBeenCalledTimes(1);
});

test('Space trên nút 🔊 đang được focus không lật thẻ', () => {
  stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  const speakBtn = screen.getByRole('button', { name: 'Nghe: hello' });
  speakBtn.focus();
  fireEvent.keyDown(speakBtn, { key: ' ', code: 'Space' });
  expect(screen.queryByTestId('card-back')).not.toBeInTheDocument();
});

test('lật đi lật lại: mỗi lúc chỉ một mặt bấm được, nút chấm chỉ có khi xem mặt sau', () => {
  stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  expect(screen.queryByRole('button', { name: 'Được' })).not.toBeInTheDocument();
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  expect(screen.getAllByRole('button', { name: 'Nghe: hello' })).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Được' })).toHaveAttribute('aria-keyshortcuts', '3');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  expect(screen.getByRole('button', { name: /Lật thẻ/ })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Nghe: hello' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Được' })).not.toBeInTheDocument();
});

test('chạm vào mặt trước cũng lật thẻ', async () => {
  stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  await userEvent.click(screen.getByRole('heading', { name: 'hello' }));
  expect(screen.getByTestId('card-back')).toHaveTextContent('xin chào');
});

test('Space khi focus ở nút lật thẻ vẫn lật thẻ', () => {
  stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  const flipBtn = screen.getByRole('button', { name: /Lật thẻ/ });
  flipBtn.focus();
  fireEvent.keyDown(flipBtn, { key: ' ', code: 'Space' });
  expect(screen.getByTestId('card-back')).toBeInTheDocument();
});
