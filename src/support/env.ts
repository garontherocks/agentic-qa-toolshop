import { TOOLSHOP_API_URL, TOOLSHOP_URL } from '../../playwright.config';

export { TOOLSHOP_API_URL, TOOLSHOP_URL };

export type Role = 'admin' | 'customer' | 'customer2';

// Toolshop ships these shared demo accounts and publishes them in its own README.
// They are not secrets; override them through env vars for a local or private copy.
export const accounts: Record<Role, { email: string; password: string }> = {
  admin: {
    email: process.env.TOOLSHOP_ADMIN_EMAIL ?? 'admin@practicesoftwaretesting.com',
    password: process.env.TOOLSHOP_ADMIN_PASSWORD ?? 'welcome01',
  },
  customer: {
    email: process.env.TOOLSHOP_CUSTOMER_EMAIL ?? 'customer@practicesoftwaretesting.com',
    password: process.env.TOOLSHOP_CUSTOMER_PASSWORD ?? 'welcome01',
  },
  customer2: {
    email: process.env.TOOLSHOP_CUSTOMER2_EMAIL ?? 'customer2@practicesoftwaretesting.com',
    password: process.env.TOOLSHOP_CUSTOMER2_PASSWORD ?? 'welcome01',
  },
};
