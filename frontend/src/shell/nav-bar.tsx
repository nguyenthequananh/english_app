import { NavLink } from 'react-router';
import { CenterAction } from './center-action';

export const NAV_ITEMS = [
  { to: '/', label: 'Hôm nay', icon: 'home' },
  { to: '/roadmap', label: 'Lộ trình', icon: 'map' },
  { to: '/stats', label: 'Tiến độ', icon: 'chart' },
  { to: '/settings', label: 'Cá nhân', icon: 'person' },
] as const;

export function NavBar() {
  const [first, second, ...rest] = NAV_ITEMS;
  return (
    <nav aria-label="Điều hướng chính" data-testid="nav-bar">
      <NavLink to={first.to} end>{first.label}</NavLink>
      <NavLink to={second.to}>{second.label}</NavLink>
      <CenterAction />
      {rest.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
    </nav>
  );
}
