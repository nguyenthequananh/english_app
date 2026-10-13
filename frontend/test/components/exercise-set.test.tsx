import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseSet } from '@/components/exercise-set';
import { stubSpeech } from '@test/speech-stub';
import { configureSpeech } from '@/speech/speech';
import type { ExerciseView } from '@/types/api';

const exercises: ExerciseView[] = [
  { code: 'E1', type: 'MCQ', prompt: 'She ___ to school.', options: ['go', 'goes'] },
  { code: 'E2', type: 'FILL', prompt: 'They ___ (play) football.', options: [] },
  { code: 'E3', type: 'MINIMAL_PAIR', prompt: 'ship', options: ['ship', 'sheep'] },
];

test('gom đáp án ba dạng câu rồi nộp', async () => {
  const user = userEvent.setup();
  const spoken = stubSpeech();
  const onSubmit = vi.fn();
  render(<ExerciseSet exercises={exercises} onSubmit={onSubmit} />);
  expect(screen.queryByText('ship', { selector: 'p' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Nghe từ: ship' }));
  expect(spoken[0].text).toBe('ship');
  await user.click(screen.getByLabelText('goes'));
  await user.type(screen.getByLabelText('Câu 2'), 'play');
  await user.click(screen.getByLabelText('sheep'));
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(onSubmit).toHaveBeenCalledWith({ E1: 'goes', E2: 'play', E3: 'sheep' });
});

test('có kết quả thì hiện đúng/sai, đáp án, giải thích và khoá ô nhập', () => {
  stubSpeech();
  render(
    <ExerciseSet exercises={exercises} onSubmit={() => undefined}
      results={[
        { code: 'E1', given: 'goes', correct: true, answer: 'goes', explanationVi: null },
        { code: 'E2', given: 'plays', correct: false, answer: 'play', explanationVi: 'Chủ ngữ số nhiều.' },
        { code: 'E3', given: null, correct: false, answer: 'ship', explanationVi: null },
      ]} />,
  );
  expect(screen.getByText('✓ Đúng')).toBeInTheDocument();
  expect(screen.getByText('✗ Sai — đáp án: play')).toBeInTheDocument();
  expect(screen.getByText('Chủ ngữ số nhiều.')).toBeInTheDocument();
  expect(screen.getByLabelText('Câu 2')).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeInTheDocument();
});

test('DICTATION: không lộ câu, có nút nghe thường và nghe chậm, gõ rồi nộp', async () => {
  const user = userEvent.setup();
  const spoken = stubSpeech();
  const onSubmit = vi.fn();
  render(<ExerciseSet exercises={[{ code: 'D1', type: 'DICTATION', prompt: 'I live in Hanoi.', options: null }]}
    onSubmit={onSubmit} />);
  expect(document.body.innerHTML).not.toContain('I live in Hanoi');
  await user.click(screen.getByRole('button', { name: 'Nghe câu' }));
  await user.click(screen.getByRole('button', { name: 'Nghe chậm' }));
  expect(spoken.map((s) => [s.text, s.rate])).toEqual([['I live in Hanoi.', 1], ['I live in Hanoi.', 0.7]]);
  await user.type(screen.getByLabelText('Câu 1'), 'i live in hanoi');
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(onSubmit).toHaveBeenCalledWith({ D1: 'i live in hanoi' });
});

test('DICTATION: sau khi chấm thì hiện câu đáp án', () => {
  stubSpeech();
  render(<ExerciseSet exercises={[{ code: 'D1', type: 'DICTATION', prompt: 'I live in Hanoi.', options: null }]}
    onSubmit={() => undefined}
    results={[{ code: 'D1', given: 'i live in hanoy', correct: false, answer: 'I live in Hanoi.', explanationVi: null }]} />);
  expect(screen.getByText('✗ Sai — đáp án: I live in Hanoi.')).toBeInTheDocument();
  expect(screen.getByLabelText('Câu 1')).toBeDisabled();
});

test('Enter trong ô gõ không nộp bài mà chuyển sang ô kế tiếp; ô gõ tắt spellcheck/autocomplete', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const onSubmit = vi.fn();
  render(<ExerciseSet exercises={[
    { code: 'F1', type: 'FILL', prompt: 'They ___ (play) football.', options: [] },
    { code: 'D1', type: 'DICTATION', prompt: 'I live in Hanoi.', options: null },
  ]} onSubmit={onSubmit} />);
  const first = screen.getByLabelText('Câu 1');
  expect(first).toHaveAttribute('spellcheck', 'false');
  expect(first).toHaveAttribute('autocomplete', 'off');
  expect(first).toHaveAttribute('autocapitalize', 'off');
  await user.type(first, 'play{Enter}');
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Câu 2')).toHaveFocus();
  await user.type(screen.getByLabelText('Câu 2'), 'i live{Enter}');
  expect(onSubmit).not.toHaveBeenCalled();
});

test('Nghe chậm tính theo tốc độ đã cấu hình trong hồ sơ', async () => {
  const user = userEvent.setup();
  const spoken = stubSpeech();
  configureSpeech({ voice: null, rate: 0.6 });
  try {
    render(<ExerciseSet exercises={[{ code: 'D1', type: 'DICTATION', prompt: 'I live in Hanoi.', options: null }]}
      onSubmit={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Nghe chậm' }));
    expect(spoken[0].rate).toBeCloseTo(0.42);
  } finally {
    configureSpeech({ voice: null, rate: 1 });
  }
});
