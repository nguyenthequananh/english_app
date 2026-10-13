/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test/support', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8765' },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        // Thư viện ít đổi tách chunk riêng theo nhóm để bản cập nhật app không làm mất cache của chúng.
        // Cố ý KHÔNG có nhóm "mọi node_modules": nhóm đó sẽ hút react-markdown/remark-gfm (chỉ trang bài học cần,
        // xem lesson-view.tsx) vào chunk tải lúc mở app. Thư viện không thuộc nhóm nào để rolldown tự chia theo route.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|@remix-run|cookie-es)[\\/]/, priority: 30 },
            { name: 'tanstack', test: /node_modules[\\/]@tanstack[\\/]/, priority: 20 },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion|tslib)[\\/]/, priority: 20 },
            { name: 'base-ui', test: /node_modules[\\/](@base-ui|@floating-ui|@babel[\\/]runtime|use-sync-external-store)[\\/]/, priority: 20 },
            // Các thư viện nhỏ mà khung app luôn cần (gọi API, toast, ghép lớp CSS).
            { name: 'vendor', test: /node_modules[\\/](axios|sonner|clsx|class-variance-authority)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/support/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
