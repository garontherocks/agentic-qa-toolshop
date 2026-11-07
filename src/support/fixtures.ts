import { test as base, request as apiRequest } from '@playwright/test';
import { BookerClient } from '../api/booker-client';
import { AdminLoginPage } from '../pages/admin-login-page';
import { HomePage } from '../pages/home-page';
import { admin, API_URL } from './env';

interface Fixtures {
  homePage: HomePage;
  adminLoginPage: AdminLoginPage;
  /** Unauthenticated client bound to the platform API. */
  api: BookerClient;
  /** Client signed in as the demo admin (a fresh token per test, logged out at teardown). */
  adminApi: BookerClient;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  api: async ({}, use) => {
    const context = await apiRequest.newContext({ baseURL: API_URL });
    await use(new BookerClient(context));
    await context.dispose();
  },
  adminApi: async ({}, use) => {
    const context = await apiRequest.newContext({ baseURL: API_URL });
    const client = new BookerClient(context);
    await client.login(admin.username, admin.password);
    await use(client);
    await client.logout();
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
