import type { Skill } from '../types/skill';
import { SKILL_META } from '../ui/skill';

export const DAY_LABEL: Record<string, string> = {
  MON: 'Thứ 2', TUE: 'Thứ 3', WED: 'Thứ 4', THU: 'Thứ 5', FRI: 'Thứ 6', SAT: 'Thứ 7', SUN: 'Chủ nhật',
};

/** Nhãn loại bài lấy từ SKILL_META để lộ trình, bài học và lưới luyện tập gọi cùng một tên. */
export const LESSON_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SKILL_META).map(([skill, meta]) => [skill, meta.label]),
);

export const STATUS_LABEL: Record<string, string> = { LOCKED: 'Chưa mở', ACTIVE: 'Đang học', DONE: 'Hoàn thành' };
export const WORD_STATUS_LABEL: Record<string, string> = { NEW: 'Mới', LEARNING: 'Đang học', KNOWN: 'Đã thuộc' };

/** Loại bài từ backend (`GRAMMAR`, `READING`…) → kỹ năng có màu; loại lạ thì `null` (dùng tông trung tính). */
export function lessonSkill(type: string): Skill | null {
  return type in SKILL_META ? (type as Skill) : null;
}

export const dayLabel = (day: string) => DAY_LABEL[day] ?? day;
export const lessonTypeLabel = (type: string) => LESSON_TYPE_LABEL[type] ?? type;
