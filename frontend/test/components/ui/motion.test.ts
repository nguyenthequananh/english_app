import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { appleSpring, DURATION, project, rubberband, SPRING, SPRING_FLIP, SPRING_SETTLE } from '@/components/ui/motion';

test('lò xo khai theo damping ratio + response của Apple, quy ra vật lý (giữ vận tốc khi đổi đích)', () => {
  const s = appleSpring(0.8, 0.3);
  expect(s.mass).toBe(1);
  const zeta = s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
  const response = (2 * Math.PI) / Math.sqrt(s.stiffness);
  expect(zeta).toBeCloseTo(0.8, 6);
  expect(response).toBeCloseTo(0.3, 6);
  expect(s).toEqual(SPRING_SETTLE);
  // Mặc định cho chạm/nhấn: tới hạn, không nảy
  expect(SPRING.damping / (2 * Math.sqrt(SPRING.stiffness))).toBeCloseTo(1, 6);
  // Lật thẻ: tới hạn, response 0.3s
  expect(SPRING_FLIP).toEqual(appleSpring(1, 0.3));
  // Không dùng tham số theo thời gian (motion 14 bỏ vận tốc thừa hưởng với chúng)
  expect(SPRING).not.toHaveProperty('bounce');
  expect(SPRING).not.toHaveProperty('visualDuration');
});

test('phép chiếu quán tính của Apple (deceleration 0.998)', () => {
  expect(project(1000)).toBeCloseTo(499, 0);
  expect(project(-600)).toBeCloseTo(-299.4, 1);
  expect(project(0)).toBe(0);
});

test('rubberband: 0 tại mép, tiệm cận nhưng không vượt kích thước', () => {
  expect(rubberband(0, 400)).toBe(0);
  expect(rubberband(50, 400)).toBeCloseTo((50 * 400 * 0.55) / (400 + 0.55 * 50), 6);
  expect(rubberband(1e7, 400)).toBeLessThan(400);
  expect(rubberband(10, 0)).toBe(0);
});

test('DURATION khớp token --duration-* trong tokens.css', () => {
  const css = readFileSync(resolve(__dirname, '../../../src/styles/tokens.css'), 'utf8');
  const ms = (name: string) => Number(css.match(new RegExp(`--duration-${name}:\\s*(\\d+)ms`))?.[1]);
  expect(DURATION.press * 1000).toBe(ms('press'));
  expect(DURATION.fast * 1000).toBe(ms('fast'));
  expect(DURATION.base * 1000).toBe(ms('base'));
});
