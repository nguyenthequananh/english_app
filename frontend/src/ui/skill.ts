import type { IconName } from '../types/icon';
import type { Skill } from '../types/skill';

export type { Skill } from '../types/skill';

/**
 * Một nguồn sự thật cho nhãn, màu, icon của từng kỹ năng.
 * `color` là tên màu Tailwind (`bg-grammar`, `text-grammar`…) và cũng là hậu tố lớp tông (`tone-grammar`).
 */
export const SKILL_META: Record<Skill, { label: string; color: 'grammar' | 'pronunciation' | 'listening' | 'reading' | 'vocab'; icon: IconName }> = {
  GRAMMAR: { label: 'Ngữ pháp', color: 'grammar', icon: 'text' },
  PRONUNCIATION: { label: 'Phát âm', color: 'pronunciation', icon: 'mic' },
  LISTENING: { label: 'Nghe', color: 'listening', icon: 'headphones' },
  READING: { label: 'Đọc', color: 'reading', icon: 'book' },
  VOCAB: { label: 'Từ vựng', color: 'vocab', icon: 'cards' },
};

export const SKILLS = Object.keys(SKILL_META) as Skill[];

/** Lớp tông màu cho một kỹ năng hoặc tông chung (xem `.tone-*` trong index.css). */
export function toneClass(tone: Skill | 'accent' | 'success' | 'warning' | 'danger' | 'neutral'): string {
  if (tone in SKILL_META) return `tone-${SKILL_META[tone as Skill].color}`;
  return `tone-${tone}`;
}
