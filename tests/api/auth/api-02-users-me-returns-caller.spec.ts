// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-02: GET /users/me needs a token and returns the caller @auth @smoke', async ({
    api,
    syntheticApi,
    syntheticAccount,
  }) => {
    // 2. GET /users/me without token
    const anonymous = await api.get('/users/me');
    expect(anonymous.status()).toBe(401);
    expect(await anonymous.json()).toEqual({ message: 'Unauthorized' });

    // 3. GET /users/me as the synthetic customer
    const response = await syntheticApi.get('/users/me');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining([
        'id',
        'provider',
        'first_name',
        'last_name',
        'phone',
        'dob',
        'email',
        'totp_enabled',
        'created_at',
        'address',
      ]),
    );
    expect(body.email).toBe(syntheticAccount.email);
    expect(Object.keys(body)).not.toContain('password');
  });
});
