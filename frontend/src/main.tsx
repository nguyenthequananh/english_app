import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { registerProfileRequiredHandler } from './app';
import { createQueryClient } from './config/query-client';
import { createAppRouter } from './router';
// Inter (OFL) đóng gói kèm cho Windows/máy không có SF Pro — Vite chép woff2 vào dist/assets, chạy offline.
// Bản `opsz`: trục cỡ quang học 14–32, trình duyệt tự dùng nét Display cho chữ lớn (như SF Text/Display).
import '@fontsource-variable/inter/opsz.css';
import './index.css';

const queryClient = createQueryClient();
const router = createAppRouter();
registerProfileRequiredHandler(router, queryClient);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>,
);
