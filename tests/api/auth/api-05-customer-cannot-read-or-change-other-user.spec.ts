// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth API', () => {
  test('API-05: a customer cannot read or change another user by id @auth', async ({
    api,
    apiAs,
    syntheticAccount,
    cleanupUsers,
  }) => {
    // Setup: user B, registered by the test and deleted at teardown
    const userB = syntheticUser();
    const registered = await api.register(userB);
    expect(registered.status()).toBe(201);
    const idB = ((await registered.json()) as { id: string }).id;
    cleanupUsers(idB);

    // Setup: sign in as user A just before use (token lives 300 s)
    const loginA = await api.loginResponse(syntheticAccount.email, syntheticAccount.password);
    expect(loginA.status()).toBe(200);
    api.setToken(((await loginA.json()) as { access_token: string }).access_token);

    // 2. As A, GET /users/{B id}
    const read = await api.get(`/users/${idB}`);
    expect(read.status()).toBe(404);
    expect(await read.json()).toEqual({ error: 'You are not authorized to view this user.' });

    // 3. As A, PUT /users/{B id} with the full payload minus password and first_name changed to 'QAchanged'
    const { password: _password, ...payload } = userB;
    const update = await api.put(`/users/${idB}`, { ...payload, first_name: 'QAchanged' });
    expect(update.status()).toBe(403);
    expect(await update.json()).toEqual({ error: 'You can only update your own data.' });

    // 4. As admin, GET /users/{B id}
    const admin = await apiAs('admin');
    const check = await admin.get(`/users/${idB}`);
    expect(check.status()).toBe(200);
    const body = await check.json();
    expect(body.first_name).toBe('QA');
    expect(body.email).toBe(userB.email);
  });
});
