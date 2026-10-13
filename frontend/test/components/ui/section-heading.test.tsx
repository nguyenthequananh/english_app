import { screen } from '@testing-library/react';
import { Eyebrow, SectionTitle } from '@/components/ui/section-heading';
import { renderAt } from '@test/render';

test('Eyebrow mặc định là đoạn văn, đổi thẻ theo `as` và giữ id', () => {
  renderAt(<>
    <Eyebrow>Buổi học hôm nay</Eyebrow>
    <Eyebrow as="h2" id="nhom">Học mỗi ngày</Eyebrow>
  </>);
  expect(screen.getByText('Buổi học hôm nay').tagName).toBe('P');
  const heading = screen.getByRole('heading', { level: 2, name: 'Học mỗi ngày' });
  expect(heading).toHaveAttribute('id', 'nhom');
});

test('Eyebrow dạng legend đặt tên cho fieldset', () => {
  renderAt(<fieldset><Eyebrow as="legend">Không bắt buộc</Eyebrow></fieldset>);
  expect(screen.getByRole('group', { name: 'Không bắt buộc' })).toBeInTheDocument();
});

test('SectionTitle là h2 đặt tên được cho section, aside nằm ngoài tên', () => {
  renderAt(
    <section aria-labelledby="stats-heatmap">
      <SectionTitle id="stats-heatmap" aside={<span>26 tuần gần nhất</span>}>Lịch học</SectionTitle>
    </section>,
  );
  expect(screen.getByRole('heading', { level: 2, name: 'Lịch học' })).toHaveAttribute('id', 'stats-heatmap');
  expect(screen.getByRole('region', { name: 'Lịch học' })).toHaveTextContent('26 tuần gần nhất');
});
