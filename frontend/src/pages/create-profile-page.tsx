import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { AvatarPicker, AVATARS } from '../components/avatar-picker';
import type { Profile } from '../types/api';
import { useEnglishVoices } from '../speech/speech';
import { Button } from '../components/ui/button';
import { FormGroup } from '../components/ui/form-group';
import { IconLink } from '../components/ui/icon-button';
import { TextField } from '../components/ui/text-field';
import { Select } from '../components/ui/select';

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { voices } = useEnglishVoices();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [pin, setPin] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [voice, setVoice] = useState('');

  // Đã tạo xong mà bước chọn hồ sơ lỗi thì lần thử lại chỉ chọn, không tạo trùng.
  const created = useRef<Profile | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      created.current ??= await endpoints.createProfile({
        name: name.trim(), avatar, pin: pin || null, dailyMinutes, voice: voice || null,
      });
      const profile = created.current;
      await endpoints.selectProfile(profile.id, pin || undefined);
      return profile;
    },
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (q) => String(q.queryKey[0]) !== 'health' });
      navigate('/', { replace: true });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) create.mutate();
  }

  const voiceOptions = [
    { value: '', label: 'Tự chọn (Anh-Mỹ)' },
    ...voices.map((v) => ({ value: v.name, label: `${v.name} (${v.lang})` })),
  ];

  return (
    <div data-testid="page-create-profile" className="min-h-dvh px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md">
        <IconLink to="/profiles?manual=1" icon="back" label="Quay lại" />
        <div className="mt-4 mb-6 flex flex-col items-center text-center">
          <span aria-hidden="true" className="inline-flex size-24 items-center justify-center rounded-full bg-surface text-6xl leading-none card-edge">
            {avatar}
          </span>
          <h1 className="mt-4 text-large-title text-text">Tạo hồ sơ</h1>
          <p className="mt-1.5 max-w-xs text-base text-balance text-text-2">
            Mỗi người học một hồ sơ riêng, tiến độ không lẫn vào nhau.
          </p>
        </div>

        <form className="space-y-6" onSubmit={submit}>
          <FormGroup>
            <TextField
              label="Tên"
              required
              maxLength={30}
              autoComplete="nickname"
              autoCapitalize="words"
              enterKeyHint="next"
              placeholder="VD: Lan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <fieldset>
              <legend className="mb-2 px-1 text-base font-semibold text-text-2">Avatar</legend>
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </fieldset>
          </FormGroup>

          <FormGroup title="Học mỗi ngày" footer="Buổi học hằng ngày được chia theo số phút này. Đổi lại được trong Cá nhân.">
            <TextField
              label="Số phút mỗi ngày"
              type="number"
              inputMode="numeric"
              min={10}
              max={240}
              value={dailyMinutes}
              onChange={(e) => setDailyMinutes(Number(e.target.value))}
            />
            <Select label="Giọng đọc" options={voiceOptions} value={voice} onChange={(e) => setVoice(e.target.value)} />
          </FormGroup>

          <FormGroup title="Bảo mật" footer="Đặt PIN nếu máy dùng chung, để người khác không vào nhầm hồ sơ của bạn.">
            <TextField
              label="Mã PIN (không bắt buộc)"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              pattern="\d{4,6}"
              title="4–6 chữ số"
              maxLength={6}
              hint="4–6 chữ số."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </FormGroup>

          <Button type="submit" block size="lg" loading={create.isPending} disabled={!name.trim()}>Tạo hồ sơ</Button>
        </form>
      </div>
    </div>
  );
}
