import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sheet } from '@/components/ui/sheet';

/*
 * Hành vi đóng/mở của Sheet (bố cục điện thoại, không giảm chuyển động). jsdom không đo layout nên giả chiều cao
 * bảng 400px — lò xo chạy thật vài trăm ms, đủ để kiểm tra những gì xảy ra GIỮA lúc chạy ra.
 */
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
});

const SETTLE = { timeout: 2000 };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Harness({ onChange, reject = false }: { onChange: (open: boolean) => void; reject?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onChange(o);
        if (!reject) setOpen(o);
      }}
      title="Bảng thử"
    >
      <input aria-label="Tên" />
    </Sheet>
  );
}

/** Bảng đã nằm yên ở vị trí mở, nhìn thấy được. */
async function expectAtRest() {
  await waitFor(() => {
    const popup = screen.getByRole('dialog');
    expect(popup.style.transform).toMatch(/^(none|translateY\(0px\))?$/);
    expect(popup.style.opacity).toBe('1');
  }, SETTLE);
}

test('nút Đóng: bảng chạy ra hết rồi mới báo onOpenChange(false), sau đó mới gỡ khỏi DOM', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Harness onChange={onChange} />);
  await expectAtRest();
  await user.click(screen.getByRole('button', { name: 'Đóng' }));
  // Đang chạy ra: vẫn trong DOM, chưa báo trang cha
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(false), SETTLE);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(onChange).toHaveBeenCalledTimes(1);
});

test('Esc lần hai trong lúc đang chạy ra bị bỏ qua: chỉ báo đóng một lần', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Harness onChange={onChange} />);
  await expectAtRest();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), SETTLE);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(false);
});

test('trang cha mở lại giữa lúc chính nó đang đóng: bảng quay về, không bị gỡ', async () => {
  const onChange = vi.fn();
  const sheet = (open: boolean) => (
    <Sheet open={open} onOpenChange={onChange} title="Bảng thử"><input aria-label="Tên" /></Sheet>
  );
  const { rerender } = render(sheet(true));
  await expectAtRest();
  rerender(sheet(false));
  await sleep(60);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  rerender(sheet(true));
  await expectAtRest();
  await sleep(600); // lâu hơn một lượt chạy ra: nếu việc đóng còn treo thì bảng đã bị gỡ
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

test('trang cha không chịu đóng: bảng quay lại và vẫn dùng được, không thành lớp phủ vô hình', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<Harness onChange={onChange} reject />);
  await expectAtRest();
  await user.click(screen.getByRole('button', { name: 'Đóng' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(false), SETTLE);
  await expectAtRest();
  // Còn phản hồi: đóng lần nữa thì lại báo trang cha (không kẹt ở trạng thái "đã báo")
  await user.click(screen.getByRole('button', { name: 'Đóng' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2), SETTLE);
});
