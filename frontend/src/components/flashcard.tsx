import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import type { Grade, Word } from '../types/api';
import { Button } from './ui/button';
import { cn } from './ui/cn';
import { SpeakButton } from './speak-button';

const GRADES: { grade: Grade; label: string; tone: string; key: string }[] = [
  { grade: 'AGAIN', label: 'Quên', tone: 'tone-danger', key: '1' },
  { grade: 'HARD', label: 'Khó', tone: 'tone-warning', key: '2' },
  { grade: 'GOOD', label: 'Được', tone: 'tone-accent', key: '3' },
  { grade: 'EASY', label: 'Dễ', tone: 'tone-success', key: '4' },
];

/** Lật thẻ: lò xo gần tới hạn, nảy rất nhẹ — đủ thấy là "xoay" mà không làm chậm nhịp ôn. Ngắt giữa chừng được. */
const FLIP_SPRING: Transition = { type: 'spring', visualDuration: 0.34, bounce: 0.14 };
/** Thẻ kế tiếp chỉ hiện dần thật nhanh, không trượt — chấm thẻ là thao tác lặp liên tục. */
const ENTER: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };
const CROSSFADE: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      aria-hidden="true"
      className="hidden min-w-5 items-center justify-center rounded-md bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-1.5 font-sans text-xs font-semibold leading-5 lg:inline-flex"
    >
      {children}
    </kbd>
  );
}

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
      transition={CROSSFADE}
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

export function Flashcard({ word, onGrade, busy = false }: { word: Word; onGrade: (g: Grade) => void; busy?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  // Mặt sau chỉ dựng từ lần lật đầu (trước đó nghĩa không có trong DOM), rồi giữ lại để lật ngược vẫn thấy nó quay đi.
  const [revealed, setRevealed] = useState(false);
  const reduce = useReducedMotion() ?? false;

  const toggle = useCallback(() => {
    setRevealed(true);
    setFlipped((f) => !f);
  }, []);

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={ENTER} className="flex flex-col gap-4">
      <div className="[perspective:1600px]">
        <motion.div
          initial={false}
          animate={reduce ? undefined : { transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          transition={FLIP_SPRING}
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
          <Button data-flip size="lg" block aria-keyshortcuts="Space" className="min-h-14" onClick={toggle}>
            Lật thẻ <Kbd>Space</Kbd>
          </Button>
        ) : (
          <div role="group" aria-label="Bạn nhớ từ này thế nào?" className="grid grid-cols-4 gap-2">
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
