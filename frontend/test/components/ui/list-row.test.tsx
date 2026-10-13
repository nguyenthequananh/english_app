import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadRow, FileRow, GroupItem, ListGroup, ListRow } from '@/components/ui/list-row';
import { renderAt } from '@test/render';

test('ListGroup có tiêu đề thì là vùng mang tên đó, các dòng là listitem', () => {
  renderAt(
    <ListGroup title="Sao lưu" footer="Tự sao lưu mỗi ngày.">
      <ListRow title="Mở" to="/settings" />
      <GroupItem>Chưa có bản sao lưu nào.</GroupItem>
    </ListGroup>,
  );
  const group = screen.getByRole('region', { name: 'Sao lưu' });
  expect(within(group).getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('Tự sao lưu mỗi ngày.')).toBeInTheDocument();
});

test('ListRow: `to` là link, `onClick` là nút, còn lại là dòng tĩnh', async () => {
  const onClick = vi.fn();
  renderAt(
    <ListGroup>
      <ListRow title="Lộ trình" to="/roadmap" />
      <ListRow title="Tắt app" onClick={onClick} />
      <ListRow title="Phiên bản" trailing="1.0" />
    </ListGroup>,
  );
  expect(screen.getByRole('link', { name: 'Lộ trình' })).toHaveAttribute('href', '/roadmap');
  await userEvent.click(screen.getByRole('button', { name: 'Tắt app' }));
  expect(onClick).toHaveBeenCalledOnce();
  expect(screen.queryByRole('link', { name: /Phiên bản/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /Phiên bản/ })).toBeNull();
});

test('DownloadRow là link tải file (có `download`, href nguyên vẹn, không qua router)', () => {
  renderAt(<ListGroup><DownloadRow href="/api/backup/download" title="Tải bản sao lưu" subtitle="Tệp .zip" /></ListGroup>);
  const link = screen.getByRole('link', { name: /Tải bản sao lưu/ });
  expect(link).toHaveAttribute('href', '/api/backup/download');
  expect(link).toHaveAttribute('download');
  expect(link).toHaveTextContent('Tệp .zip');
});

test('FileRow: bấm cả dòng mở hộp chọn file, chọn xong trả về file và xoá giá trị để chọn lại được', async () => {
  const onFiles = vi.fn();
  renderAt(<ListGroup><FileRow title="Nhập hồ sơ" inputLabel="Chọn tệp hồ sơ" accept=".zip" onFiles={onFiles} /></ListGroup>);
  const input = screen.getByLabelText<HTMLInputElement>('Chọn tệp hồ sơ');
  expect(input).toHaveAttribute('type', 'file');
  expect(input).toHaveAttribute('accept', '.zip');

  const opened = vi.fn();
  input.addEventListener('click', opened);
  await userEvent.click(screen.getByText('Nhập hồ sơ'));
  expect(opened).toHaveBeenCalled();

  const file = new File(['zip'], 'ho-so.zip', { type: 'application/zip' });
  await userEvent.upload(input, file);
  expect(onFiles).toHaveBeenCalledWith([file]);
  expect(input.value).toBe('');
});

test('FileRow đang bận: khoá input, báo bận, hiện "Đang nhập…"', () => {
  const { container } = renderAt(
    <ListGroup><FileRow title="Nạp nội dung" inputLabel="Chọn tệp nội dung" accept=".json" multiple busy onFiles={() => {}} /></ListGroup>,
  );
  const input = screen.getByLabelText('Chọn tệp nội dung');
  expect(input).toBeDisabled();
  expect(input).toHaveAttribute('multiple');
  expect(container.querySelector('label')).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByText('Đang nhập…')).toBeInTheDocument();
});
