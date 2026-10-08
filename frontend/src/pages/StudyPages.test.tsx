import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { createQueryClient } from '../api/queryClient';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import TodayPage from './TodayPage';
import SessionPage from './SessionPage';
import ReviewPage from './ReviewPage';
import { renderAt } from '../test/render';
import { mockApi, problem } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';
import type { SessionView, Word } from '../api/types';

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
  expect(await screen.findByText('🔥 3 ngày liên tiếp')).toBeInTheDocument();
  expect(screen.getByText('12 thẻ đến hạn')).toBeInTheDocument();
  expect(screen.getByText('1/2 bài')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Bắt đầu buổi học' })).toHaveAttribute('href', '/session');
});

test('đã học xong hôm nay và unit đủ bài thì mời ôn thêm và làm bài kiểm tra', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: {
    streak: 1, dueCount: 0, finishedToday: true,
    currentUnit: { code: 'S0-U01', title: 'Chào hỏi', lessonsDone: 2, lessonsTotal: 2, testReady: true },
  } }) });
  renderRoutes('/');
  expect(await screen.findByText('✓ Bạn đã hoàn thành buổi học hôm nay')).toBeInTheDocument();
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
  expect(await screen.findByText('🎉 Xong buổi học hôm nay!')).toBeInTheDocument();
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
