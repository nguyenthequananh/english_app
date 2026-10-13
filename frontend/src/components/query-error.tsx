import { Link } from 'react-router';
import { ApiError } from '../api/api-error';

export function QueryError({ error, onRetry, backTo }: {
  error: unknown;
  onRetry: () => void;
  backTo?: { to: string; label: string };
}) {
  const message = error instanceof ApiError ? error.message : 'Không tải được dữ liệu.';
  return (
    <div role="alert" className="card space-y-3">
      <p className="text-rose-700">{message}</p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary" onClick={onRetry}>Thử lại</button>
        {backTo && <Link to={backTo.to} className="btn bg-slate-100">{backTo.label}</Link>}
      </div>
    </div>
  );
}
