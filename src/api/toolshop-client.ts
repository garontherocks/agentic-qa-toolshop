import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

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

/** Thin, typed wrapper over the Toolshop REST API. Assertions stay in the tests. */
export class ToolshopClient {
  private token?: string;

  constructor(private readonly request: APIRequestContext) {}

  private headers(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async login(email: string, password: string): Promise<string> {
    const response = await this.request.post('/users/login', { data: { email, password } });
    expect(response, 'login should succeed for a seeded account').toBeOK();
    const body = (await response.json()) as { access_token: string };
    this.token = body.access_token;
    return this.token;
  }

  get(path: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.request.get(path, { params, headers: this.headers() });
  }

  post(path: string, data: unknown): Promise<APIResponse> {
    return this.request.post(path, { data, headers: this.headers() });
  }

  put(path: string, data: unknown): Promise<APIResponse> {
    return this.request.put(path, { data, headers: this.headers() });
  }

  delete(path: string): Promise<APIResponse> {
    return this.request.delete(path, { headers: this.headers() });
  }

  async products(params: Record<string, string | number> = {}): Promise<Paginated<Product>> {
    const response = await this.get('/products', params);
    expect(response).toBeOK();
    return (await response.json()) as Paginated<Product>;
  }
}
