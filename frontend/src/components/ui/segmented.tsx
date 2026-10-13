import { useId } from 'react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Radio } from '@base-ui/react/radio';
import { motion, MotionConfig } from 'motion/react';
import { cn } from './cn';
import { SPRING } from './motion';

/**
 * Điều khiển phân đoạn kiểu iOS (7 ngày / 30 ngày…), điều khiển được.
 *
 * **Vai trò ARIA: `radiogroup` + các `radio`** (base-ui RadioGroup). Nhóm có tên accessible = `label`;
 * mỗi lựa chọn là `role="radio"` với tên = nhãn hiển thị, `aria-checked` cho lựa chọn đang chọn.
 * Test/E2E chọn bằng `getByRole('radio', { name: '…' })`. Phím mũi tên chuyển và chọn luôn (như radio gốc).
 *
 * Nền trắng của lựa chọn đang chọn trượt theo bằng lò xo tới hạn `SPRING` — chọn là chạm, không nảy
 * (tắt chuyển động khi reduced-motion).
 */
export function Segmented<T extends string>({ label, value, onChange, options, className }: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <MotionConfig reducedMotion="user">
      <RadioGroup
        aria-label={label}
        value={value}
        onValueChange={(v) => onChange(v as T)}
        className={cn('flex w-full rounded-full bg-fill p-1', className)}
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Radio.Root
              key={o.value}
              value={o.value}
              className={cn(
                'focus-ring relative flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-full px-3',
                'text-md font-semibold transition-colors duration-(--duration-press)',
                selected ? 'text-text' : 'text-text-2 hover:text-text',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${id}-thumb`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[var(--thumb)] shadow-[var(--shadow-thumb)]"
                  transition={SPRING}
                />
              )}
              <span className="relative truncate">{o.label}</span>
            </Radio.Root>
          );
        })}
      </RadioGroup>
    </MotionConfig>
  );
}
