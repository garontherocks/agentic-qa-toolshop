// spec: specs/auth.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../../src/support/fixtures';
import { syntheticUser } from '../../../src/data/factories';

test.describe('Auth API', () => {
  test('API-11: registration accepts valid data and rejects duplicates and empty payloads @auth', async ({
    api,
    cleanupUsers,
  }) => {
    const user = syntheticUser();

    // 2. POST /users/register with the synthetic payload
    // Registered before the call: the email identifies the user even if a later assertion fails.
    cleanupUsers({ email: user.email });
    const created = await api.register(user);
    expect(created.status()).toBe(201);
    const body = await created.json();
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining(['first_name', 'last_name', 'dob', 'phone', 'email', 'id', 'created_at', 'address']),
    );
    expect(Object.keys(body.address)).toEqual(
      expect.arrayContaining(['street', 'house_number', 'city', 'state', 'country', 'postal_code']),
    );
    expect(Object.keys(body)).not.toContain('password');

    // 3. POST /users/register again with the same email
    const duplicate = await api.register(user);
    expect(duplicate.status()).toBe(409);
    expect(await duplicate.json()).toEqual({ email: ['A customer with this email address already exists.'] });

    // 4. POST /users/register with an empty body {}
    const empty = await api.post('/users/register', {});
    expect(empty.status()).toBe(422);
    const errors = await empty.json();
    expect(errors.first_name).toEqual(['The first name field is required.']);
    expect(errors.last_name).toEqual(['The last name field is required.']);
    expect(errors.email).toEqual(['The email field is required.']);
    expect(errors.password).toEqual(['The password field is required.']);
  });
});
