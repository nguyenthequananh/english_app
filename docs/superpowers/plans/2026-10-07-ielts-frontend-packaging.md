# IELTS App – Giao diện + đóng gói: Kế hoạch triển khai (Kế hoạch 2/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây giao diện React cho toàn bộ chức năng của backend lõi, nhúng vào jar Spring Boot, đóng gói thành bản portable Windows (`IELTS App.exe` kèm Java runtime), có test thành phần (Vitest) và test end-to-end (Playwright).

**Architecture:** Thư mục `frontend/` (React 19 + Vite + TypeScript + Tailwind 4, React Router 7, TanStack Query 5). Mọi gọi API đi qua `src/api/client.ts` (ném `ApiError` có `code`), danh sách endpoint ở `src/api/endpoints.ts`. Mỗi màn hình là một file trong `src/pages/`, thành phần dùng lại ở `src/components/`. Khi build bằng Maven profile `app`, `frontend-maven-plugin` build React ra `frontend/dist`, Maven chép vào `static/` của jar. Backend thêm một controller chuyển các đường dẫn không phải `/api` về `index.html`. Script `packaging/build-portable.sh` dùng `jlink` + `jpackage` tạo app-image rồi nén `.zip`.

**Tech Stack:** React 19, Vite, TypeScript (strict), Tailwind CSS 4 (`@tailwindcss/vite`), react-router 7, @tanstack/react-query 5, react-markdown, Vitest + jsdom + Testing Library, Playwright (trình duyệt Edge có sẵn của Windows), frontend-maven-plugin, JDK 21 jlink/jpackage.

**Spec:** `docs/superpowers/specs/2026-10-06-ielts-app-phase1-design.md` · **Kế hoạch trước:** `docs/superpowers/plans/2026-10-06-ielts-backend-core.md` · **Việc còn lại từ Kế hoạch 1:** `docs/superpowers/plans/2026-10-06-backend-core-followups.md`

## Global Constraints

- Thư mục frontend: `frontend/`. Lệnh test: `cd frontend && npx vitest run <đường dẫn file>`; cả bộ: `cd frontend && npm test`. Kiểm kiểu: `cd frontend && npx tsc --noEmit -p .`.
- Backend test: `cd backend && ./mvnw -q test -Dtest=A,B` (chọn nhiều test dùng dấu phẩy). JAVA_HOME = JDK 21; `java` trên PATH là Java 8 nên luôn dùng `./mvnw` hoặc `"$JAVA_HOME/bin/java"`.
- Mọi chữ hiển thị bằng tiếng Việt; nội dung học giữ nguyên tiếng Anh.
- Gọi API chỉ qua `endpoints` trong `src/api/endpoints.ts`; không gọi `fetch` trực tiếp ở trang. Lỗi API là `ApiError { status, code, message, errors }`; `message` lấy từ `detail` tiếng Việt của backend.
- Lỗi `PROFILE_REQUIRED` (401) luôn đưa người dùng về `/profiles`, không hiện toast.
- Âm thanh chỉ dùng Web Speech API (`speechSynthesis`), chọn giọng `en-*`; giọng và tốc độ lấy từ hồ sơ (`voice`, `speechRate`).
- Phím tắt flashcard: `Space` lật thẻ, `1–4` chấm (Quên/Khó/Được/Dễ) khi đã lật.
- Không sửa schema DB. Thay đổi backend trong kế hoạch này chỉ gồm: chuyển tiếp SPA, `server.servlet.session.timeout: 8h`, resource `frontend/dist` → `static`, profile Maven `app`.
- Server chỉ ở `127.0.0.1`; dev server Vite ở cổng 5173, proxy `/api` sang `http://127.0.0.1:8765` (không đổi Host, để qua được bộ lọc Host/Origin).
- Đóng gói: app-image portable `.zip` (không làm `.msi` vì máy chưa có WiX). Tham số JVM: `-Xms64m -Xmx256m -XX:+UseSerialGC -Dfile.encoding=UTF-8`.
- Mỗi commit kết thúc bằng: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Phiên hết hạn giữa chừng** (để app mở lâu rồi quay lại): mọi trang phải đưa về màn chọn hồ sơ, không treo hay hiện lỗi đỏ. → test trong Task 3 (client gọi handler) và Task 4 (Layout chuyển hướng).
2. **Bấm chấm thẻ liên tục hoặc mở hai tab**: frontend gặp 409 `CARD_MISMATCH`/`NO_SESSION` phải tự tải lại buổi học, không kẹt. → test trong Task 8.
3. **Máy không có giọng tiếng Anh**: app vẫn dùng được, hiện hướng dẫn cài giọng, nút loa không làm crash. → test trong Task 4.
4. **Mở thẳng đường dẫn con** (F5 ở `/roadmap`, bookmark `/lessons/S0-U01-G1`): server trả `index.html`, `/api/...` sai vẫn trả JSON 404. → test trong Task 1 và Task 12.
5. **Tắt app từ giao diện rồi mở lại**: nút "Tắt app" làm tiến trình thoát thật; bản đóng gói chạy được trên máy không cài Java. → kiểm trong Task 11 (giao diện) và Task 13 (chạy exe, gọi shutdown).

---

### Task 1: Backend – chuyển tiếp SPA, thời gian phiên, nhúng frontend/dist

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/common/SpaForwardController.java`
- Modify: `backend/src/main/resources/application.yml` (thêm `server.servlet.session.timeout`)
- Modify: `backend/pom.xml` (thêm resource `../frontend/dist` → `static`)
- Test: `backend/src/test/java/vn/ieltsapp/common/SpaForwardTest.java`

**Interfaces:**
- Produces: mọi `GET` có đoạn đầu khác `api`/`assets` và không chứa dấu chấm ở đoạn đầu được forward tới `/index.html`; `/api/**` giữ nguyên hành vi (JSON 404 khi không có).

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/common/SpaForwardTest.java`:
```java
package vn.ieltsapp.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import vn.ieltsapp.support.IntegrationTest;

class SpaForwardTest extends IntegrationTest {

    @Test
    void clientRoutesForwardToIndexHtml() throws Exception {
        mvc.perform(get("/roadmap")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/lessons/S0-U01-G1")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/units/S0-U01/test")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/profiles/new")).andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void apiAndAssetsAreNotForwarded() throws Exception {
        mvc.perform(get("/api/khong-ton-tai"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mvc.perform(get("/assets/index-abc.js")).andExpect(forwardedUrl(null));
        mvc.perform(get("/favicon.ico")).andExpect(forwardedUrl(null));
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=SpaForwardTest`
Expected: FAIL ở `clientRoutesForwardToIndexHtml` (forwardedUrl null).

- [ ] **Step 3: Viết code**

`backend/src/main/java/vn/ieltsapp/common/SpaForwardController.java`:
```java
package vn.ieltsapp.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Đường dẫn của React Router (không phải /api, /assets, không phải file) trả về index.html. */
@Controller
public class SpaForwardController {

    @GetMapping({"/{first:^(?!api$|assets$)[^\\.]*}", "/{first:^(?!api$|assets$)[^\\.]*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
```

Trong `backend/src/main/resources/application.yml`, sửa khối `server:` thành:
```yaml
server:
  address: 127.0.0.1
  port: 8765
  servlet:
    session:
      timeout: 8h
```

Trong `backend/pom.xml`, thêm vào `<resources>` (sau resource `../content`):
```xml
      <resource>
        <directory>../frontend/dist</directory>
        <targetPath>static</targetPath>
      </resource>
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=SpaForwardTest,HealthControllerTest`
Expected: PASS. Sau đó chạy cả bộ `./mvnw -q test` một lần, kỳ vọng 0 lỗi.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(backend): chuyển tiếp đường dẫn SPA về index.html, phiên 8 giờ, nhúng frontend/dist

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Khung frontend (Vite + React + Tailwind + Router + Query + Vitest)

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`
- Create: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/vite-env.d.ts`
- Create (trang tạm, các task sau ghi đè): `frontend/src/pages/{ProfileSelectPage,CreateProfilePage,TodayPage,SessionPage,ReviewPage,LessonPage,TestPage,RoadmapPage,WordBankPage,IpaPage,StatsPage,SettingsPage}.tsx`, `frontend/src/components/Layout.tsx`
- Create: `frontend/src/test/setup.ts`, `frontend/src/test/render.tsx`, `frontend/src/test/mockApi.ts`, `frontend/src/test/speechStub.ts`
- Modify: `.gitignore` (thêm `frontend/.node/`, `dist/`, `frontend/test-results/`, `frontend/playwright-report/`)
- Test: `frontend/src/App.test.tsx`

**Interfaces:**
- Produces: `renderAt(ui, route?)` (MemoryRouter + QueryClient mới), `mockApi(handlers)` → mảng `calls` (`{method, path, body}`; khoá handler dạng `"GET /profiles"`, `path` bỏ tiền tố `/api`, giữ query string), `stubSpeech(voices?)` → mảng `spoken` (`{text, voice, rate}`).
- Produces: `App` với đầy đủ route: `/profiles`, `/profiles/new`, và trong `Layout`: `/`, `/session`, `/review`, `/lessons/:code`, `/units/:code/test`, `/stages/:code/test`, `/roadmap`, `/words`, `/ipa`, `/stats`, `/settings`; `*` → `/`.
- Produces: lớp CSS dùng chung trong `index.css`: `btn`, `btn-primary`, `btn-ghost`, `btn-danger`, `card`, `input`, `badge`, `markdown`.

- [ ] **Step 1: Tạo cấu hình và cài thư viện**

`frontend/package.json`:
```json
{
  "name": "ielts-app-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit -p . && vite build",
    "test": "vitest run",
    "e2e": "playwright test"
  }
}
```

Cài thư viện (ghi phiên bản thực tế vào `package.json` và `package-lock.json`):
```bash
cd frontend
npm install react react-dom react-router @tanstack/react-query react-markdown
npm install -D typescript vite @vitejs/plugin-react tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom @playwright/test @types/node
```

`frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"]
  },
  "include": ["src", "e2e", "vite.config.ts", "playwright.config.ts"]
}
```

`frontend/vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8765' },
  },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

`frontend/index.html`:
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>IELTS App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`frontend/src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`frontend/src/index.css`:
```css
@import "tailwindcss";

@layer components {
  .btn { @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50; }
  .btn-primary { @apply bg-indigo-600 text-white hover:bg-indigo-700; }
  .btn-ghost { @apply bg-transparent px-2 hover:bg-slate-100; }
  .btn-danger { @apply bg-rose-600 text-white hover:bg-rose-700; }
  .card { @apply rounded-xl border border-slate-200 bg-white p-4 shadow-sm; }
  .input { @apply w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none; }
  .badge { @apply inline-block rounded-full px-2 py-0.5 text-xs font-medium; }
  .markdown h2 { @apply mt-2 text-xl font-semibold; }
  .markdown h3 { @apply mt-2 text-lg font-semibold; }
  .markdown p { @apply my-2; }
  .markdown ul { @apply my-2 list-disc pl-6; }
  .markdown strong { @apply font-semibold; }
  .markdown em { @apply italic; }
}
```

Thêm vào `.gitignore` ở gốc repo:
```gitignore
frontend/.node/
frontend/test-results/
frontend/playwright-report/
/dist/
```

- [ ] **Step 2: Tạo hỗ trợ test và test App (sẽ fail)**

`frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
```

`frontend/src/test/render.tsx`:
```tsx
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { createQueryClient } from '../api/queryClient';

export function renderAt(ui: ReactElement, route = '/') {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
```

`frontend/src/test/mockApi.ts`:
```ts
import { vi } from 'vitest';

export interface MockReply { status?: number; body?: unknown }
export type MockHandler = (body: unknown) => MockReply;
export interface MockCall { method: string; path: string; body: unknown }

/** Giả lập fetch: khoá "METHOD /path?query" (không có tiền tố /api). Không có handler → 404 JSON. */
export function mockApi(handlers: Record<string, MockHandler>): MockCall[] {
  const calls: MockCall[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    const path = url.replace(/^\/api/, '');
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({ method, path, body });
    const handler = handlers[`${method} ${path}`];
    if (!handler) {
      return new Response(JSON.stringify({ status: 404, code: 'NOT_FOUND', detail: `Không có mock cho ${method} ${path}` }),
        { status: 404, headers: { 'Content-Type': 'application/problem+json' } });
    }
    const reply = handler(body);
    const status = reply.status ?? 200;
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body),
      { status, headers: { 'Content-Type': 'application/json' } });
  }));
  return calls;
}

export function problem(status: number, code: string, detail: string): MockReply {
  return { status, body: { status, code, detail } };
}
```

`frontend/src/test/speechStub.ts`:
```ts
import { vi } from 'vitest';

export interface FakeVoice { name: string; lang: string }

export function stubSpeech(voices: FakeVoice[] = [
  { name: 'Microsoft Aria', lang: 'en-US' },
  { name: 'Microsoft Ryan', lang: 'en-GB' },
  { name: 'Microsoft An', lang: 'vi-VN' },
]) {
  const spoken: { text: string; voice: string | undefined; rate: number }[] = [];
  class FakeUtterance {
    text: string;
    voice: FakeVoice | null = null;
    lang = '';
    rate = 1;
    constructor(text: string) { this.text = text; }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    speak: (u: FakeUtterance) => spoken.push({ text: u.text, voice: u.voice?.name, rate: u.rate }),
    cancel: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  return spoken;
}
```

`frontend/src/App.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import App from './App';
import { renderAt } from './test/render';

test('route /profiles hiển thị trang chọn hồ sơ', () => {
  renderAt(<App />, '/profiles');
  expect(screen.getByTestId('page-profiles')).toBeInTheDocument();
});

test('route lạ quay về trang chủ', () => {
  renderAt(<App />, '/khong-co');
  expect(screen.getByTestId('layout')).toBeInTheDocument();
});
```

Run: `cd frontend && npx vitest run src/App.test.tsx`
Expected: FAIL (chưa có `App`, `queryClient`).

- [ ] **Step 3: Viết App, main và các trang tạm**

`frontend/src/api/queryClient.ts` (tạm, Task 3 viết lại bản đầy đủ):
```ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } });
}
```

`frontend/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { createQueryClient } from './api/queryClient';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

`frontend/src/App.tsx`:
```tsx
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import ProfileSelectPage from './pages/ProfileSelectPage';
import CreateProfilePage from './pages/CreateProfilePage';
import TodayPage from './pages/TodayPage';
import SessionPage from './pages/SessionPage';
import ReviewPage from './pages/ReviewPage';
import LessonPage from './pages/LessonPage';
import TestPage from './pages/TestPage';
import RoadmapPage from './pages/RoadmapPage';
import WordBankPage from './pages/WordBankPage';
import IpaPage from './pages/IpaPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/profiles" element={<ProfileSelectPage />} />
      <Route path="/profiles/new" element={<CreateProfilePage />} />
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="session" element={<SessionPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="lessons/:code" element={<LessonPage />} />
        <Route path="units/:code/test" element={<TestPage kind="UNIT" />} />
        <Route path="stages/:code/test" element={<TestPage kind="STAGE" />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="words" element={<WordBankPage />} />
        <Route path="ipa" element={<IpaPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

`frontend/src/components/Layout.tsx` (tạm, Task 4 viết lại):
```tsx
import { Outlet } from 'react-router';

export default function Layout() {
  return <div data-testid="layout"><Outlet /></div>;
}
```

Mỗi trang tạm có dạng sau (đổi tên hàm và `data-testid` cho từng file; `TestPage` nhận prop `kind`):

`frontend/src/pages/ProfileSelectPage.tsx`:
```tsx
export default function ProfileSelectPage() {
  return <h1 data-testid="page-profiles">Chọn hồ sơ</h1>;
}
```
`CreateProfilePage.tsx` → `page-create-profile` "Tạo hồ sơ"; `TodayPage.tsx` → `page-today` "Hôm nay"; `SessionPage.tsx` → `page-session` "Buổi học"; `ReviewPage.tsx` → `page-review` "Ôn thêm"; `LessonPage.tsx` → `page-lesson` "Bài học"; `RoadmapPage.tsx` → `page-roadmap` "Lộ trình"; `WordBankPage.tsx` → `page-words` "Kho từ"; `IpaPage.tsx` → `page-ipa` "Phát âm"; `StatsPage.tsx` → `page-stats` "Thống kê"; `SettingsPage.tsx` → `page-settings` "Cài đặt".

`frontend/src/pages/TestPage.tsx`:
```tsx
export default function TestPage({ kind }: { kind: 'UNIT' | 'STAGE' }) {
  return <h1 data-testid="page-test">Bài kiểm tra {kind}</h1>;
}
```

- [ ] **Step 4: Chạy test, kiểm kiểu, build**

Run: `cd frontend && npx vitest run src/App.test.tsx && npx tsc --noEmit -p . && npx vite build`
Expected: test PASS (2), tsc không lỗi, build tạo `frontend/dist/index.html`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore frontend
git commit -m "feat(frontend): khung Vite + React + Tailwind + Router + Query + Vitest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Lớp API (client, kiểu dữ liệu, endpoint, toast, QueryClient)

**Files:**
- Create: `frontend/src/api/client.ts`, `frontend/src/api/types.ts`, `frontend/src/api/endpoints.ts`
- Create: `frontend/src/components/Toaster.tsx`
- Modify (viết lại): `frontend/src/api/queryClient.ts`
- Modify: `frontend/src/App.tsx` (đăng ký handler PROFILE_REQUIRED, gắn `<Toaster />`)
- Test: `frontend/src/api/client.test.ts`, `frontend/src/components/Toaster.test.tsx`

**Interfaces:**
- Produces: `class ApiError extends Error { status: number; code: string; errors: string[] }`; `api.get/post/put/del<T>(path, body?)`; `setProfileRequiredHandler(fn: () => void)`.
- Produces: `endpoints.*` (danh sách đầy đủ ở Step 3) và `downloads.profileExport`, `downloads.dbExport`.
- Produces: `toast(message, kind?: 'info' | 'error')`, `notifyError(e)`, `<Toaster />`.
- Produces: `createQueryClient()`: lỗi query/mutation tự hiện toast, trừ khi `meta: { silent: true }` hoặc mã là `PROFILE_REQUIRED`.
- Produces: kiểu trong `types.ts`: `Grade, Status, WordStatus, SessionStep, ExerciseType, Health, Profile, CreateProfile, UpdateProfile, Word, WordBankItem, AddWord, CardState, SessionView, ExerciseView, ExerciseResult, Lesson, LessonSummary, SubmitResult, TestDto, TestResult, Roadmap, StageView, UnitView, Summary, CurrentUnit, Stats, DayMinutes, WeekCount, TestResultItem, BackupInfo, Settings, ContentImportResult, ProfileImportResult`.

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/api/client.test.ts`:
```ts
import { vi } from 'vitest';
import { api, ApiError, setProfileRequiredHandler } from './client';

function reply(status: number, body?: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })));
}

test('lỗi ProblemDetail thành ApiError có code, detail và errors', async () => {
  reply(400, { status: 400, code: 'CONTENT_INVALID', detail: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] });
  const err = await api.get('/x').catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err).toMatchObject({ status: 400, code: 'CONTENT_INVALID', message: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] });
});

test('204 trả về undefined, 200 trả về JSON', async () => {
  reply(204);
  await expect(api.post('/profiles/1/select', {})).resolves.toBeUndefined();
  reply(200, { app: 'ielts-app' });
  await expect(api.get('/health')).resolves.toEqual({ app: 'ielts-app' });
});

test('mất kết nối thành ApiError NETWORK', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  await expect(api.get('/health')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
});

test('PROFILE_REQUIRED gọi handler chuyển về chọn hồ sơ', async () => {
  const handler = vi.fn();
  setProfileRequiredHandler(handler);
  reply(401, { status: 401, code: 'PROFILE_REQUIRED', detail: 'Chưa chọn hồ sơ' });
  await api.get('/roadmap').catch(() => undefined);
  expect(handler).toHaveBeenCalledOnce();
});

test('gửi JSON có Content-Type, gửi FormData thì để trình duyệt tự đặt', async () => {
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await api.post('/words', { headword: 'x' });
  await api.post('/content/import', new FormData());
  const [, jsonInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  const [, formInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
  expect((jsonInit.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  expect((formInit.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  expect(jsonInit.credentials).toBe('same-origin');
});
```

`frontend/src/components/Toaster.test.tsx`:
```tsx
import { act, render, screen } from '@testing-library/react';
import { Toaster, toast, notifyError } from './Toaster';
import { ApiError } from '../api/client';

test('toast hiện thông báo, lỗi PROFILE_REQUIRED thì không', () => {
  render(<Toaster />);
  act(() => toast('Đã lưu'));
  expect(screen.getByText('Đã lưu')).toBeInTheDocument();
  act(() => notifyError(new ApiError(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ')));
  expect(screen.queryByText('Chưa chọn hồ sơ')).not.toBeInTheDocument();
  act(() => notifyError(new ApiError(409, 'WORD_EXISTS', 'Từ này đã có trong kho')));
  expect(screen.getByText('Từ này đã có trong kho')).toBeInTheDocument();
});
```

Run: `cd frontend && npx vitest run src/api/client.test.ts src/components/Toaster.test.tsx`
Expected: FAIL (chưa có module).

- [ ] **Step 2: Viết client, toast, queryClient**

`frontend/src/api/client.ts`:
```ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}

let profileRequiredHandler: () => void = () => undefined;

export function setProfileRequiredHandler(fn: () => void) {
  profileRequiredHandler = fn;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, credentials: 'same-origin', headers };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }

  if (!res.ok) {
    let problem: { code?: string; detail?: string; errors?: string[] } = {};
    try {
      problem = await res.json();
    } catch {
      // không phải JSON
    }
    const err = new ApiError(res.status, problem.code ?? `HTTP_${res.status}`,
      problem.detail ?? `Lỗi ${res.status}`, problem.errors ?? []);
    if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
    throw err;
  }

  const text = res.status === 204 ? '' : await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
```

`frontend/src/components/Toaster.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';

interface ToastItem { id: number; message: string; kind: 'info' | 'error' }

let items: ToastItem[] = [];
let listeners: ((t: ToastItem[]) => void)[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((l) => l(items));
}

export function toast(message: string, kind: ToastItem['kind'] = 'info') {
  const item = { id: nextId++, message, kind };
  items = [...items, item];
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== item.id);
    emit();
  }, 6000);
}

export function notifyError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.code !== 'PROFILE_REQUIRED') toast(e.message, 'error');
  } else {
    toast('Có lỗi không mong muốn', 'error');
  }
}

export function Toaster() {
  const [current, setCurrent] = useState<ToastItem[]>(items);
  useEffect(() => {
    listeners.push(setCurrent);
    return () => {
      listeners = listeners.filter((l) => l !== setCurrent);
    };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2" role="status">
      {current.map((t) => (
        <div key={t.id}
          className={`rounded-lg px-4 py-3 text-sm shadow-lg ${t.kind === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

`frontend/src/api/queryClient.ts`:
```ts
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { notifyError } from '../components/Toaster';

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (!query.meta?.silent) notifyError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (!mutation.meta?.silent) notifyError(error);
      },
    }),
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
```

- [ ] **Step 3: Viết kiểu dữ liệu và endpoint**

`frontend/src/api/types.ts`:
```ts
export type Grade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export type Status = 'LOCKED' | 'ACTIVE' | 'DONE';
export type WordStatus = 'NEW' | 'LEARNING' | 'KNOWN';
export type SessionStep = 'REVIEW' | 'NEW' | 'LESSON' | 'DONE';
export type ExerciseType = 'MCQ' | 'FILL' | 'MINIMAL_PAIR';

export interface Health { app: string; status: string; recoveredFrom: string | null; restoredFrom: string | null }

export interface Profile { id: number; name: string; avatar: string | null; hasPin: boolean; dailyMinutes: number; voice: string | null; speechRate: number }
export interface CreateProfile { name: string; avatar?: string | null; pin?: string | null; dailyMinutes?: number | null; voice?: string | null }
export interface UpdateProfile { name?: string; avatar?: string; pin?: string; removePin?: boolean; dailyMinutes?: number; voice?: string; speechRate?: number }
export interface ProfileImportResult { profile: Profile; skippedRows: number }

export interface Word {
  id: number; headword: string; pos: string; ipaUs: string | null; ipaUk: string | null; meaningVi: string;
  exampleEn: string | null; exampleVi: string | null; cefr: string | null; source: 'OXFORD' | 'AWL' | 'USER';
}
export interface WordBankItem { word: Word; status: WordStatus; dueDate: string | null }
export interface AddWord { headword: string; pos: string; ipaUs?: string; meaningVi: string; exampleEn?: string; exampleVi?: string }
export interface CardState { ease: number; intervalDays: number; repetitions: number; lapses: number; dueDate: string }

export interface SessionView {
  studyDate: string; step: SessionStep; currentCard: Word | null; reviewsLeft: number; newLeft: number;
  lessonCode: string | null; cardsDone: number; finished: boolean;
}

export interface ExerciseView { code: string; type: ExerciseType; prompt: string; options: string[] | null }
export interface ExerciseResult { code: string; given: string | null; correct: boolean; answer: string; explanationVi: string | null }
export interface Lesson { code: string; unitCode: string; type: string; day: string; title: string; bodyMd: string; exercises: ExerciseView[]; bestScore: number | null }
export interface LessonSummary { code: string; type: string; day: string; title: string; sortOrder: number; completed: boolean }
export interface SubmitResult { score: number; results: ExerciseResult[] }
export interface TestDto { code: string; kind: 'UNIT' | 'STAGE'; passRatio: number; exercises: ExerciseView[] }
export interface TestResult { score: number; passed: boolean; results: ExerciseResult[]; weakUnits: string[] }

export interface UnitView { code: string; title: string; status: Status }
export interface StageView { code: string; title: string; targetBand: number; status: Status; testAvailable: boolean; units: UnitView[] }
export interface Roadmap { stages: StageView[] }

export interface CurrentUnit { code: string; title: string; lessonsDone: number; lessonsTotal: number; testReady: boolean }
export interface Summary { streak: number; dueCount: number; currentUnit: CurrentUnit | null; finishedToday: boolean }
export interface DayMinutes { date: string; minutes: number }
export interface WeekCount { weekStart: string; total: number }
export interface TestResultItem { testCode: string; kind: string; score: number; passed: boolean; takenAt: string }
export interface Stats { streak: number; knownWords: number; learningWords: number; heatmap: DayMinutes[]; knownByWeek: WeekCount[]; tests: TestResultItem[] }

export interface BackupInfo { name: string; sizeBytes: number; createdAt: string }
export interface Settings { appHome: string; backupDir: string; logDir: string }
export interface ContentImportResult { file: string; ok: boolean; errors: string[] }
```

`frontend/src/api/endpoints.ts`:
```ts
import { api } from './client';
import type * as T from './types';

const enc = encodeURIComponent;

export const endpoints = {
  health: () => api.get<T.Health>('/health'),
  shutdown: () => api.post<{ message: string }>('/app/shutdown'),

  profiles: () => api.get<T.Profile[]>('/profiles'),
  createProfile: (body: T.CreateProfile) => api.post<T.Profile>('/profiles', body),
  selectProfile: (id: number, pin?: string) => api.post<void>(`/profiles/${id}/select`, { pin: pin ?? null }),
  currentProfile: () => api.get<T.Profile>('/profiles/current'),
  updateProfile: (body: T.UpdateProfile) => api.put<T.Profile>('/profiles/current', body),
  deleteProfile: () => api.del<void>('/profiles/current'),
  importProfile: (data: unknown) => api.post<T.ProfileImportResult>('/profiles/import', data),

  roadmap: () => api.get<T.Roadmap>('/roadmap'),
  unitLessons: (unitCode: string) => api.get<T.LessonSummary[]>(`/units/${enc(unitCode)}/lessons`),
  lesson: (code: string) => api.get<T.Lesson>(`/lessons/${enc(code)}`),
  submitLesson: (code: string, answers: Record<string, string>) =>
    api.post<T.SubmitResult>(`/lessons/${enc(code)}/submit`, { answers }),
  unitTest: (unitCode: string) => api.get<T.TestDto>(`/units/${enc(unitCode)}/test`),
  stageTest: (stageCode: string) => api.get<T.TestDto>(`/stages/${enc(stageCode)}/test`),
  submitTest: (code: string, answers: Record<string, string>) =>
    api.post<T.TestResult>(`/tests/${enc(code)}/submit`, { answers }),

  dueCards: (limit = 200) => api.get<T.Word[]>(`/cards/due?limit=${limit}`),
  reviewCard: (wordId: number, grade: T.Grade) => api.post<T.CardState>(`/cards/${wordId}/review`, { grade }),
  words: (q: string, status: T.WordStatus | '') => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    const qs = params.toString();
    return api.get<T.WordBankItem[]>(`/words${qs ? `?${qs}` : ''}`);
  },
  addWord: (body: T.AddWord) => api.post<T.Word>('/words', body),

  sessionToday: () => api.get<T.SessionView>('/session/today'),
  answerCard: (wordId: number, grade: T.Grade) => api.post<T.SessionView>(`/session/today/cards/${wordId}`, { grade }),

  summary: () => api.get<T.Summary>('/progress/summary'),
  stats: () => api.get<T.Stats>('/progress/stats'),

  backups: () => api.get<T.BackupInfo[]>('/backups'),
  createBackup: () => api.post<T.BackupInfo>('/backups'),
  restoreBackup: (name: string) => api.post<{ message: string }>(`/backups/${enc(name)}/restore`),
  settings: () => api.get<T.Settings>('/settings'),
  updateSettings: (backupDir: string | null) => api.put<T.Settings>('/settings', { backupDir }),
  openLogs: () => api.post<void>('/settings/open-logs'),
  importContent: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post<T.ContentImportResult[]>('/content/import', form);
  },
};

export const downloads = {
  profileExport: '/api/profiles/current/export',
  dbExport: '/api/backups/export',
};
```

- [ ] **Step 4: Nối vào App**

Sửa `frontend/src/App.tsx`: thêm import và đặt handler, gắn `<Toaster />`:
```tsx
import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { setProfileRequiredHandler } from './api/client';
import { Toaster } from './components/Toaster';
```
Trong thân `App()` trước `return`:
```tsx
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    setProfileRequiredHandler(() => {
      queryClient.removeQueries({ predicate: (q) => !['profiles', 'health'].includes(String(q.queryKey[0])) });
      navigate('/profiles', { replace: true });
    });
  }, [navigate, queryClient]);
```
và bọc kết quả: `return (<><Routes>…</Routes><Toaster /></>);`

- [ ] **Step 5: Chạy test**

Run: `cd frontend && npx vitest run src/api src/components src/App.test.tsx && npx tsc --noEmit -p .`
Expected: PASS, không lỗi kiểu.

- [ ] **Step 6: Commit**

```bash
git add frontend
git commit -m "feat(frontend): lớp API, kiểu dữ liệu, toast lỗi, xử lý hết phiên

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Giọng đọc, banner, Layout (thanh điều hướng + kiểm tra hồ sơ)

**Files:**
- Create: `frontend/src/speech/speech.ts`, `frontend/src/components/SpeakButton.tsx`, `frontend/src/components/VoiceBanner.tsx`, `frontend/src/components/HealthBanner.tsx`
- Modify (viết lại): `frontend/src/components/Layout.tsx`
- Test: `frontend/src/speech/speech.test.ts`, `frontend/src/components/Layout.test.tsx`

**Interfaces:**
- Consumes: `endpoints.currentProfile`, `endpoints.health`, `ApiError`.
- Produces: `configureSpeech({voice, rate})`, `speak(text, override?) → boolean`, `englishVoices()`, `useEnglishVoices() → {voices, ready}`, `<SpeakButton text label? />`.
- Produces: `Layout` — query key `['profile','current']` (meta silent); lỗi `PROFILE_REQUIRED` → `<Navigate to="/profiles">`; lỗi khác → màn báo lỗi có nút "Thử lại"; có hồ sơ → nav + `HealthBanner` + `VoiceBanner` + `<Outlet/>`, gọi `configureSpeech` theo hồ sơ.
- Nav (thứ tự, nhãn): `/` Hôm nay, `/roadmap` Lộ trình, `/words` Kho từ, `/ipa` Phát âm, `/stats` Thống kê, `/settings` Cài đặt; link "Đổi hồ sơ" tới `/profiles?manual=1`.

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/speech/speech.test.ts`:
```ts
import { configureSpeech, englishVoices, speak } from './speech';
import { stubSpeech } from '../test/speechStub';

test('đọc bằng giọng và tốc độ trong hồ sơ', () => {
  const spoken = stubSpeech();
  configureSpeech({ voice: 'Microsoft Ryan', rate: 0.8 });
  expect(speak('hello')).toBe(true);
  expect(spoken).toEqual([{ text: 'hello', voice: 'Microsoft Ryan', rate: 0.8 }]);
});

test('giọng không tồn tại thì dùng giọng en-US', () => {
  const spoken = stubSpeech();
  configureSpeech({ voice: 'Không có', rate: 1 });
  speak('book');
  expect(spoken[0].voice).toBe('Microsoft Aria');
});

test('không có giọng tiếng Anh hoặc không có speechSynthesis thì không crash', () => {
  stubSpeech([{ name: 'Microsoft An', lang: 'vi-VN' }]);
  expect(englishVoices()).toHaveLength(0);
  expect(speak('go')).toBe(false);
  vi.stubGlobal('speechSynthesis', undefined);
  expect(speak('go')).toBe(false);
});
```

`frontend/src/components/Layout.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import Layout from './Layout';
import { renderAt } from '../test/render';
import { mockApi, problem } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };

function renderLayout() {
  renderAt(
    <Routes>
      <Route path="/profiles" element={<p>TRANG CHỌN HỒ SƠ</p>} />
      <Route element={<Layout />}>
        <Route index element={<p>NỘI DUNG</p>} />
      </Route>
    </Routes>,
  );
}

test('chưa chọn hồ sơ thì về trang chọn hồ sơ', async () => {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ'), 'GET /health': () => ({ body: health }) });
  renderLayout();
  expect(await screen.findByText('TRANG CHỌN HỒ SƠ')).toBeInTheDocument();
});

test('có hồ sơ thì hiện tên, thanh điều hướng và nội dung', async () => {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }) });
  renderLayout();
  expect(await screen.findByText('NỘI DUNG')).toBeInTheDocument();
  expect(screen.getByText(/Lan/)).toBeInTheDocument();
  for (const label of ['Hôm nay', 'Lộ trình', 'Kho từ', 'Phát âm', 'Thống kê', 'Cài đặt']) {
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
  }
});

test('DB vừa được tự khôi phục thì hiện cảnh báo', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => ({ body: profile }),
    'GET /health': () => ({ body: { ...health, recoveredFrom: 'ielts-20261005-090000-auto.db' } }),
  });
  renderLayout();
  expect(await screen.findByText(/ielts-20261005-090000-auto.db/)).toBeInTheDocument();
});

test('máy không có giọng tiếng Anh thì hiện hướng dẫn cài giọng', async () => {
  stubSpeech([{ name: 'Microsoft An', lang: 'vi-VN' }]);
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }) });
  renderLayout();
  expect(await screen.findByText(/chưa có giọng đọc tiếng Anh/, {}, { timeout: 3000 })).toBeInTheDocument();
});

test('lỗi mạng thì hiện màn lỗi có nút thử lại', async () => {
  stubSpeech();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  renderLayout();
  expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
});
```

Run: `cd frontend && npx vitest run src/speech src/components/Layout.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết speech và các thành phần**

`frontend/src/speech/speech.ts`:
```ts
import { useEffect, useState } from 'react';

export interface SpeechSettings { voice: string | null; rate: number }

let current: SpeechSettings = { voice: null, rate: 1 };

export function configureSpeech(settings: SpeechSettings) {
  current = settings;
}

function synth(): SpeechSynthesis | null {
  const s = (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
  return s ?? null;
}

export function englishVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  return s ? s.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')) : [];
}

function pickVoice(voices: SpeechSynthesisVoice[], name: string | null) {
  return voices.find((v) => v.name === name) ?? voices.find((v) => v.lang === 'en-US') ?? voices[0] ?? null;
}

/** Đọc một đoạn tiếng Anh. Trả false nếu máy không đọc được (không có giọng tiếng Anh). */
export function speak(text: string, override?: Partial<SpeechSettings>): boolean {
  const s = synth();
  if (!s || !text.trim()) return false;
  const settings = { ...current, ...override };
  const voice = pickVoice(englishVoices(), settings.voice);
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = settings.rate;
  s.cancel();
  s.speak(utterance);
  return true;
}

/** Danh sách giọng tiếng Anh; ready = đã chờ đủ để biết máy có giọng hay không. */
export function useEnglishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(englishVoices);
  const [ready, setReady] = useState(() => englishVoices().length > 0);
  useEffect(() => {
    const s = synth();
    if (!s) {
      setReady(true);
      return;
    }
    const update = () => {
      setVoices(englishVoices());
      setReady(true);
    };
    s.addEventListener('voiceschanged', update);
    const timer = setTimeout(update, 1500);
    return () => {
      s.removeEventListener('voiceschanged', update);
      clearTimeout(timer);
    };
  }, []);
  return { voices, ready };
}
```

`frontend/src/components/SpeakButton.tsx`:
```tsx
import { speak } from '../speech/speech';

export function SpeakButton({ text, label = 'Nghe' }: { text: string; label?: string }) {
  return (
    <button type="button" className="btn btn-ghost" aria-label={`${label}: ${text}`} title={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}>
      🔊
    </button>
  );
}
```

`frontend/src/components/VoiceBanner.tsx`:
```tsx
import { useEnglishVoices } from '../speech/speech';

export function VoiceBanner() {
  const { voices, ready } = useEnglishVoices();
  if (!ready || voices.length > 0) return null;
  return (
    <div role="alert" className="mx-auto mt-3 max-w-5xl rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-900">
      Máy chưa có giọng đọc tiếng Anh nên app chưa phát âm được. Mở Windows Settings → Time &amp; language →
      Speech → Manage voices → Add voices, chọn English (United States), rồi mở lại trình duyệt.
    </div>
  );
}
```

`frontend/src/components/HealthBanner.tsx`:
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';

export function HealthBanner() {
  const [hidden, setHidden] = useState(false);
  const { data } = useQuery({ queryKey: ['health'], queryFn: endpoints.health, meta: { silent: true } });
  if (!data || hidden) return null;
  let message: string | null = null;
  if (data.recoveredFrom === 'NONE') {
    message = 'Dữ liệu bị hỏng và không có bản sao lưu dùng được, app đã tạo dữ liệu mới. File hỏng vẫn được giữ trong thư mục dữ liệu.';
  } else if (data.recoveredFrom) {
    message = `Dữ liệu bị hỏng nên app đã tự khôi phục từ bản sao lưu ${data.recoveredFrom}.`;
  } else if (data.restoredFrom) {
    message = `Đã khôi phục dữ liệu từ bản sao lưu ${data.restoredFrom}.`;
  }
  if (!message) return null;
  return (
    <div role="alert" className="mx-auto mt-3 flex max-w-5xl items-start gap-3 rounded-lg bg-sky-100 px-4 py-3 text-sm text-sky-900">
      <span className="flex-1">{message}</span>
      <button type="button" className="btn btn-ghost" onClick={() => setHidden(true)}>Đóng</button>
    </div>
  );
}
```

`frontend/src/components/Layout.tsx`:
```tsx
import { useEffect } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { configureSpeech } from '../speech/speech';
import { HealthBanner } from './HealthBanner';
import { VoiceBanner } from './VoiceBanner';

const NAV = [
  { to: '/', label: 'Hôm nay' },
  { to: '/roadmap', label: 'Lộ trình' },
  { to: '/words', label: 'Kho từ' },
  { to: '/ipa', label: 'Phát âm' },
  { to: '/stats', label: 'Thống kê' },
  { to: '/settings', label: 'Cài đặt' },
];

export default function Layout() {
  const { data: profile, error, isLoading, refetch } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: endpoints.currentProfile,
    meta: { silent: true },
  });

  useEffect(() => {
    if (profile) configureSpeech({ voice: profile.voice, rate: profile.speechRate });
  }, [profile]);

  if (isLoading) return <p className="p-8 text-slate-500">Đang tải…</p>;
  if (error instanceof ApiError && error.code === 'PROFILE_REQUIRED') return <Navigate to="/profiles" replace />;
  if (error || !profile) {
    return (
      <div className="mx-auto mt-16 max-w-md card text-center">
        <p>{error instanceof ApiError ? error.message : 'Không tải được dữ liệu.'}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => refetch()}>Thử lại</button>
      </div>
    );
  }

  return (
    <div data-testid="layout" className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>
              {n.label}
            </NavLink>
          ))}
          <span className="ml-auto text-sm">{profile.avatar} {profile.name}</span>
          <Link to="/profiles?manual=1" className="text-sm text-indigo-600 hover:underline">Đổi hồ sơ</Link>
        </nav>
      </header>
      <HealthBanner />
      <VoiceBanner />
      <main className="mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
```

Sửa `frontend/src/App.test.tsx` test thứ hai để có mock (Layout giờ gọi API):
```tsx
import { mockApi } from './test/mockApi';
import { stubSpeech } from './test/speechStub';

test('route lạ quay về trang chủ', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => ({ body: { id: 1, name: 'Lan', avatar: null, hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 } }),
    'GET /health': () => ({ body: { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null } }),
  });
  renderAt(<App />, '/khong-co');
  expect(await screen.findByTestId('layout')).toBeInTheDocument();
});
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run && npx tsc --noEmit -p .`
Expected: PASS toàn bộ.

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): giọng đọc, banner khôi phục/giọng, khung điều hướng theo hồ sơ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Chọn hồ sơ và tạo hồ sơ

**Files:**
- Modify (viết lại): `frontend/src/pages/ProfileSelectPage.tsx`, `frontend/src/pages/CreateProfilePage.tsx`
- Create: `frontend/src/components/AvatarPicker.tsx`
- Test: `frontend/src/pages/ProfilePages.test.tsx`

**Interfaces:**
- Consumes: `endpoints.profiles/createProfile/selectProfile`, `useEnglishVoices`.
- Produces: `/profiles` — danh sách rỗng → chuyển `/profiles/new`; đúng 1 hồ sơ không PIN và không có `?manual=1` → tự chọn rồi về `/`; hồ sơ có PIN → ô nhập PIN (sai → "Mã PIN không đúng"). Mỗi hồ sơ là nút có tên truy cập chứa tên hồ sơ.
- Produces: `/profiles/new` — ô "Tên" (label), chọn avatar, "Mã PIN (không bắt buộc)", "Số phút mỗi ngày" (mặc định 30), "Giọng đọc"; nút "Tạo hồ sơ" → tạo, chọn, về `/`.
- Produces: `AVATARS` (8 emoji) và `<AvatarPicker value onChange />`.
- Sau khi chọn hồ sơ: xoá cache trừ `profiles`/`health`, điều hướng `/`.

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/pages/ProfilePages.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import ProfileSelectPage from './ProfileSelectPage';
import CreateProfilePage from './CreateProfilePage';
import { renderAt } from '../test/render';
import { mockApi, problem } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';

const lan = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const minh = { id: 2, name: 'Minh', avatar: '🐼', hasPin: true, dailyMinutes: 30, voice: null, speechRate: 1 };

function renderPages(route: string) {
  renderAt(
    <Routes>
      <Route path="/" element={<p>TRANG CHỦ</p>} />
      <Route path="/profiles" element={<ProfileSelectPage />} />
      <Route path="/profiles/new" element={<CreateProfilePage />} />
    </Routes>,
    route,
  );
}

test('chưa có hồ sơ nào thì sang trang tạo hồ sơ', async () => {
  stubSpeech();
  mockApi({ 'GET /profiles': () => ({ body: [] }) });
  renderPages('/profiles');
  expect(await screen.findByLabelText('Tên')).toBeInTheDocument();
});

test('một hồ sơ không PIN thì tự vào luôn', async () => {
  const calls = mockApi({ 'GET /profiles': () => ({ body: [lan] }), 'POST /profiles/1/select': () => ({ status: 204 }) });
  renderPages('/profiles');
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
  expect(calls.some((c) => c.method === 'POST' && c.path === '/profiles/1/select')).toBe(true);
});

test('bấm Đổi hồ sơ (?manual=1) thì không tự vào', async () => {
  mockApi({ 'GET /profiles': () => ({ body: [lan] }) });
  renderPages('/profiles?manual=1');
  expect(await screen.findByRole('button', { name: /Lan/ })).toBeInTheDocument();
  expect(screen.queryByText('TRANG CHỦ')).not.toBeInTheDocument();
});

test('hồ sơ có PIN: sai PIN báo lỗi, đúng PIN thì vào', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /profiles': () => ({ body: [lan, minh] }),
    'POST /profiles/2/select': (body) => ((body as { pin: string }).pin === '1234'
      ? { status: 204 } : problem(403, 'PIN_INVALID', 'Mã PIN không đúng')),
  });
  renderPages('/profiles');
  await user.click(await screen.findByRole('button', { name: /Minh/ }));
  await user.type(screen.getByLabelText('Mã PIN'), '9999');
  await user.click(screen.getByRole('button', { name: 'Vào' }));
  expect(await screen.findByText('Mã PIN không đúng')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Mã PIN'));
  await user.type(screen.getByLabelText('Mã PIN'), '1234');
  await user.click(screen.getByRole('button', { name: 'Vào' }));
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
});

test('tạo hồ sơ gửi đủ thông tin rồi chọn hồ sơ đó', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({
    'POST /profiles': () => ({ status: 201, body: { ...lan, id: 7, name: 'Thành' } }),
    'POST /profiles/7/select': () => ({ status: 204 }),
  });
  renderPages('/profiles/new');
  await user.type(screen.getByLabelText('Tên'), 'Thành');
  await user.click(screen.getByRole('button', { name: 'Chọn avatar 🐯' }));
  await user.type(screen.getByLabelText('Mã PIN (không bắt buộc)'), '4321');
  await user.click(screen.getByRole('button', { name: 'Tạo hồ sơ' }));
  expect(await screen.findByText('TRANG CHỦ')).toBeInTheDocument();
  const created = calls.find((c) => c.method === 'POST' && c.path === '/profiles');
  expect(created?.body).toMatchObject({ name: 'Thành', avatar: '🐯', pin: '4321', dailyMinutes: 30 });
});
```

Run: `cd frontend && npx vitest run src/pages/ProfilePages.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/components/AvatarPicker.tsx`:
```tsx
export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🦁', '🐨', '🐙', '🦄'];

export function AvatarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVATARS.map((a) => (
        <button key={a} type="button" aria-label={`Chọn avatar ${a}`} aria-pressed={value === a}
          className={`h-11 w-11 rounded-full text-2xl ${value === a ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100'}`}
          onClick={() => onChange(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}
```

`frontend/src/pages/ProfileSelectPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { Profile } from '../api/types';

export default function ProfileSelectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const manual = params.get('manual') === '1';
  const [pinFor, setPinFor] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');

  const { data: profiles } = useQuery({ queryKey: ['profiles'], queryFn: endpoints.profiles });
  const select = useMutation({
    mutationFn: ({ id, pin }: { id: number; pin?: string }) => endpoints.selectProfile(id, pin),
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (q) => !['profiles', 'health'].includes(String(q.queryKey[0])) });
      navigate('/', { replace: true });
    },
    meta: { silent: true },
  });

  useEffect(() => {
    if (!profiles) return;
    if (profiles.length === 0) navigate('/profiles/new', { replace: true });
    else if (!manual && profiles.length === 1 && !profiles[0].hasPin) select.mutate({ id: profiles[0].id });
    // chỉ chạy khi danh sách hồ sơ thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, manual]);

  const errorMessage = select.error instanceof ApiError ? select.error.message : null;

  return (
    <div data-testid="page-profiles" className="mx-auto mt-16 max-w-2xl p-4">
      <h1 className="mb-6 text-center text-2xl font-bold">Ai đang học?</h1>
      <div className="flex flex-wrap justify-center gap-4">
        {profiles?.map((p) => (
          <button key={p.id} type="button" className="card flex w-36 flex-col items-center gap-2 hover:ring-2 hover:ring-indigo-400"
            onClick={() => {
              setPin('');
              select.reset();
              if (p.hasPin) setPinFor(p);
              else select.mutate({ id: p.id });
            }}>
            <span className="text-5xl">{p.avatar ?? '🙂'}</span>
            <span className="font-medium">{p.name}{p.hasPin ? ' 🔒' : ''}</span>
          </button>
        ))}
        <Link to="/profiles/new" className="card flex w-36 flex-col items-center justify-center gap-2 text-indigo-600">
          <span className="text-4xl">＋</span>
          <span>Thêm hồ sơ</span>
        </Link>
      </div>

      {pinFor && (
        <form className="card mx-auto mt-6 max-w-xs space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            select.mutate({ id: pinFor.id, pin });
          }}>
          <label className="block text-sm font-medium" htmlFor="pin">Mã PIN</label>
          <input id="pin" className="input" type="password" inputMode="numeric" autoFocus value={pin}
            onChange={(e) => setPin(e.target.value)} />
          {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={select.isPending}>Vào</button>
        </form>
      )}
      {!pinFor && errorMessage && <p className="mt-4 text-center text-rose-600">{errorMessage}</p>}
    </div>
  );
}
```

`frontend/src/pages/CreateProfilePage.tsx`:
```tsx
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
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/pages/ProfilePages.test.tsx && npx tsc --noEmit -p .`
Expected: PASS (5).

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): chọn hồ sơ (PIN, tự vào khi chỉ có một) và tạo hồ sơ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Flashcard và bộ bài tập

**Files:**
- Create: `frontend/src/components/Flashcard.tsx`, `frontend/src/components/ExerciseSet.tsx`
- Test: `frontend/src/components/Flashcard.test.tsx`, `frontend/src/components/ExerciseSet.test.tsx`

**Interfaces:**
- Consumes: `Word`, `Grade`, `ExerciseView`, `ExerciseResult`, `SpeakButton`, `speak`.
- Produces: `<Flashcard word onGrade busy? />` — mặt trước: từ + loa + loại từ + nút "Lật thẻ (Space)"; mặt sau (`data-testid="card-back"`): IPA, nghĩa, ví dụ có loa, 4 nút "1. Quên" "2. Khó" "3. Được" "4. Dễ". `Space` đảo mặt; `1–4` chỉ có tác dụng khi đã lật và không `busy`; bỏ qua phím khi đang gõ trong ô nhập. Cha phải đặt `key` theo thẻ để reset mặt.
- Produces: `<ExerciseSet exercises results? onSubmit submitting? submitLabel? />` — MCQ: radio; FILL: ô nhập có nhãn "Câu n"; MINIMAL_PAIR: ẩn đề, có nút loa "Nghe từ", chọn đáp án. Khi có `results`: khoá ô nhập, hiện "✓ Đúng" hoặc "✗ Sai — đáp án: X" kèm giải thích; ẩn nút nộp.

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/components/Flashcard.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcard } from './Flashcard';
import { stubSpeech } from '../test/speechStub';
import type { Word } from '../api/types';

const word: Word = {
  id: 5, headword: 'hello', pos: 'exclamation', ipaUs: '/həˈloʊ/', ipaUk: '/həˈləʊ/', meaningVi: 'xin chào',
  exampleEn: 'Hello, I am Lan.', exampleVi: 'Xin chào, tôi là Lan.', cefr: 'A1', source: 'OXFORD',
};

test('mặt trước chỉ có từ, lật thẻ mới thấy nghĩa', async () => {
  stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  expect(screen.getByText('hello')).toBeInTheDocument();
  expect(screen.queryByText('xin chào')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Lật thẻ/ }));
  expect(screen.getByTestId('card-back')).toHaveTextContent('xin chào');
  expect(screen.getByTestId('card-back')).toHaveTextContent('/həˈloʊ/');
});

test('Space lật thẻ, phím 3 chấm Được chỉ khi đã lật', () => {
  stubSpeech();
  const onGrade = vi.fn();
  render(<Flashcard word={word} onGrade={onGrade} />);
  fireEvent.keyDown(window, { key: '3' });
  expect(onGrade).not.toHaveBeenCalled();
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  expect(screen.getByTestId('card-back')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: '3' });
  expect(onGrade).toHaveBeenCalledWith('GOOD');
});

test('đang gửi (busy) thì không chấm được', () => {
  stubSpeech();
  const onGrade = vi.fn();
  render(<Flashcard word={word} onGrade={onGrade} busy />);
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '1' });
  expect(onGrade).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: '1. Quên' })).toBeDisabled();
});

test('nút loa đọc từ và câu ví dụ', async () => {
  const spoken = stubSpeech();
  render(<Flashcard word={word} onGrade={() => undefined} />);
  await userEvent.click(screen.getByRole('button', { name: 'Nghe: hello' }));
  await userEvent.click(screen.getByRole('button', { name: /Lật thẻ/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Nghe câu: Hello, I am Lan.' }));
  expect(spoken.map((s) => s.text)).toEqual(['hello', 'Hello, I am Lan.']);
});
```

`frontend/src/components/ExerciseSet.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseSet } from './ExerciseSet';
import { stubSpeech } from '../test/speechStub';
import type { ExerciseView } from '../api/types';

const exercises: ExerciseView[] = [
  { code: 'E1', type: 'MCQ', prompt: 'She ___ to school.', options: ['go', 'goes'] },
  { code: 'E2', type: 'FILL', prompt: 'They ___ (play) football.', options: [] },
  { code: 'E3', type: 'MINIMAL_PAIR', prompt: 'ship', options: ['ship', 'sheep'] },
];

test('gom đáp án ba dạng câu rồi nộp', async () => {
  const user = userEvent.setup();
  const spoken = stubSpeech();
  const onSubmit = vi.fn();
  render(<ExerciseSet exercises={exercises} onSubmit={onSubmit} />);
  expect(screen.queryByText('ship', { selector: 'p' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Nghe từ: ship' }));
  expect(spoken[0].text).toBe('ship');
  await user.click(screen.getByLabelText('goes'));
  await user.type(screen.getByLabelText('Câu 2'), 'play');
  await user.click(screen.getByLabelText('sheep'));
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(onSubmit).toHaveBeenCalledWith({ E1: 'goes', E2: 'play', E3: 'sheep' });
});

test('có kết quả thì hiện đúng/sai, đáp án, giải thích và khoá ô nhập', () => {
  stubSpeech();
  render(
    <ExerciseSet exercises={exercises} onSubmit={() => undefined}
      results={[
        { code: 'E1', given: 'goes', correct: true, answer: 'goes', explanationVi: null },
        { code: 'E2', given: 'plays', correct: false, answer: 'play', explanationVi: 'Chủ ngữ số nhiều.' },
        { code: 'E3', given: null, correct: false, answer: 'ship', explanationVi: null },
      ]} />,
  );
  expect(screen.getByText('✓ Đúng')).toBeInTheDocument();
  expect(screen.getByText('✗ Sai — đáp án: play')).toBeInTheDocument();
  expect(screen.getByText('Chủ ngữ số nhiều.')).toBeInTheDocument();
  expect(screen.getByLabelText('Câu 2')).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeInTheDocument();
});
```

Run: `cd frontend && npx vitest run src/components/Flashcard.test.tsx src/components/ExerciseSet.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/components/Flashcard.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Grade, Word } from '../api/types';
import { SpeakButton } from './SpeakButton';

const GRADES: { grade: Grade; label: string; cls: string }[] = [
  { grade: 'AGAIN', label: 'Quên', cls: 'bg-rose-100 hover:bg-rose-200' },
  { grade: 'HARD', label: 'Khó', cls: 'bg-amber-100 hover:bg-amber-200' },
  { grade: 'GOOD', label: 'Được', cls: 'bg-emerald-100 hover:bg-emerald-200' },
  { grade: 'EASY', label: 'Dễ', cls: 'bg-sky-100 hover:bg-sky-200' },
];

export function Flashcard({ word, onGrade, busy = false }: { word: Word; onGrade: (g: Grade) => void; busy?: boolean }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      const index = ['1', '2', '3', '4'].indexOf(e.key);
      if (index >= 0 && flipped && !busy) onGrade(GRADES[index].grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, busy, onGrade]);

  const ipa = [word.ipaUs && `US ${word.ipaUs}`, word.ipaUk && `UK ${word.ipaUk}`].filter(Boolean).join(' · ');

  return (
    <div className="card mx-auto max-w-xl text-center">
      <div className="flex items-center justify-center gap-2">
        <h2 className="text-4xl font-bold">{word.headword}</h2>
        <SpeakButton text={word.headword} />
      </div>
      <p className="text-sm text-slate-500">{word.pos}</p>
      {!flipped ? (
        <button type="button" className="btn btn-primary mt-6" onClick={() => setFlipped(true)}>Lật thẻ (Space)</button>
      ) : (
        <div className="mt-4 space-y-2" data-testid="card-back">
          {ipa && <p className="font-mono text-slate-600">{ipa}</p>}
          <p className="text-2xl">{word.meaningVi}</p>
          {word.exampleEn && (
            <p className="italic">{word.exampleEn} <SpeakButton text={word.exampleEn} label="Nghe câu" /></p>
          )}
          {word.exampleVi && <p className="text-slate-500">{word.exampleVi}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g, i) => (
              <button key={g.grade} type="button" className={`btn ${g.cls}`} disabled={busy} onClick={() => onGrade(g.grade)}>
                {i + 1}. {g.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

`frontend/src/components/ExerciseSet.tsx`:
```tsx
import { useState } from 'react';
import type { ExerciseResult, ExerciseView } from '../api/types';
import { SpeakButton } from './SpeakButton';

interface Props {
  exercises: ExerciseView[];
  results?: ExerciseResult[];
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function ExerciseSet({ exercises, results, onSubmit, submitting = false, submitLabel = 'Nộp bài' }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const byCode = new Map((results ?? []).map((r) => [r.code, r]));
  const done = results !== undefined;

  return (
    <form className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(answers);
      }}>
      {exercises.map((x, i) => (
        <ExerciseItem key={x.code} index={i + 1} exercise={x} value={answers[x.code] ?? ''} disabled={done}
          result={byCode.get(x.code)} onChange={(v) => setAnswers((a) => ({ ...a, [x.code]: v }))} />
      ))}
      {!done && <button type="submit" className="btn btn-primary" disabled={submitting}>{submitLabel}</button>}
    </form>
  );
}

function ExerciseItem({ index, exercise, value, onChange, result, disabled }: {
  index: number; exercise: ExerciseView; value: string; onChange: (v: string) => void;
  result?: ExerciseResult; disabled: boolean;
}) {
  const name = `ex-${exercise.code}`;
  const border = result ? (result.correct ? 'border-emerald-400' : 'border-rose-400') : '';
  return (
    <fieldset className={`card ${border}`}>
      <legend className="px-1 text-sm text-slate-500">Câu {index}</legend>
      {exercise.type === 'MINIMAL_PAIR' ? (
        <div className="flex items-center gap-2">
          <span>Nghe và chọn từ đúng:</span>
          <SpeakButton text={exercise.prompt} label="Nghe từ" />
        </div>
      ) : (
        <p className="font-medium">{exercise.prompt}</p>
      )}
      {exercise.type === 'FILL' ? (
        <input className="input mt-2" aria-label={`Câu ${index}`} value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className="mt-2 flex flex-wrap gap-4">
          {(exercise.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input type="radio" name={name} value={option} checked={value === option} disabled={disabled}
                onChange={() => onChange(option)} />
              {option}
            </label>
          ))}
        </div>
      )}
      {result && (
        <div className={`mt-2 text-sm ${result.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
          <p>{result.correct ? '✓ Đúng' : `✗ Sai — đáp án: ${result.answer}`}</p>
          {result.explanationVi && <p className="text-slate-600">{result.explanationVi}</p>}
        </div>
      )}
    </fieldset>
  );
}
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/components && npx tsc --noEmit -p .`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): flashcard có phím tắt và bộ bài tập trắc nghiệm/điền từ/cặp âm

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Trang bài học và trang bài kiểm tra

**Files:**
- Create: `frontend/src/components/LessonView.tsx`
- Modify (viết lại): `frontend/src/pages/LessonPage.tsx`, `frontend/src/pages/TestPage.tsx`
- Test: `frontend/src/pages/LessonAndTest.test.tsx`

**Interfaces:**
- Consumes: `endpoints.lesson/submitLesson/unitTest/stageTest/submitTest`, `ExerciseSet`, `react-markdown`.
- Produces: `<LessonView code onDone doneLabel? />` — tiêu đề, nội dung Markdown (`.markdown`), bài tập; sau khi nộp hiện "Điểm: n%" và nút `doneLabel` (mặc định "Xong"); bài không có bài tập thì có nút "Đã học xong bài này" (nộp `{}`). Nộp xong làm mới `summary`, `unitLessons`, `roadmap`.
- Produces: `LessonPage` (`/lessons/:code`) dùng `LessonView` với nút "Về lộ trình".
- Produces: `TestPage kind` — 409 `TEST_NOT_READY` hoặc lỗi khác hiện thông báo + link "Về lộ trình"; đạt: "Đạt n%" + "Unit tiếp theo đã mở." hoặc "Chặng tiếp theo đã mở."; chưa đạt: "Chưa đạt: n% (cần m%)" + danh sách "Nên ôn lại" (`weakUnits`) + nút "Làm lại".

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/pages/LessonAndTest.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import LessonPage from './LessonPage';
import TestPage from './TestPage';
import { renderAt } from '../test/render';
import { mockApi, problem } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';

const lesson = {
  code: 'S0-U01-G1', unitCode: 'S0-U01', type: 'GRAMMAR', day: 'MON', title: 'Thì hiện tại đơn',
  bodyMd: '## Cách dùng\n\nDùng cho **thói quen**.', bestScore: null,
  exercises: [{ code: 'E1', type: 'MCQ', prompt: 'She ___ to school.', options: ['go', 'goes'] }],
};
const unitTest = { code: 'S0-U01-T', kind: 'UNIT', passRatio: 0.6, exercises: lesson.exercises };

function renderRoutes(route: string) {
  renderAt(
    <Routes>
      <Route path="/roadmap" element={<p>LỘ TRÌNH</p>} />
      <Route path="/lessons/:code" element={<LessonPage />} />
      <Route path="/units/:code/test" element={<TestPage kind="UNIT" />} />
      <Route path="/stages/:code/test" element={<TestPage kind="STAGE" />} />
    </Routes>,
    route,
  );
}

test('bài học hiện markdown, nộp bài xong hiện điểm và về lộ trình', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({
    'GET /lessons/S0-U01-G1': () => ({ body: lesson }),
    'POST /lessons/S0-U01-G1/submit': () => ({ body: { score: 1, results: [{ code: 'E1', given: 'goes', correct: true, answer: 'goes', explanationVi: null }] } }),
  });
  renderRoutes('/lessons/S0-U01-G1');
  expect(await screen.findByRole('heading', { name: 'Cách dùng' })).toBeInTheDocument();
  await user.click(screen.getByLabelText('goes'));
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText('Điểm: 100%')).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ answers: { E1: 'goes' } });
  await user.click(screen.getByRole('button', { name: 'Về lộ trình' }));
  expect(await screen.findByText('LỘ TRÌNH')).toBeInTheDocument();
});

test('bài không có bài tập thì có nút đánh dấu đã học', async () => {
  const user = userEvent.setup();
  const calls = mockApi({
    'GET /lessons/S0-U01-R1': () => ({ body: { ...lesson, code: 'S0-U01-R1', exercises: [] } }),
    'POST /lessons/S0-U01-R1/submit': () => ({ body: { score: 1, results: [] } }),
  });
  renderRoutes('/lessons/S0-U01-R1');
  await user.click(await screen.findByRole('button', { name: 'Đã học xong bài này' }));
  expect(await screen.findByRole('button', { name: 'Về lộ trình' })).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ answers: {} });
});

test('chưa học hết bài thì bài kiểm tra unit báo chưa sẵn sàng', async () => {
  mockApi({ 'GET /units/S0-U01/test': () => problem(409, 'TEST_NOT_READY', 'Cần hoàn thành tất cả bài học của unit trước') });
  renderRoutes('/units/S0-U01/test');
  expect(await screen.findByText('Cần hoàn thành tất cả bài học của unit trước')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Về lộ trình' })).toBeInTheDocument();
});

test('qua bài kiểm tra unit thì báo đạt và mở unit tiếp theo', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /units/S0-U01/test': () => ({ body: unitTest }),
    'POST /tests/S0-U01-T/submit': () => ({ body: { score: 1, passed: true, results: [], weakUnits: [] } }),
  });
  renderRoutes('/units/S0-U01/test');
  await user.click(await screen.findByLabelText('goes'));
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText(/Đạt 100%/)).toBeInTheDocument();
  expect(screen.getByText(/Unit tiếp theo đã mở/)).toBeInTheDocument();
});

test('trượt bài chuyển chặng thì hiện unit nên ôn và cho làm lại', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /stages/S0/test': () => ({ body: { ...unitTest, code: 'S0-T', kind: 'STAGE', passRatio: 0.7 } }),
    'POST /tests/S0-T/submit': () => ({ body: { score: 0.5, passed: false, results: [], weakUnits: ['S0-U01'] } }),
  });
  renderRoutes('/stages/S0/test');
  await user.click(await screen.findByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText('Chưa đạt: 50% (cần 70%)')).toBeInTheDocument();
  expect(screen.getByText(/S0-U01/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Làm lại' }));
  expect(screen.getByRole('button', { name: 'Nộp bài' })).toBeInTheDocument();
});
```

Run: `cd frontend && npx vitest run src/pages/LessonAndTest.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/components/LessonView.tsx`:
```tsx
import Markdown from 'react-markdown';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ExerciseSet } from './ExerciseSet';

export function LessonView({ code, onDone, doneLabel = 'Xong' }: { code: string; onDone: () => void; doneLabel?: string }) {
  const queryClient = useQueryClient();
  const { data: lesson, isLoading } = useQuery({ queryKey: ['lesson', code], queryFn: () => endpoints.lesson(code) });
  const submit = useMutation({
    mutationFn: (answers: Record<string, string>) => endpoints.submitLesson(code, answers),
    onSuccess: () => {
      for (const key of ['summary', 'unitLessons', 'roadmap', 'lesson']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  if (isLoading || !lesson) return <p className="text-slate-500">Đang tải bài học…</p>;
  const noExercises = lesson.exercises.length === 0;

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold">{lesson.title}</h1>
      <div className="card markdown"><Markdown>{lesson.bodyMd}</Markdown></div>
      {!noExercises && (
        <>
          <h2 className="text-lg font-semibold">Bài tập</h2>
          <ExerciseSet exercises={lesson.exercises} results={submit.data?.results} submitting={submit.isPending}
            onSubmit={(answers) => submit.mutate(answers)} />
        </>
      )}
      {noExercises && !submit.data && (
        <button type="button" className="btn btn-primary" disabled={submit.isPending} onClick={() => submit.mutate({})}>
          Đã học xong bài này
        </button>
      )}
      {submit.data && (
        <div className="card flex items-center justify-between">
          {!noExercises && <span className="text-lg font-semibold">Điểm: {Math.round(submit.data.score * 100)}%</span>}
          <button type="button" className="btn btn-primary ml-auto" onClick={onDone}>{doneLabel}</button>
        </div>
      )}
    </article>
  );
}
```

`frontend/src/pages/LessonPage.tsx`:
```tsx
import { useNavigate, useParams } from 'react-router';
import { LessonView } from '../components/LessonView';

export default function LessonPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  return <LessonView key={code} code={code!} doneLabel="Về lộ trình" onDone={() => navigate('/roadmap')} />;
}
```

`frontend/src/pages/TestPage.tsx`:
```tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { ExerciseSet } from '../components/ExerciseSet';

export default function TestPage({ kind }: { kind: 'UNIT' | 'STAGE' }) {
  const { code } = useParams();
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const test = useQuery({
    queryKey: ['test', kind, code],
    queryFn: () => (kind === 'UNIT' ? endpoints.unitTest(code!) : endpoints.stageTest(code!)),
    meta: { silent: true },
  });
  const submit = useMutation({
    mutationFn: (answers: Record<string, string>) => endpoints.submitTest(test.data!.code, answers),
    onSuccess: () => {
      for (const key of ['roadmap', 'summary', 'stats']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  if (test.error) {
    return (
      <div className="card space-y-3">
        <p>{test.error instanceof ApiError ? test.error.message : 'Không tải được bài kiểm tra.'}</p>
        <Link to="/roadmap" className="btn btn-primary">Về lộ trình</Link>
      </div>
    );
  }
  if (!test.data) return <p className="text-slate-500">Đang tải bài kiểm tra…</p>;

  const result = submit.data;
  const percent = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{kind === 'UNIT' ? 'Bài kiểm tra cuối unit' : 'Bài kiểm tra chuyển chặng'}</h1>
      <p className="text-sm text-slate-500">Cần đạt {percent(test.data.passRatio)} để qua.</p>
      <ExerciseSet key={attempt} exercises={test.data.exercises} results={result?.results} submitting={submit.isPending}
        onSubmit={(answers) => submit.mutate(answers)} />
      {result && (
        <div className={`card ${result.passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          {result.passed ? (
            <p className="text-lg font-semibold">
              🎉 Đạt {percent(result.score)}. {kind === 'UNIT' ? 'Unit tiếp theo đã mở.' : 'Chặng tiếp theo đã mở.'}
            </p>
          ) : (
            <>
              <p className="text-lg font-semibold">Chưa đạt: {percent(result.score)} (cần {percent(test.data.passRatio)})</p>
              {result.weakUnits.length > 0 && <p>Nên ôn lại: {result.weakUnits.join(', ')}</p>}
              <button type="button" className="btn btn-primary mt-3"
                onClick={() => {
                  submit.reset();
                  setAttempt((a) => a + 1);
                }}>
                Làm lại
              </button>
            </>
          )}
          <Link to="/roadmap" className="ml-3 text-indigo-600 hover:underline">Về lộ trình</Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/pages/LessonAndTest.test.tsx && npx tsc --noEmit -p .`
Expected: PASS (5).

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): trang bài học (markdown + bài tập) và trang bài kiểm tra unit/chặng

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Hôm nay, buổi học 30 phút, ôn thêm

**Files:**
- Modify (viết lại): `frontend/src/pages/TodayPage.tsx`, `frontend/src/pages/SessionPage.tsx`, `frontend/src/pages/ReviewPage.tsx`
- Create: `frontend/src/components/StepBar.tsx`
- Test: `frontend/src/pages/StudyPages.test.tsx`

**Interfaces:**
- Consumes: `endpoints.summary/sessionToday/answerCard/dueCards/reviewCard`, `Flashcard`, `LessonView`.
- Produces: `TodayPage` — "🔥 n ngày liên tiếp", "n thẻ đến hạn", unit hiện tại + tiến độ "a/b bài"; chưa học xong → link "Bắt đầu buổi học" (`/session`); đã xong → "✓ Bạn đã hoàn thành buổi học hôm nay" + link "Ôn thêm" (`/review`); `testReady` → link "Làm bài kiểm tra unit"; không còn unit → "Bạn đã học hết nội dung hiện có".
- Produces: `SessionPage` — `StepBar` (`data-testid="session-step"`, thuộc tính `data-step`), thẻ (key = `${id}-${cardsDone}`), bước LESSON dùng `LessonView` với nút "Hoàn thành buổi học", bước DONE hiện "🎉 Xong buổi học hôm nay!". Lỗi 409 `CARD_MISMATCH`/`NO_SESSION`/`WRONG_STEP` → tự tải lại buổi học, không toast.
- Produces: `ReviewPage` — ôn lần lượt `dueCards`, hết thẻ hiện "Không còn thẻ nào đến hạn. Tuyệt!".

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/pages/StudyPages.test.tsx`:
```tsx
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import TodayPage from './TodayPage';
import SessionPage from './SessionPage';
import ReviewPage from './ReviewPage';
import { renderAt } from '../test/render';
import { mockApi, problem } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';
import type { SessionView, Word } from '../api/types';

const word = (id: number, headword: string): Word => ({
  id, headword, pos: 'noun', ipaUs: null, ipaUk: null, meaningVi: `nghĩa ${headword}`,
  exampleEn: null, exampleVi: null, cefr: 'A1', source: 'OXFORD',
});
const view = (over: Partial<SessionView>): SessionView => ({
  studyDate: '2026-10-07', step: 'NEW', currentCard: word(1, 'hello'), reviewsLeft: 0, newLeft: 2,
  lessonCode: 'S0-U01-G1', cardsDone: 0, finished: false, ...over,
});

function renderRoutes(route: string) {
  renderAt(
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/review" element={<ReviewPage />} />
    </Routes>,
    route,
  );
}

test('trang Hôm nay: chuỗi ngày, thẻ đến hạn, tiến độ unit và nút bắt đầu', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: {
    streak: 3, dueCount: 12, finishedToday: false,
    currentUnit: { code: 'S0-U01', title: 'Chào hỏi', lessonsDone: 1, lessonsTotal: 2, testReady: false },
  } }) });
  renderRoutes('/');
  expect(await screen.findByText('🔥 3 ngày liên tiếp')).toBeInTheDocument();
  expect(screen.getByText('12 thẻ đến hạn')).toBeInTheDocument();
  expect(screen.getByText('1/2 bài')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Bắt đầu buổi học' })).toHaveAttribute('href', '/session');
});

test('đã học xong hôm nay và unit đủ bài thì mời ôn thêm và làm bài kiểm tra', async () => {
  mockApi({ 'GET /progress/summary': () => ({ body: {
    streak: 1, dueCount: 0, finishedToday: true,
    currentUnit: { code: 'S0-U01', title: 'Chào hỏi', lessonsDone: 2, lessonsTotal: 2, testReady: true },
  } }) });
  renderRoutes('/');
  expect(await screen.findByText('✓ Bạn đã hoàn thành buổi học hôm nay')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ôn thêm' })).toHaveAttribute('href', '/review');
  expect(screen.getByRole('link', { name: 'Làm bài kiểm tra unit' })).toHaveAttribute('href', '/units/S0-U01/test');
});

test('buổi học: chấm thẻ gửi đúng từ và chuyển sang thẻ kế', async () => {
  stubSpeech();
  const calls = mockApi({
    'GET /session/today': () => ({ body: view({}) }),
    'POST /session/today/cards/1': () => ({ body: view({ currentCard: word(2, 'book'), newLeft: 1, cardsDone: 1 }) }),
  });
  renderRoutes('/session');
  expect(await screen.findByText('hello')).toBeInTheDocument();
  expect(screen.getByTestId('session-step')).toHaveAttribute('data-step', 'NEW');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '3' });
  expect(await screen.findByText('book')).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ grade: 'GOOD' });
});

test('buổi học: bị 409 CARD_MISMATCH thì tự tải lại buổi học', async () => {
  stubSpeech();
  let gets = 0;
  mockApi({
    'GET /session/today': () => {
      gets += 1;
      return { body: gets === 1 ? view({}) : view({ currentCard: word(2, 'book'), cardsDone: 1 }) };
    },
    'POST /session/today/cards/1': () => problem(409, 'CARD_MISMATCH', 'Thẻ không đúng thứ tự, hãy tải lại trang'),
  });
  renderRoutes('/session');
  await screen.findByText('hello');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '3' });
  expect(await screen.findByText('book')).toBeInTheDocument();
});

test('buổi học: bước bài chính rồi hoàn thành', async () => {
  const user = userEvent.setup();
  stubSpeech();
  let step: SessionView['step'] = 'LESSON';
  mockApi({
    'GET /session/today': () => ({ body: view({ step, currentCard: null, newLeft: 0, cardsDone: 3, finished: step === 'DONE' }) }),
    'GET /lessons/S0-U01-G1': () => ({ body: { code: 'S0-U01-G1', unitCode: 'S0-U01', type: 'GRAMMAR', day: 'MON', title: 'Thì hiện tại đơn', bodyMd: 'Nội dung', bestScore: null, exercises: [] } }),
    'POST /lessons/S0-U01-G1/submit': () => {
      step = 'DONE';
      return { body: { score: 1, results: [] } };
    },
  });
  renderRoutes('/session');
  await user.click(await screen.findByRole('button', { name: 'Đã học xong bài này' }));
  await user.click(await screen.findByRole('button', { name: 'Hoàn thành buổi học' }));
  expect(await screen.findByText('🎉 Xong buổi học hôm nay!')).toBeInTheDocument();
});

test('ôn thêm: chấm hết thẻ đến hạn thì báo hết thẻ', async () => {
  stubSpeech();
  const calls = mockApi({
    'GET /cards/due?limit=200': () => ({ body: [word(1, 'hello')] }),
    'POST /cards/1/review': () => ({ body: { ease: 2.5, intervalDays: 6, repetitions: 2, lapses: 0, dueDate: '2026-10-13' } }),
  });
  renderRoutes('/review');
  await screen.findByText('hello');
  fireEvent.keyDown(window, { key: ' ', code: 'Space' });
  fireEvent.keyDown(window, { key: '4' });
  expect(await screen.findByText('Không còn thẻ nào đến hạn. Tuyệt!')).toBeInTheDocument();
  expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ grade: 'EASY' });
});
```

Run: `cd frontend && npx vitest run src/pages/StudyPages.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/components/StepBar.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { SessionStep } from '../api/types';

const STEPS: { step: SessionStep; label: string }[] = [
  { step: 'REVIEW', label: 'Ôn tập' },
  { step: 'NEW', label: 'Từ mới' },
  { step: 'LESSON', label: 'Bài chính' },
];

function useElapsed() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seconds = Math.floor((now - start) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function StepBar({ step, reviewsLeft, newLeft }: { step: SessionStep; reviewsLeft: number; newLeft: number }) {
  const elapsed = useElapsed();
  const order = ['REVIEW', 'NEW', 'LESSON', 'DONE'].indexOf(step);
  const counts: Partial<Record<SessionStep, number>> = { REVIEW: reviewsLeft, NEW: newLeft };
  return (
    <div data-testid="session-step" data-step={step} className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => (
        <span key={s.step} className={`badge text-sm ${i === order ? 'bg-indigo-600 text-white' : i < order ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
          {i < order ? '✓ ' : ''}{s.label}{counts[s.step] !== undefined && i === order ? ` (${counts[s.step]})` : ''}
        </span>
      ))}
      <span className="ml-auto font-mono text-sm text-slate-500">⏱ {elapsed}</span>
    </div>
  );
}
```

`frontend/src/pages/TodayPage.tsx`:
```tsx
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';

export default function TodayPage() {
  const { data: s } = useQuery({ queryKey: ['summary'], queryFn: endpoints.summary });
  if (!s) return <p className="text-slate-500">Đang tải…</p>;
  const unit = s.currentUnit;
  return (
    <div data-testid="page-today" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card text-2xl font-semibold">🔥 {s.streak} ngày liên tiếp</div>
        <div className="card text-2xl font-semibold">{s.dueCount} thẻ đến hạn</div>
      </div>

      {unit ? (
        <div className="card space-y-2">
          <p className="text-sm text-slate-500">Đang học</p>
          <p className="text-lg font-semibold">{unit.code} · {unit.title}</p>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${unit.lessonsTotal ? (unit.lessonsDone / unit.lessonsTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-sm">{unit.lessonsDone}/{unit.lessonsTotal} bài</p>
          {unit.testReady && <Link to={`/units/${unit.code}/test`} className="btn bg-amber-100 hover:bg-amber-200">Làm bài kiểm tra unit</Link>}
        </div>
      ) : (
        <div className="card">Bạn đã học hết nội dung hiện có. <Link to="/roadmap" className="text-indigo-600">Xem lộ trình</Link></div>
      )}

      {s.finishedToday ? (
        <div className="card space-y-3 bg-emerald-50">
          <p className="text-lg font-semibold">✓ Bạn đã hoàn thành buổi học hôm nay</p>
          <Link to="/review" className="btn btn-primary">Ôn thêm</Link>
        </div>
      ) : (
        <Link to="/session" className="btn btn-primary w-full py-4 text-lg">Bắt đầu buổi học</Link>
      )}
    </div>
  );
}
```

`frontend/src/pages/SessionPage.tsx`:
```tsx
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { notifyError } from '../components/Toaster';
import { Flashcard } from '../components/Flashcard';
import { LessonView } from '../components/LessonView';
import { StepBar } from '../components/StepBar';
import type { Grade } from '../api/types';

const RELOAD_CODES = ['CARD_MISMATCH', 'NO_SESSION', 'WRONG_STEP'];
const SESSION_KEY = ['session', 'today'];

export default function SessionPage() {
  const queryClient = useQueryClient();
  const { data: v } = useQuery({ queryKey: SESSION_KEY, queryFn: endpoints.sessionToday });
  const answer = useMutation({
    mutationFn: ({ wordId, grade }: { wordId: number; grade: Grade }) => endpoints.answerCard(wordId, grade),
    onSuccess: (next) => queryClient.setQueryData(SESSION_KEY, next),
    onError: (e) => {
      if (e instanceof ApiError && RELOAD_CODES.includes(e.code)) queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      else notifyError(e);
    },
    meta: { silent: true },
  });

  if (!v) return <p className="text-slate-500">Đang chuẩn bị buổi học…</p>;
  const card = v.currentCard;

  return (
    <div data-testid="page-session" className="space-y-4">
      <StepBar step={v.step} reviewsLeft={v.reviewsLeft} newLeft={v.newLeft} />
      {(v.step === 'REVIEW' || v.step === 'NEW') && card && (
        <Flashcard key={`${card.id}-${v.cardsDone}`} word={card} busy={answer.isPending}
          onGrade={(grade) => answer.mutate({ wordId: card.id, grade })} />
      )}
      {v.step === 'LESSON' && v.lessonCode && (
        <LessonView key={v.lessonCode} code={v.lessonCode} doneLabel="Hoàn thành buổi học"
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: SESSION_KEY });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
          }} />
      )}
      {v.step === 'DONE' && (
        <div className="card space-y-3 text-center">
          <p className="text-2xl font-semibold">🎉 Xong buổi học hôm nay!</p>
          <p>Bạn đã ôn {v.cardsDone} thẻ.</p>
          <div className="flex justify-center gap-2">
            <Link to="/" className="btn btn-primary">Về trang chủ</Link>
            <Link to="/review" className="btn bg-slate-100">Ôn thêm</Link>
            <Link to="/roadmap" className="btn bg-slate-100">Lộ trình</Link>
          </div>
        </div>
      )}
    </div>
  );
}
```

`frontend/src/pages/ReviewPage.tsx`:
```tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { Flashcard } from '../components/Flashcard';
import type { Grade } from '../api/types';

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const { data: cards } = useQuery({ queryKey: ['dueCards'], queryFn: () => endpoints.dueCards(200), staleTime: Infinity });
  const review = useMutation({
    mutationFn: ({ wordId, grade }: { wordId: number; grade: Grade }) => endpoints.reviewCard(wordId, grade),
    onSuccess: () => {
      setIndex((i) => i + 1);
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });

  if (!cards) return <p className="text-slate-500">Đang tải thẻ…</p>;
  const card = cards[index];
  if (!card) {
    return (
      <div className="card space-y-3 text-center">
        <p className="text-lg">Không còn thẻ nào đến hạn. Tuyệt!</p>
        <Link to="/" className="btn btn-primary">Về trang chủ</Link>
      </div>
    );
  }
  return (
    <div data-testid="page-review" className="space-y-3">
      <p className="text-sm text-slate-500">Ôn thêm: thẻ {index + 1}/{cards.length}</p>
      <Flashcard key={card.id} word={card} busy={review.isPending}
        onGrade={(grade) => review.mutate({ wordId: card.id, grade })} />
    </div>
  );
}
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/pages/StudyPages.test.tsx && npx tsc --noEmit -p .`
Expected: PASS (6).

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): trang Hôm nay, buổi học 3 bước, ôn thêm

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Lộ trình và kho từ

**Files:**
- Modify (viết lại): `frontend/src/pages/RoadmapPage.tsx`, `frontend/src/pages/WordBankPage.tsx`
- Create: `frontend/src/components/labels.ts`
- Test: `frontend/src/pages/RoadmapAndWords.test.tsx`

**Interfaces:**
- Consumes: `endpoints.roadmap/unitLessons/words/addWord`, `SpeakButton`, `toast`.
- Produces: `labels.ts`: `DAY_LABEL` (MON→"Thứ 2" … SAT→"Thứ 7"), `LESSON_TYPE_LABEL` (GRAMMAR→"Ngữ pháp", PRONUNCIATION→"Phát âm", READING→"Đọc", LISTENING→"Nghe"), `STATUS_LABEL` (LOCKED→"Chưa mở", ACTIVE→"Đang học", DONE→"Hoàn thành"), `WORD_STATUS_LABEL` (NEW→"Mới", LEARNING→"Đang học", KNOWN→"Đã thuộc").
- Produces: `RoadmapPage` — mỗi chặng: tên, "Mục tiêu band x", trạng thái; `testAvailable` và chưa DONE → link "Làm bài kiểm tra chuyển chặng". Unit LOCKED: "🔒" không bấm được; unit mở: nút mở rộng (tên truy cập chứa mã unit) → danh sách bài (link `/lessons/:code`, ✓ nếu đã học, thứ + loại bài) + link "Bài kiểm tra unit".
- Produces: `WordBankPage` — ô "Tìm từ", chọn "Trạng thái", bảng từ (loa, loại, nghĩa, trạng thái, ngày ôn), không có → "Không có từ nào"; form "Thêm từ của bạn" (Từ, Loại từ, IPA, Nghĩa tiếng Việt, Câu ví dụ, Nghĩa câu ví dụ) → toast "Đã thêm từ".

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/pages/RoadmapAndWords.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoadmapPage from './RoadmapPage';
import WordBankPage from './WordBankPage';
import { renderAt } from '../test/render';
import { mockApi } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';

const roadmap = { stages: [
  { code: 'S0', title: 'Xây nền', targetBand: 4, status: 'ACTIVE', testAvailable: true, units: [
    { code: 'S0-U01', title: 'Chào hỏi', status: 'DONE' },
    { code: 'S0-U02', title: 'Mạo từ', status: 'LOCKED' },
  ] },
] };

test('lộ trình: unit khoá không mở được, unit đã mở xem được bài và bài kiểm tra', async () => {
  const user = userEvent.setup();
  mockApi({
    'GET /roadmap': () => ({ body: roadmap }),
    'GET /units/S0-U01/lessons': () => ({ body: [
      { code: 'S0-U01-G1', type: 'GRAMMAR', day: 'MON', title: 'Thì hiện tại đơn', sortOrder: 1, completed: true },
    ] }),
  });
  renderAt(<RoadmapPage />, '/roadmap');
  expect(await screen.findByText('Mục tiêu band 4')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Làm bài kiểm tra chuyển chặng' })).toHaveAttribute('href', '/stages/S0/test');
  expect(screen.queryByRole('button', { name: /S0-U02/ })).not.toBeInTheDocument();
  expect(screen.getByText(/🔒/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /S0-U01/ }));
  expect(await screen.findByRole('link', { name: /Thì hiện tại đơn/ })).toHaveAttribute('href', '/lessons/S0-U01-G1');
  expect(screen.getByText(/Thứ 2 · Ngữ pháp/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Bài kiểm tra unit' })).toHaveAttribute('href', '/units/S0-U01/test');
});

test('kho từ: lọc theo trạng thái và thêm từ', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const item = { word: { id: 1, headword: 'book', pos: 'noun', ipaUs: '/bʊk/', ipaUk: null, meaningVi: 'quyển sách', exampleEn: null, exampleVi: null, cefr: 'A1', source: 'OXFORD' }, status: 'LEARNING', dueDate: '2026-10-08' };
  const calls = mockApi({
    'GET /words': () => ({ body: [item] }),
    'GET /words?status=KNOWN': () => ({ body: [] }),
    'POST /words': () => ({ status: 201, body: { ...item.word, id: 9, headword: 'serendipity', source: 'USER' } }),
  });
  renderAt(<WordBankPage />, '/words');
  expect(await screen.findByText('quyển sách')).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Đang học' })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Trạng thái'), 'KNOWN');
  expect(await screen.findByText('Không có từ nào')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Thêm từ của bạn' }));
  await user.type(screen.getByLabelText('Từ'), 'serendipity');
  await user.type(screen.getByLabelText('Loại từ'), 'noun');
  await user.type(screen.getByLabelText('Nghĩa tiếng Việt'), 'sự tình cờ may mắn');
  await user.click(screen.getByRole('button', { name: 'Lưu từ' }));
  await screen.findByRole('button', { name: 'Thêm từ của bạn' });
  expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ headword: 'serendipity', pos: 'noun', meaningVi: 'sự tình cờ may mắn' });
});
```

Run: `cd frontend && npx vitest run src/pages/RoadmapAndWords.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/components/labels.ts`:
```ts
export const DAY_LABEL: Record<string, string> = {
  MON: 'Thứ 2', TUE: 'Thứ 3', WED: 'Thứ 4', THU: 'Thứ 5', FRI: 'Thứ 6', SAT: 'Thứ 7',
};
export const LESSON_TYPE_LABEL: Record<string, string> = {
  GRAMMAR: 'Ngữ pháp', PRONUNCIATION: 'Phát âm', READING: 'Đọc', LISTENING: 'Nghe',
};
export const STATUS_LABEL: Record<string, string> = { LOCKED: 'Chưa mở', ACTIVE: 'Đang học', DONE: 'Hoàn thành' };
export const WORD_STATUS_LABEL: Record<string, string> = { NEW: 'Mới', LEARNING: 'Đang học', KNOWN: 'Đã thuộc' };
```

`frontend/src/pages/RoadmapPage.tsx`:
```tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import type { UnitView } from '../api/types';
import { DAY_LABEL, LESSON_TYPE_LABEL, STATUS_LABEL } from '../components/labels';

const STATUS_CLS: Record<string, string> = {
  LOCKED: 'bg-slate-200 text-slate-600', ACTIVE: 'bg-indigo-100 text-indigo-800', DONE: 'bg-emerald-100 text-emerald-800',
};

export default function RoadmapPage() {
  const { data } = useQuery({ queryKey: ['roadmap'], queryFn: endpoints.roadmap });
  if (!data) return <p className="text-slate-500">Đang tải lộ trình…</p>;
  return (
    <div data-testid="page-roadmap" className="space-y-4">
      <h1 className="text-2xl font-bold">Lộ trình</h1>
      {data.stages.map((stage) => (
        <section key={stage.code} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">{stage.code} · {stage.title}</h2>
            <span className="text-sm text-slate-500">Mục tiêu band {stage.targetBand}</span>
            <span className={`badge ${STATUS_CLS[stage.status]}`}>{STATUS_LABEL[stage.status]}</span>
            {stage.testAvailable && stage.status !== 'DONE' && (
              <Link to={`/stages/${stage.code}/test`} className="btn ml-auto bg-amber-100 hover:bg-amber-200">Làm bài kiểm tra chuyển chặng</Link>
            )}
          </div>
          <ul className="space-y-2">
            {stage.units.map((u) => <UnitRow key={u.code} unit={u} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function UnitRow({ unit }: { unit: UnitView }) {
  const [open, setOpen] = useState(false);
  if (unit.status === 'LOCKED') {
    return <li className="rounded-lg bg-slate-100 px-3 py-2 text-slate-400">🔒 {unit.code} · {unit.title}</li>;
  }
  return (
    <li className="rounded-lg border border-slate-200">
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <span>{unit.status === 'DONE' ? '✅' : '📘'}</span>
        <span className="font-medium">{unit.code} · {unit.title}</span>
        <span className={`badge ml-auto ${STATUS_CLS[unit.status]}`}>{STATUS_LABEL[unit.status]}</span>
      </button>
      {open && <UnitLessons code={unit.code} />}
    </li>
  );
}

function UnitLessons({ code }: { code: string }) {
  const { data } = useQuery({ queryKey: ['unitLessons', code], queryFn: () => endpoints.unitLessons(code) });
  if (!data) return <p className="px-3 pb-2 text-sm text-slate-500">Đang tải…</p>;
  return (
    <div className="space-y-1 px-3 pb-3">
      {data.map((l) => (
        <Link key={l.code} to={`/lessons/${l.code}`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-slate-50">
          <span>{l.completed ? '✓' : '○'}</span>
          <span>{l.title}</span>
          <span className="ml-auto text-xs text-slate-500">{DAY_LABEL[l.day] ?? l.day} · {LESSON_TYPE_LABEL[l.type] ?? l.type}</span>
        </Link>
      ))}
      <Link to={`/units/${code}/test`} className="mt-2 inline-block text-sm text-indigo-600 hover:underline">Bài kiểm tra unit</Link>
    </div>
  );
}
```

`frontend/src/pages/WordBankPage.tsx`:
```tsx
import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import type { AddWord, WordStatus } from '../api/types';
import { SpeakButton } from '../components/SpeakButton';
import { toast } from '../components/Toaster';
import { WORD_STATUS_LABEL } from '../components/labels';

export default function WordBankPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<WordStatus | ''>('');
  const [adding, setAdding] = useState(false);
  const deferredQ = useDeferredValue(q);
  const { data } = useQuery({ queryKey: ['words', deferredQ, status], queryFn: () => endpoints.words(deferredQ, status) });

  return (
    <div data-testid="page-words" className="space-y-4">
      <h1 className="text-2xl font-bold">Kho từ</h1>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" aria-label="Tìm từ" placeholder="Tìm từ hoặc nghĩa…" value={q}
          onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          Trạng thái
          <select className="input w-auto" aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value as WordStatus | '')}>
            <option value="">Tất cả</option>
            <option value="NEW">Mới</option>
            <option value="LEARNING">Đang học</option>
            <option value="KNOWN">Đã thuộc</option>
          </select>
        </label>
        {!adding && <button type="button" className="btn btn-primary ml-auto" onClick={() => setAdding(true)}>Thêm từ của bạn</button>}
      </div>

      {adding && <AddWordForm onClose={() => setAdding(false)} />}

      {data && data.length === 0 && <p className="text-slate-500">Không có từ nào</p>}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr><th className="p-2">Từ</th><th className="p-2">Loại</th><th className="p-2">Nghĩa</th><th className="p-2">Trạng thái</th><th className="p-2">Ôn lại</th></tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.word.id} className="border-t border-slate-100">
                  <td className="p-2 font-medium">{item.word.headword} <SpeakButton text={item.word.headword} /></td>
                  <td className="p-2">{item.word.pos}</td>
                  <td className="p-2">{item.word.meaningVi}</td>
                  <td className="p-2">{WORD_STATUS_LABEL[item.status]}</td>
                  <td className="p-2">{item.dueDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EMPTY: AddWord = { headword: '', pos: '', ipaUs: '', meaningVi: '', exampleEn: '', exampleVi: '' };

function AddWordForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddWord>(EMPTY);
  const add = useMutation({
    mutationFn: () => endpoints.addWord(form),
    onSuccess: () => {
      toast('Đã thêm từ');
      queryClient.invalidateQueries({ queryKey: ['words'] });
      onClose();
    },
  });
  const field = (key: keyof AddWord, label: string, required = false) => (
    <div>
      <label htmlFor={`w-${key}`} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={`w-${key}`} className="input" required={required} value={form[key] ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
    </div>
  );
  return (
    <form className="card grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}>
      {field('headword', 'Từ', true)}
      {field('pos', 'Loại từ', true)}
      {field('ipaUs', 'IPA')}
      {field('meaningVi', 'Nghĩa tiếng Việt', true)}
      {field('exampleEn', 'Câu ví dụ')}
      {field('exampleVi', 'Nghĩa câu ví dụ')}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={add.isPending}>Lưu từ</button>
        <button type="button" className="btn bg-slate-100" onClick={onClose}>Huỷ</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/pages/RoadmapAndWords.test.tsx && npx tsc --noEmit -p .`
Expected: PASS (2).

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): trang lộ trình (unit, bài học, bài kiểm tra) và kho từ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Thống kê và bảng phát âm IPA

**Files:**
- Modify (viết lại): `frontend/src/pages/StatsPage.tsx`, `frontend/src/pages/IpaPage.tsx`
- Create: `frontend/src/components/Heatmap.tsx`, `frontend/src/components/KnownChart.tsx`, `frontend/src/ipa/ipaData.ts`, `frontend/src/dates.ts`
- Test: `frontend/src/pages/StatsAndIpa.test.tsx`

**Interfaces:**
- Consumes: `endpoints.stats`, `speak`.
- Produces: `toIsoDate(d: Date): string` (ngày theo giờ máy, `yyyy-MM-dd`).
- Produces: `StatsPage` — ô `data-testid="stat-streak"`, `stat-known`, `stat-learning` (chỉ chứa số); `<Heatmap days today />` 26 tuần, mỗi ô có `title="yyyy-MM-dd: n phút"`; `<KnownChart points />` (SVG, ít hơn 2 điểm thì hiện chữ); bảng kết quả kiểm tra (mã, loại Unit/Chặng, điểm %, ✓/✗, ngày).
- Produces: `IPA_GROUPS` (3 nhóm: Nguyên âm đơn 12, Nguyên âm đôi 8, Phụ âm 24); `IpaPage` — mỗi âm là nút có tên truy cập `"/x/ ví dụ"`; bấm → `speak(ví dụ)`.

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/pages/StatsAndIpa.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsPage from './StatsPage';
import IpaPage from './IpaPage';
import { renderAt } from '../test/render';
import { mockApi } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';
import { toIsoDate } from '../dates';
import { IPA_GROUPS } from '../ipa/ipaData';

test('thống kê: các ô số, heatmap hôm nay và bảng kết quả', async () => {
  const today = toIsoDate(new Date());
  mockApi({ 'GET /progress/stats': () => ({ body: {
    streak: 4, knownWords: 120, learningWords: 35,
    heatmap: [{ date: today, minutes: 31 }],
    knownByWeek: [{ weekStart: '2026-09-28', total: 100 }, { weekStart: '2026-10-05', total: 120 }],
    tests: [{ testCode: 'S0-U01-T', kind: 'UNIT', score: 0.75, passed: true, takenAt: '2026-10-05T20:00' }],
  } }) });
  renderAt(<StatsPage />, '/stats');
  expect(await screen.findByTestId('stat-streak')).toHaveTextContent('4');
  expect(screen.getByTestId('stat-known')).toHaveTextContent('120');
  expect(screen.getByTestId('stat-learning')).toHaveTextContent('35');
  expect(screen.getByTitle(`${today}: 31 phút`)).toBeInTheDocument();
  expect(screen.getByText('S0-U01-T')).toBeInTheDocument();
  expect(screen.getByText('75%')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Số từ đã thuộc theo tuần' })).toBeInTheDocument();
});

test('bảng IPA đủ 44 âm, bấm âm thì đọc từ ví dụ', async () => {
  const spoken = stubSpeech();
  renderAt(<IpaPage />, '/ipa');
  expect(IPA_GROUPS.flatMap((g) => g.sounds)).toHaveLength(44);
  await userEvent.click(screen.getByRole('button', { name: '/iː/ sheep' }));
  expect(spoken[0].text).toBe('sheep');
});
```

Run: `cd frontend && npx vitest run src/pages/StatsAndIpa.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/dates.ts`:
```ts
export function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
```

`frontend/src/components/Heatmap.tsx`:
```tsx
import type { DayMinutes } from '../api/types';
import { toIsoDate } from '../dates';

const WEEKS = 26;

function color(minutes: number) {
  if (minutes <= 0) return 'bg-slate-100';
  if (minutes < 15) return 'bg-emerald-200';
  if (minutes < 30) return 'bg-emerald-400';
  return 'bg-emerald-600';
}

export function Heatmap({ days, today = new Date() }: { days: DayMinutes[]; today?: Date }) {
  const byDate = new Map(days.map((d) => [d.date, d.minutes]));
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (end.getDay() + 6) % 7;
  const start = new Date(end);
  start.setDate(end.getDate() - mondayOffset - (WEEKS - 1) * 7);

  const columns: { date: string; minutes: number; future: boolean }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const column = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const iso = toIsoDate(day);
      column.push({ date: iso, minutes: byDate.get(iso) ?? 0, future: day > end });
    }
    columns.push(column);
  }

  return (
    <div className="flex gap-1 overflow-x-auto" aria-label="Lịch học 26 tuần">
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-1">
          {col.map((c) => (
            <div key={c.date} title={`${c.date}: ${c.minutes} phút`}
              className={`h-3 w-3 rounded-sm ${c.future ? 'bg-transparent' : color(c.minutes)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

`frontend/src/components/KnownChart.tsx`:
```tsx
import type { WeekCount } from '../api/types';

const W = 600;
const H = 160;
const PAD = 24;

export function KnownChart({ points }: { points: WeekCount[] }) {
  if (points.length < 2) {
    return <p className="text-sm text-slate-500">Cần ít nhất 2 tuần dữ liệu để vẽ biểu đồ.</p>;
  }
  const max = Math.max(...points.map((p) => p.total), 1);
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (points.length - 1);
  const y = (v: number) => H - PAD - (v * (H - 2 * PAD)) / max;
  const line = points.map((p, i) => `${x(i)},${y(p.total)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Số từ đã thuộc theo tuần">
      <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="3" />
      {points.map((p, i) => (
        <g key={p.weekStart}>
          <circle cx={x(i)} cy={y(p.total)} r="4" fill="#4f46e5" />
          <text x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="#64748b">{p.weekStart.slice(5)}</text>
        </g>
      ))}
      <text x={x(points.length - 1)} y={y(points[points.length - 1].total) - 8} fontSize="12" textAnchor="end" fill="#1e293b">
        {points[points.length - 1].total}
      </text>
    </svg>
  );
}
```

`frontend/src/pages/StatsPage.tsx`:
```tsx
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { Heatmap } from '../components/Heatmap';
import { KnownChart } from '../components/KnownChart';

export default function StatsPage() {
  const { data: s } = useQuery({ queryKey: ['stats'], queryFn: endpoints.stats });
  if (!s) return <p className="text-slate-500">Đang tải thống kê…</p>;
  const tile = (testId: string, label: string, value: number) => (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p data-testid={testId} className="text-3xl font-bold">{value}</p>
    </div>
  );
  return (
    <div data-testid="page-stats" className="space-y-4">
      <h1 className="text-2xl font-bold">Thống kê</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {tile('stat-streak', 'Chuỗi ngày học', s.streak)}
        {tile('stat-known', 'Từ đã thuộc', s.knownWords)}
        {tile('stat-learning', 'Từ đang học', s.learningWords)}
      </div>
      <section className="card space-y-2">
        <h2 className="font-semibold">Lịch học</h2>
        <Heatmap days={s.heatmap} />
      </section>
      <section className="card space-y-2">
        <h2 className="font-semibold">Số từ đã thuộc theo tuần</h2>
        <KnownChart points={s.knownByWeek} />
      </section>
      <section className="card space-y-2">
        <h2 className="font-semibold">Kết quả bài kiểm tra</h2>
        {s.tests.length === 0 ? <p className="text-sm text-slate-500">Chưa làm bài kiểm tra nào.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="p-1">Bài</th><th className="p-1">Loại</th><th className="p-1">Điểm</th><th className="p-1">Kết quả</th><th className="p-1">Ngày</th></tr>
            </thead>
            <tbody>
              {s.tests.map((t) => (
                <tr key={`${t.testCode}-${t.takenAt}`} className="border-t border-slate-100">
                  <td className="p-1">{t.testCode}</td>
                  <td className="p-1">{t.kind === 'UNIT' ? 'Unit' : 'Chặng'}</td>
                  <td className="p-1">{Math.round(t.score * 100)}%</td>
                  <td className="p-1">{t.passed ? '✓' : '✗'}</td>
                  <td className="p-1">{t.takenAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
```

`frontend/src/ipa/ipaData.ts`:
```ts
export interface IpaSound { symbol: string; example: string }
export interface IpaGroup { title: string; sounds: IpaSound[] }

export const IPA_GROUPS: IpaGroup[] = [
  { title: 'Nguyên âm đơn', sounds: [
    { symbol: 'iː', example: 'sheep' }, { symbol: 'ɪ', example: 'ship' }, { symbol: 'ʊ', example: 'good' },
    { symbol: 'uː', example: 'shoot' }, { symbol: 'e', example: 'bed' }, { symbol: 'ə', example: 'teacher' },
    { symbol: 'ɜː', example: 'bird' }, { symbol: 'ɔː', example: 'door' }, { symbol: 'æ', example: 'cat' },
    { symbol: 'ʌ', example: 'up' }, { symbol: 'ɑː', example: 'far' }, { symbol: 'ɒ', example: 'on' },
  ] },
  { title: 'Nguyên âm đôi', sounds: [
    { symbol: 'ɪə', example: 'here' }, { symbol: 'eɪ', example: 'wait' }, { symbol: 'ʊə', example: 'tour' },
    { symbol: 'ɔɪ', example: 'boy' }, { symbol: 'əʊ', example: 'show' }, { symbol: 'eə', example: 'hair' },
    { symbol: 'aɪ', example: 'my' }, { symbol: 'aʊ', example: 'cow' },
  ] },
  { title: 'Phụ âm', sounds: [
    { symbol: 'p', example: 'pea' }, { symbol: 'b', example: 'boat' }, { symbol: 't', example: 'tea' },
    { symbol: 'd', example: 'dog' }, { symbol: 'tʃ', example: 'cheese' }, { symbol: 'dʒ', example: 'June' },
    { symbol: 'k', example: 'car' }, { symbol: 'ɡ', example: 'go' }, { symbol: 'f', example: 'fly' },
    { symbol: 'v', example: 'video' }, { symbol: 'θ', example: 'think' }, { symbol: 'ð', example: 'this' },
    { symbol: 's', example: 'see' }, { symbol: 'z', example: 'zoo' }, { symbol: 'ʃ', example: 'shall' },
    { symbol: 'ʒ', example: 'television' }, { symbol: 'm', example: 'man' }, { symbol: 'n', example: 'now' },
    { symbol: 'ŋ', example: 'sing' }, { symbol: 'h', example: 'hat' }, { symbol: 'l', example: 'love' },
    { symbol: 'r', example: 'red' }, { symbol: 'w', example: 'wet' }, { symbol: 'j', example: 'yes' },
  ] },
];
```

`frontend/src/pages/IpaPage.tsx`:
```tsx
import { IPA_GROUPS } from '../ipa/ipaData';
import { speak } from '../speech/speech';

export default function IpaPage() {
  return (
    <div data-testid="page-ipa" className="space-y-4">
      <h1 className="text-2xl font-bold">Bảng phát âm IPA</h1>
      <p className="text-sm text-slate-500">Bấm vào một âm để nghe từ ví dụ. Bài tập cặp âm dễ nhầm nằm trong các bài Phát âm của lộ trình.</p>
      {IPA_GROUPS.map((group) => (
        <section key={group.title} className="card space-y-2">
          <h2 className="font-semibold">{group.title}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {group.sounds.map((s) => (
              <button key={s.symbol} type="button" aria-label={`/${s.symbol}/ ${s.example}`}
                className="rounded-lg border border-slate-200 p-2 text-center hover:bg-indigo-50"
                onClick={() => speak(s.example)}>
                <span className="block font-mono text-xl">/{s.symbol}/</span>
                <span className="text-sm text-slate-600">{s.example}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/pages/StatsAndIpa.test.tsx && npx tsc --noEmit -p .`
Expected: PASS (2).

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): thống kê (heatmap, biểu đồ từ đã thuộc, kết quả kiểm tra) và bảng IPA

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Cài đặt (hồ sơ, xuất/nhập, nội dung, sao lưu, tắt app)

**Files:**
- Modify (viết lại): `frontend/src/pages/SettingsPage.tsx`
- Create: `frontend/src/pages/settings/ProfileSettings.tsx`, `TransferSettings.tsx`, `ContentSettings.tsx`, `BackupSettings.tsx`, `frontend/src/components/ShutdownButton.tsx`
- Test: `frontend/src/pages/SettingsPage.test.tsx`

**Interfaces:**
- Consumes: `endpoints.currentProfile/updateProfile/deleteProfile/importProfile/importContent/backups/createBackup/restoreBackup/settings/updateSettings/openLogs/shutdown`, `downloads`, `configureSpeech`, `speak`, `useEnglishVoices`, `AvatarPicker`, `toast`.
- Produces: `ProfileSettings` — ô "Tên hồ sơ", avatar, "Số phút mỗi ngày", "Giọng đọc", "Tốc độ đọc" (0.5–2), nút "Nghe thử", "Mã PIN mới", ô tick "Bỏ mã PIN" (khi có PIN), nút "Lưu hồ sơ"; "Xoá hồ sơ" → `window.confirm` → DELETE → xoá cache → `/profiles`.
- Produces: `TransferSettings` — link tải "Xuất hồ sơ (JSON)"; ô file "Nhập hồ sơ từ file" → đọc JSON → POST → toast `Đã nhập hồ sơ "X"` (+ số dòng bỏ qua); file không phải JSON → toast lỗi.
- Produces: `ContentSettings` — ô file "Chọn file nội dung (.json)" (nhiều file) → bảng kết quả từng file (✓ / ✗ + lỗi).
- Produces: `BackupSettings` — danh sách bản sao lưu, nút "Sao lưu ngay", mỗi dòng nút "Khôi phục" (confirm) → hiện thông điệp backend + `ShutdownButton`; link "Tải toàn bộ dữ liệu (.db)"; ô "Thư mục sao lưu" + "Lưu thư mục"; nút "Mở thư mục log".
- Produces: `<ShutdownButton />` — nút "Tắt app" → `window.confirm` → POST shutdown → thay màn hình bằng "App đã tắt. Bạn có thể đóng tab này." (`data-testid="app-stopped"`).

- [ ] **Step 1: Viết test (sẽ fail)**

`frontend/src/pages/SettingsPage.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import SettingsPage from './SettingsPage';
import { Toaster } from '../components/Toaster';
import { renderAt } from '../test/render';
import { mockApi } from '../test/mockApi';
import { stubSpeech } from '../test/speechStub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: true, dailyMinutes: 30, voice: null, speechRate: 1 };
const base = {
  'GET /profiles/current': () => ({ body: profile }),
  'GET /backups': () => ({ body: [{ name: 'ielts-20261006-090000-auto.db', sizeBytes: 2048, createdAt: '2026-10-06T09:00' }] }),
  'GET /settings': () => ({ body: { appHome: 'C:\\Users\\PC\\.ielts-app', backupDir: 'C:\\Users\\PC\\.ielts-app\\backups', logDir: 'C:\\Users\\PC\\.ielts-app\\logs' } }),
};

function renderSettings() {
  renderAt(
    <>
      <Routes>
        <Route path="/profiles" element={<p>TRANG CHỌN HỒ SƠ</p>} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <Toaster />
    </>,
    '/settings',
  );
}

test('lưu hồ sơ gửi các trường đã sửa và bỏ PIN', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({ ...base, 'PUT /profiles/current': (body) => ({ body: { ...profile, ...(body as object), hasPin: false } }) });
  renderSettings();
  const name = await screen.findByLabelText('Tên hồ sơ');
  await user.clear(name);
  await user.type(name, 'Lan Anh');
  await user.click(screen.getByLabelText('Bỏ mã PIN'));
  await user.click(screen.getByRole('button', { name: 'Lưu hồ sơ' }));
  await screen.findByText('Đã lưu hồ sơ');
  expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ name: 'Lan Anh', removePin: true, dailyMinutes: 30, speechRate: 1 });
});

test('xoá hồ sơ sau khi xác nhận thì về trang chọn hồ sơ', async () => {
  const user = userEvent.setup();
  stubSpeech();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  const calls = mockApi({ ...base, 'DELETE /profiles/current': () => ({ status: 204 }) });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Xoá hồ sơ' }));
  expect(await screen.findByText('TRANG CHỌN HỒ SƠ')).toBeInTheDocument();
  expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
});

test('nhập file nội dung hiện kết quả từng file', async () => {
  const user = userEvent.setup();
  stubSpeech();
  mockApi({ ...base, 'POST /content/import': () => ({ body: [
    { file: 'unit-02.json', ok: true, errors: [] },
    { file: 'unit-03.json', ok: false, errors: ['lessons[0].day: phải là MON..SAT'] },
  ] }) });
  renderSettings();
  const input = await screen.findByLabelText('Chọn file nội dung (.json)');
  await user.upload(input, [
    new File(['{}'], 'unit-02.json', { type: 'application/json' }),
    new File(['{}'], 'unit-03.json', { type: 'application/json' }),
  ]);
  expect(await screen.findByText('lessons[0].day: phải là MON..SAT')).toBeInTheDocument();
  expect(screen.getByText(/✓ unit-02.json/)).toBeInTheDocument();
});

test('nhập hồ sơ từ file JSON', async () => {
  const user = userEvent.setup();
  stubSpeech();
  const calls = mockApi({ ...base, 'POST /profiles/import': () => ({ status: 201, body: { profile: { ...profile, id: 2, name: 'Minh' }, skippedRows: 2 } }) });
  renderSettings();
  const input = await screen.findByLabelText('Nhập hồ sơ từ file');
  await user.upload(input, new File(['{"version":1,"profile":{"name":"Minh"}}'], 'ho-so.json', { type: 'application/json' }));
  expect(await screen.findByText(/Đã nhập hồ sơ "Minh"/)).toBeInTheDocument();
  expect(calls.find((c) => c.path === '/profiles/import')?.body).toEqual({ version: 1, profile: { name: 'Minh' } });
});

test('khôi phục bản sao lưu rồi tắt app', async () => {
  const user = userEvent.setup();
  stubSpeech();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  mockApi({
    ...base,
    'POST /backups/ielts-20261006-090000-auto.db/restore': () => ({ body: { message: 'Đã lên lịch khôi phục. Hãy tắt app (nút Tắt app) rồi mở lại để hoàn tất.' } }),
    'POST /app/shutdown': () => ({ status: 202, body: { message: 'Đang tắt app...' } }),
  });
  renderSettings();
  await user.click(await screen.findByRole('button', { name: 'Khôi phục ielts-20261006-090000-auto.db' }));
  expect(await screen.findByText(/Đã lên lịch khôi phục/)).toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: 'Tắt app' })[0]);
  expect(await screen.findByTestId('app-stopped')).toHaveTextContent('App đã tắt');
});
```

Run: `cd frontend && npx vitest run src/pages/SettingsPage.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết code**

`frontend/src/components/ShutdownButton.tsx`:
```tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';

export function ShutdownButton() {
  const [stopped, setStopped] = useState(false);
  const shutdown = useMutation({ mutationFn: endpoints.shutdown, onSuccess: () => setStopped(true) });
  return (
    <>
      <button type="button" className="btn btn-danger" disabled={shutdown.isPending}
        onClick={() => {
          if (window.confirm('Tắt app? Trang này sẽ ngừng hoạt động cho tới khi bạn mở lại app.')) shutdown.mutate();
        }}>
        Tắt app
      </button>
      {stopped && createPortal(
        <div data-testid="app-stopped" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 text-center text-xl text-white">
          App đã tắt. Bạn có thể đóng tab này.
        </div>,
        document.body,
      )}
    </>
  );
}
```

`frontend/src/pages/settings/ProfileSettings.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';
import type { Profile } from '../../api/types';
import { AvatarPicker } from '../../components/AvatarPicker';
import { toast } from '../../components/Toaster';
import { configureSpeech, speak, useEnglishVoices } from '../../speech/speech';

export function ProfileSettings() {
  const { data: profile } = useQuery({ queryKey: ['profile', 'current'], queryFn: endpoints.currentProfile });
  if (!profile) return null;
  return <ProfileForm key={profile.id} profile={profile} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { voices } = useEnglishVoices();
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar ?? '');
  const [dailyMinutes, setDailyMinutes] = useState(profile.dailyMinutes);
  const [voice, setVoice] = useState(profile.voice ?? '');
  const [speechRate, setSpeechRate] = useState(profile.speechRate);
  const [pin, setPin] = useState('');
  const [removePin, setRemovePin] = useState(false);

  const save = useMutation({
    mutationFn: () => endpoints.updateProfile({
      name: name.trim(), avatar: avatar || undefined, dailyMinutes, voice: voice || undefined, speechRate,
      pin: !removePin && pin ? pin : undefined, removePin: removePin || undefined,
    }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile', 'current'], updated);
      configureSpeech({ voice: updated.voice, rate: updated.speechRate });
      setPin('');
      setRemovePin(false);
      toast('Đã lưu hồ sơ');
    },
  });
  const remove = useMutation({
    mutationFn: endpoints.deleteProfile,
    onSuccess: () => {
      queryClient.clear();
      navigate('/profiles', { replace: true });
    },
  });

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Hồ sơ</h2>
      <form className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) save.mutate();
        }}>
        <div>
          <label htmlFor="p-name" className="mb-1 block text-sm font-medium">Tên hồ sơ</label>
          <input id="p-name" className="input" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="p-minutes" className="mb-1 block text-sm font-medium">Số phút mỗi ngày</label>
          <input id="p-minutes" className="input" type="number" min={10} max={240} value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>
        <div>
          <label htmlFor="p-voice" className="mb-1 block text-sm font-medium">Giọng đọc</label>
          <select id="p-voice" className="input" value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">Tự chọn (Anh-Mỹ)</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="p-rate" className="mb-1 block text-sm font-medium">Tốc độ đọc ({speechRate.toFixed(1)}×)</label>
          <div className="flex items-center gap-2">
            <input id="p-rate" type="range" min={0.5} max={2} step={0.1} value={speechRate} className="flex-1"
              onChange={(e) => setSpeechRate(Number(e.target.value))} />
            <button type="button" className="btn bg-slate-100"
              onClick={() => speak('Hello, welcome to your English lesson.', { voice: voice || null, rate: speechRate })}>
              Nghe thử
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="p-pin" className="mb-1 block text-sm font-medium">Mã PIN mới</label>
          <input id="p-pin" className="input" type="password" inputMode="numeric" pattern="\d{4,6}" title="4–6 chữ số"
            disabled={removePin} value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
        {profile.hasPin && (
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" checked={removePin} onChange={(e) => setRemovePin(e.target.checked)} />
            Bỏ mã PIN
          </label>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={save.isPending}>Lưu hồ sơ</button>
          <button type="button" className="btn btn-danger ml-auto" disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Xoá hồ sơ "${profile.name}" và toàn bộ tiến độ? Không thể hoàn tác.`)) remove.mutate();
            }}>
            Xoá hồ sơ
          </button>
        </div>
      </form>
    </section>
  );
}
```

`frontend/src/pages/settings/TransferSettings.tsx`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloads, endpoints } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { notifyError, toast } from '../../components/Toaster';

export function TransferSettings() {
  const queryClient = useQueryClient();
  const importProfile = useMutation({
    mutationFn: async (file: File) => {
      let data: unknown;
      try {
        data = JSON.parse(await file.text());
      } catch {
        throw new Error('File không phải JSON hợp lệ');
      }
      return endpoints.importProfile(data);
    },
    onSuccess: (r) => {
      toast(`Đã nhập hồ sơ "${r.profile.name}"${r.skippedRows ? ` (bỏ qua ${r.skippedRows} dòng không khớp nội dung)` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (e) => {
      if (e instanceof ApiError) notifyError(e);
      else toast(e instanceof Error ? e.message : 'Nhập hồ sơ thất bại', 'error');
    },
    meta: { silent: true },
  });
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Xuất / nhập hồ sơ</h2>
      <p className="text-sm text-slate-500">Dùng để chuyển một hồ sơ sang máy khác. File có chứa mã PIN đã mã hoá, hãy giữ kín.</p>
      <div className="flex flex-wrap items-center gap-3">
        <a className="btn bg-slate-100" href={downloads.profileExport} download>Xuất hồ sơ (JSON)</a>
        <label className="btn bg-slate-100 cursor-pointer">
          Nhập hồ sơ từ file
          <input type="file" accept=".json,application/json" className="sr-only" aria-label="Nhập hồ sơ từ file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importProfile.mutate(file);
              e.target.value = '';
            }} />
        </label>
      </div>
    </section>
  );
}
```

`frontend/src/pages/settings/ContentSettings.tsx`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/endpoints';

export function ContentSettings() {
  const queryClient = useQueryClient();
  const importContent = useMutation({
    mutationFn: (files: File[]) => endpoints.importContent(files),
    onSuccess: () => queryClient.invalidateQueries(),
  });
  return (
    <section className="card space-y-3">
      <h2 className="text-lg font-semibold">Nội dung học</h2>
      <p className="text-sm text-slate-500">Nhập thêm file nội dung (.json) theo mẫu trong thư mục content/.</p>
      <input type="file" multiple accept=".json,application/json" aria-label="Chọn file nội dung (.json)"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) importContent.mutate(files);
          e.target.value = '';
        }} />
      {importContent.data && (
        <ul className="space-y-2 text-sm">
          {importContent.data.map((r) => (
            <li key={r.file} className={r.ok ? 'text-emerald-700' : 'text-rose-700'}>
              {r.ok ? '✓' : '✗'} {r.file}
              {r.errors.length > 0 && (
                <ul className="ml-6 list-disc text-slate-700">{r.errors.map((err) => <li key={err}>{err}</li>)}</ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

`frontend/src/pages/settings/BackupSettings.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downloads, endpoints } from '../../api/endpoints';
import { toast } from '../../components/Toaster';
import { ShutdownButton } from '../../components/ShutdownButton';

export function BackupSettings() {
  const queryClient = useQueryClient();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const { data: backups } = useQuery({ queryKey: ['backups'], queryFn: endpoints.backups });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: endpoints.settings });
  const [dir, setDir] = useState('');
  useEffect(() => {
    if (settings) setDir(settings.backupDir);
  }, [settings]);

  const create = useMutation({
    mutationFn: endpoints.createBackup,
    onSuccess: (b) => {
      toast(`Đã sao lưu: ${b.name}`);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
  const restore = useMutation({ mutationFn: endpoints.restoreBackup, onSuccess: (r) => setRestoreMessage(r.message) });
  const saveDir = useMutation({
    mutationFn: () => endpoints.updateSettings(dir.trim() || null),
    onSuccess: (s) => {
      queryClient.setQueryData(['settings'], s);
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast('Đã lưu thư mục sao lưu');
    },
  });
  const openLogs = useMutation({ mutationFn: endpoints.openLogs });

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Sao lưu & khôi phục</h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>Sao lưu ngay</button>
        <a className="btn bg-slate-100" href={downloads.dbExport} download>Tải toàn bộ dữ liệu (.db)</a>
        <button type="button" className="btn bg-slate-100" onClick={() => openLogs.mutate()}>Mở thư mục log</button>
      </div>

      {restoreMessage && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-100 p-3 text-sm">
          <span className="flex-1">{restoreMessage}</span>
          <ShutdownButton />
        </div>
      )}

      <ul className="divide-y divide-slate-100 text-sm">
        {backups?.length === 0 && <li className="py-2 text-slate-500">Chưa có bản sao lưu nào.</li>}
        {backups?.map((b) => (
          <li key={b.name} className="flex items-center gap-3 py-2">
            <span className="font-mono">{b.name}</span>
            <span className="text-slate-500">{Math.ceil(b.sizeBytes / 1024)} KB</span>
            <button type="button" className="btn ml-auto bg-slate-100" aria-label={`Khôi phục ${b.name}`}
              onClick={() => {
                if (window.confirm(`Khôi phục dữ liệu về bản ${b.name}? Dữ liệu hiện tại sẽ được thay thế khi mở lại app.`)) restore.mutate(b.name);
              }}>
              Khôi phục
            </button>
          </li>
        ))}
      </ul>

      <form className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          saveDir.mutate();
        }}>
        <label htmlFor="backup-dir" className="block text-sm font-medium">Thư mục sao lưu</label>
        <p className="text-xs text-slate-500">Có thể chọn thư mục OneDrive/Google Drive để có bản sao ngoài máy. Để trống để dùng mặc định.</p>
        <div className="flex gap-2">
          <input id="backup-dir" className="input" value={dir} onChange={(e) => setDir(e.target.value)} />
          <button type="submit" className="btn bg-slate-100" disabled={saveDir.isPending}>Lưu thư mục</button>
        </div>
      </form>
    </section>
  );
}
```

`frontend/src/pages/SettingsPage.tsx`:
```tsx
import { ProfileSettings } from './settings/ProfileSettings';
import { TransferSettings } from './settings/TransferSettings';
import { ContentSettings } from './settings/ContentSettings';
import { BackupSettings } from './settings/BackupSettings';
import { ShutdownButton } from '../components/ShutdownButton';

export default function SettingsPage() {
  return (
    <div data-testid="page-settings" className="space-y-4">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <ProfileSettings />
      <TransferSettings />
      <ContentSettings />
      <BackupSettings />
      <section className="card flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Tắt app</h2>
          <p className="text-sm text-slate-500">Đóng tab trình duyệt không tắt app. Dùng nút này khi muốn tắt hẳn.</p>
        </div>
        <ShutdownButton />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Chạy test**

Run: `cd frontend && npx vitest run src/pages/SettingsPage.test.tsx && npm test && npx tsc --noEmit -p .`
Expected: PASS toàn bộ bộ Vitest.

- [ ] **Step 4: Commit**

```bash
git add frontend
git commit -m "feat(frontend): trang cài đặt (hồ sơ, xuất/nhập, nội dung, sao lưu, tắt app)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Build frontend trong Maven (profile `app`) và kiểm tra jar phục vụ giao diện

**Files:**
- Modify: `backend/pom.xml` (thêm `<profiles>` với profile `app`)
- Create: `docs/BUILD.md`

**Interfaces:**
- Produces: `cd backend && ./mvnw -Papp package -DskipTests` cài Node v22.12.0 vào `frontend/.node`, chạy `npm ci` + `npm run build`, đóng `frontend/dist` vào `static/` của `target/ielts-app-0.1.0.jar`. Build không có `-Papp` (dùng khi chạy test backend) không đụng tới frontend.

- [ ] **Step 1: Thêm profile Maven**

Trong `backend/pom.xml`, thêm sau `</build>` (trước `</project>`):
```xml
  <profiles>
    <profile>
      <id>app</id>
      <build>
        <plugins>
          <plugin>
            <groupId>com.github.eirslett</groupId>
            <artifactId>frontend-maven-plugin</artifactId>
            <version>1.15.1</version>
            <configuration>
              <workingDirectory>${project.basedir}/../frontend</workingDirectory>
              <installDirectory>${project.basedir}/../frontend/.node</installDirectory>
              <nodeVersion>v22.12.0</nodeVersion>
            </configuration>
            <executions>
              <execution>
                <id>install-node-and-npm</id>
                <phase>generate-resources</phase>
                <goals><goal>install-node-and-npm</goal></goals>
              </execution>
              <execution>
                <id>npm-ci</id>
                <phase>generate-resources</phase>
                <goals><goal>npm</goal></goals>
                <configuration><arguments>ci</arguments></configuration>
              </execution>
              <execution>
                <id>npm-build</id>
                <phase>generate-resources</phase>
                <goals><goal>npm</goal></goals>
                <configuration><arguments>run build</arguments></configuration>
              </execution>
            </executions>
          </plugin>
        </plugins>
      </build>
    </profile>
  </profiles>
```

- [ ] **Step 2: Build và chạy thử jar**

```bash
cd backend && ./mvnw -q -Papp clean package -DskipTests
"$JAVA_HOME/bin/jar" tf target/ielts-app-0.1.0.jar | grep -E "static/(index.html|assets/)" | head -3
SMOKE_HOME="$(mktemp -d)"
"$JAVA_HOME/bin/java" -Dapp.home="$SMOKE_HOME" -jar target/ielts-app-0.1.0.jar --app.open-browser=false &
APP_PID=$!
for i in $(seq 1 40); do curl -s http://127.0.0.1:8765/api/health && break; sleep 1; done
PORT=$(grep -o '[0-9]\+' "$SMOKE_HOME/config.yml")
curl -s "http://127.0.0.1:$PORT/" | grep -c '<div id="root">'
curl -s "http://127.0.0.1:$PORT/roadmap" | grep -c '<div id="root">'
curl -s "http://127.0.0.1:$PORT/api/khong-co"
curl -s -X POST "http://127.0.0.1:$PORT/api/app/shutdown"
sleep 2; kill $APP_PID 2>/dev/null; true
```
Expected:
- `jar tf` liệt kê `BOOT-INF/classes/static/index.html` và `BOOT-INF/classes/static/assets/...`.
- `/` và `/roadmap` đều in `1` (có thẻ root).
- `/api/khong-co` trả JSON có `"code":"NOT_FOUND"`.
- shutdown trả `{"message":"Đang tắt app..."}` và tiến trình tự thoát.

- [ ] **Step 3: Ghi tài liệu build**

`docs/BUILD.md`:
````markdown
# Build và chạy

## Phát triển
- Backend: `cd backend && ./mvnw spring-boot:run` (cổng 8765, dữ liệu ở `%USERPROFILE%\.ielts-app`).
- Frontend: `cd frontend && npm install && npm run dev`, mở http://localhost:5173 (proxy `/api` sang 8765).
- Test: `cd backend && ./mvnw test` · `cd frontend && npm test` · E2E: xem mục dưới.

## Jar có giao diện
`cd backend && ./mvnw -Papp clean package -DskipTests` → `backend/target/ielts-app-0.1.0.jar`
(lần đầu tải Node 22 vào `frontend/.node`).

## Bản portable cho Windows
`bash packaging/build-portable.sh` → `dist/IELTS-App-0.1.0-portable.zip`. Giải nén, chạy `IELTS App.exe`.

## E2E
`cd backend && ./mvnw -Papp package -DskipTests && cd ../frontend && npx playwright test`
(dùng trình duyệt Edge có sẵn, dữ liệu tạm riêng, cổng 8775).
````

- [ ] **Step 4: Commit**

```bash
git add backend/pom.xml docs/BUILD.md
git commit -m "build: profile Maven app build React vào jar; tài liệu build

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Đóng gói bản portable (jlink + jpackage)

**Files:**
- Create: `packaging/build-portable.sh`

**Interfaces:**
- Consumes: profile Maven `app` (Task 12).
- Produces: `dist/IELTS App/IELTS App.exe` (app-image kèm runtime rút gọn) và `dist/IELTS-App-0.1.0-portable.zip`.

- [ ] **Step 1: Viết script**

`packaging/build-portable.sh`:
```bash
#!/usr/bin/env bash
# Tạo bản portable Windows: dist/IELTS-App-0.1.0-portable.zip (cần JAVA_HOME = JDK 21).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${JAVA_HOME:?Cần đặt JAVA_HOME trỏ tới JDK 21}"
VERSION=0.1.0
JAR="ielts-app-${VERSION}.jar"
OUT="$ROOT/dist"
APP_NAME="IELTS App"
MODULES="java.base,java.compiler,java.desktop,java.instrument,java.logging,java.management,java.naming,java.net.http,java.prefs,java.rmi,java.scripting,java.security.jgss,java.sql,java.xml,jdk.crypto.ec,jdk.unsupported,jdk.zipfs"

rm -rf "$OUT"
mkdir -p "$OUT/input"

(cd "$ROOT/backend" && ./mvnw -q -Papp clean package -DskipTests)
cp "$ROOT/backend/target/$JAR" "$OUT/input/"

"$JAVA_HOME/bin/jlink" --add-modules "$MODULES" --strip-debug --no-header-files --no-man-pages \
  --compress zip-6 --output "$OUT/runtime"

"$JAVA_HOME/bin/jpackage" --type app-image --name "$APP_NAME" --app-version "$VERSION" \
  --vendor "IELTS App" --input "$OUT/input" --main-jar "$JAR" \
  --main-class org.springframework.boot.loader.launch.JarLauncher \
  --runtime-image "$OUT/runtime" \
  --java-options "-Xms64m -Xmx256m -XX:+UseSerialGC -Dfile.encoding=UTF-8" \
  --dest "$OUT"

powershell.exe -NoProfile -Command \
  "Compress-Archive -Path '$(cygpath -w "$OUT/$APP_NAME")' -DestinationPath '$(cygpath -w "$OUT/IELTS-App-${VERSION}-portable.zip")' -Force"

rm -rf "$OUT/input" "$OUT/runtime"
echo "Xong: $OUT/IELTS-App-${VERSION}-portable.zip"
```

- [ ] **Step 2: Chạy script và kiểm tra kích thước**

```bash
bash packaging/build-portable.sh
ls -la dist/
du -sh "dist/IELTS App"
```
Expected: có `dist/IELTS App/IELTS App.exe` và `dist/IELTS-App-0.1.0-portable.zip`, thư mục app khoảng 80–130 MB.

- [ ] **Step 3: Chạy thử exe với dữ liệu tạm rồi tắt bằng API**

```bash
SMOKE_HOME="$(mktemp -d)"
JAVA_TOOL_OPTIONS="-Dapp.home=$(cygpath -w "$SMOKE_HOME")" "dist/IELTS App/IELTS App.exe" --app.open-browser=false &
for i in $(seq 1 60); do [ -f "$SMOKE_HOME/config.yml" ] && break; sleep 1; done
PORT=$(grep -o '[0-9]\+' "$SMOKE_HOME/config.yml")
for i in $(seq 1 60); do curl -s "http://127.0.0.1:$PORT/api/health" && break; sleep 1; done
curl -s "http://127.0.0.1:$PORT/" | grep -c '<div id="root">'
curl -s -X POST "http://127.0.0.1:$PORT/api/app/shutdown"
sleep 3
tasklist //FI "IMAGENAME eq IELTS App.exe" | grep -c "IELTS App.exe" || true
ls "$SMOKE_HOME"
```
Expected: health `UP`; `/` in `1`; shutdown trả message; `tasklist` đếm `0` (tiến trình đã thoát); `$SMOKE_HOME` có `ielts.db`, `config.yml`, `logs/`.
Nếu app không khởi động và log (`$SMOKE_HOME/logs/app.log`) báo thiếu lớp thuộc module Java nào, thêm module đó vào `MODULES`, chạy lại Step 2–3 và ghi tên module vào báo cáo.

- [ ] **Step 4: Commit**

```bash
git add packaging/build-portable.sh
git commit -m "build: đóng gói bản portable Windows bằng jlink + jpackage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Test end-to-end (Playwright, chạy jar thật)

**Files:**
- Create: `frontend/playwright.config.ts`, `frontend/e2e/start-app.mjs`, `frontend/e2e/study.spec.ts`

**Interfaces:**
- Consumes: `backend/target/ielts-app-0.1.0.jar` build bằng `-Papp` (Task 12); `data-testid="session-step"` + `data-step` (Task 8); `data-testid="stat-streak"` (Task 10); nhãn "Tên", nút "Tạo hồ sơ" (Task 5).
- Produces: `npx playwright test` chạy app thật trên dữ liệu tạm (cổng 8775), trình duyệt Edge.

- [ ] **Step 1: Viết cấu hình và script khởi động**

`frontend/e2e/start-app.mjs`:
```js
// Khởi động jar thật trên thư mục dữ liệu tạm, cổng 8775, cho Playwright.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'ielts-e2e-'));
writeFileSync(join(home, 'config.yml'), 'port: 8775\n');
const java = join(process.env.JAVA_HOME ?? '', 'bin', 'java');
const jar = resolve('..', 'backend', 'target', 'ielts-app-0.1.0.jar');
const child = spawn(java, [`-Dapp.home=${home}`, '-jar', jar, '--app.open-browser=false'], { stdio: 'inherit' });

const stop = () => {
  if (!child.killed) child.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
child.on('exit', (code) => process.exit(code ?? 0));
```

`frontend/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: 1,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:8775', channel: 'msedge', trace: 'retain-on-failure' },
  webServer: {
    command: 'node e2e/start-app.mjs',
    url: 'http://127.0.0.1:8775/api/health',
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
```

- [ ] **Step 2: Viết kịch bản E2E**

`frontend/e2e/study.spec.ts`:
```ts
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
```

- [ ] **Step 3: Build jar có giao diện và chạy E2E**

```bash
cd backend && ./mvnw -q -Papp package -DskipTests
cd ../frontend && npx playwright test
```
Expected: 3 test PASS. Test được chạy theo thứ tự (workers = 1); test thứ ba dùng hồ sơ "Lan" tạo ở test đầu.
Nếu máy không có Edge, đổi `channel` thành `chrome` (nếu có Chrome) hoặc chạy `npx playwright install chromium` và bỏ `channel`, rồi ghi lại trong báo cáo.

- [ ] **Step 4: Commit**

```bash
git add frontend/playwright.config.ts frontend/e2e
git commit -m "test(e2e): Playwright chạy jar thật – học trọn buổi, F5 đường dẫn con, tách hồ sơ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
