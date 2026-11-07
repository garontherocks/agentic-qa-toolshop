// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-09: a wrong password for a registered synthetic user is rejected @auth', async ({
    api,
    syntheticAccount,
  }) => {
    // 2. POST /users/login with a wrong password (exactly one failed attempt)
    const wrong = await api.loginResponse(syntheticAccount.email, `${syntheticAccount.password}x`);
    expect(wrong.status()).toBe(401);
    const wrongBody = await wrong.json();
    expect(wrongBody).toEqual({ error: 'Unauthorized' });
    expect(Object.keys(wrongBody)).not.toContain('access_token');

    // 3. POST /users/login with the correct password
    const correct = await api.loginResponse(syntheticAccount.email, syntheticAccount.password);
    expect(correct.status()).toBe(200);
    expect(Object.keys(await correct.json())).toEqual(
      expect.arrayContaining(['access_token', 'token_type', 'expires_in']),
    );
  });
});
