// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth API', () => {
  test('API-12: registration enforces the password length boundary @auth', async ({ api, cleanupUsers }) => {
    // 2. POST /users/register with a 7-character and an 8-character password (measured API boundary)
    // Register the cleanup BEFORE each call: a regression answering 201 must not leak a user.
    const shortUser = syntheticUser({ password: 'Ab1!xyz' });
    cleanupUsers({ email: shortUser.email });
    const tooShort = await api.register(shortUser);
    expect(tooShort.status()).toBe(422);
    expect(await tooShort.json()).toEqual({ password: ['The password field must be at least 8 characters.'] });

    const minimumUser = syntheticUser({ password: 'Ab1!xyzw' });
    cleanupUsers({ email: minimumUser.email });
    const minimum = await api.register(minimumUser);
    expect(minimum.status()).toBe(201);
  });
});
