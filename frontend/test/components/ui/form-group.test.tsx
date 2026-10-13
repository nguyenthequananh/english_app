import { screen } from '@testing-library/react';
import { FormGroup } from '@/components/ui/form-group';
import { renderAt } from '@test/render';

test('FormGroup có tiêu đề nhóm, ô nhập bên trong và chú thích', () => {
  renderAt(
    <FormGroup title="Bảo mật" footer="Đặt PIN nếu máy dùng chung.">
      <label>PIN <input /></label>
    </FormGroup>,
  );
  expect(screen.getByRole('heading', { level: 2, name: 'Bảo mật' })).toBeInTheDocument();
  expect(screen.getByLabelText('PIN')).toBeInTheDocument();
  expect(screen.getByText('Đặt PIN nếu máy dùng chung.')).toBeInTheDocument();
});

test('FormGroup không tiêu đề thì không có heading rỗng', () => {
  renderAt(<FormGroup><input aria-label="Tên" /></FormGroup>);
  expect(screen.queryByRole('heading')).toBeNull();
});
