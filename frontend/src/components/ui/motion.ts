import type { Transition } from 'motion/react';

/*
 * Một nguồn duy nhất cho chuyển động (theo skill `apple-design`).
 *
 * Lò xo khai bằng hai tham số của Apple — damping ratio (ζ, độ nảy) và response (giây, độ nhanh) — rồi quy ra
 * stiffness/damping vật lý (mass 1). KHÔNG dùng `bounce` + `visualDuration`/`duration` của Motion: ở motion 14
 * lò xo khai theo thời gian bỏ qua vận tốc thừa hưởng (`inheritVelocity` trả 0 trong
 * `motion-dom/.../generators/spring.mjs`), nên đổi hướng giữa chừng sẽ khựng lại ("bức tường gạch") và lúc thả
 * tay không nhận được vận tốc ngón tay. Lò xo vật lý thì giữ vận tốc qua mọi lần đổi đích.
 *
 * Quy ước: thao tác chạm/nhấn/chọn → ζ = 1 (không nảy). Chỉ sau một cử chỉ có quán tính (kéo, vuốt) mới cho nảy
 * nhẹ (ζ ≈ 0.8).
 */

/** Lò xo theo cách Apple mô tả: ζ = damping ratio, response = chu kỳ dao động riêng (giây). */
export function appleSpring(dampingRatio: number, response: number) {
  const omega = (2 * Math.PI) / response; // tần số góc riêng, rad/s
  return {
    type: 'spring',
    stiffness: omega * omega,
    damping: 2 * dampingRatio * omega,
    mass: 1,
  } as const satisfies Transition;
}

/** Mặc định cho mọi thứ do chạm/nhấn/chọn: tới đích dứt khoát, không vượt (Apple "move" 1.0 / 0.4). */
export const SPRING = appleSpring(1, 0.4);
/** Bảng rời đi sau khi người dùng đóng (vuốt, nút Đóng, Esc): gọn hơn lúc mở, không nảy. */
export const SPRING_EXIT = appleSpring(1, 0.3);
/** Trả về chỗ cũ sau khi THẢ một cử chỉ kéo — chỉ ở đây mới nảy nhẹ (Apple "drawer/sheet" 0.8 / 0.3). */
export const SPRING_SETTLE = appleSpring(0.8, 0.3);

/** Đường cong ease-out mạnh, trùng `--ease-out` trong tokens.css. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Thời lượng (giây) — gương của `--duration-*` trong `src/styles/tokens.css` (test kiểm tra hai bên khớp nhau). */
export const DURATION = {
  press: 0.14,
  fast: 0.2,
  base: 0.3,
} as const;

/** Mờ dần ngắn (giảm chuyển động, nội dung đổi chỗ): không có chuyển động vị trí. */
export const FADE: Transition = { duration: DURATION.fast, ease: EASE_OUT };
/** Mờ đi khi rời: nhanh hơn lúc vào — hệ thống đáp lại thì phải gọn. */
export const FADE_OUT: Transition = { duration: DURATION.press, ease: EASE_OUT };
/**
 * Thẻ kế tiếp trong buổi ôn chỉ hiện dần 120ms, không trượt: chấm thẻ là thao tác lặp hàng trăm lần,
 * nhanh hơn cả `--duration-press` có chủ đích.
 */
export const FADE_NEXT_CARD: Transition = { duration: 0.12, ease: EASE_OUT };

/**
 * Điểm dừng dự kiến của một cú vuốt (Apple, *Designing Fluid Interfaces*): quãng đường còn trôi thêm nếu
 * vật giảm tốc như cuộn trang. `velocity` tính bằng px/s; `decelerationRate` 0.998 = cảm giác cuộn thường.
 */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Rubber-band tăng dần ở mép: kéo quá giới hạn `overshoot` px thì vật chỉ đi được phần trả về, càng xa càng
 * nặng tay, không bao giờ vượt `dimension`. Hằng số 0.55 là của iOS.
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
