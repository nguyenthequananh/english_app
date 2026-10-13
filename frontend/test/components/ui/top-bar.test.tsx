import { screen } from '@testing-library/react';
import { TopBar } from '@/components/ui/top-bar';
import { renderAt } from '@test/render';

test('tiêu đề và phụ đề bị cắt "…" vẫn xem được đầy đủ qua title; nút quay lại có tên', () => {
  const title = 'To be (am/is/are) và đại từ nhân xưng — chủ ngữ số ít, số nhiều';
  renderAt(<TopBar title={title} subtitle="Thứ 2 · Ngữ pháp" back="/roadmap" />, '/lessons/S0-U01-G1');
  expect(screen.getByRole('heading', { level: 1, name: title })).toHaveAttribute('title', title);
  expect(screen.getByText('Thứ 2 · Ngữ pháp')).toHaveAttribute('title', 'Thứ 2 · Ngữ pháp');
  expect(screen.getByRole('link', { name: 'Quay lại' })).toHaveAttribute('href', '/roadmap');
});
