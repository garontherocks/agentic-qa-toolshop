// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-01: GET /users is refused without admin rights @auth', async ({
    api,
    apiAs,
    syntheticApi,
  }) => {
    // 2. GET /users anonymously, with bearer 'invalid', and as customer
    const anonymous = await api.get('/users');
    expect(anonymous.status()).toBe(401);
    expect(await anonymous.json()).toEqual({ message: 'Unauthorized' });

    const invalid = await api.get('/users', undefined, { Authorization: 'Bearer invalid' });
    expect(invalid.status()).toBe(401);
    expect(await invalid.json()).toEqual({ message: 'Unauthorized' });

    const asCustomer = await syntheticApi.get('/users');
    expect(asCustomer.status()).toBe(403);
    expect(await asCustomer.json()).toEqual({ message: 'Forbidden' });

    // 3. GET /users as admin
    const admin = await apiAs('admin');
    const asAdmin = await admin.get('/users');
    expect(asAdmin.status()).toBe(200);
    const body = await asAdmin.json();
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(['current_page', 'data', 'from', 'last_page', 'per_page', 'to', 'total']),
    );
    expect(body.data.length).toBeGreaterThan(0);
    for (const user of body.data) {
      expect(Object.keys(user)).toEqual(
        expect.arrayContaining(['id', 'first_name', 'last_name', 'email', 'role', 'address']),
      );
    }
  });
});
