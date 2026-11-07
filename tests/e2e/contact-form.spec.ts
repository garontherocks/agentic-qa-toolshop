// spec: specs/contact-form.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../src/support/fixtures';
import { contactMessage } from '../../src/data/factories';

const MSG = {
  nameBlank: 'Name may not be blank',
  emailBlank: 'Email may not be blank',
  emailMalformed: 'must be a well-formed email address',
  phoneBlank: 'Phone may not be blank',
  phoneSize: 'Phone must be between 11 and 21 characters.',
  subjectBlank: 'Subject may not be blank',
  subjectSize: 'Subject must be between 5 and 100 characters.',
  messageBlank: 'Message may not be blank',
  messageSize: 'Message must be between 20 and 2000 characters.',
};

// The one real UI submission of the suite: its own describe so CI never resubmits (retries 0).
test.describe('Contact form - real submission', () => {
  test.describe.configure({ retries: 0 });

  test(
    'TC-01: visitor sends a message and sees the thank-you',
    // Creates a real message on the shared demo, so it runs once per full run: Chromium only (see playwright.config).
    { tag: ['@contact', '@chromium-only'] },
    async ({ page, homePage }) => {
      const { contact } = homePage;
      const message = contactMessage();

      // 1. Open the home page and scroll to #contact
      await homePage.goto();
      await contact.section.scrollIntoViewIfNeeded();
      await expect(contact.name).toBeVisible();
      await expect(contact.email).toBeVisible();
      await expect(contact.phone).toBeVisible();
      await expect(contact.subject).toBeVisible();
      await expect(contact.description).toBeVisible();
      await expect(contact.submit).toBeVisible();

      // 2. Fill with contactMessage() as is and click Submit
      await homePage.fillContact(message);
      const responsePromise = page.waitForResponse(
        (response) => response.url().endsWith('/api/message') && response.request().method() === 'POST',
      );
      await contact.submit.click();
      const response = await responsePromise;
      expect(response.status()).toBe(200);

      await expect(contact.successHeading).toBeVisible();
      await expect(contact.successHeading).toContainText(message.name);
      await expect(contact.section.getByText(message.subject)).toBeVisible();
      await expect(contact.section.getByText('as soon as possible.')).toBeVisible();
      await expect(contact.name).toHaveCount(0);
      await expect(contact.submit).toHaveCount(0);
    },
  );
});

test.describe('Contact form', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.contact.section.scrollIntoViewIfNeeded();
  });

  test(
    'TC-02: mocked success shows the thank-you with name and subject, and the form is gone',
    { tag: '@contact' },
    async ({ page, homePage }) => {
      const { contact } = homePage;
      const message = contactMessage();
      const posts: { contentType: string | undefined; body: unknown }[] = [];
      page.on('request', (request) => {
        if (request.url().endsWith('/api/message') && request.method() === 'POST') {
          posts.push({ contentType: request.headers()['content-type'], body: request.postDataJSON() });
        }
      });

      // 1. Mock the POST, fill all fields with factory data, click Submit
      await homePage.mockContactSuccess();
      await homePage.fillContact(message);
      const posted = page.waitForResponse(
        (r) => r.url().includes('/api/message') && r.request().method() === 'POST',
      );
      await contact.submit.click();
      expect((await posted).headers()['x-qa-mock']).toBe('contact-success');

      await expect(contact.successHeading).toBeVisible();
      await expect(contact.successHeading).toContainText(message.name);
      await expect(contact.section.getByText(message.subject)).toBeVisible();
      await expect(contact.section.getByText('as soon as possible.')).toBeVisible();

      expect(posts).toHaveLength(1);
      expect(posts[0].contentType).toContain('application/json');
      expect(posts[0].body).toEqual({
        name: message.name,
        email: message.email,
        phone: message.phone,
        subject: message.subject,
        description: message.description,
      });

      await expect(contact.name).toHaveCount(0);
      await expect(contact.submit).toHaveCount(0);
      await expect(contact.section.getByRole('link')).toHaveCount(0);
      await expect(contact.section.getByRole('button')).toHaveCount(0);
    },
  );

  test('TC-03: empty submit shows the eight blank/size errors', { tag: '@contact' }, async ({ homePage }) => {
    const { contact } = homePage;

    // 1. Click Submit with all fields empty
    await contact.submit.click();

    await expect(contact.errorAlert).toHaveCount(1);
    await expect(contact.errorAlert).toBeVisible();
    await expect(contact.errorAlert.locator('p')).toHaveCount(8);
    // Membership only: the order of the messages is not deterministic (MSG-ERR-ORDER)
    for (const text of [
      MSG.subjectBlank,
      MSG.nameBlank,
      MSG.messageSize,
      MSG.messageBlank,
      MSG.phoneSize,
      MSG.phoneBlank,
      MSG.subjectSize,
      MSG.emailBlank,
    ]) {
      await expect(contact.errorAlert).toContainText(text);
    }
    await expect(contact.submit).toBeVisible();
    for (const field of [contact.name, contact.email, contact.phone, contact.subject, contact.description]) {
      await expect(field).toHaveValue('');
    }
  });

  test('TC-05: malformed email is rejected', { tag: '@contact' }, async ({ homePage }) => {
    const { contact } = homePage;

    // 1. Valid name, email "not-an-email", blank phone (guarantees rejection), valid subject and message
    await homePage.fillContact(contactMessage({ email: 'not-an-email', phone: '' }));
    await contact.submit.click();

    await expect(contact.errorAlert).toBeVisible();
    await expect(contact.errorAlert).toContainText(MSG.emailMalformed);
    await expect(contact.errorAlert).toContainText(MSG.phoneBlank);
    await expect(contact.successHeading).toHaveCount(0);
  });

  // One browser is enough for the validation matrix and the boundary check (see playwright.config).
  test.describe('chromium only', { tag: '@chromium-only' }, () => {

    const blankRows = [
      { field: 'name', present: [MSG.nameBlank], keyword: 'Name' },
      { field: 'phone', present: [MSG.phoneBlank, MSG.phoneSize], keyword: 'Phone' },
      { field: 'description', present: [MSG.messageBlank, MSG.messageSize], keyword: 'Message' },
    ] as const;
    const allKeywords = ['Name', 'Email', 'well-formed', 'Phone', 'Subject', 'Message'];

    for (const row of blankRows) {
      test(
        `TC-04: a blank ${row.field} is reported on its own`,
        { tag: '@contact' },
        async ({ homePage }) => {
          const { contact } = homePage;

          // 1. Fill the other four fields with valid factory values and leave this one blank
          await homePage.fillContact(contactMessage({ [row.field]: '' }));
          await contact.submit.click();

          await expect(contact.errorAlert).toBeVisible();
          for (const text of row.present) {
            await expect(contact.errorAlert).toContainText(text);
          }
          await expect(contact.errorAlert.locator('p')).toHaveCount(row.present.length);
          for (const keyword of allKeywords.filter((word) => word !== row.keyword)) {
            await expect(contact.errorAlert).not.toContainText(keyword);
          }
          await expect(contact.successHeading).toHaveCount(0);
        },
      );
    }

    test(
      'TC-06: phone, subject and message out of range are rejected from the UI',
      { tag: '@contact' },
      async ({ homePage }) => {
        const { contact } = homePage;

        // 1. Phone with 10 characters, subject with 4, message with 19
        await homePage.fillContact(
          contactMessage({ phone: '0770090012', subject: 'Abcd', description: '1234567890123456789' }),
        );
        await contact.submit.click();

        await expect(contact.errorAlert).toBeVisible();
        await expect(contact.errorAlert).toContainText(MSG.phoneSize);
        await expect(contact.errorAlert).toContainText(MSG.subjectSize);
        await expect(contact.errorAlert).toContainText(MSG.messageSize);
        await expect(contact.errorAlert).not.toContainText('Name');
        await expect(contact.errorAlert).not.toContainText('Email');
        await expect(contact.errorAlert).not.toContainText('well-formed');
        await expect(contact.successHeading).toHaveCount(0);
      },
    );
  });

  test(
    'TC-07: a corrected form after an error can be resubmitted and the alert is gone',
    { tag: '@contact' },
    async ({ page, homePage }) => {
      const { contact } = homePage;

      // 1. Click Submit with the form empty
      await contact.submit.click();
      await expect(contact.errorAlert).toBeVisible();
      await expect(contact.errorAlert).toHaveCount(1);

      // 2. Mock the success, fill valid factory data, click Submit again
      await homePage.mockContactSuccess();
      await homePage.fillContact(contactMessage());
      const posted = page.waitForResponse(
        (r) => r.url().includes('/api/message') && r.request().method() === 'POST',
      );
      await contact.submit.click();
      expect((await posted).headers()['x-qa-mock']).toBe('contact-success');

      await expect(contact.errorAlert).toHaveCount(0);
      await expect(contact.successHeading).toBeVisible();
      await expect(contact.name).toHaveCount(0);
      await expect(contact.submit).toHaveCount(0);
    },
  );
});
