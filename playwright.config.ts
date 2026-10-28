import { defineConfig, devices } from '@playwright/test';

const app = (name: string, port: number) => ({
  command: `pnpm --filter @humanbase/${name} build && pnpm --filter @humanbase/${name} preview --port ${port}`,
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  // Astro backgrounds its servers when it detects a coding agent; Playwright needs them in the foreground.
  env: { AI_AGENT: '', CLAUDECODE: '' },
});

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [app('web', 4173), app('docs', 4322)],
});
