import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { SyntheticUser } from '../data/factories';

export interface Paginated<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
  category: { id: string; name: string };
  brand: { id: string; name: string };
}

/** Extra request headers; an explicit `Authorization` here overrides the client's own bearer. */
export type HeaderOverrides = Record<string, string>;

/** Thin, typed wrapper over the Toolshop REST API. Assertions stay in the tests. */
export class ToolshopClient {
  private accessToken?: string;

  constructor(private readonly request: APIRequestContext) {}

  /** The bearer currently sent with every request, if any. */
  get token(): string | undefined {
    return this.accessToken;
  }

  /** Sends `token` as the bearer from now on (any string, e.g. 'invalid' for negative checks); undefined clears it. */
  setToken(token: string | undefined): this {
    this.accessToken = token;
    return this;
  }

  private headers(overrides: HeaderOverrides = {}): Record<string, string> {
    const auth: Record<string, string> = this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
    return { ...auth, ...overrides };
  }

  /**
   * `POST /users/login` and keeps the bearer. On failure the message carries the status and body
   * (e.g. 423 when a shared demo account is locked); never the password, and any token is redacted.
   */
  async login(email: string, password: string): Promise<string> {
    const response = await this.loginResponse(email, password);
    const text = (await response.text()).replace(/("access_token"\s*:\s*")[^"]*"/g, '$1<redacted>"');
    expect(response.status(), `login should succeed for ${email}: got ${response.status()} ${text}`).toBe(200);
    const body = (await response.json()) as { access_token: string };
    this.accessToken = body.access_token;
    return this.accessToken;
  }

  /** Raw `POST /users/login` with no assertion and no token side effect, for negative tests. */
  loginResponse(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/users/login', { data: { email, password } });
  }

  /** `POST /users/register`. */
  register(user: SyntheticUser): Promise<APIResponse> {
    return this.post('/users/register', user);
  }

  /** `DELETE /users/{id}` (admin bearer required for 204). */
  deleteUser(id: string): Promise<APIResponse> {
    return this.delete(`/users/${id}`);
  }

  get(path: string, params?: Record<string, string | number>, headers?: HeaderOverrides): Promise<APIResponse> {
    return this.request.get(path, { params, headers: this.headers(headers) });
  }

  post(path: string, data: unknown, headers?: HeaderOverrides): Promise<APIResponse> {
    return this.request.post(path, { data, headers: this.headers(headers) });
  }

  put(path: string, data: unknown, headers?: HeaderOverrides): Promise<APIResponse> {
    return this.request.put(path, { data, headers: this.headers(headers) });
  }

  delete(path: string, headers?: HeaderOverrides): Promise<APIResponse> {
    return this.request.delete(path, { headers: this.headers(headers) });
  }

  async products(params: Record<string, string | number> = {}): Promise<Paginated<Product>> {
    const response = await this.get('/products', params);
    expect(response).toBeOK();
    return (await response.json()) as Paginated<Product>;
  }
}
