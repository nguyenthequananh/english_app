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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, credentials: 'same-origin', headers };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }

  if (!res.ok) {
    let problem: { code?: string; detail?: string; errors?: string[] } = {};
    try {
      problem = await res.json();
    } catch {
      // không phải JSON
    }
    const err = new ApiError(res.status, problem.code ?? `HTTP_${res.status}`,
      problem.detail ?? `Lỗi ${res.status}`, problem.errors ?? []);
    if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
    throw err;
  }

  const text = res.status === 204 ? '' : await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
