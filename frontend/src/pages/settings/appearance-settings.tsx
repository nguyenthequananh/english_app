import { useTheme, type ThemePreference } from '../../config/theme';
import { GroupItem, ListGroup } from '../../components/ui/list-row';
import { Segmented } from '../../components/ui/segmented';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Tự động' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
];

/** Nhóm "Giao diện": Tự động (theo máy) · Sáng · Tối. Lưu trên trình duyệt này, không theo hồ sơ. */
export function AppearanceSettings() {
  const { preference, setPreference } = useTheme();
  return (
    <ListGroup title="Giao diện" footer="Tự động: theo chế độ sáng/tối của máy. Lựa chọn lưu trên trình duyệt này, dùng chung cho mọi hồ sơ.">
      <GroupItem>
        <Segmented label="Giao diện" value={preference} onChange={setPreference} options={OPTIONS} />
      </GroupItem>
    </ListGroup>
  );
}
