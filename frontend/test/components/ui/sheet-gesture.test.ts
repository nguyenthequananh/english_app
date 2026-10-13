import { REVERSE_VELOCITY, sheetOffset, shouldDismissSheet, VelocityTracker } from '@/components/ui/sheet-gesture';

const height = 500;

test('vuốt nhanh xuống một đoạn ngắn thì đóng (phép chiếu quán tính)', () => {
  // 40px + project(800 px/s) ≈ 40 + 399 > 250
  expect(shouldDismissSheet({ y: 40, velocity: 800, height })).toBe(true);
});

test('kéo xa rồi hất ngược lên thì bảng ở lại, dù đã quá nửa', () => {
  expect(shouldDismissSheet({ y: 400, velocity: -300, height })).toBe(false);
});

test('kéo chậm một đoạn nhỏ rồi thả thì ở lại', () => {
  expect(shouldDismissSheet({ y: 60, velocity: 100, height })).toBe(false);
});

test('kéo chậm quá nửa rồi dừng tay thì đóng (điểm dừng gần nhất là đóng)', () => {
  expect(shouldDismissSheet({ y: 260, velocity: 0, height })).toBe(true);
});

test('rung tay nhẹ hướng lên lúc thả không tính là hất ngược', () => {
  expect(shouldDismissSheet({ y: 300, velocity: -(REVERSE_VELOCITY - 1), height })).toBe(true);
});

test('đi xuống bám 1:1, đẩy lên quá mép thì rubber-band tăng dần với hằng số 0.55', () => {
  expect(sheetOffset(120, height)).toBe(120);
  // 100·500·0.55 / (500 + 0.55·100) = 27500 / 555
  expect(sheetOffset(-100, height)).toBeCloseTo(-49.55, 2);
  expect(sheetOffset(-200, height)).toBeCloseTo(-90.16, 2);
  // Càng kéo xa, mỗi px thêm vào càng đi được ít hơn, và không bao giờ vượt chiều cao bảng
  const step1 = sheetOffset(-100, height) - sheetOffset(0, height);
  const step2 = sheetOffset(-200, height) - sheetOffset(-100, height);
  expect(Math.abs(step2)).toBeLessThan(Math.abs(step1));
  expect(Math.abs(sheetOffset(-1e6, height))).toBeLessThan(height);
});

test('vận tốc lúc thả tính từ ~100ms cuối; dừng tay lâu rồi mới thả thì vận tốc 0', () => {
  const t = new VelocityTracker();
  t.add(0, 0);
  t.add(16, 10);
  t.add(32, 20);
  t.add(48, 30);
  expect(t.velocity()).toBeCloseTo(625, 0); // 30px / 48ms
  expect(t.velocity(48 + 150)).toBe(0);
  t.reset();
  expect(t.velocity()).toBe(0);
});
