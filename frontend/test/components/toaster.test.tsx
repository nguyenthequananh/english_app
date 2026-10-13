import { act, render, screen } from '@testing-library/react';
import { Toaster, toast, notifyError } from '@/components/toaster';
import { ApiError } from '@/api/api-error';

test('toast hiện thông báo, lỗi PROFILE_REQUIRED thì không', async () => {
  render(<Toaster />);
  act(() => toast('Đã lưu'));
  expect(await screen.findByText('Đã lưu')).toBeInTheDocument();

  // sonner thêm thông báo qua setTimeout theo đúng thứ tự gọi: đợi một thông báo bắn SAU PROFILE_REQUIRED hiện ra
  // rồi mới kiểm tra vắng mặt — nếu PROFILE_REQUIRED có bị bắn thì lúc này nó cũng đã ở trong DOM.
  act(() => notifyError(new ApiError(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ')));
  act(() => notifyError(new ApiError(409, 'WORD_EXISTS', 'Từ này đã có trong kho')));
  expect(await screen.findByText('Từ này đã có trong kho')).toBeInTheDocument();
  expect(screen.queryByText('Chưa chọn hồ sơ')).not.toBeInTheDocument();
});

test('vùng thông báo có nhãn tiếng Việt cho trình đọc màn hình', () => {
  render(<Toaster />);
  expect(screen.getByRole('region', { name: /Thông báo/ })).toBeInTheDocument();
});
