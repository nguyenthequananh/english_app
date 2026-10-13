import { cn } from './cn';

/**
 * Vòng quay chờ: màu theo `currentColor` (đặt `text-accent`… ở nơi dùng), ẩn với trình đọc màn hình — trạng thái
 * "đang tải" phải được nói bằng chữ (`role="status"`, `aria-busy`) ở phần tử chứa nó. Lớp `animate-spin` được
 * miễn trừ khỏi giảm chuyển động trong `index.css` (quay chậm lại chứ không đứng im, đứng im trông như treo).
 */
export function Spinner({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
