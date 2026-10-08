import { screen } from '@testing-library/react';
import App from './App';
import { renderAt } from './test/render';

test('route /profiles hiển thị trang chọn hồ sơ', () => {
  renderAt(<App />, '/profiles');
  expect(screen.getByTestId('page-profiles')).toBeInTheDocument();
});

test('route lạ quay về trang chủ', () => {
  renderAt(<App />, '/khong-co');
  expect(screen.getByTestId('layout')).toBeInTheDocument();
});
