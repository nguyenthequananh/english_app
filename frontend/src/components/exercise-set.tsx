import { useState } from 'react';
import type { ExerciseResult, ExerciseType, ExerciseView } from '../types/api';
import { currentSpeechRate, speak } from '../speech/speech';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Icon } from '../ui/icons';
import { TextField } from '../ui/text-field';
import { toneClass } from '../ui/skill';
import { cn } from '../ui/cn';

/** Nghe chậm = 70% tốc độ đang cấu hình trong hồ sơ. */
const SLOW_FACTOR = 0.7;

const KIND_LABEL: Record<ExerciseType, string> = {
  MCQ: 'Trắc nghiệm', FILL: 'Điền từ', MINIMAL_PAIR: 'Nghe chọn từ', DICTATION: 'Nghe chép',
};

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
  const answered = exercises.filter((x) => (answers[x.code] ?? '').trim() !== '').length;

  return (
    <form className="space-y-3" noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(answers);
      }}>
      {exercises.map((x, i) => (
        <ExerciseItem key={x.code} index={i + 1} total={exercises.length} exercise={x} value={answers[x.code] ?? ''}
          disabled={done} result={byCode.get(x.code)} onChange={(v) => setAnswers((a) => ({ ...a, [x.code]: v }))} />
      ))}
      {!done && (
        // Thanh nộp bài nổi ở đáy khi cuộn qua danh sách câu dài; hết danh sách thì nằm yên cuối form.
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-10 pt-2">
          <div className="material flex items-center gap-3 rounded-full py-2 pr-2 pl-5 shadow-[var(--shadow-card)] card-edge">
            <p className="min-w-0 flex-1 text-[0.875rem] leading-tight text-text-2">
              Đã làm <span className="font-semibold tabular-nums text-text">{answered}/{exercises.length}</span> câu
            </p>
            <Button type="submit" loading={submitting}>{submitLabel}</Button>
          </div>
        </div>
      )}
    </form>
  );
}

function ExerciseItem({ index, total, exercise, value, onChange, result, disabled }: {
  index: number; total: number; exercise: ExerciseView; value: string; onChange: (v: string) => void;
  result?: ExerciseResult; disabled: boolean;
}) {
  const typed = exercise.type === 'FILL' || exercise.type === 'DICTATION';
  return (
    <Card as="section">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Câu {index}</legend>
        <div aria-hidden="true" className="mb-2.5 flex items-center gap-2 text-[0.8125rem] font-semibold text-text-3">
          <span className="tabular-nums">Câu {index}<span className="font-normal opacity-70">/{total}</span></span>
          <span className="size-[3px] rounded-full bg-current opacity-50" />
          <span className="font-medium">{KIND_LABEL[exercise.type]}</span>
          {result && (
            <span className={cn('ml-auto inline-flex size-6 items-center justify-center rounded-full bg-[var(--tone)] text-surface',
              toneClass(result.correct ? 'success' : 'danger'))}>
              <Icon name={result.correct ? 'check' : 'cross'} size={14} strokeWidth={3} />
            </span>
          )}
        </div>

        {exercise.type === 'MINIMAL_PAIR' ? (
          <>
            <p className="text-[1.0625rem] font-semibold leading-snug text-text">Nghe và chọn từ bạn nghe được</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ListenButton label="Nghe từ" onClick={() => speak(exercise.prompt)} />
            </div>
          </>
        ) : exercise.type === 'DICTATION' ? (
          <>
            <p className="text-[1.0625rem] font-semibold leading-snug text-text">Nghe và chép lại câu</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ListenButton label="Nghe câu" onClick={() => speak(exercise.prompt)} />
              <ListenButton label="Nghe chậm" slow
                onClick={() => speak(exercise.prompt, { rate: SLOW_FACTOR * currentSpeechRate() })} />
            </div>
          </>
        ) : (
          <p className="text-[1.0625rem] font-semibold leading-snug text-pretty text-text"><PromptText text={exercise.prompt} /></p>
        )}

        {typed ? (
          <TextField
            label={exercise.type === 'DICTATION' ? 'Câu bạn nghe được' : 'Từ cần điền'}
            aria-label={`Câu ${index}`}
            // Ô đang gõ không bị thanh nộp bài (đáy) hay thanh trên che khi trình duyệt cuộn tới nó.
            className={cn('mt-4 [&_input]:scroll-mt-24 [&_input]:scroll-mb-28', result && cn(toneClass(result.correct ? 'success' : 'danger'), '[&_input]:border-[var(--tone)]'))}
            data-exercise-input="" value={value} disabled={disabled}
            spellCheck={false} autoComplete="off" autoCapitalize="off" autoCorrect="off"
            enterKeyHint={index === total ? 'done' : 'next'}
            onKeyDown={(e) => {
              // Enter trong ô gõ không được nộp cả bài (các câu khác còn trống); chuyển sang ô kế tiếp.
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const inputs = Array.from(e.currentTarget.form?.querySelectorAll<HTMLInputElement>('input[data-exercise-input]') ?? []);
              inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
            }}
            onChange={(e) => onChange(e.target.value)} />
        ) : (
          <div className={cn('mt-4 grid gap-2', exercise.type === 'MINIMAL_PAIR' ? 'grid-cols-2' : 'sm:grid-cols-2')}>
            {(exercise.options ?? []).map((option) => (
              <OptionChoice key={option} name={`ex-${exercise.code}`} option={option} selected={value === option}
                disabled={disabled} result={result} onSelect={() => onChange(option)} />
            ))}
          </div>
        )}

        {result && (
          <div className={cn('mt-3 flex gap-2.5 rounded-control bg-[var(--tone-soft)] px-3.5 py-3', toneClass(result.correct ? 'success' : 'danger'))}>
            <Icon name={result.correct ? 'check' : 'cross'} size={18} strokeWidth={2.6} className="mt-0.5 text-[var(--tone-text)]" />
            <div className="min-w-0 text-[0.9375rem] leading-snug">
              <p className="font-semibold break-words text-[var(--tone-text)]">
                {result.correct ? 'Đúng' : `Sai — đáp án: ${result.answer}`}
              </p>
              {result.explanationVi && <p className="mt-1 text-text-2">{result.explanationVi}</p>}
            </div>
          </div>
        )}
      </fieldset>
    </Card>
  );
}

/**
 * Một lựa chọn MCQ/cặp âm: nhãn bọc radio thật (ẩn) để bàn phím, trình đọc màn hình và getByLabelText vẫn chạy;
 * phần nhìn thấy là ô lớn ≥48px. Sau khi chấm: đáp án đúng tô xanh + dấu check, lựa chọn sai tô đỏ + dấu chéo.
 */
function OptionChoice({ name, option, selected, disabled, result, onSelect }: {
  name: string; option: string; selected: boolean; disabled: boolean; result?: ExerciseResult; onSelect: () => void;
}) {
  const isAnswer = result !== undefined && option.trim() === result.answer.trim();
  const wrongPick = result !== undefined && selected && !isAnswer;
  const tone = isAnswer ? 'success' : wrongPick ? 'danger' : null;
  return (
    <label
      className={cn(
        'relative flex min-h-12 items-center gap-3 rounded-control border-[1.5px] px-3.5 py-2.5 text-[1rem] leading-snug',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)]',
        tone && cn(toneClass(tone), 'border-[var(--tone)] bg-[var(--tone-soft)] font-semibold text-text'),
        !tone && selected && 'border-accent bg-accent-soft font-semibold text-text',
        !tone && !selected && 'border-transparent bg-surface-2 text-text',
        !disabled && 'pressable cursor-pointer',
        !disabled && !selected && 'hover:bg-fill-strong',
        disabled && !tone && 'opacity-55',
      )}
    >
      <input type="radio" name={name} value={option} checked={selected} disabled={disabled} className="sr-only"
        onChange={onSelect} />
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-(--duration-press)',
          tone ? 'border-[var(--tone)] bg-[var(--tone)] text-surface'
            : selected ? 'border-accent bg-accent text-on-accent' : 'border-text-3/45',
        )}
      >
        {tone ? <Icon name={isAnswer ? 'check' : 'cross'} size={13} strokeWidth={3.2} />
          : selected && <span className="size-2 rounded-full bg-on-accent" />}
      </span>
      <span className="min-w-0 flex-1 break-words">{option}</span>
    </label>
  );
}

function ListenButton({ label, slow = false, onClick }: { label: string; slow?: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" onClick={onClick} aria-label={label} className="pl-4">
      <Icon name={slow ? 'clock' : 'speaker'} size={19} strokeWidth={2} />
      {label}
    </Button>
  );
}

/** Chỗ trống `___` trong câu hiện thành gạch chân; trình đọc màn hình đọc "chỗ trống". */
function PromptText({ text }: { text: string }) {
  const parts = text.split(/(_{2,})/);
  return (
    <>
      {parts.map((part, i) => /^_{2,}$/.test(part) ? (
        <span key={i} className="relative mx-0.5 inline-block w-11 border-b-2 border-accent/60 align-[-0.1em]">
          <span className="sr-only">chỗ trống</span>&nbsp;
        </span>
      ) : part)}
    </>
  );
}
