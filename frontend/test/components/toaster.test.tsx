import { act, render, screen } from '@testing-library/react';
import { Toaster, toast, notifyError } from '@/components/toaster';
import { ApiError } from '@/api/api-error';

test('toast hiện thông báo, lỗi PROFILE_REQUIRED thì không', () => {
  render(<Toaster />);
  act(() => toast('Đã lưu'));
  expect(screen.getByText('Đã lưu')).toBeInTheDocument();
  act(() => notifyError(new ApiError(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ')));
  expect(screen.queryByText('Chưa chọn hồ sơ')).not.toBeInTheDocument();
  act(() => notifyError(new ApiError(409, 'WORD_EXISTS', 'Từ này đã có trong kho')));
  expect(screen.getByText('Từ này đã có trong kho')).toBeInTheDocument();
});
