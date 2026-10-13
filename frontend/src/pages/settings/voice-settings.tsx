import { useId, useState } from 'react';
import type { Profile } from '../../types/api';
import { speak, useEnglishVoices } from '../../speech/speech';
import { ListGroup } from '../../ui/list-row';
import { Select } from '../../ui/select';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icons';
import { GroupItem } from './settings-rows';
import { useSaveProfile } from './use-save-profile';

const SAMPLE = 'Hello, welcome to your English lesson.';

/** Nhóm "Giọng đọc": chọn giọng + tốc độ, nghe thử, lưu khi có thay đổi. */
export function VoiceSettings({ profile }: { profile: Profile }) {
  const { voices } = useEnglishVoices();
  const rateId = useId();
  const [voice, setVoice] = useState(profile.voice ?? '');
  const [speechRate, setSpeechRate] = useState(profile.speechRate);
  const dirty = voice !== (profile.voice ?? '') || speechRate !== profile.speechRate;
  const save = useSaveProfile(profile, { message: 'Đã lưu giọng đọc' });

  const options = [
    { value: '', label: 'Tự chọn (Anh-Mỹ)' },
    ...voices.map((v) => ({ value: v.name, label: `${v.name} (${v.lang})` })),
  ];
  // Giọng đã lưu nhưng máy này không có: vẫn hiện để không lặng lẽ đổi lựa chọn.
  if (voice && !voices.some((v) => v.name === voice)) options.push({ value: voice, label: `${voice} (không có trên máy)` });

  return (
    <ListGroup title="Giọng đọc" footer="Dùng giọng có sẵn của Windows, đọc được khi không có mạng.">
      <GroupItem>
        <Select label="Giọng đọc" options={options} value={voice} onChange={(e) => setVoice(e.target.value)} />
      </GroupItem>
      <GroupItem>
        <div className="mb-1.5 flex items-baseline justify-between px-1">
          <label htmlFor={rateId} className="text-[0.875rem] font-semibold text-text-2">Tốc độ đọc</label>
          <span className="text-[0.9375rem] font-semibold tabular-nums text-text">{speechRate.toFixed(1)}×</span>
        </div>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-[0.75rem] text-text-3">Chậm</span>
          <input
            id={rateId}
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speechRate}
            aria-valuetext={`${speechRate.toFixed(1)} lần`}
            onChange={(e) => setSpeechRate(Number(e.target.value))}
            className="h-11 min-w-0 flex-1 cursor-pointer accent-accent"
          />
          <span aria-hidden="true" className="text-[0.75rem] text-text-3">Nhanh</span>
        </div>
      </GroupItem>
      <GroupItem className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => speak(SAMPLE, { voice: voice || null, rate: speechRate })}>
          <Icon name="speaker" size={18} strokeWidth={2.1} />
          Nghe thử
        </Button>
        <Button className="flex-1" disabled={!dirty} loading={save.isPending} onClick={() => save.mutate({ voice, speechRate })}>
          Lưu giọng đọc
        </Button>
      </GroupItem>
    </ListGroup>
  );
}
