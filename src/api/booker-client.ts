import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ContactMessage, SyntheticGuest } from '../data/factories';

export interface Room {
  roomid: number;
  roomName: string;
  type: string;
  accessible: boolean;
  image: string;
  description: string;
  features: string[];
  roomPrice: number;
}

export interface Booking {
  bookingid: number;
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
}

export interface NewBooking extends Pick<SyntheticGuest, 'firstname' | 'lastname'> {
  roomid: number;
  depositpaid: boolean;
  email?: string;
  phone?: string;
  bookingdates: { checkin: string; checkout: string };
}

/**
 * Thin, typed wrapper over the platform's REST API (`/api/*` on the app host). Assertions stay in the tests.
 * Admin calls authenticate with the `token` cookie returned by `POST /api/auth/login` (verified 2026-11-07).
 */
export class BookerClient {
  private token?: string;

  constructor(private readonly request: APIRequestContext) {}

  get authenticated(): boolean {
    return Boolean(this.token);
  }

  private headers(): Record<string, string> {
    return this.token ? { Cookie: `token=${this.token}` } : {};
  }

  /** `POST /api/auth/login` and keeps the token; a failure message never contains the token. */
  async login(username: string, password: string): Promise<void> {
    const response = await this.loginResponse(username, password);
    expect(response.status(), `admin login should succeed: got ${response.status()}`).toBe(200);
    this.token = ((await response.json()) as { token: string }).token;
  }

  /** Raw `POST /api/auth/login` with no assertion and no token side effect, for negative tests. */
  loginResponse(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: { username, password } });
  }

  /** `POST /api/auth/logout` and forgets the token. */
  async logout(): Promise<APIResponse> {
    const response = await this.request.post('/api/auth/logout', { data: { token: this.token }, headers: this.headers() });
    this.token = undefined;
    return response;
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

  async rooms(): Promise<Room[]> {
    const response = await this.get('/api/room');
    expect(response).toBeOK();
    return ((await response.json()) as { rooms: Room[] }).rooms;
  }

  /** `POST /api/message` (public contact form). */
  sendMessage(message: ContactMessage): Promise<APIResponse> {
    return this.post('/api/message', message);
  }

  /** `POST /api/booking` (public). The hosted demo can't delete bookings: create as few as possible. */
  createBooking(booking: NewBooking): Promise<APIResponse> {
    return this.post('/api/booking', booking);
  }

  /** `GET /api/booking?roomid=` (admin token required: 401 without it). */
  async bookings(roomid: number): Promise<Booking[]> {
    const response = await this.get('/api/booking', { roomid });
    expect(response).toBeOK();
    return ((await response.json()) as { bookings: Booking[] }).bookings;
  }
}
