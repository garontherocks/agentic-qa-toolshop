// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth API', () => {
  test('API-08: login with a non-existent email is rejected @auth', async ({ api }) => {
    // 2. POST /users/login with that email and any password
    const unknown = syntheticUser();
    const response = await api.loginResponse(unknown.email, unknown.password);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(Object.keys(body)).not.toContain('access_token');
  });
});
