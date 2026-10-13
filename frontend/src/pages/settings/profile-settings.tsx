import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';
import type { Profile } from '../../types/api';
import { AvatarPicker } from '../../components/avatar-picker';
import { ButtonLink, Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ListGroup, ListRow } from '../../components/ui/list-row';
import { Sheet } from '../../components/ui/sheet';
import { ConfirmDialog } from '../../components/ui/dialog';
import { TextField } from '../../components/ui/text-field';
import { Switch } from '../../components/ui/switch';
import { IconChip } from '../../components/ui/icon-chip';
import { useSaveProfile } from './use-save-profile';

/** Thẻ đầu trang Cá nhân: avatar lớn, tên, số phút/ngày + "Đổi hồ sơ". */
export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Card className="flex items-center gap-4">
      <span aria-hidden="true" className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-5xl leading-none font-semibold text-accent-text">
        {profile.avatar || profile.name.charAt(0).toUpperCase() || '?'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xl font-bold break-words text-text" title={profile.name}>{profile.name}</p>
        <p className="mt-0.5 text-md tabular-nums text-text-2">
          {profile.dailyMinutes} phút mỗi ngày{profile.hasPin ? ' · Có mã PIN' : ''}
        </p>
      </div>
      <ButtonLink to="/profiles?manual=1" variant="secondary" size="sm">Đổi hồ sơ</ButtonLink>
    </Card>
  );
}

/** Nhóm "Hồ sơ": sửa thông tin trong Sheet, xoá hồ sơ qua hộp xác nhận. */
export function ProfileSettings({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = useMutation({
    mutationFn: endpoints.deleteProfile,
    onSuccess: () => {
      queryClient.clear();
      navigate('/profiles', { replace: true });
    },
  });

  return (
    <>
      <ListGroup title="Hồ sơ">
        <ListRow
          leading={<IconChip icon="person" />}
          title="Sửa hồ sơ"
          subtitle="Tên, avatar, mã PIN, số phút mỗi ngày"
          chevron
          onClick={() => setEditing(true)}
        />
        <ListRow
          leading={<IconChip icon="close" tone="danger" />}
          title={<span className="font-medium text-danger-text">{remove.isPending ? 'Đang xoá hồ sơ…' : 'Xoá hồ sơ'}</span>}
          onClick={() => { if (!remove.isPending) setConfirmDelete(true); }}
        />
      </ListGroup>

      <Sheet open={editing} onOpenChange={setEditing} title="Sửa hồ sơ">
        <ProfileForm profile={profile} onSaved={() => setEditing(false)} />
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Xoá hồ sơ "${profile.name}" và toàn bộ tiến độ?`}
        description="Không thể hoàn tác."
        confirmLabel="Xoá hồ sơ"
        destructive
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar ?? '');
  const [dailyMinutes, setDailyMinutes] = useState(profile.dailyMinutes);
  const [pin, setPin] = useState('');
  const [removePin, setRemovePin] = useState(false);
  const save = useSaveProfile(profile, { message: 'Đã lưu hồ sơ', onSaved });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    save.mutate({
      name: name.trim(),
      avatar: avatar || undefined,
      dailyMinutes,
      pin: !removePin && pin ? pin : undefined,
      removePin: removePin || undefined,
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <TextField label="Tên hồ sơ" required maxLength={30} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      <fieldset>
        <legend className="mb-2 px-1 text-base font-semibold text-text-2">Avatar</legend>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </fieldset>
      <TextField
        label="Số phút mỗi ngày"
        type="number"
        inputMode="numeric"
        min={10}
        max={240}
        hint="Từ 10 đến 240 phút."
        value={dailyMinutes}
        onChange={(e) => setDailyMinutes(Number(e.target.value))}
      />
      <div className="space-y-2">
        <TextField
          label={profile.hasPin ? 'Mã PIN mới' : 'Đặt mã PIN'}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          pattern="\d{4,6}"
          title="4–6 chữ số"
          hint="4–6 chữ số. Để trống nếu không đổi."
          disabled={removePin}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        {profile.hasPin && <Switch label="Bỏ mã PIN" checked={removePin} onCheckedChange={setRemovePin} className="px-1" />}
      </div>
      <Button type="submit" block size="lg" loading={save.isPending}>Lưu hồ sơ</Button>
    </form>
  );
}
