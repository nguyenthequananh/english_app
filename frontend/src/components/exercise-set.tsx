import { useState } from 'react';
import type { ExerciseResult, ExerciseView } from '../api/types';
import { currentSpeechRate, speak } from '../speech/speech';
import { SpeakButton } from './speak-button';

/** Nghe chậm = 70% tốc độ đang cấu hình trong hồ sơ. */
const SLOW_FACTOR = 0.7;

interface Props {
  exercises: ExerciseView[];
  results?: ExerciseResult[];
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function ExerciseSet({ exercises, results, onSubmit, submitting = false, submitLabel = 'Nộp bài' }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const byCode = new Map((results ?? []).map((r) => [r.code, r]));
  const done = results !== undefined;

  return (
    <form className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(answers);
      }}>
      {exercises.map((x, i) => (
        <ExerciseItem key={x.code} index={i + 1} exercise={x} value={answers[x.code] ?? ''} disabled={done}
          result={byCode.get(x.code)} onChange={(v) => setAnswers((a) => ({ ...a, [x.code]: v }))} />
      ))}
      {!done && <button type="submit" className="btn btn-primary" disabled={submitting}>{submitLabel}</button>}
    </form>
  );
}

function ExerciseItem({ index, exercise, value, onChange, result, disabled }: {
  index: number; exercise: ExerciseView; value: string; onChange: (v: string) => void;
  result?: ExerciseResult; disabled: boolean;
}) {
  const name = `ex-${exercise.code}`;
  const border = result ? (result.correct ? 'border-emerald-400' : 'border-rose-400') : '';
  return (
    <fieldset className={`card ${border}`}>
      <legend className="px-1 text-sm text-slate-500">Câu {index}</legend>
      {exercise.type === 'MINIMAL_PAIR' ? (
        <div className="flex items-center gap-2">
          <span>Nghe và chọn từ đúng:</span>
          <SpeakButton text={exercise.prompt} label="Nghe từ" />
        </div>
      ) : exercise.type === 'DICTATION' ? (
        <div className="flex flex-wrap items-center gap-2">
          <span>Nghe và chép lại câu:</span>
          <button type="button" className="btn btn-ghost" aria-label="Nghe câu" onClick={() => speak(exercise.prompt)}>🔊 Nghe câu</button>
          <button type="button" className="btn btn-ghost" aria-label="Nghe chậm" onClick={() => speak(exercise.prompt, { rate: SLOW_FACTOR * currentSpeechRate() })}>🐢 Nghe chậm</button>
        </div>
      ) : (
        <p className="font-medium">{exercise.prompt}</p>
      )}
      {exercise.type === 'FILL' || exercise.type === 'DICTATION' ? (
        <input className="input mt-2" data-exercise-input aria-label={`Câu ${index}`} value={value} disabled={disabled}
          spellCheck={false} autoComplete="off" autoCapitalize="off"
          onKeyDown={(e) => {
            // Enter trong ô gõ không được nộp cả bài (các câu khác còn trống); chuyển sang ô kế tiếp.
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const inputs = Array.from(e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[data-exercise-input]') ?? []);
            inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
          }}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="mt-2 flex flex-wrap gap-4">
          {(exercise.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input type="radio" name={name} value={option} checked={value === option} disabled={disabled}
                onChange={() => onChange(option)} />
              {option}
            </label>
          ))}
        </div>
      )}
      {result && (
        <div className={`mt-2 text-sm ${result.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
          <p>{result.correct ? '✓ Đúng' : `✗ Sai — đáp án: ${result.answer}`}</p>
          {result.explanationVi && <p className="text-slate-600">{result.explanationVi}</p>}
        </div>
      )}
    </fieldset>
  );
}
