import { speak } from '../speech/speech';

export function SpeakButton({ text, label = 'Nghe' }: { text: string; label?: string }) {
  return (
    <button type="button" className="btn btn-ghost" aria-label={`${label}: ${text}`} title={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}>
      🔊
    </button>
  );
}
