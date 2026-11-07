// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-16: GET /users/refresh with a valid token returns a new token @auth', async ({
    api,
    syntheticAccount,
  }) => {
    // Setup: sign in just before use
    const login = await api.loginResponse(syntheticAccount.email, syntheticAccount.password);
    expect(login.status()).toBe(200);
    api.setToken(((await login.json()) as { access_token: string }).access_token);

    // 3. GET /users/refresh with the user's valid token
    const response = await api.get('/users/refresh');
    expect(response.status()).toBe(200);
    expect(Object.keys(await response.json())).toEqual(
      expect.arrayContaining(['access_token', 'token_type', 'expires_in']),
    );
  });
});
