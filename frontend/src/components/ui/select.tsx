import { useId, type SelectHTMLAttributes } from 'react';
import { Icon } from './icons';
import { cn } from './cn';
import { fieldControl, fieldLabel } from './field-styles';

/** `<select>` gốc đã style (giữ bàn phím/bánh xe chọn của hệ điều hành và `selectOption` trong test). */
export function Select({ label, options, id, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={selectId} className={fieldLabel}>{label}</label>
      <div className="relative">
        <select {...rest} id={selectId} className={cn(fieldControl, 'cursor-pointer appearance-none pr-11')}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevron-right" size={16} strokeWidth={2.4} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 rotate-90 text-text-3" />
      </div>
    </div>
  );
}
