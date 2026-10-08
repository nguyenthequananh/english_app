import { IPA_GROUPS } from '../ipa/ipaData';
import { speak } from '../speech/speech';

export default function IpaPage() {
  return (
    <div data-testid="page-ipa" className="space-y-4">
      <h1 className="text-2xl font-bold">Bảng phát âm IPA</h1>
      <p className="text-sm text-slate-500">Bấm vào một âm để nghe từ ví dụ. Bài tập cặp âm dễ nhầm nằm trong các bài Phát âm của lộ trình.</p>
      {IPA_GROUPS.map((group) => (
        <section key={group.title} className="card space-y-2">
          <h2 className="font-semibold">{group.title}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {group.sounds.map((s) => (
              <button key={s.symbol} type="button" aria-label={`/${s.symbol}/ ${s.example}`}
                className="rounded-lg border border-slate-200 p-2 text-center hover:bg-indigo-50"
                onClick={() => speak(s.example)}>
                <span className="block font-mono text-xl">/{s.symbol}/</span>
                <span className="text-sm text-slate-600">{s.example}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
