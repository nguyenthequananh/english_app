import { project, rubberband } from './motion';

/*
 * Logic thuần của cử chỉ kéo bảng (Sheet) trên điện thoại — tách khỏi component để test được.
 * Toạ độ: y = độ dời của bảng xuống dưới so với vị trí mở (0 = mở hẳn, `height` = khuất hẳn). Vận tốc px/s, dương = đi xuống.
 */

/** Vận tốc nhỏ hơn mức này coi như ngón tay đứng yên lúc thả (rung tay), không phải đang đẩy ngược lên. */
export const REVERSE_VELOCITY = 30;

/**
 * Thả tay thì đóng hay ở lại? Theo Apple: chiếu quán tính để biết bảng sẽ trôi tới đâu, rồi chọn điểm dừng gần
 * điểm chiếu nhất (0 = mở, `height` = đóng ⇒ ngưỡng là nửa chiều cao). Nhưng HƯỚNG vận tốc lúc thả thắng vị trí:
 * kéo xa rồi hất lên là muốn giữ bảng lại, dù đang ở quá nửa.
 */
export function shouldDismissSheet({ y, velocity, height }: { y: number; velocity: number; height: number }) {
  if (velocity < -REVERSE_VELOCITY) return false;
  return y + project(velocity) > height / 2;
}

/**
 * Vị trí hiển thị của bảng ứng với vị trí "thô" của ngón tay: đi xuống thì bám 1:1, đẩy lên quá mép trên thì
 * rubber-band tăng dần (hằng số 0.55) theo chiều cao bảng.
 */
export function sheetOffset(raw: number, height: number) {
  return raw >= 0 ? raw : -rubberband(-raw, height);
}

/** Cửa sổ lấy mẫu để tính vận tốc lúc thả: chỉ vài chục ms cuối mới phản ánh cú vuốt. */
const VELOCITY_WINDOW_MS = 100;

/**
 * Ghi lại vài mẫu (thời điểm, vị trí) gần nhất của ngón tay để tính vận tốc lúc thả. Thời điểm lấy từ
 * `event.timeStamp` (ms). Ngón tay dừng lâu hơn cửa sổ rồi mới thả ⇒ vận tốc 0.
 */
export class VelocityTracker {
  private samples: { t: number; y: number }[] = [];

  reset() {
    this.samples = [];
  }

  add(t: number, y: number) {
    this.samples.push({ t, y });
    const cutoff = t - VELOCITY_WINDOW_MS;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
  }

  /** px/s tại thời điểm `now` (mặc định: mẫu cuối). */
  velocity(now?: number) {
    const last = this.samples[this.samples.length - 1];
    if (!last) return 0;
    const at = now ?? last.t;
    if (at - last.t > VELOCITY_WINDOW_MS) return 0;
    const first = this.samples.find((s) => s.t >= at - VELOCITY_WINDOW_MS) ?? last;
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return ((last.y - first.y) / dt) * 1000;
  }
}
