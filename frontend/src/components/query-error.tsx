import { ApiError } from '../api/api-error';
import { Button, ButtonLink } from './ui/button';
import { Card } from './ui/card';
import { Icon } from './ui/icons';

export function QueryError({ error, onRetry, backTo }: {
  error: unknown;
  onRetry: () => void;
  backTo?: { to: string; label: string };
}) {
  const message = error instanceof ApiError ? error.message : 'Không tải được dữ liệu.';
  return (
    <Card role="alert" className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="tone-danger inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
          <Icon name="cross" size={18} strokeWidth={2.3} />
        </span>
        <p className="pt-1.5 text-base text-text">{message}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {backTo && <ButtonLink to={backTo.to} variant="secondary" size="sm">{backTo.label}</ButtonLink>}
        <Button size="sm" onClick={onRetry}>Thử lại</Button>
      </div>
    </Card>
  );
}
