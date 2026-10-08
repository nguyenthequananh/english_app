import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';
import type { Profile } from '../../api/types';
import { AvatarPicker } from '../../components/AvatarPicker';
import { toast } from '../../components/Toaster';
import { configureSpeech, speak, useEnglishVoices } from '../../speech/speech';

export function ProfileSettings() {
  const { data: profile } = useQuery({ queryKey: ['profile', 'current'], queryFn: endpoints.currentProfile });
  if (!profile) return null;
  return <ProfileForm key={profile.id} profile={profile} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { voices } = useEnglishVoices();
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar ?? '');
  const [dailyMinutes, setDailyMinutes] = useState(profile.dailyMinutes);
  const [voice, setVoice] = useState(profile.voice ?? '');
  const [speechRate, setSpeechRate] = useState(profile.speechRate);
  const [pin, setPin] = useState('');
  const [removePin, setRemovePin] = useState(false);

  const save = useMutation({
    mutationFn: () => endpoints.updateProfile({
      name: name.trim(), avatar: avatar || undefined, dailyMinutes, voice, speechRate,
      pin: !removePin && pin ? pin : undefined, removePin: removePin || undefined,
    }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', 'current'], updated);
      configureSpeech({ voice: updated.voice, rate: updated.speechRate });
      setPin('');
      setRemovePin(false);
      toast('Đã lưu hồ sơ');
    },
  });
  const remove = useMutation({
    mutationFn: endpoints.deleteProfile,
    onSuccess: () => {
      queryClient.clear();
      navigate('/profiles', { replace: true });
    },
  });

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Hồ sơ</h2>
      <form className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) save.mutate();
        }}>
        <div>
          <label htmlFor="p-name" className="mb-1 block text-sm font-medium">Tên hồ sơ</label>
          <input id="p-name" className="input" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="p-minutes" className="mb-1 block text-sm font-medium">Số phút mỗi ngày</label>
          <input id="p-minutes" className="input" type="number" min={10} max={240} value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
        <div>
          <label htmlFor="p-voice" className="mb-1 block text-sm font-medium">Giọng đọc</label>
          <select id="p-voice" className="input" value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">Tự chọn (Anh-Mỹ)</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="p-rate" className="mb-1 block text-sm font-medium">Tốc độ đọc ({speechRate.toFixed(1)}×)</label>
          <div className="flex items-center gap-2">
            <input id="p-rate" type="range" min={0.5} max={2} step={0.1} value={speechRate} className="flex-1"
              onChange={(e) => setSpeechRate(Number(e.target.value))} />
            <button type="button" className="btn bg-slate-100"
              onClick={() => speak('Hello, welcome to your English lesson.', { voice: voice || null, rate: speechRate })}>
              Nghe thử
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="p-pin" className="mb-1 block text-sm font-medium">Mã PIN mới</label>
          <input id="p-pin" className="input" type="password" inputMode="numeric" pattern="\d{4,6}" title="4–6 chữ số"
            disabled={removePin} value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
        {profile.hasPin && (
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={removePin} onChange={(e) => setRemovePin(e.target.checked)} />
            Bỏ mã PIN
          </label>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={save.isPending}>Lưu hồ sơ</button>
          <button type="button" className="btn btn-danger ml-auto" disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Xoá hồ sơ "${profile.name}" và toàn bộ tiến độ? Không thể hoàn tác.`)) remove.mutate();
            }}>
            Xoá hồ sơ
          </button>
        </div>
      </form>
    </section>
  );
}
