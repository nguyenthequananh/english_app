import { Outlet } from 'react-router';
import { HealthBanner } from '../components/health-banner';

/** Màn tập trung (buổi học, ôn thẻ, bài học, kiểm tra): không điều hướng; mỗi trang tự có TopBar. */
export default function FocusShell() {
  return (
    <div data-testid="focus-shell">
      <HealthBanner />
      <Outlet />
    </div>
  );
}
