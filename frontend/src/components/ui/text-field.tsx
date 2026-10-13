import { useId, type InputHTMLAttributes, type Ref } from 'react';
import { fieldControl, fieldError, fieldHint, fieldLabel } from './field-styles';

/** Ô nhập có nhãn luôn gắn với input (getByLabelText dùng được); hint/error nối qua aria-describedby. */
export function TextField({ label, hint, error, id, className, ref, ...rest }: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [rest['aria-describedby'], errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={inputId} className={fieldLabel}>{label}</label>
      <input
        {...rest}
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : rest['aria-invalid']}
        aria-describedby={describedBy}
        className={fieldControl}
      />
      {error && <p id={errorId} className={fieldError}>{error}</p>}
      {hint && !error && <p id={hintId} className={fieldHint}>{hint}</p>}
    </div>
  );
}
