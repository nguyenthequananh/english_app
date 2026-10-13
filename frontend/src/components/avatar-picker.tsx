export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🦁', '🐨', '🐙', '🦄'];

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVATARS.map((a) => (
        <button key={a} type="button" aria-label={`Chọn avatar ${a}`} aria-pressed={value === a}
          className={`h-11 w-11 rounded-full text-2xl ${value === a ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100'}`}
          onClick={() => onChange(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}
