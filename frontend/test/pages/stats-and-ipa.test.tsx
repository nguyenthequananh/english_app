import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsPage from '@/pages/stats-page';
import IpaPage from '@/pages/ipa-page';
import { renderAt } from '@test/render';
import { mockApi, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';
import { toIsoDate } from '@/dates';
import { IPA_GROUPS } from '@/ipa/ipa-data';

test('thống kê: các ô số, heatmap hôm nay và bảng kết quả', async () => {
  const today = toIsoDate(new Date());
  mockApi({
    'GET /progress/stats': () => ({ body: {
      streak: 4, knownWords: 120, learningWords: 35,
      heatmap: [{ date: today, minutes: 31 }, { date: '2000-01-03', minutes: 840 }],
      knownByWeek: [{ weekStart: '2026-09-28', total: 100 }, { weekStart: '2026-10-05', total: 120 }],
      tests: [
        { testCode: 'S0-U01-T', kind: 'UNIT', score: 0.75, passed: true, takenAt: '2026-10-05T20:00' },
        { testCode: 'S0-U02-T', kind: 'UNIT', score: 0.4, passed: false, takenAt: '2026-10-06T20:00' },
      ],
    } }),
    'GET /progress/summary': () => ({ body: {
      streak: 4, dueCount: 0, finishedToday: true,
      currentUnit: { code: 'S0-U02', title: 'Mạo từ', lessonsDone: 2, lessonsTotal: 6, testReady: false },
    } }),
    'GET /roadmap': () => ({ body: { stages: [{ code: 'S0', title: 'Xây nền', targetBand: 4, status: 'ACTIVE', testAvailable: false, units: [
      { code: 'S0-U01', title: 'Chào hỏi', status: 'DONE' },
      { code: 'S0-U02', title: 'Mạo từ', status: 'ACTIVE' },
      { code: 'S0-U03', title: 'Số nhiều', status: 'LOCKED' },
      { code: 'S0-U04', title: 'Đại từ', status: 'LOCKED' },
    ] }] } }),
  });
  renderAt(<StatsPage />, '/stats');
  expect(await screen.findByTestId('stat-streak')).toHaveTextContent(/^4$/);
  expect(screen.getByTestId('stat-known')).toHaveTextContent('120');
  expect(screen.getByTestId('stat-learning')).toHaveTextContent('35');
  // Tổng thời gian học = tổng phút các buổi đã xong (31 + 840 = 14 giờ 31 phút).
  expect(screen.getByText('14 giờ 31 phút')).toBeInTheDocument();
  expect(screen.getByTitle(`${today}: 31 phút`)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /^Lịch học 26 tuần/ })).toBeInTheDocument();
  expect(screen.getByText('S0-U01-T')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
  expect(screen.getByText('Chưa đạt')).toHaveClass('tone-warning');
  expect(screen.getByRole('img', { name: 'Số từ đã thuộc theo tuần' })).toBeInTheDocument();
  // Thẻ tổng quan: chặng đang học 1/4 unit = 25%, unit hiện tại 2/6 bài.
  expect(await screen.findByRole('progressbar', { name: 'Hoàn thành chặng Xây nền' })).toHaveAttribute('aria-valuenow', '25');
  expect(screen.getByText('2/6 bài')).toBeInTheDocument();
});

test('thống kê: lỗi tải hiện thông báo và thử lại được', async () => {
  const user = userEvent.setup();
  let fail = true;
  mockApi({
    'GET /progress/stats': () => (fail
      ? problem(500, 'INTERNAL', 'Máy chủ lỗi')
      : { body: { streak: 0, knownWords: 0, learningWords: 0, heatmap: [], knownByWeek: [], tests: [] } }),
  });
  renderAt(<StatsPage />, '/stats');
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  fail = false;
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByTestId('stat-streak')).toHaveTextContent(/^0$/);
  expect(screen.getByText('Chưa làm bài kiểm tra nào')).toBeInTheDocument();
  expect(screen.getByText('Cần ít nhất 2 tuần dữ liệu để vẽ biểu đồ.')).toBeInTheDocument();
});

test('bảng IPA đủ 44 âm, bấm âm thì đọc từ ví dụ', async () => {
  const spoken = stubSpeech();
  renderAt(<IpaPage />, '/ipa');
  expect(IPA_GROUPS.flatMap((g) => g.sounds)).toHaveLength(44);
  await userEvent.click(screen.getByRole('button', { name: '/iː/ sheep' }));
  expect(spoken[0].text).toBe('sheep');
});
