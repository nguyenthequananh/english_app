import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsPage from './stats-page';
import IpaPage from './ipa-page';
import { renderAt } from '../test/render';
import { mockApi } from '../test/mock-api';
import { stubSpeech } from '../test/speech-stub';
import { toIsoDate } from '../dates';
import { IPA_GROUPS } from '../ipa/ipa-data';

test('thống kê: các ô số, heatmap hôm nay và bảng kết quả', async () => {
  const today = toIsoDate(new Date());
  mockApi({ 'GET /progress/stats': () => ({ body: {
    streak: 4, knownWords: 120, learningWords: 35,
    heatmap: [{ date: today, minutes: 31 }],
    knownByWeek: [{ weekStart: '2026-09-28', total: 100 }, { weekStart: '2026-10-05', total: 120 }],
    tests: [{ testCode: 'S0-U01-T', kind: 'UNIT', score: 0.75, passed: true, takenAt: '2026-10-05T20:00' }],
  } }) });
  renderAt(<StatsPage />, '/stats');
  expect(await screen.findByTestId('stat-streak')).toHaveTextContent('4');
  expect(screen.getByTestId('stat-known')).toHaveTextContent('120');
  expect(screen.getByTestId('stat-learning')).toHaveTextContent('35');
  expect(screen.getByTitle(`${today}: 31 phút`)).toBeInTheDocument();
  expect(screen.getByText('S0-U01-T')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Số từ đã thuộc theo tuần' })).toBeInTheDocument();
});

test('bảng IPA đủ 44 âm, bấm âm thì đọc từ ví dụ', async () => {
  const spoken = stubSpeech();
  renderAt(<IpaPage />, '/ipa');
  expect(IPA_GROUPS.flatMap((g) => g.sounds)).toHaveLength(44);
  await userEvent.click(screen.getByRole('button', { name: '/iː/ sheep' }));
  expect(spoken[0].text).toBe('sheep');
});
