// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth API', () => {
  test('API-06: a customer or anonymous caller cannot delete users @auth', async ({
    api,
    apiAs,
    syntheticAccount,
    cleanupUsers,
  }) => {
    // Setup: user B, registered by the test and deleted at teardown
    const registered = await api.register(syntheticUser());
    expect(registered.status()).toBe(201);
    const idB = ((await registered.json()) as { id: string }).id;
    cleanupUsers(idB);

    // Setup: sign in as user A just before use; the token is passed per request so `api` stays anonymous
    const loginA = await api.loginResponse(syntheticAccount.email, syntheticAccount.password);
    expect(loginA.status()).toBe(200);
    const tokenA = ((await loginA.json()) as { access_token: string }).access_token;

    // 2. As A, DELETE /users/{B id}
    const asCustomer = await api.delete(`/users/${idB}`, { Authorization: `Bearer ${tokenA}` });
    expect(asCustomer.status()).toBe(403);
    expect(await asCustomer.json()).toEqual({ message: 'Forbidden' });

    // 3. Anonymous DELETE /users/{B id}
    const anonymous = await api.delete(`/users/${idB}`);
    expect(anonymous.status()).toBe(401);
    expect(await anonymous.json()).toEqual({ message: 'Unauthorized' });

    // 4. As admin, GET /users/{B id}
    const admin = await apiAs('admin');
    const check = await admin.get(`/users/${idB}`);
    expect(check.status()).toBe(200);
  });
});
