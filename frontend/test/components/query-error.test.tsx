import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/api/api-error';
import { QueryError, isRetryable } from '@/components/query-error';
import { renderAt } from '@test/render';

const back = { to: '/roadmap', label: 'Về lộ trình' };

test.each([
  ['409 bài bị khoá', new ApiError(409, 'UNIT_LOCKED', 'Unit này chưa được mở khoá')],
  ['404 không có', new ApiError(404, 'NOT_FOUND', 'Không tìm thấy bài')],
  ['403 không được phép', new ApiError(403, 'FORBIDDEN', 'Không có quyền')],
])('%s: không mời "Thử lại" (bấm lại vẫn vậy), chỉ có đường quay về', (_name, error) => {
  renderAt(<QueryError error={error} onRetry={() => undefined} backTo={back} />);
  expect(screen.getByText(error.message)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về lộ trình' })).toHaveAttribute('href', '/roadmap');
});

test.each([
  ['mất kết nối', new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.')],
  ['500 máy chủ lỗi', new ApiError(500, 'INTERNAL', 'Máy chủ lỗi')],
  ['408 quá hạn chờ', new ApiError(408, 'HTTP_408', 'Quá thời gian chờ')],
  ['429 quá tải', new ApiError(429, 'HTTP_429', 'Thử lại sau')],
])('%s: có "Thử lại" và bấm thì gọi lại', async (_name, error) => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  renderAt(<QueryError error={error} onRetry={onRetry} backTo={back} />);
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(onRetry).toHaveBeenCalledOnce();
  expect(screen.getByRole('link', { name: 'Về lộ trình' })).toBeInTheDocument();
});

test('lỗi không rõ (không phải ApiError) vẫn cho thử lại', () => {
  expect(isRetryable(new TypeError('x is undefined'))).toBe(true);
  renderAt(<QueryError error={new TypeError('x')} onRetry={() => undefined} />);
  expect(screen.getByText('Không tải được dữ liệu.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
});

test('lỗi 4xx không có đường quay về thì không hiện hàng nút trống', () => {
  renderAt(<QueryError error={new ApiError(409, 'TEST_NOT_READY', 'Chưa sẵn sàng')} onRetry={() => undefined} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Chưa sẵn sàng');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
