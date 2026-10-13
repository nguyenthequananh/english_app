import axios, { type AxiosInstance } from 'axios';
import { ApiError } from '../api/api-error';

let profileRequiredHandler: () => void = () => undefined;

/** App đăng ký hành động khi backend báo chưa chọn hồ sơ (xoá cache + về /profiles). */
export function setProfileRequiredHandler(fn: () => void) {
  profileRequiredHandler = fn;
}

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }
  const { status, data } = error.response;
  const problem = (data !== null && typeof data === 'object' ? data : {}) as { code?: string; detail?: string; errors?: string[] };
  const err = new ApiError(status, problem.code ?? `HTTP_${status}`, problem.detail ?? `Lỗi ${status}`, problem.errors ?? []);
  if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
  return err;
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.response.use((res) => res, (error: unknown) => Promise.reject(toApiError(error)));
}
