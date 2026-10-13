import { useEnglishVoices } from '../speech/speech';
import { Icon } from '../ui/icons';

export function VoiceBanner() {
  const { voices, ready } = useEnglishVoices();
  if (!ready || voices.length > 0) return null;
  return (
    <div role="alert" className="tone-warning mt-4 flex items-start gap-3 rounded-card bg-surface p-4 card-edge">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--tone-soft)] text-[var(--tone-text)]">
        <Icon name="speaker" size={18} strokeWidth={2.1} />
      </span>
      <p className="min-w-0 flex-1 pt-1.5 text-base text-text">
        Máy chưa có giọng đọc tiếng Anh nên app chưa phát âm được. Mở Windows Settings → Time &amp; language →
        Speech → Manage voices → Add voices, chọn English (United States), rồi mở lại trình duyệt.
      </p>
    </div>
  );
}
