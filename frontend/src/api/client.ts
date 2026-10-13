import { http } from '../config/axios';

async function request<T>(method: 'get' | 'post' | 'put' | 'delete', path: string, body?: unknown): Promise<T> {
  const res = await http.request<T>({ method, url: path, data: body });
  return (res.status === 204 || (res.data as unknown) === '' ? undefined : res.data) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('get', path),
  post: <T>(path: string, body?: unknown) => request<T>('post', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('put', path, body),
  del: <T>(path: string) => request<T>('delete', path),
};
