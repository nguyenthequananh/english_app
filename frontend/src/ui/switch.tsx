import { useId } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from './cn';

/** Công tắc kiểu iOS (base-ui Switch, `role="switch"`). Cả dòng là vùng bấm; nhãn là tên accessible. */
export function Switch({ label, checked, onCheckedChange, disabled, className }: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const labelId = useId();
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-center justify-between gap-4', disabled && 'cursor-not-allowed opacity-50', className)}>
      <span id={labelId} className="text-[1rem] text-text">{label}</span>
      <BaseSwitch.Root
        aria-labelledby={labelId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v)}
        className={cn(
          'focus-ring relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px]',
          'bg-fill-strong transition-colors duration-(--duration-fast) ease-out data-[checked]:bg-accent',
        )}
      >
        <BaseSwitch.Thumb
          className="block size-[27px] rounded-full bg-[var(--knob)] shadow-[var(--shadow-knob)] transition-transform duration-(--duration-fast) ease-[var(--ease-out)] data-[checked]:translate-x-[20px]"
        />
      </BaseSwitch.Root>
    </label>
  );
}
