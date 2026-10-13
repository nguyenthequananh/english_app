import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(__dirname, '../../src');

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : [],
  );
}

/** Bỏ chú thích để chữ "prefers-color-scheme" trong lời giải thích không bị đếm. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

test('chỉ `@custom-variant dark` (tokens.css) đọc prefers-color-scheme — chỗ khác dùng `@variant dark`/`dark:`', () => {
  // Một `@media (prefers-color-scheme: dark)` trần bỏ qua lựa chọn Sáng/Tối của người dùng (data-theme).
  const hits = cssFiles(SRC).flatMap((file) => {
    const count = stripComments(readFileSync(file, 'utf8')).match(/prefers-color-scheme/g)?.length ?? 0;
    return count ? [[relative(SRC, file), count] as const] : [];
  });
  expect(hits).toEqual([['styles/tokens.css', 1]]);
});

test('biến thể dark: áp khi data-theme="dark", hoặc hệ thống tối mà người dùng không ép Sáng', () => {
  const tokens = stripComments(readFileSync(join(SRC, 'styles/tokens.css'), 'utf8'));
  const variant = tokens.match(/@custom-variant dark \{[\s\S]*?\n\}/)?.[0] ?? '';
  expect(variant).toContain('[data-theme="dark"]');
  expect(variant).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*&:where\(:root:not\(\[data-theme="light"\]\)/);
});

test('mỗi token tối đều có bản sáng (không gõ nhầm tên biến trong khối tối)', () => {
  const tokens = stripComments(readFileSync(join(SRC, 'styles/tokens.css'), 'utf8'));
  const darkBlock = tokens.match(/@variant dark \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
  const darkVars = [...darkBlock.matchAll(/(--[\w-]+):/g)].map((m) => m[1]);
  const lightBlock = tokens.slice(0, tokens.indexOf('@variant dark'));
  expect(darkVars.length).toBeGreaterThan(20);
  for (const v of darkVars) expect(lightBlock, v).toContain(`${v}:`);
});
