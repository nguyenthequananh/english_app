import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { http } from '@/config/axios';

export interface MockReply { status?: number; body?: unknown }
export type MockHandler = (body: unknown) => MockReply;
export interface MockCall { method: string; path: string; body: unknown; headers: Record<string, string> }

const realAdapter = http.defaults.adapter;

function install(adapter: AxiosAdapter) {
  http.defaults.adapter = adapter;
}

/** Chuẩn hoá header của request thành object { tên-chữ-thường: giá trị } để test dễ so sánh. */
function normalizeHeaders(raw: InternalAxiosRequestConfig['headers']): Record<string, string> {
  const json = AxiosHeaders.from(raw).toJSON() as Record<string, unknown>;
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(json)) {
    if (value != null) headers[key.toLowerCase()] = String(value);
  }
  return headers;
}

/** Trả adapter thật cho instance axios (gọi trong afterEach của setup.ts). */
export function resetApiMock() {
  http.defaults.adapter = realAdapter;
}

function respond(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosResponse {
  const response: AxiosResponse = {
    data: body === undefined ? '' : body,
    status,
    statusText: String(status),
    headers: new AxiosHeaders({ 'content-type': 'application/json' }),
    config,
  };
  if (status >= 200 && status < 300) return response;
  throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, null, response);
}

/** Giả backend: khoá "METHOD /path?query" (không có tiền tố /api). Không có handler → 404 ProblemDetail. */
export function mockApi(handlers: Record<string, MockHandler>): MockCall[] {
  const calls: MockCall[] = [];
  install(async (config) => {
    const method = (config.method ?? 'get').toUpperCase();
    const path = config.url ?? '';
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    calls.push({ method, path, body, headers: normalizeHeaders(config.headers) });
    const handler = handlers[`${method} ${path}`];
    if (!handler) {
      return respond(config, 404, { status: 404, code: 'NOT_FOUND', detail: `Không có mock cho ${method} ${path}` });
    }
    const reply = handler(body);
    return respond(config, reply.status ?? 200, reply.body);
  });
  return calls;
}

/** Giả mất kết nối: mọi request lỗi mạng (không có response). */
export function mockNetworkDown() {
  install(async (config) => {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  });
}

export function problem(status: number, code: string, detail: string): MockReply {
  return { status, body: { status, code, detail } };
}
