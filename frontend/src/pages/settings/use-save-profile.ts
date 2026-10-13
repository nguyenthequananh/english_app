import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';
import type { Profile, UpdateProfile } from '../../types/api';
import { CURRENT_PROFILE_KEY } from '../../shell/require-profile';
import { configureSpeech } from '../../speech/speech';
import { toast } from '../../components/toaster';

/**
 * Lưu hồ sơ hiện tại. Luôn gửi đủ các trường (giá trị hiện có + phần vừa sửa) như form cũ;
 * `voice: ''` nghĩa là "tự chọn giọng". Thành công thì ghi thẳng vào cache hồ sơ và cấu hình lại giọng đọc.
 */
export function useSaveProfile(profile: Profile, { message, onSaved }: { message: string; onSaved?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: UpdateProfile) => endpoints.updateProfile({
      name: profile.name,
      avatar: profile.avatar || undefined,
      dailyMinutes: profile.dailyMinutes,
      voice: profile.voice ?? '',
      speechRate: profile.speechRate,
      ...changes,
    }),
    onSuccess: (updated) => {
      queryClient.setQueryData(CURRENT_PROFILE_KEY, updated);
      configureSpeech({ voice: updated.voice, rate: updated.speechRate });
      toast(message);
      onSaved?.();
    },
  });
}
