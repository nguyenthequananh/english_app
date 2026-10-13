import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { animate, motion, MotionConfig, useMotionValue, useMotionValueEvent, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { Icon } from './icons';
import { FADE, FADE_OUT, SPRING, SPRING_EXIT, SPRING_SETTLE } from './motion';
import { sheetOffset, shouldDismissSheet, VelocityTracker } from './sheet-gesture';
import { DESKTOP_QUERY, useMediaQuery } from './use-media-query';

const TABBABLE = 'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
/* Chạm vào những phần tử này là để bấm/gõ, không phải để kéo bảng. */
const NO_DRAG = 'button, a, input, textarea, select, [role="button"], [role="switch"], [contenteditable="true"]';
/* Kéo từ nội dung: ngón tay phải đi xuống quá ngưỡng này (khi nội dung đang ở đầu) mới thành kéo bảng. */
const CONTENT_DRAG_SLOP = 8;
/* Vài px cuối trước khi khuất hẳn thì bảng mờ đi, để bóng đổ phía trên không lơ lửng ở mép đáy. */
const EDGE_FADE = 24;

/**
 * Điện thoại: bảng trượt từ đáy, kéo được · ≥lg: hộp thoại giữa màn. Giảm chuyển động không phải một chế độ riêng:
 * bảng vẫn bám ngón tay khi kéo (đó là phản hồi trực tiếp, không phải thứ reduced-motion bỏ đi), chỉ có vào/ra/trả
 * về là thành mờ dần hoặc nhảy thẳng tới chỗ.
 */
type Mode = 'drag' | 'dialog';

type DragState = { pointerId: number; startY: number; startOffset: number; height: number };
type PendingContentDrag = { pointerId: number; startY: number };

/**
 * Bảng trượt: điện thoại — trượt từ đáy lên, kéo xuống để đóng (từ thanh nắm, hoặc từ nội dung khi nội dung đã
 * cuộn tới đầu); ≥lg — hộp thoại giữa màn. Dựa trên base-ui Dialog (bẫy focus, Esc, chạm nền để đóng).
 *
 * Cử chỉ theo skill `apple-design`: bám ngón tay 1:1 khi kéo xuống, rubber-band tăng dần khi đẩy lên quá mép;
 * thả tay thì quyết định bằng phép chiếu quán tính + hướng vận tốc (`sheet-gesture.ts`), trả về bằng lò xo ngăn
 * kéo của Apple (ζ 0.8, response 0.3s) mang theo vận tốc ngón tay.
 *
 * Bắt lại được khi đang đóng: người dùng đóng (vuốt, Esc, nút Đóng, chạm nền) thì bảng tự chạy hết đường ra rồi
 * mới báo `onOpenChange(false)` — trong lúc đó base-ui vẫn coi là mở, chạm lại vào bảng là dừng việc đóng và bảng
 * đi theo ngón tay. Trang cha tự đóng (`open` → false, ví dụ sau khi lưu) thì không bắt lại được, chỉ chạy ra.
 * Trang cha không chịu đóng (bỏ qua `onOpenChange(false)`, `open` vẫn true) thì bảng quay lại — không để một lớp
 * phủ vô hình chặn cả trang.
 */
export function Sheet({ open, onOpenChange, title, description, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const reduce = useReducedMotion() ?? false;
  const mode: Mode = desktop ? 'dialog' : 'drag';

  /* Bảng còn trong DOM: từ lúc mở tới khi chuyển động rời đi chạy xong. */
  const [present, setPresent] = useState(open);
  const [popupEl, setPopupEl] = useState<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  /* '100%' cho khung hình đầu tiên: bảng nằm sẵn dưới mép màn trước khi đo được chiều cao. */
  const y = useMotionValue<number | string>('100%');
  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);
  const scrim = useMotionValue(0);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const openRef = useRef(open);
  openRef.current = open;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  /* Ai đang đóng bảng: người dùng (còn bắt lại được), trang cha, hay người dùng đã đóng xong và đang chờ cha. */
  const closing = useRef<'user' | 'parent' | 'reported' | null>(null);
  const anims = useRef<AnimationPlaybackControls[]>([]);
  const drag = useRef<DragState | null>(null);
  const pending = useRef<PendingContentDrag | null>(null);
  const tracker = useRef(new VelocityTracker());
  /* Mỗi lần người dùng đóng xong và đã báo trang cha: tăng để effect kiểm tra cha có thật sự đóng không. */
  const [reported, setReported] = useState(0);

  /* Chiều cao bảng, đo khi gắn vào DOM và mỗi khi đổi cỡ (ResizeObserver) — không đọc layout ở mỗi khung hình kéo. */
  const heightRef = useRef(0);
  const measure = () => {
    heightRef.current = popupRef.current?.offsetHeight ?? 0;
  };
  const height = () => heightRef.current;
  const currentY = () => {
    const v = y.get();
    return typeof v === 'number' ? v : height();
  };

  const stop = useCallback(() => {
    anims.current.forEach((a) => a.stop());
    anims.current = [];
  }, []);

  const run = (...controls: AnimationPlaybackControls[]) => {
    anims.current.push(...controls);
  };

  /* Chế độ kéo: nền tối và mép mờ đi theo vị trí bảng — kéo xuống tới đâu nền sáng lại tới đó. */
  useMotionValueEvent(y, 'change', (v) => {
    if (modeRef.current !== 'drag' || typeof v !== 'number') return;
    const h = height();
    if (h <= 0) {
      scrim.set(1);
      return;
    }
    scrim.set(Math.min(1, Math.max(0, 1 - v / h)));
    opacity.set(Math.min(1, Math.max(0, (h - v) / EDGE_FADE)));
  });

  /**
   * Chạy vào. `fresh` = bảng vừa gắn vào DOM; ngược lại là mở lại khi đang chạy ra (hoặc trang cha không chịu đóng)
   * — quay đầu tại chỗ, giữ vận tốc.
   */
  const enter = useCallback((fresh: boolean) => {
    stop();
    closing.current = null;
    const m = modeRef.current;
    const r = reduceRef.current;
    if (m === 'drag' && !r) {
      scale.jump(1);
      if (fresh || typeof y.get() !== 'number') y.jump(height());
      run(animate(y, 0, SPRING));
      return;
    }
    // Hộp thoại, hoặc bảng khi giảm chuyển động: đứng tại chỗ, chỉ mờ dần vào (hộp thoại phóng nhẹ nếu không giảm).
    // Đưa y về 0 làm effect theo vị trí đặt lại nền/độ mờ ⇒ giữ lại giá trị đang có để mờ dần từ đó.
    const from = { opacity: fresh ? 0 : opacity.get(), scrim: fresh ? 0 : scrim.get() };
    y.jump(0);
    opacity.jump(from.opacity);
    scrim.jump(from.scrim);
    if (r) scale.jump(1);
    else if (fresh) scale.jump(0.96);
    run(animate(opacity, 1, FADE), animate(scrim, 1, FADE));
    if (m === 'dialog' && !r) run(animate(scale, 1, SPRING));
  }, [opacity, scale, scrim, stop, y]);

  const exit = useCallback((by: 'user' | 'parent', velocity = 0) => {
    stop();
    drag.current = null;
    pending.current = null;
    closing.current = by;
    const done = () => {
      if (closing.current !== by) return; // đã bị bắt lại hoặc mở lại giữa chừng
      if (by === 'user') {
        closing.current = 'reported';
        onOpenChangeRef.current(false);
        setReported((n) => n + 1);
      } else {
        closing.current = null;
        setPresent(false);
      }
    };
    const m = modeRef.current;
    const r = reduceRef.current;
    if (m === 'drag' && !r) {
      const a = animate(y, height(), { ...SPRING_EXIT, velocity });
      run(a);
      a.then(done);
    } else {
      // Mờ đi tại chỗ (giảm chuyển động: ngay ở vị trí ngón tay vừa thả).
      const a = animate(opacity, 0, FADE_OUT);
      run(a, animate(scrim, 0, FADE_OUT));
      if (m === 'dialog' && !r) run(animate(scale, 0.97, FADE_OUT));
      a.then(done);
    }
  }, [opacity, scale, scrim, stop, y]);

  /* Trang cha mở/đóng. */
  useLayoutEffect(() => {
    if (open) {
      if (!present) {
        setPresent(true); // enter() chạy khi phần tử bảng gắn vào DOM (xem effect dưới)
      } else if (closing.current) {
        enter(false); // mở lại khi đang chạy ra
      }
      return;
    }
    if (!present) return;
    if (closing.current === 'reported') {
      closing.current = null;
      setPresent(false);
    } else if (closing.current !== 'parent') {
      exit('parent');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ phản ứng khi `open` đổi
  }, [open]);

  /*
   * Đã báo trang cha là người dùng đóng, nhưng cha không đóng (`open` vẫn true — ví dụ đang lưu dở nên từ chối):
   * cho bảng quay lại. Nếu cha đóng thật thì effect `[open]` ở trên đã chạy trước (layout effect) và xoá 'reported'.
   */
  useEffect(() => {
    if (reported && closing.current === 'reported' && openRef.current) enter(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ sau mỗi lần báo đóng
  }, [reported]);

  /* Đo chiều cao khi bảng gắn vào DOM (trước khi chạy vào), rồi theo dõi đổi cỡ (nội dung đổi, bàn phím ảo…). */
  useLayoutEffect(() => {
    if (!popupEl) return;
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(popupEl);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measure chỉ đọc ref
  }, [popupEl]);

  /* Phần tử bảng vừa gắn vào DOM (portal của base-ui có thể dựng sau một nhịp): chạy vào. */
  useLayoutEffect(() => {
    if (popupEl && open) enter(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chạy một lần cho mỗi lần gắn
  }, [popupEl]);

  /*
   * Đổi chế độ khi đang mở (xoay máy qua mốc lg): bỏ cử chỉ kéo dở (ngón tay đang giữ không còn điều khiển bảng),
   * về trạng thái nghỉ của chế độ mới.
   */
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;
    drag.current = null;
    pending.current = null;
    if (!popupRef.current || closing.current) return;
    stop();
    y.jump(0);
    opacity.jump(1);
    scale.jump(1);
    scrim.jump(1);
  }, [mode, opacity, scale, scrim, stop, y]);

  useEffect(() => stop, [stop]);

  const setPopupRef = useCallback((el: HTMLDivElement | null) => {
    popupRef.current = el;
    setPopupEl(el);
  }, []);

  /*
   * Focus khi mở: chạm → base-ui focus chính bảng (không bật bàn phím ảo); chuột/bàn phím → ô đầu tiên trong
   * nội dung, không có thì chính bảng. Không để rơi vào nút Đóng — vừa sai trọng tâm vừa hiện vòng focus thừa.
   */
  function initialFocus(type: string) {
    if (type === 'touch') return true;
    return bodyRef.current?.querySelector<HTMLElement>(TABBABLE) ?? popupRef.current;
  }

  /* ---------- Cử chỉ kéo (chỉ chế độ 'drag') ---------- */

  function beginDrag(e: ReactPointerEvent<HTMLElement>) {
    stop();
    if (closing.current === 'user') closing.current = null; // bắt lại bảng đang đóng
    const startOffset = currentY();
    drag.current = { pointerId: e.pointerId, startY: e.clientY, startOffset, height: height() };
    tracker.current.reset();
    tracker.current.add(e.timeStamp, startOffset);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Con trỏ đã nhấc trước khi kịp bắt (hoặc sự kiện giả lập): vẫn kéo được trong phạm vi phần tử.
    }
  }

  function canDrag() {
    return modeRef.current === 'drag' && closing.current !== 'parent' && closing.current !== 'reported';
  }

  function onHeaderPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (!canDrag() || e.button !== 0 || (e.target as Element).closest(NO_DRAG)) return;
    beginDrag(e);
  }

  /* Nội dung: chỉ cảm ứng/bút, chỉ khi đã cuộn tới đầu; đi lên thì nhường cho cuộn, đi xuống quá ngưỡng thì kéo bảng. */
  function onBodyPointerDown(e: ReactPointerEvent<HTMLElement>) {
    pending.current = null;
    if (!canDrag() || e.pointerType === 'mouse' || (e.target as Element).closest(NO_DRAG)) return;
    if ((bodyRef.current?.scrollTop ?? 0) > 0) return;
    pending.current = { pointerId: e.pointerId, startY: e.clientY };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    const p = pending.current;
    if (p && p.pointerId === e.pointerId) {
      const dy = e.clientY - p.startY;
      if (dy < 0) pending.current = null;
      else if (dy > CONTENT_DRAG_SLOP) {
        pending.current = null;
        beginDrag(e);
      }
      return;
    }
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const offset = sheetOffset(d.startOffset + (e.clientY - d.startY), d.height);
    y.set(offset);
    tracker.current.add(e.timeStamp, offset);
  }

  /* Thả tay — hoặc cử chỉ bị huỷ / mất pointer capture giữa chừng (coi như thả tại chỗ, vận tốc 0). */
  function onPointerUp(e: ReactPointerEvent<HTMLElement>) {
    if (pending.current?.pointerId === e.pointerId) pending.current = null;
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    const velocity = e.type === 'pointerup' ? tracker.current.velocity(e.timeStamp) : 0;
    const at = currentY();
    if (shouldDismissSheet({ y: at, velocity, height: d.height })) {
      exit('user', velocity);
    } else if (reduceRef.current) {
      y.jump(0); // giảm chuyển động: về chỗ ngay, không trượt
    } else {
      // Ở lại: lò xo ngăn kéo, nhận vận tốc lúc thả — chỉ ở đây mới nảy nhẹ. Thả khi đang kéo nảy quá mép trên
      // thì không mang vận tốc đi lên vào lò xo, nếu không bảng còn vọt thêm lên trước khi rơi về.
      run(animate(y, 0, { ...SPRING_SETTLE, velocity: at < 0 ? Math.max(velocity, 0) : velocity }));
    }
  }

  /*
   * Kéo bảng từ nội dung bằng cảm ứng: chặn cuộn gốc (touchmove không passive) khi ngón tay đi xuống từ đầu nội
   * dung, nếu không trình duyệt sẽ nhận cử chỉ thành cuộn và huỷ luồng pointer (pointercancel).
   */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.cancelable) return;
      const dy = (e.touches[0]?.clientY ?? 0) - startY;
      if (drag.current || (pending.current && dy > 0)) e.preventDefault();
    };
    body.addEventListener('touchstart', onTouchStart, { passive: true });
    body.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      body.removeEventListener('touchstart', onTouchStart);
      body.removeEventListener('touchmove', onTouchMove);
    };
  }, [popupEl]);

  const dragHandlers = mode === 'drag'
    ? { onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onLostPointerCapture: onPointerUp }
    : {};

  return (
    <Dialog.Root
      open={present}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        // Người dùng đóng: chạy ra trước, báo trang cha sau — để còn bắt lại được giữa chừng.
        if (!closing.current) exit('user');
      }}
    >
      <MotionConfig reducedMotion="user">
        {present && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 z-50 bg-[var(--scrim)]"
              render={<motion.div style={{ opacity: scrim }} />}
            />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-8">
              <Dialog.Popup
                ref={setPopupRef}
                initialFocus={initialFocus}
                className="flex max-h-[min(88dvh,760px)] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[28px] bg-surface text-text shadow-[var(--shadow-sheet),inset_0_0_0_1px_var(--card-border)] outline-none lg:max-w-[520px] lg:rounded-[28px]"
                render={<motion.div style={{ y, opacity, scale }} />}
              >
                <div
                  className="shrink-0 touch-none px-5 pt-2 select-none lg:touch-auto lg:pt-5"
                  onPointerDown={onHeaderPointerDown}
                  {...dragHandlers}
                >
                  <div aria-hidden="true" data-grabber="" className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-fill-strong lg:hidden" />
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 pt-1.5">
                      <Dialog.Title className="text-2xl font-bold">{title}</Dialog.Title>
                      {description && (
                        <Dialog.Description className="mt-1 text-base text-text-2">{description}</Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close
                      aria-label="Đóng"
                      className="pressable group -mr-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-2 outline-none"
                    >
                      {/* Vùng chạm 44px, nhưng vòng focus ôm đúng hình tròn 32px nhìn thấy. */}
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-fill group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--focus-ring)]">
                        <Icon name="close" size={16} strokeWidth={2.4} />
                      </span>
                    </Dialog.Close>
                  </div>
                </div>
                <div
                  ref={bodyRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] lg:pb-6"
                  onPointerDown={mode === 'drag' ? onBodyPointerDown : undefined}
                  {...dragHandlers}
                >
                  {children}
                </div>
              </Dialog.Popup>
              {mode === 'drag' && (
                /*
                 * Phần nền nối dài dưới đáy bảng, đi cùng `y`: kéo nảy lên quá mép hoặc hất lên (lò xo vượt qua 0)
                 * thì dưới bảng vẫn là mặt bảng như iOS, không hở khe nhìn xuống trang. Không gộp vào bảng được vì
                 * bảng `overflow-hidden` (bo góc cắt nội dung cuộn); bóng đổ cũng không làm được vì bóng lặp lại bo góc.
                 * Chồng lên 1px đáy bảng để che viền đáy của bảng (nếu không thành một vạch kẻ ngang khi nảy lên).
                 */
                <motion.div
                  aria-hidden="true"
                  data-sheet-underlay=""
                  style={{ y, opacity }}
                  className="pointer-events-none absolute inset-x-0 top-[calc(100%-1px)] mx-auto h-dvh w-full max-w-[640px] bg-surface shadow-[inset_1px_0_0_var(--card-border),inset_-1px_0_0_var(--card-border)]"
                />
              )}
            </Dialog.Viewport>
          </Dialog.Portal>
        )}
      </MotionConfig>
    </Dialog.Root>
  );
}
