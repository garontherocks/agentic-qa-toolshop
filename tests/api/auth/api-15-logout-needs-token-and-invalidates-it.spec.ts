// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-15: logout needs a token and invalidates it @auth', async ({ api, syntheticAccount }) => {
    // 2. GET /users/logout without token
    const anonymous = await api.get('/users/logout');
    expect(anonymous.status()).toBe(401);
    expect(await anonymous.json()).toEqual({ message: 'Unauthorized' });

    // Setup: sign in just before use
    const login = await api.loginResponse(syntheticAccount.email, syntheticAccount.password);
    expect(login.status()).toBe(200);
    api.setToken(((await login.json()) as { access_token: string }).access_token);

    // 3. GET /users/logout with the user's token
    const logout = await api.get('/users/logout');
    expect(logout.status()).toBe(200);
    expect(await logout.json()).toEqual({ message: 'Successfully logged out' });

    // 4. GET /users/me with the same token
    const me = await api.get('/users/me');
    expect(me.status()).toBe(401);
    expect(await me.json()).toEqual({ message: 'Unauthorized' });
  });
});
