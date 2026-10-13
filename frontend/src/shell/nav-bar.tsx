import { Link, NavLink } from 'react-router';
import { motion, MotionConfig } from 'motion/react';
import type { IconName } from '../types/icon';
import { Icon } from '../ui/icons';
import { CenterAction } from './center-action';
import { useCurrentProfile } from './require-profile';

export const NAV_ITEMS = [
  { to: '/', label: 'Hôm nay', icon: 'home' },
  { to: '/roadmap', label: 'Lộ trình', icon: 'map' },
  { to: '/stats', label: 'Tiến độ', icon: 'chart' },
  { to: '/settings', label: 'Cá nhân', icon: 'person' },
] as const satisfies readonly { to: string; label: string; icon: IconName }[];

/* Chỉ báo mục đang chọn trượt theo bằng lò xo — tới đích dứt khoát, không nảy (đổi tab là thao tác thường xuyên). */
const INDICATOR_SPRING = { type: 'spring', bounce: 0.12, duration: 0.38 } as const;

function NavItem({ to, label, icon }: { to: string; label: string; icon: IconName }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={[
        'pressable focus-ring group relative flex h-full flex-col items-center justify-center gap-[3px] rounded-2xl',
        'text-text-2 aria-[current=page]:text-accent-text',
        'lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3',
        'lg:hover:bg-fill lg:aria-[current=page]:hover:bg-transparent',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active-indicator"
              aria-hidden="true"
              transition={INDICATOR_SPRING}
              className="absolute inset-x-1 inset-y-1.5 rounded-2xl bg-accent-soft lg:inset-0 lg:rounded-xl"
            />
          )}
          <Icon name={icon} filled={isActive} size={24} strokeWidth={isActive ? 2.1 : 1.85} className="relative lg:size-[22px]" />
          <span className="relative text-[0.6875rem] leading-none font-medium tracking-[0.005em] group-aria-[current=page]:font-bold lg:text-[0.9375rem] lg:font-medium lg:group-aria-[current=page]:font-semibold">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function ProfileCard() {
  const { data: profile } = useCurrentProfile();
  const name = profile?.name ?? '';
  return (
    <div className="mt-auto hidden pt-6 lg:block">
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 card-edge">
        <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[1.25rem] font-semibold text-accent-text">
          {profile?.avatar || name.charAt(0).toUpperCase() || '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-text" title={name || undefined}>{name || '…'}</p>
          <p className="text-[0.75rem] text-text-3">Hồ sơ đang dùng</p>
        </div>
      </div>
      <Link
        to="/profiles?manual=1"
        className="pressable focus-ring mt-2 flex h-10 items-center justify-center rounded-xl text-[0.875rem] font-semibold text-accent-text hover:bg-fill"
      >
        Đổi hồ sơ
      </Link>
    </div>
  );
}

/**
 * MỘT phần tử <nav> cho mọi kích thước: <lg là tab bar kính mờ dính đáy (4 mục + nút tròn giữa),
 * ≥lg là sidebar kính mờ bên trái (nút chính ở đầu, thẻ hồ sơ + "Đổi hồ sơ" ở cuối).
 * Không render hai bộ link song song — phần chỉ có ở sidebar được ẩn bằng CSS dưới lg.
 *
 * Nút chính đứng TRƯỚC danh sách trong DOM để thứ tự Tab khớp thứ tự nhìn của sidebar (không dùng `order`).
 * Ở tab bar nó được đặt tuyệt đối vào giữa thanh; danh sách chừa trống cột 3 (mục thứ ba bắt đầu ở cột 4)
 * nên không cần ô giả trong danh sách.
 */
export function NavBar() {
  const [first, second, ...rest] = NAV_ITEMS;
  return (
    <MotionConfig reducedMotion="user">
      <nav
        aria-label="Điều hướng chính"
        data-testid="nav-bar"
        className={[
          'material fixed inset-x-0 bottom-0 z-40 border-t border-[var(--material-edge)] pb-safe shadow-[var(--shadow-bar)]',
          'lg:material-strong lg:inset-y-0 lg:right-auto lg:flex lg:w-[var(--sidebar-width)] lg:flex-col',
          'lg:border-t-0 lg:border-r lg:border-separator lg:px-4 lg:pt-7 lg:pb-5 lg:shadow-none',
        ].join(' ')}
      >
        <div aria-hidden="true" className="hidden items-center gap-2.5 px-2 pb-7 lg:flex">
          <span className="tone-accent tone-chip inline-flex size-8 items-center justify-center rounded-[10px]">
            <Icon name="sparkle" filled size={18} strokeWidth={1.6} />
          </span>
          <span className="text-[1.0625rem] font-bold tracking-[-0.01em] text-text">IELTS App</span>
        </div>
        <div className="absolute top-0 left-1/2 z-10 -translate-x-1/2 lg:static lg:mb-5 lg:translate-x-0">
          <CenterAction />
        </div>
        <ul className="mx-auto grid h-[var(--tabbar-height)] max-w-[560px] grid-cols-5 px-1.5 lg:mx-0 lg:flex lg:h-auto lg:max-w-none lg:flex-col lg:gap-1 lg:px-0">
          <li><NavItem {...first} /></li>
          <li><NavItem {...second} /></li>
          {rest.map((item, i) => (
            <li key={item.to} className={i === 0 ? 'col-start-4' : undefined}><NavItem {...item} /></li>
          ))}
        </ul>
        <ProfileCard />
      </nav>
    </MotionConfig>
  );
}
