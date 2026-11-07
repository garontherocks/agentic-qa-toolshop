// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';

test.describe('Auth API', () => {
  test('API-17: refresh without a valid token answers 401 [REFRESH-500] @auth', async ({ api }) => {
    test.fixme(true, 'REFRESH-500: GET /users/refresh answers 500 {"message":"Server Error"} without a valid token; evidence: specs/auth.md "Product findings", failure-triager 2026-11-07 (2/2)');

    // 2. GET /users/refresh without a token
    const anonymous = await api.get('/users/refresh');
    expect(anonymous.status()).toBe(401);

    // 3. GET /users/refresh with Authorization: Bearer invalid
    const invalid = await api.get('/users/refresh', undefined, { Authorization: 'Bearer invalid' });
    expect(invalid.status()).toBe(401);
  });
});
