import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:8775', channel: 'msedge', trace: 'retain-on-failure' },
  webServer: {
    command: 'node e2e/start-app.mjs',
    url: 'http://127.0.0.1:8775/api/health',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
