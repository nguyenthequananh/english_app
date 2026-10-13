import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { registerProfileRequiredHandler } from './app';
import { createQueryClient } from './config/query-client';
import { createAppRouter } from './router';
import { applyTheme, readStoredPreference } from './config/theme';
// Inter (OFL) đóng gói kèm cho Windows/máy không có SF Pro — Vite chép woff2 vào dist/assets, chạy offline.
// Bản `opsz`: trục cỡ quang học 14–32, trình duyệt tự dùng nét Display cho chữ lớn (như SF Text/Display).
// Chỉ 4 bộ ký tự cần (latin, latin-ext cho IPA, vietnamese, greek cho θ) — xem font-inter.css.
import './font-inter.css';
import './index.css';

// Script đầu index.html đã áp chế độ sáng/tối trước khi vẽ; gọi lại ở đây phòng khi script đó bị chặn (idempotent).
applyTheme(readStoredPreference());

const queryClient = createQueryClient();
const router = createAppRouter();
registerProfileRequiredHandler(router, queryClient);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>,
);
