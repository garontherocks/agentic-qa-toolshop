import { randomUUID } from 'node:crypto';

// The hosted Toolshop database is shared with everyone: never use real personal data.
// Every generated record is obviously synthetic and traceable to this suite.
const runTag = () => randomUUID().slice(0, 8);

export function syntheticUser(overrides: Partial<SyntheticUser> = {}): SyntheticUser {
  const tag = runTag();
  return {
    first_name: 'QA',
    last_name: `Agent ${tag}`,
    email: `qa-agent+${tag}@example.test`,
    password: `Sx!${tag}Aa9#`,
    dob: '1990-01-01',
    phone: '0000000000',
    address: { street: '1 Test Street', city: 'Testville', state: 'TS', country: 'NL', postal_code: '0000 AA', house_number: '1' },
    ...overrides,
  };
}

export interface SyntheticUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  dob: string;
  phone: string;
  address: { street: string; city: string; state: string; country: string; postal_code: string; house_number: string };
}

export function contactMessage(overrides: Partial<Record<'name' | 'email' | 'subject' | 'message', string>> = {}) {
  return {
    name: 'QA Agent',
    email: `qa-agent+${runTag()}@example.test`,
    subject: 'webmaster',
    message: 'Automated message from the agentic-qa-toolshop suite. Please ignore. '.repeat(2).trim(),
    ...overrides,
  };
}
