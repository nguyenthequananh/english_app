import { Outlet } from 'react-router';
import { HealthBanner } from '../components/health-banner';
import { VoiceBanner } from '../components/voice-banner';
import { NavBar } from './nav-bar';
import { AppHeader } from './app-header';

/**
 * Khung các màn chính.
 * <lg: chừa đáy cho tab bar (+ nút giữa nhô lên + safe-area), nội dung rộng tối đa 640px.
 * ≥lg: chừa trái cho sidebar, có AppHeader dính đỉnh và nội dung rộng tối đa 1100px.
 */
export default function AppShell() {
  return (
    <div data-testid="app-shell" className="min-h-dvh">
      <NavBar />
      <div className="lg:pl-[var(--sidebar-width)]">
        <AppHeader />
        <main className="pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom,0px)+2.5rem)] lg:pb-12">
          <div className="mx-auto w-full max-w-[640px] px-4 pt-safe sm:px-6 lg:max-w-[1100px] lg:px-10">
            <HealthBanner />
            <VoiceBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
