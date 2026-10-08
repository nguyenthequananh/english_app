import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { AvatarPicker, AVATARS } from '../components/AvatarPicker';
import { useEnglishVoices } from '../speech/speech';

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { voices } = useEnglishVoices();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [pin, setPin] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [voice, setVoice] = useState('');

  const create = useMutation({
    mutationFn: async () => {
      const profile = await endpoints.createProfile({
        name: name.trim(), avatar, pin: pin || null, dailyMinutes, voice: voice || null,
      });
      await endpoints.selectProfile(profile.id, pin || undefined);
      return profile;
    },
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (q) => String(q.queryKey[0]) !== 'health' });
      navigate('/', { replace: true });
    },
  });

  return (
    <div data-testid="page-create-profile" className="mx-auto mt-12 max-w-md p-4">
      <h1 className="mb-6 text-2xl font-bold">Tạo hồ sơ</h1>
      <form className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Tên</label>
          <input id="name" className="input" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
        <div>
          <label htmlFor="pin" className="mb-1 block text-sm font-medium">Mã PIN (không bắt buộc)</label>
          <input id="pin" className="input" type="password" inputMode="numeric" pattern="\d{4,6}" title="4–6 chữ số"
            value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
        <div>
          <label htmlFor="minutes" className="mb-1 block text-sm font-medium">Số phút mỗi ngày</label>
          <input id="minutes" className="input" type="number" min={10} max={240} value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="voice" className="mb-1 block text-sm font-medium">Giọng đọc</label>
          <select id="voice" className="input" value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">Tự chọn (Anh-Mỹ)</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={create.isPending}>Tạo hồ sơ</button>
        <Link to="/profiles?manual=1" className="block text-center text-sm text-indigo-600">Quay lại</Link>
      </form>
    </div>
  );
}
