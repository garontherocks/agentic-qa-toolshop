import { randomInt, randomUUID } from 'node:crypto';

// The hosted demo is shared with everyone: never use real personal data. Every generated record is
// obviously synthetic and traceable to this suite (names start with "Qa", emails end in @example.test).
const tag = () => randomUUID().replace(/-/g, '').slice(0, 6);
const letters = (value: string) => value.replace(/[^a-z]/gi, '');

/** A guest for a booking: firstname 3–18 and lastname 3–30 characters (API validation, verified 2026-11-07). */
export function syntheticGuest(overrides: Partial<SyntheticGuest> = {}): SyntheticGuest {
  const id = letters(tag()).padEnd(4, 'x').slice(0, 6);
  return {
    firstname: `Qa${id}`,
    lastname: `Agent${id}`,
    email: `qa-agent+${tag()}@example.test`,
    // UK range reserved for drama (Ofcom 07700 900000–900999); 13 characters, inside the 11–21 rule.
    phone: `+447700900${String(randomInt(0, 1000)).padStart(3, '0')}`,
    ...overrides,
  };
}

export interface SyntheticGuest {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

/**
 * A stay in the far future on random dates, so runs don't collide with each other or with other people's
 * bookings. Bookings can't be deleted on the hosted demo (DELETE → 500, verified 2026-11-07): keep them few.
 */
export function futureStay(nights = 2): { checkin: string; checkout: string } {
  const start = new Date(Date.UTC(2030 + randomInt(0, 20), randomInt(0, 12), 1 + randomInt(0, 27)));
  const end = new Date(start.getTime() + nights * 86_400_000);
  const day = (date: Date) => date.toISOString().slice(0, 10);
  return { checkin: day(start), checkout: day(end) };
}

/** A contact-form message within the API rules: subject 5–100, description 20–2000 characters. */
export function contactMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  const guest = syntheticGuest();
  return {
    name: `${guest.firstname} ${guest.lastname}`,
    email: guest.email,
    phone: guest.phone,
    subject: 'Automated suite check',
    description: 'Synthetic message sent by the agentic QA suite. Safe to ignore or delete.',
    ...overrides,
  };
}

export interface ContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}
