import { useEnglishVoices } from '../speech/speech';

export function VoiceBanner() {
  const { voices, ready } = useEnglishVoices();
  if (!ready || voices.length > 0) return null;
  return (
    <div role="alert" className="mx-auto mt-3 max-w-5xl rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900">
      Máy chưa có giọng đọc tiếng Anh nên app chưa phát âm được. Mở Windows Settings → Time &amp; language →
      Speech → Manage voices → Add voices, chọn English (United States), rồi mở lại trình duyệt.
    </div>
  );
}
