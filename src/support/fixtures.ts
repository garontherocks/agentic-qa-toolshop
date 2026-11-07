import { test as base, expect, request as apiRequest } from '@playwright/test';
import { ToolshopClient } from '../api/toolshop-client';
import { LoginPage } from '../pages/login-page';
import { accounts, TOOLSHOP_API_URL, type Role } from './env';

interface Fixtures {
  loginPage: LoginPage;
  /** Unauthenticated API client bound to the Toolshop API. */
  api: ToolshopClient;
  /** Returns an API client signed in as the given seeded role. */
  apiAs: (role: Role) => Promise<ToolshopClient>;
  /** A page already signed in through the UI as the default customer. */
  customerPage: import('@playwright/test').Page;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  api: async ({}, use) => {
    const context = await apiRequest.newContext({ baseURL: TOOLSHOP_API_URL });
    await use(new ToolshopClient(context));
    await context.dispose();
  },

  apiAs: async ({}, use) => {
    const contexts: Awaited<ReturnType<typeof apiRequest.newContext>>[] = [];
    await use(async (role) => {
      const context = await apiRequest.newContext({ baseURL: TOOLSHOP_API_URL });
      contexts.push(context);
      const client = new ToolshopClient(context);
      await client.login(accounts[role].email, accounts[role].password);
      return client;
    });
    await Promise.all(contexts.map((context) => context.dispose()));
  },

  customerPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(accounts.customer.email, accounts.customer.password);
    await expect(page).toHaveURL(/\/account/);
    await use(page);
  },
});

export { expect };
