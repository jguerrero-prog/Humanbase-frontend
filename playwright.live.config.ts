import { defineConfig, devices } from '@playwright/test';

// Runs the front end with the API on against the public Humanbase API (or HB_API_PROXY_TARGET). Never part of pnpm test:e2e.
export default defineConfig({
  testDir: 'e2e-live',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['list'], ['json', { outputFile: 'test-results/live-results.json' }]] : 'list',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 3,
  use: { trace: 'retain-on-failure', reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } },
  projects: [
    { name: 'live', testMatch: '*.live.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'jobs', testMatch: '*.jobs.ts', timeout: 3_600_000, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm --filter @humanbase/web build && pnpm --filter @humanbase/web preview --port 4190 --strictPort',
    url: 'http://localhost:4190',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
