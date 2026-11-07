import { defineConfig, devices } from '@playwright/test';

// Restful-booker platform by Mark Winteringham (GPL-3.0), a public B&B booking app built for practising testing.
// The UI and its REST API share one host: the API lives under /api. Override for a local copy.
export const APP_URL = process.env.APP_URL ?? 'https://automationintesting.online';
export const API_URL = process.env.API_URL ?? APP_URL;

const CI = Boolean(process.env.CI);
const viewport = { width: 1920, height: 1080 };

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  // One retry in CI: a test that only passes on retry is reported as flaky, never hidden.
  retries: CI ? 1 : 0,
  // The hosted app and its data are shared with other people: keep the load modest.
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
    baseURL: APP_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Baselines sit next to their spec: tests/visual/<area>/__screenshots__/<spec file>/<name>.png
  snapshotPathTemplate: '{testDir}/{testFileDir}/__screenshots__/{testFileName}/{arg}{ext}',
  projects: [
    // seed.spec.ts is the agents' starting point (planner/generator); it also runs as a smoke check.
    { name: 'e2e-chromium', testMatch: ['e2e/**/*.spec.ts', 'seed.spec.ts'], use: { ...devices['Desktop Chrome'], viewport } },
    // Tests tagged @chromium-only (real submissions, validation matrices) are not scheduled on the other browsers
    // at all, instead of being skipped at runtime: no skipped noise in the reports.
    { name: 'e2e-firefox', testMatch: 'e2e/**/*.spec.ts', grepInvert: /@chromium-only/, use: { ...devices['Desktop Firefox'], viewport } },
    { name: 'e2e-webkit', testMatch: 'e2e/**/*.spec.ts', grepInvert: /@chromium-only/, use: { ...devices['Desktop Safari'], viewport } },
    { name: 'api', testMatch: 'api/**/*.spec.ts', use: { baseURL: API_URL } },
    // Baselines are platform-specific: they are generated and compared in the CI Linux container only.
    { name: 'visual', testMatch: 'visual/**/*.spec.ts', use: { ...devices['Desktop Chrome'], viewport } },
    { name: 'a11y', testMatch: 'a11y/**/*.spec.ts', use: { ...devices['Desktop Chrome'], viewport } },
  ],
});
