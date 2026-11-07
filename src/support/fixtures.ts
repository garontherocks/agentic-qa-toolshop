import { test as base, expect, request as apiRequest, type Page } from '@playwright/test';
import { ToolshopClient } from '../api/toolshop-client';
import { syntheticUser, type SyntheticUser } from '../data/factories';
import { LoginPage } from '../pages/login-page';
import { RegisterPage } from '../pages/register-page';
import { accounts, TOOLSHOP_API_URL, type Role } from './env';

/** A user registered by the suite for one test; deleted by the admin at teardown. */
export interface SyntheticAccount {
  user: SyntheticUser;
  id: string;
  email: string;
  password: string;
}

/** Runs `fn` with a client on a fresh, unauthenticated API context and disposes the context afterwards. */
async function withFreshClient<T>(fn: (client: ToolshopClient) => Promise<T>): Promise<T> {
  const context = await apiRequest.newContext({ baseURL: TOOLSHOP_API_URL });
  try {
    return await fn(new ToolshopClient(context));
  } finally {
    await context.dispose();
  }
}

/**
 * Deletes a suite-created user with a demo admin token obtained right now (JWTs live 300 s).
 * Only ever call it with ids of users this suite created.
 *
 * 204 = deleted. 404 = already gone: the hosted database is reset periodically (verified 2026-11-07),
 * so a reset between setup and teardown is not a product failure; it is recorded as a `cleanup`
 * annotation on the current test. Any other status fails.
 */
export async function deleteUserAsAdmin(id: string): Promise<void> {
  await withFreshClient(async (admin) => {
    await admin.login(accounts.admin.email, accounts.admin.password);
    const response = await admin.deleteUser(id);
    const status = response.status();
    if (status === 404) {
      annotateCleanup(`user ${id} already gone (404): shared DB reset`);
      return;
    }
    expect(
      status,
      `cleanup: DELETE /users/${id} as admin should return 204 (deleted) or 404 (already gone), got ${status}`,
    ).toBe(204);
  });
}

/** Records a `cleanup` annotation on the current test; a no-op outside a test. */
function annotateCleanup(description: string): void {
  try {
    base.info().annotations.push({ type: 'cleanup', description });
  } catch {
    // Called outside a test (no test.info()): nothing to annotate.
  }
}

/**
 * Resolves a suite-created user's id from its email with an admin `GET /users/search?q=<email>`
 * (verified 2026-11-07: 200 with matching records). Only an exact `email` match counts;
 * undefined means the user is already gone.
 */
async function userIdByEmailAsAdmin(email: string): Promise<string | undefined> {
  return withFreshClient(async (admin) => {
    await admin.login(accounts.admin.email, accounts.admin.password);
    const response = await admin.get('/users/search', { q: email });
    expect(response.status(), `cleanup: GET /users/search?q=${email} as admin should return 200`).toBe(200);
    const body = (await response.json()) as { data?: { id: string; email: string }[] } | { id: string; email: string }[];
    const records = Array.isArray(body) ? body : (body.data ?? []);
    return records.find((record) => record.email === email)?.id;
  });
}

/** Logs in through the API as the given user and returns their id from `GET /users/me` (e.g. after a UI registration). */
export async function userIdFor(email: string, password: string): Promise<string> {
  return withFreshClient(async (client) => {
    const login = await client.loginResponse(email, password);
    expect(login, `login as ${email} should succeed to look up the user id`).toBeOK();
    client.setToken(((await login.json()) as { access_token: string }).access_token);
    const me = await client.get('/users/me');
    expect(me, 'GET /users/me should succeed for a signed-in user').toBeOK();
    return ((await me.json()) as { id: string }).id;
  });
}

interface Fixtures {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  /** Unauthenticated API client bound to the Toolshop API. */
  api: ToolshopClient;
  /** Returns an API client signed in as the given seeded role. */
  apiAs: (role: Role) => Promise<ToolshopClient>;
  /** A page already signed in through the UI as the default customer. */
  customerPage: import('@playwright/test').Page;
  /** A fresh synthetic user registered via the API (201); deleted as admin at teardown, even if the test fails. */
  syntheticAccount: SyntheticAccount;
  /** An API client signed in as `syntheticAccount` (role `user`); use it instead of the lockable demo customer. */
  syntheticApi: ToolshopClient;
  /** A page signed in through the UI as `syntheticAccount`; use it instead of `customerPage` when any customer will do. */
  syntheticCustomerPage: Page;
  /**
   * Registers a user the test created itself, by id or by `{ email }` (register it before the id is known);
   * at teardown emails are resolved via admin `GET /users/search` and every user is deleted as admin.
   */
  cleanupUsers: (target: CleanupTarget) => void;
}

/** A user to delete at teardown: its id, or its email when the id is not known yet. */
export type CleanupTarget = string | { email: string };

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
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

  syntheticAccount: async ({}, use) => {
    const user = syntheticUser();
    const id = await withFreshClient(async (anonymous) => {
      const response = await anonymous.register(user);
      expect(response.status(), 'setup: POST /users/register should return 201 for a synthetic user').toBe(201);
      return ((await response.json()) as { id: string }).id;
    });
    await use({ user, id, email: user.email, password: user.password });
    await deleteUserAsAdmin(id);
  },

  syntheticApi: async ({ syntheticAccount }, use) => {
    // Logged in at setup: the JWT lives 300 s. syntheticAccount's teardown deletes the user.
    const context = await apiRequest.newContext({ baseURL: TOOLSHOP_API_URL });
    try {
      const client = new ToolshopClient(context);
      await client.login(syntheticAccount.email, syntheticAccount.password);
      await use(client);
    } finally {
      await context.dispose();
    }
  },

  syntheticCustomerPage: async ({ page, syntheticAccount }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(syntheticAccount.email, syntheticAccount.password);
    await expect(page).toHaveURL(/\/account/);
    await use(page);
  },

  cleanupUsers: async ({}, use) => {
    const targets: CleanupTarget[] = [];
    await use((target) => {
      targets.push(target);
    });
    const failures: string[] = [];
    for (const target of targets) {
      const label = typeof target === 'string' ? target : target.email;
      try {
        const id = typeof target === 'string' ? target : await userIdByEmailAsAdmin(target.email);
        if (id === undefined) {
          annotateCleanup(`user ${label} already gone (no exact match in GET /users/search): shared DB reset`);
          continue;
        }
        await deleteUserAsAdmin(id);
      } catch (error) {
        failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    expect(failures, 'cleanup: every registered synthetic user should be deleted (204) or already gone (404)').toEqual([]);
  },
});

export { expect };
