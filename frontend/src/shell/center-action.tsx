import { Link } from 'react-router';

export interface CenterActionTarget { to: string; label: string }

/** Hành động chính ở giữa tab bar / đầu sidebar. Hiện là buổi học hôm nay; đổi đích ở đây khi có chế độ AI. */
export const CENTER_ACTION: CenterActionTarget = { to: '/session', label: 'Buổi học hôm nay' };

export function CenterAction({ target = CENTER_ACTION }: { target?: CenterActionTarget }) {
  return (
    <Link to={target.to} aria-label={target.label} data-testid="center-action">
      <span className="center-action-label">{target.label}</span>
    </Link>
  );
}
