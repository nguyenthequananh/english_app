import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = resolve(__dirname, '../../src');
const css = readFileSync(resolve(SRC, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/*
 * Tab bar cố định (<lg) và TopBar dính đỉnh che phần trang: thiếu scroll-padding thì Tab tới nút cuối trang
 * (ví dụ Segmented "Giao diện" ở Cá nhân, 390px) dừng ngay dưới tab bar — đang focus mà không thấy.
 */
test('trang có tab bar chừa đáy, trang có TopBar chừa đỉnh khi cuộn tới phần tử được focus', () => {
  expect(css).toMatch(/@media \(width < 64rem\)\s*\{\s*html:has\(\[data-nav-bar\]\)\s*\{\s*scroll-padding-bottom: calc\(var\(--tabbar-height\)/);
  expect(css).toMatch(/html:has\(\[data-top-bar\]\)\s*\{\s*scroll-padding-top:/);
  // Hai móc CSS phải còn trên đúng component.
  expect(readFileSync(resolve(SRC, 'shell/nav-bar.tsx'), 'utf8')).toMatch(/<nav[^>]*data-nav-bar=""/);
  expect(readFileSync(resolve(SRC, 'components/ui/top-bar.tsx'), 'utf8')).toContain('data-top-bar=""');
});
