import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoadmapPage from '@/pages/roadmap-page';
import WordBankPage from '@/pages/word-bank-page';
import { renderAt } from '@test/render';
import { mockApi } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

const roadmap = { stages: [
  { code: 'S0', title: 'Xây nền', targetBand: 4, status: 'ACTIVE', testAvailable: true, units: [
    { code: 'S0-U01', title: 'Chào hỏi', status: 'DONE' },
    { code: 'S0-U02', title: 'Mạo từ', status: 'LOCKED' },
  ] },
] };

test('lộ trình: unit khoá không mở được, unit đã mở xem được bài và bài kiểm tra', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /roadmap': () => ({ body: roadmap }),
    'GET /units/S0-U01/lessons': () => ({ body: [
      { code: 'S0-U01-G1', type: 'GRAMMAR', day: 'MON', title: 'Thì hiện tại đơn', sortOrder: 1, completed: true },
    ] }),
  });
  renderAt(<RoadmapPage />, '/roadmap');
  expect(await screen.findByText('Mục tiêu band 4')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Làm bài kiểm tra chuyển chặng' })).toHaveAttribute('href', '/stages/S0/test');
  expect(screen.queryByRole('button', { name: /S0-U02/ })).not.toBeInTheDocument();
  expect(screen.getByText('Chưa mở')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /S0-U01/ }));
  expect(await screen.findByRole('link', { name: /Thì hiện tại đơn/ })).toHaveAttribute('href', '/lessons/S0-U01-G1');
  expect(screen.getByText(/Thứ 2 · Ngữ pháp/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Bài kiểm tra unit' })).toHaveAttribute('href', '/units/S0-U01/test');
});

test('kho từ: lọc theo trạng thái và thêm từ', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const item = { word: { id: 1, headword: 'book', pos: 'noun', ipaUs: '/bʊk/', ipaUk: null, meaningVi: 'quyển sách', exampleEn: null, exampleVi: null, cefr: 'A1', source: 'OXFORD' }, status: 'LEARNING', dueDate: '2026-10-08' };
  const calls = mockApi({
    'GET /words': () => ({ body: [item] }),
    'GET /words?status=KNOWN': () => ({ body: [] }),
    'POST /words': () => ({ status: 201, body: { ...item.word, id: 9, headword: 'serendipity', source: 'USER' } }),
  });
  renderAt(<WordBankPage />, '/words');
  expect(await screen.findByText('quyển sách')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Đang học' })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Trạng thái'), 'KNOWN');
  expect(await screen.findByText('Không có từ nào')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Thêm từ của bạn' }));
  await user.type(screen.getByLabelText('Từ'), 'serendipity');
  await user.type(screen.getByLabelText('Loại từ'), 'noun');
  await user.type(screen.getByLabelText('Nghĩa tiếng Việt'), 'sự tình cờ may mắn');
  await user.click(screen.getByRole('button', { name: 'Lưu từ' }));
  await screen.findByRole('button', { name: 'Thêm từ của bạn' });
  expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ headword: 'serendipity', pos: 'noun', meaningVi: 'sự tình cờ may mắn' });
});
