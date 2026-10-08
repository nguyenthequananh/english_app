import { expect, test, type Page } from '@playwright/test';

async function createProfile(page: Page, name: string) {
  await page.goto('/profiles/new');
  await page.getByLabel('Tên').fill(name);
  await page.getByRole('button', { name: 'Tạo hồ sơ' }).click();
  await expect(page.getByRole('link', { name: 'Hôm nay' })).toBeVisible();
}

async function finishTodaySession(page: Page) {
  await page.getByRole('link', { name: 'Bắt đầu buổi học' }).click();
  const stepBar = page.getByTestId('session-step');
  await expect(stepBar).toBeVisible();
  for (let i = 0; i < 40; i++) {
    const step = await stepBar.getAttribute('data-step');
    if (step !== 'REVIEW' && step !== 'NEW') break;
    await page.keyboard.press('Space');
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/session/today/cards/') && r.ok()),
      page.keyboard.press('3'),
    ]);
  }
  await expect(stepBar).toHaveAttribute('data-step', 'LESSON');
  const submit = page.getByRole('button', { name: 'Nộp bài' });
  if (await submit.isVisible()) await submit.click();
  else await page.getByRole('button', { name: 'Đã học xong bài này' }).click();
  await page.getByRole('button', { name: 'Hoàn thành buổi học' }).click();
  await expect(page.getByText('🎉 Xong buổi học hôm nay!')).toBeVisible();
}

test('học trọn một buổi rồi thấy chuỗi ngày học', async ({ page }) => {
  await createProfile(page, 'Lan');
  await finishTodaySession(page);
  await page.getByRole('link', { name: 'Thống kê' }).click();
  await expect(page.getByTestId('stat-streak')).toHaveText('1');
  await page.getByRole('link', { name: 'Hôm nay' }).click();
  await expect(page.getByText('✓ Bạn đã hoàn thành buổi học hôm nay')).toBeVisible();
});

test('F5 ở đường dẫn con vẫn mở đúng trang', async ({ page }) => {
  // Mỗi test Playwright có phiên mới: vào trang chủ để app tự chọn hồ sơ duy nhất (Lan) trước.
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Hôm nay' })).toBeVisible();
  await page.goto('/roadmap');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lộ trình' })).toBeVisible();
});

test('hai hồ sơ không thấy dữ liệu học của nhau', async ({ page }) => {
  await createProfile(page, 'Minh');
  await page.getByRole('link', { name: 'Kho từ' }).click();
  await page.getByLabel('Trạng thái').selectOption('LEARNING');
  await expect(page.getByText('Không có từ nào')).toBeVisible();

  await page.getByRole('link', { name: 'Đổi hồ sơ' }).click();
  await page.getByRole('button', { name: /Lan/ }).click();
  await page.getByRole('link', { name: 'Kho từ' }).click();
  await page.getByLabel('Trạng thái').selectOption('LEARNING');
  await expect(page.locator('tbody tr').first()).toBeVisible();
});
