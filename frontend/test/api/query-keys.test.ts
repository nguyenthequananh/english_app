import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as keys from '@/api/query-keys';

test('các khoá cache không trùng tiền tố nhau', () => {
  const prefixes = Object.values(keys)
    .filter((v): v is readonly string[] => Array.isArray(v) && v !== keys.PROFILE_INDEPENDENT_KEYS)
    .map((k) => k.join('/'));
  expect(new Set(prefixes).size).toBe(prefixes.length);
  expect(keys.lessonKey('S0-U01-G1')).toEqual([...keys.LESSON_KEY, 'S0-U01-G1']);
  expect(keys.unitLessonsKey('S0-U01')).toEqual([...keys.UNIT_LESSONS_KEY, 'S0-U01']);
});

test('query-keys không import gì, và không trang nào import từ file trang khác (giữ chunk đầu của / gọn)', () => {
  const src = join(process.cwd(), 'src');
  expect(readFileSync(join(src, 'api/query-keys.ts'), 'utf8')).not.toMatch(/^import /m);
  const pages = join(src, 'pages');
  const offenders = readdirSync(pages, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => /from '(\.\.?\/)+(pages\/)?[\w-]+-page'/.test(readFileSync(join(pages, f), 'utf8')));
  expect(offenders).toEqual([]);
});
