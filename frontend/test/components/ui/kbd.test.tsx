import { screen } from '@testing-library/react';
import { Kbd } from '@/components/ui/kbd';
import { renderAt } from '@test/render';

test('Kbd là gợi ý thị giác: không làm đổi tên nút', () => {
  renderAt(<button type="button">Lật thẻ <Kbd>Space</Kbd></button>);
  expect(screen.getByRole('button', { name: 'Lật thẻ' })).toBeInTheDocument();
  expect(screen.getByText('Space').tagName).toBe('KBD');
  expect(screen.getByText('Space')).toHaveAttribute('aria-hidden', 'true');
});
