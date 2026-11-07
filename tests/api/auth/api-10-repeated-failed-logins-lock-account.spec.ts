// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth API', () => {
  test('API-10: repeated failed logins lock a synthetic account (423) @auth', async ({ api, cleanupUsers }) => {
    // Setup: a dedicated synthetic user, used by no other test
    const user = syntheticUser();
    const registered = await api.register(user);
    expect(registered.status()).toBe(201);
    cleanupUsers(((await registered.json()) as { id: string }).id);

    const wrongPassword = `${user.password}x`;
    const unauthorized = { error: 'Unauthorized' };

    // 2. POST /users/login with a wrong password, one request at a time
    const attempt1 = await api.loginResponse(user.email, wrongPassword);
    expect(attempt1.status()).toBe(401);
    expect(await attempt1.json()).toEqual(unauthorized);

    const attempt2 = await api.loginResponse(user.email, wrongPassword);
    expect(attempt2.status()).toBe(401);
    expect(await attempt2.json()).toEqual(unauthorized);

    const attempt3 = await api.loginResponse(user.email, wrongPassword);
    expect(attempt3.status()).toBe(401);
    expect(await attempt3.json()).toEqual(unauthorized);

    const locked = { error: 'Account locked, too many failed attempts. Please contact the administrator.' };
    const attempt4 = await api.loginResponse(user.email, wrongPassword);
    expect(attempt4.status()).toBe(423);
    expect(await attempt4.json()).toEqual(locked);

    // 3. POST /users/login with the correct password (one try)
    const correct = await api.loginResponse(user.email, user.password);
    expect(correct.status()).toBe(423);
    const body = await correct.json();
    expect(body).toEqual(locked);
    expect(Object.keys(body)).not.toContain('access_token');
  });
});
