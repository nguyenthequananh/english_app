import { speak } from '../speech/speech';
import { Icon } from '../ui/icons';

/** Nút loa tròn 44px. Tên accessible gồm cả chữ được đọc để trình đọc màn hình phân biệt các nút. */
export function SpeakButton({ text, label = 'Nghe' }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      aria-label={`${label}: ${text}`}
      title={label}
      className="pressable focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <Icon name="speaker" size={20} strokeWidth={2} />
    </button>
  );
}
