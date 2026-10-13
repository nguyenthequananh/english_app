import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button, ButtonLink } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { TopBar } from '../components/ui/top-bar';
import { cn } from '../components/ui/cn';

/*
 * Thông điệp khi trình duyệt không tải được chunk của trang (import() động thất bại) — mỗi engine một câu:
 * Chromium, Firefox, Safari, và lỗi preload CSS của Vite. Hay gặp nhất sau khi app được cập nhật:
 * trang đang mở còn trỏ tới chunk cũ đã bị thay tên. Tải lại trang là đủ.
 */
const CHUNK_LOAD_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'ChunkLoadError' || CHUNK_LOAD_ERROR.test(error.message));
}

/**
 * Lỗi khi hiển thị route (`errorElement`). Ba chỗ đặt:
 * - `full` (mặc định): thay cả màn — route ngoài shell (Chọn/Tạo hồ sơ) và lỗi của chính shell.
 * - `app`: trong vùng nội dung của AppShell — nav vẫn còn để đi trang khác.
 * - `focus`: trong FocusShell — có thanh trên với nút về trang chủ, như TopBar của các màn tập trung.
 */
export default function RouteError({ variant = 'full' }: { variant?: 'full' | 'app' | 'focus' }) {
  const error = useRouteError();
  useEffect(() => {
    console.error(error);
  }, [error]);

  const chunk = isChunkLoadError(error);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = chunk ? 'Không tải được trang này.' : notFound ? 'Không tìm thấy trang này.' : 'Có lỗi khi hiển thị trang này.';
  const description = chunk
    ? 'App vừa được cập nhật hoặc kết nối bị gián đoạn. Tải lại trang để lấy bản mới — dữ liệu của bạn không bị ảnh hưởng.'
    : 'Dữ liệu của bạn không bị ảnh hưởng. Hãy quay về trang chủ rồi thử lại.';
  const action = chunk
    ? <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
    : <ButtonLink to="/">Về trang chủ</ButtonLink>;

  const card = (
    <Card role="alert" data-testid="route-error" data-variant={variant} padded={false} className={cn('w-full', variant === 'full' && 'max-w-sm')}>
      <EmptyState icon="cross" title={title} description={description} action={action} />
    </Card>
  );

  if (variant === 'app') return <div className="pt-6">{card}</div>;
  if (variant === 'focus') {
    return (
      <>
        <TopBar title="Có lỗi" back="/" />
        <div className="pt-4">{card}</div>
      </>
    );
  }
  return <div className="flex min-h-dvh items-center justify-center p-4">{card}</div>;
}
