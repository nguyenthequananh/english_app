import { useEffect, useRef, useState } from 'react';
import { IPA_GROUPS } from '../ipa/ipa-data';
import { speak } from '../speech/speech';
import { Icon } from '../ui/icons';
import { PageHeader } from '../ui/page-header';
import { cn } from '../ui/cn';

/** Ô vừa bấm sáng lên trong khoảng này — đủ để thấy máy đã nghe, không chờ giọng đọc xong. */
const PLAYING_MS = 900;

export default function IpaPage() {
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const play = (symbol: string, example: string) => {
    speak(example);
    setPlaying(symbol);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(null), PLAYING_MS);
  };

  return (
    <div data-testid="page-ipa" className="tone-pronunciation">
      <PageHeader
        title="Phát âm IPA"
        back="/"
        subtitle="Chạm vào một âm để nghe từ ví dụ. Bài tập cặp âm dễ nhầm nằm trong các bài Phát âm của lộ trình."
      />
      <div className="space-y-7">
        {IPA_GROUPS.map((group) => (
          <section key={group.title} aria-label={group.title} className="space-y-2.5">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-[1.25rem] font-bold tracking-[-0.015em] text-text">{group.title}</h2>
              <span className="text-[0.8125rem] tabular-nums text-text-3">{group.sounds.length} âm</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5 lg:grid-cols-8">
              {group.sounds.map((s) => {
                const active = playing === s.symbol;
                return (
                  <button
                    key={s.symbol}
                    type="button"
                    aria-label={`/${s.symbol}/ ${s.example}`}
                    onClick={() => play(s.symbol, s.example)}
                    className={cn(
                      'pressable focus-ring relative flex aspect-square min-h-11 flex-col items-center justify-center gap-1 rounded-[18px] bg-surface px-1 card-edge',
                      'hover:bg-[color-mix(in_srgb,var(--surface)_94%,var(--text))]',
                      active && 'bg-[var(--tone-soft)] shadow-[inset_0_0_0_1.5px_var(--tone)] hover:bg-[var(--tone-soft)]',
                    )}
                  >
                    <Icon
                      name="speaker"
                      size={13}
                      strokeWidth={2.2}
                      className={cn('absolute top-2 right-2 transition-colors duration-(--duration-press)', active ? 'text-[var(--tone-text)]' : 'text-text-3 opacity-50')}
                    />
                    <span className={cn('text-[1.625rem] leading-none font-semibold tracking-[-0.01em] sm:text-[1.75rem]', active ? 'text-[var(--tone-text)]' : 'text-text')}>
                      {s.symbol}
                    </span>
                    <span className="max-w-full truncate text-[0.75rem] leading-tight text-text-3 sm:text-[0.8125rem]">{s.example}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
