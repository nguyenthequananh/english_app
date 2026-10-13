import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Grade, Word } from '../types/api';
import { Button } from './ui/button';
import { cn } from './ui/cn';
import { Kbd } from './ui/kbd';
import { FADE, FADE_NEXT_CARD, SPRING_FLIP } from './ui/motion';
import { SpeakButton } from './speak-button';

const GRADES: { grade: Grade; label: string; tone: string; key: string }[] = [
  { grade: 'AGAIN', label: 'Quên', tone: 'tone-danger', key: '1' },
  { grade: 'HARD', label: 'Khó', tone: 'tone-warning', key: '2' },
  { grade: 'GOOD', label: 'Được', tone: 'tone-accent', key: '3' },
  { grade: 'EASY', label: 'Dễ', tone: 'tone-success', key: '4' },
];


/** Cỡ chữ của từ ở mặt trước theo độ dài, để từ dài (internationalization) vẫn nằm trên một dòng ở 390px. */
function headwordSize(text: string) {
  if (text.length <= 10) return 'text-[clamp(2.25rem,10vw,3.25rem)]';
  if (text.length <= 15) return 'text-[clamp(1.875rem,8vw,2.75rem)]';
  return 'text-[clamp(1.5rem,6.4vw,2.25rem)]';
}

/** Nghĩa ngắn hiện to như một câu trả lời; nghĩa dài (cả câu giải thích) hạ cỡ để còn chỗ cho ví dụ. */
function meaningSize(text: string) {
  return text.length <= 32 ? 'text-3xl font-semibold' : 'text-xl font-semibold';
}

function Pos({ pos }: { pos: string }) {
  if (!pos) return null;
  return <span className="text-base italic text-text-3">{pos}</span>;
}

function Ipa({ tag, value }: { tag: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-fill px-3 py-1 text-base text-text-2">
      <span className="text-xs font-semibold tracking-[0.04em] text-text-3">{tag}</span>
      {value}
    </span>
  );
}

/** Một mặt thẻ: chồng lên mặt kia trong cùng ô lưới, ẩn khi quay lưng lại. */
function Face({ hidden, back = false, reduce, onClick, children }: {
  hidden: boolean;
  back?: boolean;
  reduce: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      aria-hidden={hidden || undefined}
      inert={hidden}
      onClick={onClick}
      // Giảm chuyển động: mặt sau dựng lần đầu thì mờ dần vào (crossfade), không bật ra đột ngột.
      initial={reduce && back ? { opacity: 0 } : false}
      animate={reduce ? { opacity: hidden ? 0 : 1 } : undefined}
      transition={FADE}
      style={!reduce && back ? { transform: 'rotateY(180deg)' } : undefined}
      className={cn(
        '[grid-area:1/1] flex flex-col rounded-card bg-surface card-edge [backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
        onClick && !hidden && 'cursor-pointer',
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * `focusOnMount`: trang cha bật cho các thẻ hiện ra SAU một lần chấm — thẻ cũ (và nút chấm đang giữ focus) vừa bị
 * gỡ khỏi DOM, focus rơi về <body>; thẻ mới nhận focus vào nút Lật thẻ để người dùng bàn phím/trình đọc màn hình
 * đi tiếp tại chỗ. Thẻ đầu tiên khi mở trang không bật — không giành focus lúc tải trang.
 */
export function Flashcard({ word, onGrade, busy = false, focusOnMount = false }: {
  word: Word;
  onGrade: (g: Grade) => void;
  busy?: boolean;
  focusOnMount?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  // Mặt sau chỉ dựng từ lần lật đầu (trước đó nghĩa không có trong DOM), rồi giữ lại để lật ngược vẫn thấy nó quay đi.
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const gradesRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLButtonElement>(null);
  // Chỉ chuyển focus khi người dùng vừa lật (không phải lúc thẻ mới hiện ra).
  const userFlipped = useRef(false);

  const toggle = useCallback(() => {
    userFlipped.current = true;
    setRevealed(true);
    setFlipped((f) => !f);
  }, []);

  /*
   * Lật xong thì focus về nhóm nút chấm (lật lại thì về nút Lật thẻ) — nút đang focus vừa biến mất, không để focus
   * rơi về <body>. Focus vào chính NHÓM, không vào nút "Quên": nếu không, bấm Space định lật lại sẽ thành chấm
   * "Quên" vào lịch ôn. Tab từ nhóm đi tiếp vào nút đầu tiên; phím 1–4 vẫn chấm như cũ.
   */
  /* Chỉ nhận focus khi nó đang thất lạc (ở <body>): người dùng đã chủ động focus chỗ khác thì không giật lại. */
  useEffect(() => {
    if (!focusOnMount) return;
    const active = document.activeElement;
    if (!active || active === document.body) flipRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ lúc thẻ gắn vào
  }, []);

  useEffect(() => {
    if (!userFlipped.current) return;
    (flipped ? gradesRef.current : flipRef.current)?.focus({ preventScroll: true });
  }, [flipped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.code === 'Space' || e.key === ' ') {
        // Space trên nút/link khác (loa, nút chấm) để trình duyệt kích hoạt nút đó như bình thường
        const control = target?.closest?.('button, a');
        if (control && !control.hasAttribute('data-flip')) return;
        e.preventDefault();
        toggle();
        return;
      }
      const index = ['1', '2', '3', '4'].indexOf(e.key);
      if (index >= 0 && flipped && !busy) onGrade(GRADES[index].grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, busy, onGrade, toggle]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE_NEXT_CARD} className="flex flex-col gap-4">
      <div className="[perspective:1600px]">
        <motion.div
          initial={false}
          // rotateY dạng SỐ (motion value có theo dõi vận tốc) + lò xo vật lý: chạm lần nữa giữa lúc đang lật thì
          // thẻ quay đầu mượt, giữ đà, không khựng lại. Lật là thao tác chạm ⇒ tới hạn, không nảy.
          animate={reduce ? undefined : { rotateY: flipped ? 180 : 0 }}
          transition={SPRING_FLIP}
          className="grid min-h-[clamp(18rem,calc(100dvh_-_16rem),34rem)] [transform-style:preserve-3d]"
        >
          <Face hidden={flipped} reduce={reduce} onClick={flipped ? undefined : toggle}>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-10 pb-4 text-center">
              <h2
                lang="en"
                className={cn(headwordSize(word.headword), 'font-bold leading-[1.08] tracking-[-0.025em] text-balance text-text hyphens-auto [overflow-wrap:anywhere]')}
              >
                {word.headword}
              </h2>
              <Pos pos={word.pos} />
              <div className="mt-2">
                <SpeakButton text={word.headword} />
              </div>
            </div>
            <p aria-hidden="true" className="pb-5 text-center text-sm text-text-3">Chạm thẻ để xem nghĩa</p>
          </Face>

          {revealed && (
            <Face hidden={!flipped} back reduce={reduce}>
              <div data-testid="card-back" className="flex flex-1 flex-col gap-5 p-5 sm:p-7">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2">
                    <p lang="en" className="text-4xl font-bold text-text hyphens-auto [overflow-wrap:anywhere]">{word.headword}</p>
                    <SpeakButton text={word.headword} />
                  </div>
                  {(word.ipaUs || word.ipaUk) && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {word.ipaUs && <Ipa tag="US" value={word.ipaUs} />}
                      {word.ipaUk && <Ipa tag="UK" value={word.ipaUk} />}
                    </div>
                  )}
                  <Pos pos={word.pos} />
                </div>

                <p className={cn(meaningSize(word.meaningVi), 'text-center text-balance text-text')}>{word.meaningVi}</p>

                {(word.exampleEn || word.exampleVi) && (
                  <div className="mt-auto flex items-start gap-3 rounded-[18px] bg-surface-2 p-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      {word.exampleEn && <p className="text-lg text-text">{word.exampleEn}</p>}
                      {word.exampleVi && <p className="text-base text-text-2">{word.exampleVi}</p>}
                    </div>
                    {word.exampleEn && <SpeakButton text={word.exampleEn} label="Nghe câu" />}
                  </div>
                )}
              </div>
            </Face>
          )}
        </motion.div>
      </div>

      {/* Cùng chiều cao cho nút lật và hàng nút chấm để thẻ không nhảy khi lật. */}
      <div className="min-h-14">
        {!flipped ? (
          <Button ref={flipRef} data-flip size="lg" block aria-keyshortcuts="Space" className="min-h-14" onClick={toggle}>
            Lật thẻ <Kbd>Space</Kbd>
          </Button>
        ) : (
          <div
            ref={gradesRef}
            role="group"
            aria-label="Bạn nhớ từ này thế nào?"
            tabIndex={-1}
            className="grid grid-cols-4 gap-2 rounded-[22px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]"
          >
            {GRADES.map((g) => (
              <button
                key={g.grade}
                type="button"
                aria-keyshortcuts={g.key}
                disabled={busy}
                onClick={() => onGrade(g.grade)}
                className={cn(
                  g.tone,
                  'pressable focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-[18px] px-2',
                  // Nền đục (pha tông vào màu thẻ) thay vì nhuộm trong suốt: đè lên nền dải màu thì màu không bị đục bẩn.
                  'bg-[color-mix(in_srgb,var(--tone)_13%,var(--surface))] text-base font-semibold text-[var(--tone-text)] card-edge',
                  'hover:bg-[color-mix(in_srgb,var(--tone)_20%,var(--surface))] disabled:cursor-not-allowed disabled:opacity-45',
                )}
              >
                {g.label} <Kbd>{g.key}</Kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
