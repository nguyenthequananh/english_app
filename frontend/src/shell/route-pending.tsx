import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';

/*
 * Màn chờ khi mở app thẳng vào một route mà chunk trang chưa tải (`hydrateFallbackElement`).
 * Chỉ dùng cho lần tải đầu: chuyển trang sau đó router giữ màn cũ tới khi chunk mới sẵn sàng.
 * Hiện ra sau một nhịp (`delay` + mờ dần bằng @starting-style) để chunk về nhanh thì không chớp khung giữ chỗ.
 */
const APPEAR = 'transition-opacity duration-(--duration-fast) delay-(--duration-fast) starting:opacity-0';

/** Khung giữ chỗ trong vùng nội dung của AppShell/FocusShell — shell (nav, TopBar của trang) vẫn ở nguyên. */
export function PagePending() {
  return (
    <div data-testid="page-pending" className={`space-y-4 pt-6 ${APPEAR}`}>
      <span className="sr-only" role="status">Đang tải trang…</span>
      <Skeleton className="h-9 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-32 w-full rounded-card" />
      <Skeleton className="h-20 w-full rounded-card" />
    </div>
  );
}

/** Màn chờ toàn trang cho route ngoài shell (Chọn hồ sơ, Tạo hồ sơ) — cùng dáng với màn chờ của RequireProfile. */
export function CenteredPending() {
  return (
    <div role="status" className={`flex min-h-dvh flex-col items-center justify-center gap-3 text-text-3 ${APPEAR}`}>
      <Spinner className="text-accent" />
      <p className="text-base">Đang tải…</p>
    </div>
  );
}
