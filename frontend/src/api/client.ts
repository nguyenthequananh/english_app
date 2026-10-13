import axios from 'axios';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}

let profileRequiredHandler: () => void = () => undefined;

export function setProfileRequiredHandler(fn: () => void) {
  profileRequiredHandler = fn;
}

/** Instance axios duy nhất của app. Test thay `http.defaults.adapter` (xem test/support/mock-api.ts). */
export const http = axios.create({ baseURL: '/api' });

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }
  const { status, data } = error.response;
  const problem = (data !== null && typeof data === 'object' ? data : {}) as { code?: string; detail?: string; errors?: string[] };
  const err = new ApiError(status, problem.code ?? `HTTP_${status}`, problem.detail ?? `Lỗi ${status}`, problem.errors ?? []);
  if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
  return err;
}

http.interceptors.response.use((res) => res, (error: unknown) => Promise.reject(toApiError(error)));

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
