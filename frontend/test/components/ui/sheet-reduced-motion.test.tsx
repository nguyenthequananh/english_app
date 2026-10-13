import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet } from '@/components/ui/sheet';

/*
 * File riêng: motion đọc `(prefers-reduced-motion)` một lần cho cả module, nên giả "đang bật giảm chuyển động"
 * phải làm trước lần render đầu tiên của file.
 */
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
});

function Harness({ onChange }: { onChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Sheet open={open} onOpenChange={(o) => { onChange(o); setOpen(o); }} title="Bảng thử">
      <input aria-label="Tên" />
    </Sheet>
  );
}

test('giảm chuyển động: vẫn có thanh nắm và kéo được theo ngón tay, thả ra thì về chỗ ngay', async () => {
  render(<Harness onChange={() => undefined} />);
  const popup = await screen.findByRole('dialog');
  await waitFor(() => expect(popup.style.opacity).toBe('1'));
  expect(popup.querySelector('[data-grabber]')).toBeInTheDocument();

  const title = screen.getByText('Bảng thử');
  fireEvent.pointerDown(title, { pointerId: 1, button: 0, clientY: 100 });
  fireEvent.pointerMove(title, { pointerId: 1, clientY: 160 });
  // Motion ghi style ở khung hình kế tiếp
  await waitFor(() => expect(popup.style.transform).toBe('translateY(60px)'));
  // Giữ yên quá cửa sổ đo vận tốc rồi mới thả ⇒ vận tốc 0, chưa quá nửa bảng ⇒ ở lại
  await new Promise((r) => setTimeout(r, 150));
  fireEvent.pointerUp(title, { pointerId: 1, clientY: 160 });
  await waitFor(() => expect(popup.style.transform).toMatch(/^(none|translateY\(0px\))?$/));
  expect(popup.style.opacity).toBe('1');
});

test('giảm chuyển động: nút Đóng mờ đi rồi báo trang cha và gỡ bảng', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Harness onChange={onChange} />);
  const popup = await screen.findByRole('dialog');
  await waitFor(() => expect(popup.style.opacity).toBe('1'));
  await user.click(screen.getByRole('button', { name: 'Đóng' }));
  expect(onChange).not.toHaveBeenCalled();
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(false));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
