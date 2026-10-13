import { cn } from './cn';

/** Khối giữ chỗ khi tải. aria-hidden — nơi dùng tự thêm `<span className="sr-only">Đang tải…</span>`. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-xl bg-fill', className)} />;
}
