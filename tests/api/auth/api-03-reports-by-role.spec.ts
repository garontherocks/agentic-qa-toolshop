// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-03: reports are not available to anonymous or customers @auth', async ({
    api,
    apiAs,
    syntheticApi,
  }) => {
    const path = '/reports/total-sales-of-years';

    // 2. GET /reports/total-sales-of-years anonymous, as customer, as admin
    const anonymous = await api.get(path);
    expect(anonymous.status()).toBe(401);
    expect(await anonymous.json()).toEqual({ message: 'Unauthorized' });

    const asCustomer = await syntheticApi.get(path);
    expect(asCustomer.status()).toBe(403);
    expect(await asCustomer.json()).toEqual({ message: 'Forbidden' });

    const admin = await apiAs('admin');
    const asAdmin = await admin.get(path);
    expect(asAdmin.status()).toBe(200);
    const body = await asAdmin.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const item of body) {
      expect(Object.keys(item)).toEqual(expect.arrayContaining(['year', 'total']));
    }
  });
});
