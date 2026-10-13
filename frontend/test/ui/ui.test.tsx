import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from '@/ui/button';
import { ProgressBar } from '@/ui/progress-bar';
import { Segmented } from '@/ui/segmented';
import { StatTile } from '@/ui/stat-tile';
import { SkillTile } from '@/ui/skill-tile';
import { PageHeader } from '@/ui/page-header';
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

test('SkillTile: tên đọc riêng, tông trung tính cho đích không phải kỹ năng, icon neo đỉnh mặc định', () => {
  renderAt(<>
    <SkillTile to="/roadmap" label="Lộ trình" ariaLabel="Mở lộ trình" icon="map" tone="neutral" />
    <SkillTile to="/ipa" label="Phát âm IPA" icon="mic" tone="PRONUNCIATION" align="center" />
  </>);
  const roadmap = screen.getByRole('link', { name: 'Mở lộ trình' });
  expect(roadmap).toHaveAttribute('href', '/roadmap');
  expect(roadmap).toHaveTextContent('Lộ trình');
  expect(roadmap).toHaveClass('tone-neutral');
  expect(roadmap).toHaveAttribute('data-align', 'top');
  const ipa = screen.getByRole('link', { name: 'Phát âm IPA' });
  expect(ipa).toHaveClass('tone-pronunciation');
  expect(ipa).toHaveAttribute('data-align', 'center');
});

test('PageHeader: tiêu đề dài vẫn đọc đủ khi bị cắt còn 2 dòng', () => {
  renderAt(<><PageHeader title="Chào, Nguyễn Thị Phương Thảo Nguyên" /><PageHeader title="Tiến độ" /></>);
  const long = screen.getByRole('heading', { level: 1, name: 'Chào, Nguyễn Thị Phương Thảo Nguyên' });
  expect(long).toHaveAttribute('title', 'Chào, Nguyễn Thị Phương Thảo Nguyên');
  expect(screen.getByRole('heading', { level: 1, name: 'Tiến độ' })).not.toHaveAttribute('title');
});
