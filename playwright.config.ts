import { defineConfig, devices } from '@playwright/test';

// Toolshop (Sprint 5) by Testsmith, a public practice app. Override for other sprints or a local copy.
export const TOOLSHOP_URL = process.env.TOOLSHOP_URL ?? 'https://practicesoftwaretesting.com';
export const TOOLSHOP_API_URL = process.env.TOOLSHOP_API_URL ?? 'https://api.practicesoftwaretesting.com';

const CI = Boolean(process.env.CI);
const viewport = { width: 1920, height: 1080 };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  // One retry in CI: a test that only passes on retry is reported as flaky, never hidden.
  retries: CI ? 1 : 0,
  // The hosted app and its database are shared with other people: keep the load modest.
  workers: CI ? 2 : 4,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  reporter: CI
    ? [['list'], ['allure-playwright', { resultsDir: 'allure-results', detail: true, suiteTitle: false }], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: TOOLSHOP_URL,
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Baselines sit next to their spec: tests/visual/<area>/__screenshots__/<spec file>/<name>.png
  snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}{ext}',
  projects: [
    // seed.spec.ts is the agents' starting point (planner/generator); it also runs as a smoke check.
    { name: 'e2e-chromium', testMatch: ['e2e/**/*.spec.ts', 'seed.spec.ts'], use: { ...devices['Desktop Chrome'], viewport } },
    { name: 'e2e-firefox', testMatch: 'e2e/**/*.spec.ts', use: { ...devices['Desktop Firefox'], viewport } },
    { name: 'e2e-webkit', testMatch: 'e2e/**/*.spec.ts', use: { ...devices['Desktop Safari'], viewport } },
    { name: 'api', testMatch: 'api/**/*.spec.ts', use: { baseURL: TOOLSHOP_API_URL } },
    // Baselines are platform-specific: they are generated and compared in the CI Linux container only.
    { name: 'visual', testMatch: 'visual/**/*.spec.ts', use: { ...devices['Desktop Chrome'], viewport } },
    { name: 'a11y', testMatch: 'a11y/**/*.spec.ts', use: { ...devices['Desktop Chrome'], viewport } },
  ],
});
