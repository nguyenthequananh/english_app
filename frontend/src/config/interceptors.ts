import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { ApiError } from '../api/api-error';

let profileRequiredHandler: () => void = () => undefined;

/** App đăng ký hành động khi backend báo chưa chọn hồ sơ (xoá cache + về /profiles). */
export function setProfileRequiredHandler(fn: () => void) {
  profileRequiredHandler = fn;
}

/** Chuẩn hoá lỗi axios (có response → ProblemDetail, không response → mất kết nối) thành ApiError. */
export function toApiError(error: AxiosError): ApiError {
  if (!error.response) {
    return new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }
  const { status, data } = error.response;
  const problem = (data !== null && typeof data === 'object' ? data : {}) as { code?: string; detail?: string; errors?: string[] };
  const err = new ApiError(status, problem.code ?? `HTTP_${status}`, problem.detail ?? `Lỗi ${status}`, problem.errors ?? []);
  if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
  return err;
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.response.use((res) => res, (error: unknown) => {
    // Chỉ lỗi axios (HTTP hoặc mất kết nối) mới được gắn nhãn NETWORK/ProblemDetail.
    // Lỗi khác (ví dụ lỗi lập trình ném trong transform) không phải "app mất kết nối" —
    // giữ nguyên lỗi gốc để không che giấu bug thật.
    if (!axios.isAxiosError(error)) {
      console.error('Lỗi không phải từ axios trong response interceptor:', error);
      return Promise.reject(error);
    }
    return Promise.reject(toApiError(error));
  });
}
