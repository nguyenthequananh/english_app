import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import RouteError from '@/shell/route-error';
import { renderRoute } from '@test/render';
import { mockApi } from '@test/mock-api';
import { stubSpeech } from '@test/speech-stub';

// Hai trang "hỏng khi render" — một trong AppShell, một trong FocusShell. Router tải trang bằng import() động,
// vi.mock áp cho cả import động nên route lazy nhận đúng component giả này.
vi.mock('@/pages/ipa-page', () => ({
  default: function BrokenIpaPage(): never {
    throw new Error('IPA hỏng');
  },
}));
vi.mock('@/pages/review-page', () => ({
  default: function BrokenReviewPage(): never {
    throw new Error('Ôn thẻ hỏng');
  },
}));

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };

function signedIn() {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }) });
}

test('trang trong AppShell lỗi khi render: báo lỗi trong vùng nội dung, nav vẫn còn', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  signedIn();
  renderRoute('/ipa');
  const error = await screen.findByTestId('route-error');
  expect(error).toHaveAttribute('data-variant', 'app');
  expect(within(screen.getByTestId('app-shell')).getByTestId('route-error')).toBe(error);
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'Lộ trình' })).toBeInTheDocument();
  expect(within(error).getByText('Có lỗi khi hiển thị trang này.')).toBeInTheDocument();
  expect(within(error).getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  // Lỗi được ghi ra console để còn lần được nguyên nhân.
  expect(consoleError).toHaveBeenCalledWith(expect.objectContaining({ message: 'IPA hỏng' }));
});

test('trang trong FocusShell lỗi khi render: có thanh trên để quay về trang chủ, không có nav', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  signedIn();
  renderRoute('/review');
  const error = await screen.findByTestId('route-error');
  expect(error).toHaveAttribute('data-variant', 'focus');
  expect(within(screen.getByTestId('focus-shell')).getByTestId('route-error')).toBe(error);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Có lỗi' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Quay lại' })).toHaveAttribute('href', '/');
});

test('không tải được chunk của trang (app vừa cập nhật): mời tải lại trang thay vì về trang chủ', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const router = createMemoryRouter([
    {
      errorElement: <RouteError variant="app" />,
      children: [
        {
          path: '/',
          lazy: async () => {
            throw new TypeError('Failed to fetch dynamically imported module: http://localhost/assets/stats-page-OLD.js');
          },
        },
      ],
    },
  ]);
  render(<RouterProvider router={router} />);
  const error = await screen.findByTestId('route-error');
  expect(within(error).getByText('Không tải được trang này.')).toBeInTheDocument();
  expect(within(error).getByRole('button', { name: 'Tải lại trang' })).toBeInTheDocument();
  expect(within(error).queryByRole('link', { name: 'Về trang chủ' })).not.toBeInTheDocument();
});
