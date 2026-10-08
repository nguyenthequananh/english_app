import { vi } from 'vitest';
import { api, ApiError, setProfileRequiredHandler } from './client';

function reply(status: number, body?: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })));
}

test('lỗi ProblemDetail thành ApiError có code, detail và errors', async () => {
  reply(400, { status: 400, code: 'CONTENT_INVALID', detail: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] });
  const err = await api.get('/x').catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err).toMatchObject({ status: 400, code: 'CONTENT_INVALID', message: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] });
});

test('204 trả về undefined, 200 trả về JSON', async () => {
  reply(204);
  await expect(api.post('/profiles/1/select', {})).resolves.toBeUndefined();
  reply(200, { app: 'ielts-app' });
  await expect(api.get('/health')).resolves.toEqual({ app: 'ielts-app' });
});

test('mất kết nối thành ApiError NETWORK', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  await expect(api.get('/health')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
});

test('PROFILE_REQUIRED gọi handler chuyển về chọn hồ sơ', async () => {
  const handler = vi.fn();
  setProfileRequiredHandler(handler);
  reply(401, { status: 401, code: 'PROFILE_REQUIRED', detail: 'Chưa chọn hồ sơ' });
  await api.get('/roadmap').catch(() => undefined);
  expect(handler).toHaveBeenCalledOnce();
});

test('gửi JSON có Content-Type, gửi FormData thì để trình duyệt tự đặt', async () => {
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await api.post('/words', { headword: 'x' });
  await api.post('/content/import', new FormData());
  const [, jsonInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  const [, formInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
  expect((jsonInit.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  expect((formInit.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  expect(jsonInit.credentials).toBe('same-origin');
});
