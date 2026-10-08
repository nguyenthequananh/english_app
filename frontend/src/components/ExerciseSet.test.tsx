import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseSet } from './ExerciseSet';
import { stubSpeech } from '../test/speechStub';
import type { ExerciseView } from '../api/types';

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
