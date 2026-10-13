import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '@/ui/button';
import { ProgressBar } from '@/ui/progress-bar';
import { Segmented } from '@/ui/segmented';
import { StatTile } from '@/ui/stat-tile';
import { TextField } from '@/ui/text-field';
import { renderAt } from '@test/render';

test('Button loading thì bị khoá và báo bận, tên không đổi', async () => {
  const onClick = vi.fn();
  renderAt(<Button loading onClick={onClick}>Lưu</Button>);
  const btn = screen.getByRole('button', { name: 'Lưu' });
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('aria-busy', 'true');
  await userEvent.click(btn);
  expect(onClick).not.toHaveBeenCalled();
});

test('ProgressBar có ngữ nghĩa progressbar theo phần trăm', () => {
  renderAt(<ProgressBar value={0.6} label="Tiến độ unit" />);
  const bar = screen.getByRole('progressbar', { name: 'Tiến độ unit' });
  expect(bar).toHaveAttribute('aria-valuenow', '60');
});

test('Segmented đổi giá trị bằng click', async () => {
  function Demo() {
    const [v, setV] = useState<'ALL' | 'NEW'>('ALL');
    return <><Segmented label="Trạng thái" value={v} onChange={setV}
      options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'NEW', label: 'Mới' }]} /><p>giá trị: {v}</p></>;
  }
  renderAt(<Demo />);
  await userEvent.click(screen.getByRole('radio', { name: 'Mới' }));
  expect(screen.getByText('giá trị: NEW')).toBeInTheDocument();
});

test('StatTile gắn testId lên phần tử chứa số', () => {
  renderAt(<StatTile icon="flame" value={12} label="Chuỗi ngày" testId="stat-streak" />);
  expect(screen.getByTestId('stat-streak')).toHaveTextContent(/^12$/);
});

test('TextField liên kết label với input', () => {
  renderAt(<TextField label="Tên" defaultValue="Lan" />);
  expect(screen.getByLabelText('Tên')).toHaveValue('Lan');
});
