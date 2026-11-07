import { API_URL, APP_URL } from '../../playwright.config';

export { API_URL, APP_URL };

// The platform's single admin account is published in its own README and on the demo site.
// It is not a secret; override it through env vars for a local copy with other credentials.
export const admin = {
  username: process.env.RBP_ADMIN_USERNAME ?? 'admin',
  password: process.env.RBP_ADMIN_PASSWORD ?? 'password',
};
