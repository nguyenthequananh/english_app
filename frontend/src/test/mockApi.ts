import { vi } from 'vitest';

export interface MockReply { status?: number; body?: unknown }
export type MockHandler = (body: unknown) => MockReply;
export interface MockCall { method: string; path: string; body: unknown }

/** Giả lập fetch: khoá "METHOD /path?query" (không có tiền tố /api). Không có handler → 404 JSON. */
export function mockApi(handlers: Record<string, MockHandler>): MockCall[] {
  const calls: MockCall[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    const path = url.replace(/^\/api/, '');
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({ method, path, body });
    const handler = handlers[`${method} ${path}`];
    if (!handler) {
      return new Response(JSON.stringify({ status: 404, code: 'NOT_FOUND', detail: `Không có mock cho ${method} ${path}` }),
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } });
    }
    const reply = handler(body);
    const status = reply.status ?? 200;
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body),
      { status, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

export function problem(status: number, code: string, detail: string): MockReply {
  return { status, body: { status, code, detail } };
}
