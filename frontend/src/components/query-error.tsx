import { ApiError } from '../api/api-error';
import { Button, ButtonLink } from './ui/button';
import { Card } from './ui/card';
import { Icon } from './ui/icons';

/**
 * Thử lại có thể ra kết quả khác không: mất kết nối, lỗi máy chủ (5xx), hết thời gian chờ (408), quá tải (429).
 * Các lỗi 4xx còn lại (409 bài bị khoá/chưa sẵn sàng, 404, 403…) là trả lời dứt khoát của backend — bấm lại vẫn vậy.
 * Lỗi không phải ApiError (lỗi lạ trong code) thì vẫn cho thử lại.
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  if (error.code === 'NETWORK' || error.status === 0) return true;
  if (error.status >= 500 || error.status === 408 || error.status === 429) return true;
  return error.status < 400;
}

export function QueryError({ error, onRetry, backTo }: {
  error: unknown;
  onRetry: () => void;
  backTo?: { to: string; label: string };
}) {
  const message = error instanceof ApiError ? error.message : 'Không tải được dữ liệu.';
  const retryable = isRetryable(error);
  return (
    <Card role="alert" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="tone-danger inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
          <Icon name="cross" size={18} strokeWidth={2.3} />
        </span>
        <p className="pt-1.5 text-base text-text">{message}</p>
      </div>
      {(backTo || retryable) && (
        <div className="flex shrink-0 gap-2">
          {backTo && (
            <ButtonLink to={backTo.to} variant={retryable ? 'secondary' : 'primary'} size="sm">{backTo.label}</ButtonLink>
          )}
          {retryable && <Button size="sm" onClick={onRetry}>Thử lại</Button>}
        </div>
      )}
    </Card>
  );
}
