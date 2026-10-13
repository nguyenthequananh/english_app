import { screen } from '@testing-library/react';
import { Spinner } from '@/components/ui/spinner';
import { renderAt } from '@test/render';

test('Spinner chỉ để nhìn: ẩn với trình đọc màn hình, giữ lớp quay được miễn trừ giảm chuyển động', () => {
  const { container } = renderAt(<div role="status">Đang tải… <Spinner size={18} className="text-accent" /></div>);
  const svg = container.querySelector('svg')!;
  expect(svg).toHaveAttribute('aria-hidden', 'true');
  expect(svg).toHaveAttribute('width', '18');
  expect(svg).toHaveAttribute('height', '18');
  expect(svg).toHaveClass('animate-spin', 'text-accent');
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải…');
});

test('Spinner mặc định 28px và vẽ bằng currentColor', () => {
  const { container } = renderAt(<Spinner />);
  const svg = container.querySelector('svg')!;
  expect(svg).toHaveAttribute('width', '28');
  svg.querySelectorAll('circle, path').forEach((el) => expect(el).toHaveAttribute('stroke', 'currentColor'));
});
