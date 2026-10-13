import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import LessonPage from '@/pages/lesson-page';
import TestPage from '@/pages/test-page';
import { renderAt } from '@test/render';
import { mockApi, problem } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const lesson = {
  code: 'S0-U01-G1', unitCode: 'S0-U01', type: 'GRAMMAR', day: 'MON', title: 'Thì hiện tại đơn',
  bodyMd: '## Cách dùng\n\nDùng cho **thói quen**.', bestScore: null,
  exercises: [{ code: 'E1', type: 'MCQ', prompt: 'She ___ to school.', options: ['go', 'goes'] }],
};
const unitTest = { code: 'S0-U01-T', kind: 'UNIT', passRatio: 0.6, exercises: lesson.exercises };

function renderRoutes(route: string) {
  renderAt(
    <Routes>
      <Route path="/roadmap" element={<p>LỘ TRÌNH</p>} />
      <Route path="/lessons/:code" element={<LessonPage />} />
      <Route path="/units/:code/test" element={<TestPage kind="UNIT" />} />
      <Route path="/stages/:code/test" element={<TestPage kind="STAGE" />} />
    </Routes>,
    route,
  );
}

test('bài học hiện markdown, nộp bài xong hiện điểm và về lộ trình', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({
    'GET /lessons/S0-U01-G1': () => ({ body: lesson }),
    'POST /lessons/S0-U01-G1/submit': () => ({ body: { score: 1, results: [{ code: 'E1', given: 'goes', correct: true, answer: 'goes', explanationVi: null }] } }),
  });
  renderRoutes('/lessons/S0-U01-G1');
  expect(await screen.findByRole('heading', { name: 'Cách dùng' })).toBeInTheDocument();
  await user.click(screen.getByLabelText('goes'));
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText('Điểm: 100%')).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ answers: { E1: 'goes' } });
  await user.click(screen.getByRole('button', { name: 'Về lộ trình' }));
  expect(await screen.findByText('LỘ TRÌNH')).toBeInTheDocument();
});

test('bài không có bài tập thì có nút đánh dấu đã học', async () => {
  const user = userEvent.setup();
  const calls = mockApi({
    'GET /lessons/S0-U01-R1': () => ({ body: { ...lesson, code: 'S0-U01-R1', exercises: [] } }),
    'POST /lessons/S0-U01-R1/submit': () => ({ body: { score: 1, results: [] } }),
  });
  renderRoutes('/lessons/S0-U01-R1');
  await user.click(await screen.findByRole('button', { name: 'Đã học xong bài này' }));
  expect(await screen.findByRole('button', { name: 'Về lộ trình' })).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ answers: {} });
});

test('chưa học hết bài thì bài kiểm tra unit báo chưa sẵn sàng', async () => {
  mockApi({ 'GET /units/S0-U01/test': () => problem(409, 'TEST_NOT_READY', 'Cần hoàn thành tất cả bài học của unit trước') });
  renderRoutes('/units/S0-U01/test');
  expect(await screen.findByText('Cần hoàn thành tất cả bài học của unit trước')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về lộ trình' })).toBeInTheDocument();
});

test('qua bài kiểm tra unit thì báo đạt và mở unit tiếp theo', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /units/S0-U01/test': () => ({ body: unitTest }),
    'POST /tests/S0-U01-T/submit': () => ({ body: { score: 1, passed: true, results: [], weakUnits: [] } }),
  });
  renderRoutes('/units/S0-U01/test');
  await user.click(await screen.findByLabelText('goes'));
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText(/Unit tiếp theo đã mở/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Điểm bài kiểm tra' })).toHaveAttribute('aria-valuenow', '100');
  expect(screen.getByText('Đạt')).toBeInTheDocument();
});

test('trượt bài chuyển chặng thì hiện unit nên ôn và cho làm lại', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /stages/S0/test': () => ({ body: { ...unitTest, code: 'S0-T', kind: 'STAGE', passRatio: 0.7 } }),
    'POST /tests/S0-T/submit': () => ({ body: { score: 0.5, passed: false, results: [], weakUnits: ['S0-U01'] } }),
  });
  renderRoutes('/stages/S0/test');
  await user.click(await screen.findByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText('Cần 70% để qua.')).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Điểm bài kiểm tra' })).toHaveAttribute('aria-valuenow', '50');
  expect(screen.getByText('Chưa đạt')).toBeInTheDocument();
  expect(screen.getByText(/S0-U01/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Làm lại' }));
  expect(screen.getByRole('button', { name: 'Nộp bài' })).toBeInTheDocument();
});

test('bài học bị khoá: hiện lỗi từ backend, thử lại thì tải được bài', async () => {
  const user = userEvent.setup();
  let locked = true;
  const calls = mockApi({
    'GET /lessons/S0-U01-G1': () => (locked ? problem(403, 'UNIT_LOCKED', 'Unit này chưa được mở khoá') : { body: lesson }),
  });
  renderRoutes('/lessons/S0-U01-G1');
  expect(await screen.findByText('Unit này chưa được mở khoá')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về lộ trình' })).toHaveAttribute('href', '/roadmap');
  locked = false;
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByRole('heading', { name: 'Thì hiện tại đơn' })).toBeInTheDocument();
  expect(calls.filter((c) => c.path === '/lessons/S0-U01-G1')).toHaveLength(2);
});
