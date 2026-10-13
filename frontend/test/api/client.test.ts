import { vi } from 'vitest';
import { api, ApiError, setProfileRequiredHandler } from '@/api/client';
import { mockApi, mockNetworkDown, problem } from '@test/mock-api';

test('lỗi ProblemDetail thành ApiError có code, detail và errors', async () => {
  mockApi({ 'GET /x': () => ({ status: 400, body: { status: 400, code: 'CONTENT_INVALID', detail: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] } }) });
  const err = await api.get('/x').catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err).toMatchObject({ status: 400, code: 'CONTENT_INVALID', message: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] });
});

test('lỗi không có ProblemDetail thành HTTP_<status>', async () => {
  mockApi({ 'GET /x': () => ({ status: 502, body: undefined }) });
  await expect(api.get('/x')).rejects.toMatchObject({ status: 502, code: 'HTTP_502', message: 'Lỗi 502' });
});

test('204 trả về undefined, 200 trả về JSON', async () => {
  mockApi({
    'POST /profiles/1/select': () => ({ status: 204 }),
    'GET /health': () => ({ body: { app: 'ielts-app' } }),
  });
  await expect(api.post('/profiles/1/select', {})).resolves.toBeUndefined();
  await expect(api.get('/health')).resolves.toEqual({ app: 'ielts-app' });
});

test('mất kết nối thành ApiError NETWORK', async () => {
  mockNetworkDown();
  await expect(api.get('/health')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
});

test('PROFILE_REQUIRED gọi handler chuyển về chọn hồ sơ', async () => {
  const handler = vi.fn();
  setProfileRequiredHandler(handler);
  mockApi({ 'GET /roadmap': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ') });
  await api.get('/roadmap').catch(() => undefined);
  expect(handler).toHaveBeenCalledOnce();
});

test('gửi JSON thành object, gửi FormData giữ nguyên FormData', async () => {
  const calls = mockApi({ 'POST /words': () => ({ body: {} }), 'POST /content/import': () => ({ body: [] }) });
  await api.post('/words', { headword: 'x' });
  await api.post('/content/import', new FormData());
  expect(calls[0]).toMatchObject({ method: 'POST', path: '/words', body: { headword: 'x' } });
  expect(calls[1].body).toBeInstanceOf(FormData);
});

test('PUT và DELETE đi đúng phương thức', async () => {
  const calls = mockApi({ 'PUT /profiles/current': () => ({ body: { id: 1 } }), 'DELETE /profiles/current': () => ({ status: 204 }) });
  await api.put('/profiles/current', { name: 'Lan' });
  await api.del('/profiles/current');
  expect(calls.map((c) => c.method)).toEqual(['PUT', 'DELETE']);
});
