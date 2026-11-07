// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-07: valid credentials return a bearer token @auth @smoke', async ({ api, syntheticAccount }) => {
    // 2. POST /users/login {email, password}
    const response = await api.loginResponse(syntheticAccount.email, syntheticAccount.password);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Object.keys(body)).toEqual(expect.arrayContaining(['access_token', 'token_type', 'expires_in']));
    expect(Object.keys(body)).toHaveLength(3);
    expect(body.token_type).toBe('bearer');
    expect(body.expires_in).toBe(300);
    expect(typeof body.access_token).toBe('string');
    expect(body.access_token.length).toBeGreaterThan(0);
  });
});
