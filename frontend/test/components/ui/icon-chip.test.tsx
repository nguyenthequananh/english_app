import { IconChip } from '@/components/ui/icon-chip';
import { renderAt } from '@test/render';

test('IconChip chỉ để trang trí: ẩn với trình đọc màn hình, tông mặc định accent', () => {
  const { container } = renderAt(<><IconChip icon="download" /><IconChip icon="upload" tone="success" /></>);
  const [plain, success] = Array.from(container.querySelectorAll('span.tone-chip'));
  expect(plain).toHaveAttribute('aria-hidden', 'true');
  expect(plain).toHaveClass('tone-accent');
  expect(success).toHaveClass('tone-success');
  expect(plain.querySelector('svg')).not.toBeNull();
});
