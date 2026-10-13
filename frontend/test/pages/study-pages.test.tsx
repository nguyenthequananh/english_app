import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { createQueryClient } from '@/config/query-client';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import TodayPage from '@/pages/today-page';
import SessionPage from '@/pages/session-page';
import ReviewPage from '@/pages/review-page';
import { renderAt } from '@test/render';
import { mockApi, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';
import { toIsoDate } from '@/dates';
import type { SessionView, Word } from '@/types/api';

const word = (id: number, headword: string): Word => ({
  id, headword, pos: 'noun', ipaUs: null, ipaUk: null, meaningVi: `nghĩa ${headword}`,
  exampleEn: null, exampleVi: null, cefr: 'A1', source: 'OXFORD',
});
const view = (over: Partial<SessionView>): SessionView => ({
  studyDate: '2026-10-07', step: 'NEW', currentCard: word(1, 'hello'), reviewsLeft: 0, newLeft: 2,
  lessonCode: 'S0-U01-G1', cardsDone: 0, finished: false, ...over,
});

function renderRoutes(route: string) {
  renderAt(
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/review" element={<ReviewPage />} />
    </Routes>,
    route,
  );
}

test('trang Hôm nay: chuỗi ngày, thẻ đến hạn, tiến độ unit và nút bắt đầu', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: {
    streak: 3, dueCount: 12, finishedToday: false,
    currentUnit: { code: 'S0-U01', title: 'Chào hỏi', lessonsDone: 1, lessonsTotal: 2, testReady: false },
  } }) });
  renderRoutes('/');
  expect(await screen.findByTestId('today-streak')).toHaveTextContent('3');
  expect(screen.getByText('ngày liên tiếp')).toBeInTheDocument();
  expect(screen.getByTestId('today-due')).toHaveTextContent('12');
  expect(screen.getByText('thẻ đến hạn')).toBeInTheDocument();
  expect(screen.getByText('1/2 bài')).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Tiến độ unit S0-U01' })).toHaveAttribute('aria-valuenow', '50');
  expect(screen.getByRole('link', { name: 'Bắt đầu buổi học' })).toHaveAttribute('href', '/session');
});

test('trang Hôm nay: số lớn có dấu ngăn cách hàng nghìn', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: { streak: 1284, dueCount: 12345, finishedToday: false, currentUnit: null } }) });
  renderRoutes('/');
  expect(await screen.findByTestId('today-streak')).toHaveTextContent('1.284');
  expect(screen.getByTestId('today-due')).toHaveTextContent('12.345');
  expect(screen.getByText('12.345 thẻ cần ôn')).toBeInTheDocument();
});

test('trang Hôm nay: chào theo tên hồ sơ, lưới Luyện tập dẫn tới các màn phụ', async () => {
  mockApi({
    'GET /profiles/current': () => ({ body: { id: 1, name: 'Lan', avatar: null, hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 } }),
    'GET /progress/summary': () => ({ body: { streak: 0, dueCount: 0, finishedToday: false, currentUnit: null } }),
    'GET /roadmap': () => ({ body: { stages: [
      { code: 'S0', title: 'Xây nền', targetBand: 4, status: 'DONE', testAvailable: true, units: [{ code: 'S0-U01', title: 'Chào hỏi', status: 'DONE' }] },
    ] } }),
  });
  renderRoutes('/');
  expect(await screen.findByRole('heading', { level: 1, name: 'Chào, Lan' })).toBeInTheDocument();
  expect(await screen.findByText(/khoảng 30 phút/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ôn thẻ' })).toHaveAttribute('href', '/review');
  expect(screen.getByRole('link', { name: 'Kho từ' })).toHaveAttribute('href', '/words');
  expect(screen.getByRole('link', { name: 'Phát âm IPA' })).toHaveAttribute('href', '/ipa');
  // Ô Lộ trình đổi tên đọc để không trùng với mục "Lộ trình" của thanh điều hướng.
  expect(screen.getByRole('link', { name: 'Mở lộ trình' })).toHaveAttribute('href', '/roadmap');
  expect(await screen.findByText('Bạn đã học hết nội dung hiện có.')).toBeInTheDocument();
});

const noUnitSummary = { streak: 0, dueCount: 0, finishedToday: false, currentUnit: null };

test('trang Hôm nay: chưa nạp nội dung thì mời nạp, không báo đã học hết', async () => {
  mockApi({
    'GET /progress/summary': () => ({ body: noUnitSummary }),
    'GET /roadmap': () => ({ body: { stages: [] } }),
  });
  renderRoutes('/');
  expect(await screen.findByText('Chưa có nội dung để học')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Nạp nội dung trong Cá nhân' })).toHaveAttribute('href', '/settings');
  expect(screen.queryByText('Bạn đã học hết nội dung hiện có.')).not.toBeInTheDocument();
});

test('trang Hôm nay: xong các unit nhưng chưa qua kiểm tra chặng thì mời làm bài kiểm tra chặng', async () => {
  mockApi({
    'GET /progress/summary': () => ({ body: noUnitSummary }),
    'GET /roadmap': () => ({ body: { stages: [
      { code: 'S0', title: 'Xây nền', targetBand: 4, status: 'ACTIVE', testAvailable: true, units: [{ code: 'S0-U01', title: 'Chào hỏi', status: 'DONE' }] },
      { code: 'S1', title: 'Tăng tốc', targetBand: 5, status: 'LOCKED', testAvailable: false, units: [{ code: 'S1-U01', title: 'Gia đình', status: 'LOCKED' }] },
    ] } }),
  });
  renderRoutes('/');
  expect(await screen.findByText('Đã học xong các unit của chặng')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Làm bài kiểm tra chặng' })).toHaveAttribute('href', '/stages/S0/test');
});

test('trang Hôm nay: không đọc được lộ trình thì không đoán là đã học hết', async () => {
  mockApi({
    'GET /progress/summary': () => ({ body: noUnitSummary }),
    'GET /roadmap': () => problem(500, 'INTERNAL', 'Lỗi'),
  });
  renderRoutes('/');
  expect(await screen.findByText('Chưa có unit đang học')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Xem lộ trình' })).toHaveAttribute('href', '/roadmap');
  expect(screen.queryByText('Bạn đã học hết nội dung hiện có.')).not.toBeInTheDocument();
});

test('trang Hôm nay: unit chưa có bài thì không hiện 0% và 0/0 bài', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: {
    streak: 0, dueCount: 0, finishedToday: false,
    currentUnit: { code: 'S0-U02', title: 'Gia đình', lessonsDone: 0, lessonsTotal: 0, testReady: false },
  } }) });
  renderRoutes('/');
  expect(await screen.findByText('Unit chưa có bài học')).toBeInTheDocument();
  expect(screen.queryByRole('progressbar', { name: 'Tiến độ unit S0-U02' })).not.toBeInTheDocument();
  expect(screen.queryByText('0/0 bài')).not.toBeInTheDocument();
});

test('trang Hôm nay: buổi học đang dở thì nút đổi thành Tiếp tục, không tự gọi tạo buổi học', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({
    'GET /session/today': () => ({ body: view({ studyDate: toIsoDate(new Date()), reviewsLeft: 0, newLeft: 2, cardsDone: 1 }) }),
    'GET /progress/summary': () => ({ body: { streak: 2, dueCount: 0, finishedToday: false, currentUnit: null } }),
  });
  renderRoutes('/session');
  await screen.findByText('hello');
  await user.click(screen.getByRole('link', { name: 'Quay lại' }));
  expect(await screen.findByRole('link', { name: 'Tiếp tục buổi học' })).toHaveAttribute('href', '/session');
  expect(screen.getByText('Còn 2 từ mới')).toBeInTheDocument();
  expect(calls.filter((c) => c.path === '/session/today')).toHaveLength(1);
});

test('đã học xong hôm nay và unit đủ bài thì mời ôn thêm và làm bài kiểm tra', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: {
    streak: 1, dueCount: 0, finishedToday: true,
    currentUnit: { code: 'S0-U01', title: 'Chào hỏi', lessonsDone: 2, lessonsTotal: 2, testReady: true },
  } }) });
  renderRoutes('/');
  expect(await screen.findByText('Bạn đã hoàn thành buổi học hôm nay')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ôn thêm' })).toHaveAttribute('href', '/review');
  expect(screen.getByRole('link', { name: 'Làm bài kiểm tra unit' })).toHaveAttribute('href', '/units/S0-U01/test');
});

test('buổi học: chấm thẻ gửi đúng từ và chuyển sang thẻ kế', async () => {
  stubSpeech();
  const calls = mockApi({
    'GET /session/today': () => ({ body: view({}) }),
    'POST /session/today/cards/1': () => ({ body: view({ currentCard: word(2, 'book'), newLeft: 1, cardsDone: 1 }) }),
  });
  renderRoutes('/session');
  expect(await screen.findByText('hello')).toBeInTheDocument();
  expect(screen.getByTestId('session-step')).toHaveAttribute('data-step', 'NEW');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '3' });
  expect(await screen.findByText('book')).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ grade: 'GOOD' });
});

test('buổi học: bị 409 CARD_MISMATCH thì tự tải lại buổi học', async () => {
  stubSpeech();
  let gets = 0;
  mockApi({
    'GET /session/today': () => {
      gets += 1;
      return { body: gets === 1 ? view({}) : view({ currentCard: word(2, 'book'), cardsDone: 1 }) };
    },
    'POST /session/today/cards/1': () => problem(409, 'CARD_MISMATCH', 'Thẻ không đúng thứ tự, hãy tải lại trang'),
  });
  renderRoutes('/session');
  await screen.findByText('hello');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '3' });
  expect(await screen.findByText('book')).toBeInTheDocument();
});

test('buổi học: bước bài chính rồi hoàn thành', async () => {
  const user = userEvent.setup();
  stubSpeech();
  let step: SessionView['step'] = 'LESSON';
  mockApi({
    'GET /session/today': () => ({ body: view({ step, currentCard: null, newLeft: 0, cardsDone: 3, finished: step === 'DONE' }) }),
    'GET /lessons/S0-U01-G1': () => ({ body: { code: 'S0-U01-G1', unitCode: 'S0-U01', type: 'GRAMMAR', day: 'MON', title: 'Thì hiện tại đơn', bodyMd: 'Nội dung', bestScore: null, exercises: [] } }),
    'POST /lessons/S0-U01-G1/submit': () => {
      step = 'DONE';
      return { body: { score: 1, results: [] } };
    },
  });
  renderRoutes('/session');
  await user.click(await screen.findByRole('button', { name: 'Đã học xong bài này' }));
  await user.click(await screen.findByRole('button', { name: 'Hoàn thành buổi học' }));
  expect(await screen.findByText('Xong buổi học hôm nay!')).toBeInTheDocument();
});

test('ôn thêm: chấm hết thẻ đến hạn thì báo hết thẻ', async () => {
  stubSpeech();
  const calls = mockApi({
    'GET /cards/due?limit=200': () => ({ body: [word(1, 'hello')] }),
    'POST /cards/1/review': () => ({ body: { ease: 2.5, intervalDays: 6, repetitions: 2, lapses: 0, dueDate: '2026-10-13' } }),
  });
  renderRoutes('/review');
  await screen.findByText('hello');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '4' });
  expect(await screen.findByText('Không còn thẻ nào đến hạn. Tuyệt!')).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ grade: 'EASY' });
});

test('ôn thêm: quay lại trang sau khi chấm hết thì tải danh sách mới, không chấm lại thẻ cũ', async () => {
  stubSpeech();
  let due: Word[] = [word(1, 'hello')];
  const calls = mockApi({
    'GET /cards/due?limit=200': () => ({ body: due }),
    'POST /cards/1/review': () => ({ body: { ease: 2.5, intervalDays: 6, repetitions: 2, lapses: 0, dueDate: '2026-10-13' } }),
  });
  const client = createQueryClient();
  const ui = (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/review']}><ReviewPage /></MemoryRouter>
    </QueryClientProvider>
  );
  const first = render(ui);
  await screen.findByText('hello');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '4' });
  expect(await screen.findByText('Không còn thẻ nào đến hạn. Tuyệt!')).toBeInTheDocument();
  first.unmount();
  await new Promise((r) => setTimeout(r, 0)); // gcTime 0 dọn query sau một tick, như khi người dùng chuyển trang

  due = [];
  render(ui);
  expect(await screen.findByText('Không còn thẻ nào đến hạn. Tuyệt!')).toBeInTheDocument();
  expect(calls.filter((c) => c.method === 'GET' && c.path === '/cards/due?limit=200')).toHaveLength(2);
});

test('buổi học: lỗi tải buổi học thì hiện thông báo và nút thử lại', async () => {
  mockApi({ 'GET /session/today': () => problem(500, 'INTERNAL', 'Có lỗi xảy ra, hãy thử lại') });
  renderRoutes('/session');
  expect(await screen.findByText('Có lỗi xảy ra, hãy thử lại')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
});

test('trang Hôm nay: lỗi tải tổng quan thì có nút thử lại', async () => {
  const user = userEvent.setup();
  let fail = true;
  mockApi({ 'GET /progress/summary': () => (fail ? problem(500, 'INTERNAL', 'Có lỗi xảy ra, hãy thử lại') : { body: {
    streak: 3, dueCount: 12, finishedToday: false, currentUnit: null,
  } }) });
  renderRoutes('/');
  expect(await screen.findByRole('alert')).toHaveTextContent('Có lỗi xảy ra, hãy thử lại');
  fail = false;
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByTestId('today-streak')).toHaveTextContent('3');
});

test('buổi học: xong thì có tổng kết và ba lối đi tiếp', async () => {
  mockApi({ 'GET /session/today': () => ({ body: view({ step: 'DONE', currentCard: null, newLeft: 0, cardsDone: 7, finished: true }) }) });
  renderRoutes('/session');
  expect(await screen.findByText('Xong buổi học hôm nay!')).toBeInTheDocument();
  expect(screen.getByText(/Bạn đã ôn/)).toHaveTextContent('Bạn đã ôn 7 thẻ.');
  expect(screen.getByTestId('session-step')).toHaveAttribute('data-step', 'DONE');
  expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Ôn thêm' })).toHaveAttribute('href', '/review');
  expect(screen.getByRole('link', { name: 'Lộ trình' })).toHaveAttribute('href', '/roadmap');
});

test('buổi học: thanh bước đánh dấu bước đang làm và số thẻ còn lại', async () => {
  stubSpeech();
  mockApi({ 'GET /session/today': () => ({ body: view({ step: 'NEW', newLeft: 4 }) }) });
  renderRoutes('/session');
  await screen.findByText('hello');
  const current = screen.getByRole('listitem', { current: 'step' });
  expect(current).toHaveTextContent('Từ mới');
  expect(current).toHaveTextContent('4 thẻ còn lại');
  const [review, , lesson] = screen.getAllByRole('listitem');
  expect(review).toHaveTextContent('Ôn tập, đã xong');
  expect(lesson).not.toHaveTextContent('đã xong');
});

test('ôn thêm: đếm thẻ còn lại trên thanh trên', async () => {
  stubSpeech();
  mockApi({
    'GET /cards/due?limit=200': () => ({ body: [word(1, 'hello'), word(2, 'book')] }),
    'POST /cards/1/review': () => ({ body: { ease: 2.5, intervalDays: 6, repetitions: 2, lapses: 0, dueDate: '2026-10-13' } }),
  });
  renderRoutes('/review');
  await screen.findByText('hello');
  expect(screen.getByText('Còn 2 thẻ')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '3' });
  expect(await screen.findByText('book')).toBeInTheDocument();
  expect(screen.getByText('Còn 1 thẻ')).toBeInTheDocument();
});
