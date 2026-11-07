// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-04: invoices need authentication @auth', async ({ api }) => {
    // 2. GET /invoices without token
    const response = await api.get('/invoices');
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });
});
