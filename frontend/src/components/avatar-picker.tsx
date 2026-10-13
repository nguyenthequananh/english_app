import { cn } from '../ui/cn';

export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🦁', '🐨', '🐙', '🦄'];

/** Lưới avatar tròn (4 cột trên điện thoại, 8 cột khi đủ rộng). Ô đang chọn có vòng nhấn + nền nhạt. */
export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
      {AVATARS.map((a) => {
        const selected = value === a;
        return (
          <button
            key={a}
            type="button"
            aria-label={`Chọn avatar ${a}`}
            aria-pressed={selected}
            onClick={() => onChange(a)}
            className={cn(
              'pressable focus-ring flex aspect-square w-full max-w-16 items-center justify-center justify-self-center rounded-full text-[1.875rem] leading-none',
              selected
                ? 'bg-accent-soft shadow-[0_0_0_2.5px_var(--accent)]'
                : 'bg-fill hover:bg-fill-strong',
            )}
          >
            <span aria-hidden="true">{a}</span>
          </button>
        );
      })}
    </div>
  );
}
