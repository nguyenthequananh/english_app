import { useEffect, useState } from 'react';
import type { Grade, Word } from '../api/types';
import { SpeakButton } from './SpeakButton';

const GRADES: { grade: Grade; label: string; cls: string }[] = [
  { grade: 'AGAIN', label: 'Quên', cls: 'bg-rose-100 hover:bg-rose-200' },
  { grade: 'HARD', label: 'Khó', cls: 'bg-amber-100 hover:bg-amber-200' },
  { grade: 'GOOD', label: 'Được', cls: 'bg-emerald-100 hover:bg-emerald-200' },
  { grade: 'EASY', label: 'Dễ', cls: 'bg-sky-100 hover:bg-sky-200' },
];

export function Flashcard({ word, onGrade, busy = false }: { word: Word; onGrade: (g: Grade) => void; busy?: boolean }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      const index = ['1', '2', '3', '4'].indexOf(e.key);
      if (index >= 0 && flipped && !busy) onGrade(GRADES[index].grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, busy, onGrade]);

  const ipa = [word.ipaUs && `US ${word.ipaUs}`, word.ipaUk && `UK ${word.ipaUk}`].filter(Boolean).join(' · ');

  return (
    <div className="card mx-auto max-w-xl text-center">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-4xl font-bold">{word.headword}</h2>
        <SpeakButton text={word.headword} />
      </div>
      <p className="text-sm text-slate-500">{word.pos}</p>
      {!flipped ? (
        <button type="button" className="btn btn-primary mt-6" onClick={() => setFlipped(true)}>Lật thẻ (Space)</button>
      ) : (
        <div className="mt-4 space-y-2" data-testid="card-back">
          {ipa && <p className="font-mono text-slate-600">{ipa}</p>}
          <p className="text-2xl">{word.meaningVi}</p>
          {word.exampleEn && (
            <p className="italic">{word.exampleEn} <SpeakButton text={word.exampleEn} label="Nghe câu" /></p>
          )}
          {word.exampleVi && <p className="text-slate-500">{word.exampleVi}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g, i) => (
              <button key={g.grade} type="button" className={`btn ${g.cls}`} disabled={busy} onClick={() => onGrade(g.grade)}>
                {i + 1}. {g.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
