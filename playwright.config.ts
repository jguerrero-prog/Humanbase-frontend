import { defineConfig, devices } from '@playwright/test';

const app = (name: string, url: string) => ({
  command: `pnpm --filter @humanbase/${name} build && pnpm --filter @humanbase/${name} preview`,
  url,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  // Astro backgrounds its servers when it detects a coding agent; Playwright needs them in the foreground.
  env: { AI_AGENT: '', CLAUDECODE: '' },
});

export default defineConfig({
  testDir: 'e2e',
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [app('web', 'http://localhost:4173'), app('docs', 'http://localhost:4321')],
});
