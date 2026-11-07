// spec: specs/contact-form.md
// seed: tests/seed.spec.ts

import type { APIResponse } from '@playwright/test';
import type { BookerClient } from '../../src/api/booker-client';
import { contactMessage } from '../../src/data/factories';
import { test, expect } from '../../src/support/fixtures';

type Payload = Record<string, unknown>;

const FIELDS = ['name', 'email', 'phone', 'subject', 'description'] as const;

// Exact 400 strings (booker-domain, verified 2026-11-07).
const NAME_BLANK = 'Name may not be blank';
const NAME_MSGS = [NAME_BLANK, 'Name must be set'];
const EMAIL_MSGS = ['Email may not be blank', 'Email must be set', 'must be a well-formed email address'];
const PHONE_BLANK = 'Phone may not be blank';
const PHONE_SIZE = 'Phone must be between 11 and 21 characters.';
const PHONE_MSGS = [PHONE_BLANK, 'Phone must be set', PHONE_SIZE];
const SUBJECT_BLANK = 'Subject may not be blank';
const SUBJECT_SIZE = 'Subject must be between 5 and 100 characters.';
const SUBJECT_MSGS = [SUBJECT_BLANK, 'Subject must be set', SUBJECT_SIZE];
const MESSAGE_BLANK = 'Message may not be blank';
const MESSAGE_SIZE = 'Message must be between 20 and 2000 characters.';
const MESSAGE_MSGS = [MESSAGE_BLANK, 'Message must be set', MESSAGE_SIZE];

/**
 * Safety net: the payload must have at least one of the five fields missing or blank, so a future edit can
 * never post a valid message to the shared demo (valid POSTs are budgeted to API-01 only).
 */
function expectGuarded(payload: Payload): void {
  const hasInvalidField = FIELDS.some((key) => {
    const value = payload[key];
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  });
  expect(hasInvalidField, 'payload must contain at least one missing or blank field').toBe(true);
}

/** POST /api/message only after the guard has passed. */
async function sendGuarded(api: BookerClient, payload: Payload): Promise<APIResponse> {
  expectGuarded(payload);
  return api.post('/api/message', payload);
}

async function messagesOf(response: APIResponse): Promise<string[]> {
  expect(response.status()).toBe(400);
  return (await response.json()) as string[];
}

test.describe('Contact form API', () => {
  test.describe('API-01 real submission', () => {
    test.describe.configure({ retries: 0 });

    // Creates one real message: budgeted, retries disabled.
    test('API-01: a valid message from factory defaults is accepted', { tag: '@contact' }, async ({ api }) => {
      const response = await api.sendMessage(contactMessage());

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ success: true });
    });
  });

  test('API-02: empty object and missing fields return 400 with the full message set', { tag: '@contact' }, async ({ api }) => {
    // 1. POST `{}`; then POST `{"name":"x"}`.
    await test.step('empty object', async () => {
      const body = await messagesOf(await sendGuarded(api, {}));
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(10);
      for (const msg of [...NAME_MSGS, 'Email may not be blank', 'Email must be set', PHONE_BLANK, 'Phone must be set',
        SUBJECT_BLANK, 'Subject must be set', MESSAGE_BLANK, 'Message must be set']) {
        expect(body).toContain(msg);
      }
    });

    await test.step('only a name', async () => {
      const body = await messagesOf(await sendGuarded(api, { name: 'x' }));
      expect(Array.isArray(body)).toBe(true);
      for (const msg of ['Email may not be blank', 'Email must be set', PHONE_BLANK, 'Phone must be set',
        SUBJECT_BLANK, 'Subject must be set', MESSAGE_BLANK, 'Message must be set']) {
        expect(body).toContain(msg);
      }
      for (const msg of NAME_MSGS) expect(body).not.toContain(msg);
    });
  });

  test('API-03: a blank name is rejected, and so is a whitespace-only name', { tag: '@contact' }, async ({ api }) => {
    // 1. Row 1: name '' with all other fields valid.
    await test.step('blank name', async () => {
      const body = await messagesOf(await sendGuarded(api, contactMessage({ name: '' })));
      expect(body).toContain(NAME_BLANK);
      for (const msg of [...EMAIL_MSGS, ...PHONE_MSGS, ...SUBJECT_MSGS, ...MESSAGE_MSGS]) {
        expect(body).not.toContain(msg);
      }
    });

    // Row 2: name ' ' with phone '' as guard.
    await test.step('whitespace-only name with blank phone (guard)', async () => {
      const body = await messagesOf(await sendGuarded(api, contactMessage({ name: ' ', phone: '' })));
      expect(body).toContain(NAME_BLANK);
      expect(body).toContain(PHONE_BLANK);
    });
  });

  test('API-04: a blank email and a malformed email are rejected', { tag: '@contact' }, async ({ api }) => {
    // 1. Parametrise email in '' and 'not-an-email'; name '' in each request as guard.
    const rows = [
      { email: '', expected: 'Email may not be blank' },
      { email: 'not-an-email', expected: 'must be a well-formed email address' },
    ];
    for (const row of rows) {
      await test.step(`email "${row.email}"`, async () => {
        const body = await messagesOf(await sendGuarded(api, contactMessage({ name: '', email: row.email })));
        expect(body).toContain(row.expected);
        expect(body).toContain(NAME_BLANK);
      });
    }
  });

  test('API-05: phone length boundaries (10, 11, 21, 22) and blank', { tag: '@contact' }, async ({ api }) => {
    // 1. Every request also has name '' (guard). Lengths '', 10, 11, 21, 22.
    const rows = [
      { length: 0, present: [PHONE_BLANK, PHONE_SIZE], absent: [] as string[] },
      { length: 10, present: [PHONE_SIZE], absent: [PHONE_BLANK] },
      { length: 11, present: [] as string[], absent: PHONE_MSGS },
      { length: 21, present: [] as string[], absent: PHONE_MSGS },
      { length: 22, present: [PHONE_SIZE], absent: [PHONE_BLANK] },
    ];
    for (const row of rows) {
      await test.step(`phone of ${row.length} characters`, async () => {
        const phone = '1'.repeat(row.length);
        const body = await messagesOf(await sendGuarded(api, contactMessage({ name: '', phone })));
        expect(body).toContain(NAME_BLANK);
        for (const msg of row.present) expect(body).toContain(msg);
        for (const msg of row.absent) expect(body).not.toContain(msg);
      });
    }
  });

  test('API-06: subject length boundaries (4, 5, 100, 101) and blank', { tag: '@contact' }, async ({ api }) => {
    // 1. Name '' guard in every request. Subject lengths '', 4, 5, 100, 101.
    const rows = [
      { length: 0, present: [SUBJECT_BLANK, SUBJECT_SIZE], absent: [] as string[] },
      { length: 4, present: [SUBJECT_SIZE], absent: [SUBJECT_BLANK] },
      { length: 5, present: [] as string[], absent: SUBJECT_MSGS },
      { length: 100, present: [] as string[], absent: SUBJECT_MSGS },
      { length: 101, present: [SUBJECT_SIZE], absent: [SUBJECT_BLANK] },
    ];
    for (const row of rows) {
      await test.step(`subject of ${row.length} characters`, async () => {
        const subject = 'x'.repeat(row.length);
        const body = await messagesOf(await sendGuarded(api, contactMessage({ name: '', subject })));
        expect(body).toContain(NAME_BLANK);
        for (const msg of row.present) expect(body).toContain(msg);
        for (const msg of row.absent) expect(body).not.toContain(msg);
      });
    }
  });

  test('API-07: description length boundaries (19, 20, 2000, 2001) and blank', { tag: '@contact' }, async ({ api }) => {
    // 1. Name '' guard in every request. Description lengths '', 19, 20, 2000, 2001.
    const rows = [
      { length: 0, present: [MESSAGE_BLANK, MESSAGE_SIZE], absent: [] as string[] },
      { length: 19, present: [MESSAGE_SIZE], absent: [MESSAGE_BLANK] },
      { length: 20, present: [] as string[], absent: MESSAGE_MSGS },
      { length: 2000, present: [] as string[], absent: MESSAGE_MSGS },
      { length: 2001, present: [MESSAGE_SIZE], absent: [MESSAGE_BLANK] },
    ];
    for (const row of rows) {
      await test.step(`description of ${row.length} characters`, async () => {
        const description = 'x'.repeat(row.length);
        const body = await messagesOf(await sendGuarded(api, contactMessage({ name: '', description })));
        expect(body).toContain(NAME_BLANK);
        for (const msg of row.present) expect(body).toContain(msg);
        for (const msg of row.absent) expect(body).not.toContain(msg);
      });
    }
  });

  test('API-09: an unknown extra field is ignored and does not change validation', { tag: '@contact' }, async ({ api }) => {
    // 1. Valid name/email/subject/description, phone '' (guard), extra key `extra: 'x'`.
    const payload: Payload = { ...contactMessage({ phone: '' }), extra: 'x' };
    const body = await messagesOf(await sendGuarded(api, payload));

    expect(body).toContain(PHONE_BLANK);
    expect(body).toContain(PHONE_SIZE);
    for (const msg of [...NAME_MSGS, ...EMAIL_MSGS, ...SUBJECT_MSGS, ...MESSAGE_MSGS]) {
      expect(body).not.toContain(msg);
    }
    expect(body.filter((msg) => /extra/i.test(msg))).toHaveLength(0);
  });

  test('API-10: 400 responses are JSON arrays of distinct non-empty strings', { tag: '@contact' }, async ({ api }) => {
    // 1. Send one invalid request (all blank).
    const response = await sendGuarded(api, { name: '', email: '', phone: '', subject: '', description: '' });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');
    const body = (await response.json()) as unknown;
    expect(Array.isArray(body)).toBe(true);
    const messages = body as unknown[];
    expect(messages).toHaveLength(8);
    for (const msg of messages) {
      expect(typeof msg).toBe('string');
      expect((msg as string).length).toBeGreaterThan(0);
    }
    expect(new Set(messages).size).toBe(messages.length);
  });

  test.fixme(
    'API-11: a non-JSON or malformed body is rejected with a 4xx, not 500',
    {
      tag: '@contact',
      annotation: [
        { type: 'finding', description: 'MSG-BADBODY-500 — specs/findings.md' },
        { type: 'issue', description: 'evidence: failure-triager 2026-11-07, 2/2' },
      ],
    },
    async ({ request }) => {
      // 1. Send (a) text/plain 'name=&email=', (b) application/json '{"name":', (c) application/json with no body.
      // None of these bodies can be a valid message, so nothing can be created.
      const variants = [
        { label: 'text/plain body', headers: { 'Content-Type': 'text/plain' }, data: 'name=&email=' },
        { label: 'malformed JSON', headers: { 'Content-Type': 'application/json' }, data: '{"name":' },
        { label: 'JSON content type and no body', headers: { 'Content-Type': 'application/json' }, data: undefined },
      ];
      for (const variant of variants) {
        const response = await request.post('/api/message', { headers: variant.headers, data: variant.data });
        expect([400, 415], `${variant.label}: got ${response.status()}`).toContain(response.status());
      }
    },
  );

  test.fixme(
    'API-12: anonymous reads of the message list and the count require a token',
    {
      tag: '@contact',
      annotation: [
        { type: 'finding', description: 'MSG-ANON-READ — specs/findings.md' },
        { type: 'issue', description: 'evidence: failure-triager 2026-11-07, 2/2' },
      ],
    },
    async ({ api }) => {
      // 1. Cookie-less GET /api/message, then GET /api/message/count. Never read the bodies.
      expect((await api.get('/api/message')).status()).toBe(401);
      expect((await api.get('/api/message/count')).status()).toBe(401);
    },
  );

  test.fixme(
    'API-14: anonymous GET of a single message returns 401, not 500',
    {
      tag: '@contact',
      annotation: [
        { type: 'finding', description: 'MSG-ID-500 — specs/findings.md' },
        { type: 'issue', description: 'evidence: failure-triager 2026-11-07, 2/2' },
      ],
    },
    async ({ api }) => {
      // 1. GET /api/message/1 with no token (never opened as admin: that would mark it read).
      expect((await api.get('/api/message/1')).status()).toBe(401);
    },
  );
});
