/*
 * Khoá cache TanStack Query dùng ở từ hai file trở lên (một trang đọc, trang khác ghi hoặc làm mới).
 * Khoá chỉ một file dùng thì khai tại chỗ. File này không import gì: trang nào cũng import được
 * mà không kéo theo code của trang khác (trước đây Hôm nay import SESSION_KEY từ session-page,
 * nên cả màn Buổi học nằm trong chunk đầu).
 * Khoá dạng tiền tố (`LESSON_KEY`, `UNIT_LESSONS_KEY`) dùng để làm mới mọi biến thể; khoá đầy đủ lấy từ hàm `…Key(code)`.
 */

/** Buổi học hôm nay. Chỉ màn Buổi học được gọi API (GET tạo buổi học); Hôm nay chỉ đọc cache. */
export const SESSION_KEY = ['session', 'today'] as const;
/** Hồ sơ đang dùng (RequireProfile, `useCurrentProfile`, lưu hồ sơ). */
export const CURRENT_PROFILE_KEY = ['profile', 'current'] as const;
/** Danh sách hồ sơ — giữ lại khi đăng xuất. */
export const PROFILES_KEY = ['profiles'] as const;
/** Sức khoẻ backend — giữ lại khi đăng xuất / đổi hồ sơ. */
export const HEALTH_KEY = ['health'] as const;
/** Tiền tố của các khoá không thuộc hồ sơ nào — giữ lại khi xoá cache lúc đổi hồ sơ / mất hồ sơ. */
export const PROFILE_INDEPENDENT_KEYS: readonly string[] = [PROFILES_KEY[0], HEALTH_KEY[0]];
export const SUMMARY_KEY = ['summary'] as const;
export const ROADMAP_KEY = ['roadmap'] as const;
export const STATS_KEY = ['stats'] as const;
export const LESSON_KEY = ['lesson'] as const;
export const lessonKey = (code: string) => [...LESSON_KEY, code] as const;
export const UNIT_LESSONS_KEY = ['unitLessons'] as const;
export const unitLessonsKey = (code: string) => [...UNIT_LESSONS_KEY, code] as const;
