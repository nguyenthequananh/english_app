import { Outlet } from 'react-router';
import { HealthBanner } from '../components/health-banner';

/**
 * Màn tập trung (buổi học, ôn thẻ, bài học, kiểm tra): không điều hướng, toàn màn; mỗi trang tự có TopBar.
 * TopBar (`data-top-bar`) tràn hết chiều ngang; mọi phần tử con trực tiếp khác được căn giữa,
 * rộng tối đa 720px, đệm ngang 16px (xem `.focus-shell` trong index.css).
 */
export default function FocusShell() {
  return (
    <div data-testid="focus-shell" className="focus-shell min-h-dvh pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
      <HealthBanner />
      <Outlet />
    </div>
  );
}
