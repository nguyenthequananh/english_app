import { Outlet } from 'react-router';
import { HealthBanner } from '../components/health-banner';
import { VoiceBanner } from '../components/voice-banner';
import { NavBar } from './nav-bar';

export default function AppShell() {
  return (
    <div data-testid="app-shell">
      <NavBar />
      <main>
        <HealthBanner />
        <VoiceBanner />
        <Outlet />
      </main>
    </div>
  );
}
