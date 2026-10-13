# Giao diện mới phong cách Apple — Kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm lại toàn bộ giao diện `frontend/` theo spec `docs/superpowers/specs/2026-10-13-frontend-redesign-apple-design.md`: mobile-first, sáng/tối theo hệ thống, axios + `createBrowserRouter` + TanStack Query, file kebab-case.

**Architecture:** Các task nền chạy tuần tự (đổi tên → tách test ra `test/` → axios → tách `src/config`, `src/types` → router + khung app → token + thành phần UI), sau đó ba task làm màn chạy song song trên các nhóm file rời nhau, rồi cập nhật E2E và review. Logic dữ liệu (`endpoints`, `types`, `speech`, `dates`) không đổi; chỉ đổi tầng gọi HTTP, định tuyến và trình bày.

**Tech Stack:** React 19, React Router 8 (`createBrowserRouter`), TanStack Query 5, axios 1.20, Tailwind 4, motion 14, sonner 2, @base-ui/react 1.9, clsx, class-variance-authority, Vitest 5 + Testing Library, Playwright.

**Quy ước chung cho mọi task**
- Làm trong `frontend/` trên nhánh `feat/redesign-apple`. Lệnh chạy từ `frontend/` trừ khi ghi khác.
- Commit message tiếng Việt dạng `type(scope): mô tả`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Không xoá assertion kiểm tra hành vi trong test có sẵn. Được sửa chữ/selector khi giao diện đổi.
- Chữ giao diện tiếng Việt. Không tải tài nguyên từ mạng lúc chạy (font, icon, CSS).
- Task có phần trình bày (Task 4–7): **trước khi viết code, nạp skill `apple-design`, `emil-design-eng`, `mobile-native`** (có trong `.claude/skills/`). Spec quy định *cái gì*; skill quy định *làm cho đẹp và đúng thế nào*. Phần style không được viết sẵn trong kế hoạch này là có chủ ý — người thực hiện quyết định chi tiết thị giác trong khuôn token và API đã chốt.

---

## Bản đồ file sau khi xong

```
frontend/src/
  main.tsx                      tạo queryClient + router, render <App>
  app.tsx                       QueryClientProvider + RouterProvider + Toaster, đăng ký PROFILE_REQUIRED
  router.tsx                    cây route (routes) + createAppRouter()
  config/axios.ts               axios instance `http` + gắn interceptor
  config/interceptors.ts        toApiError, setupInterceptors, setProfileRequiredHandler
  config/query-client.ts        createQueryClient
  api/api-error.ts              class ApiError
  api/client.ts                 api.get/post/put/del
  api/endpoints.ts              giữ nguyên
  types/api.ts                  kiểu dữ liệu API (chuyển từ api/types.ts)
  types/skill.ts                kiểu Skill dùng chung
  styles/tokens.css             biến CSS sáng/tối + @theme inline
  index.css                     import tailwind + tokens, base, lớp tiện ích chung
  ui/                           thành phần dùng chung (kebab-case)
    button.tsx icon-button.tsx card.tsx list-row.tsx progress-bar.tsx progress-ring.tsx
    stat-tile.tsx skill-tile.tsx segmented.tsx sheet.tsx dialog.tsx text-field.tsx
    select.tsx switch.tsx badge.tsx empty-state.tsx skeleton.tsx page-header.tsx
    top-bar.tsx icons.tsx skill.ts cn.ts
  shell/
    require-profile.tsx         tải hồ sơ hiện tại, redirect /profiles, cấu hình giọng đọc
    app-shell.tsx               nav + banner + <Outlet/>
    focus-shell.tsx             không nav, toàn màn
    nav-bar.tsx                 MỘT <nav>: tab bar (<lg) / sidebar (≥lg)
    center-action.tsx           nút tròn giữa
    route-error.tsx             errorElement
  components/                   (đổi tên kebab-case) flashcard, exercise-set, lesson-view, heatmap…
  pages/                        (đổi tên kebab-case) today-page, session-page…
frontend/test/                  ngang hàng src/, cùng cấu trúc thư mục; import code bằng @/…
  support/
    mock-api.ts                 mockApi/problem/mockNetworkDown/resetApiMock (qua adapter axios)
    render.tsx                  renderAt (MemoryRouter) + renderRoute (createMemoryRouter + routes)
    setup.ts, speech-stub.ts
  app.test.tsx router.test.tsx api/ components/ pages/ shell/ ui/ speech/
```

---

### Task 1: Đổi tên file frontend sang kebab-case

**Files:**
- Create (tạm, xoá cuối task): `frontend/scripts/kebab-rename.mjs`
- Rename: 46 file theo bảng dưới
- Modify: mọi file có import tới file bị đổi tên; `frontend/CLAUDE.md`

Bảng đổi tên (thư mục giữ nguyên, chỉ đổi tên file):

```
src/App.test.tsx → src/app.test.tsx              src/App.tsx → src/app.tsx
src/api/queryClient.ts → src/api/query-client.ts src/ipa/ipaData.ts → src/ipa/ipa-data.ts
src/test/mockApi.ts → src/test/mock-api.ts       src/test/speechStub.ts → src/test/speech-stub.ts
src/components/AvatarPicker.tsx → avatar-picker.tsx       ExerciseSet(.test).tsx → exercise-set(.test).tsx
src/components/Flashcard(.test).tsx → flashcard(.test).tsx HealthBanner.tsx → health-banner.tsx
src/components/Heatmap.tsx → heatmap.tsx                  KnownChart.tsx → known-chart.tsx
src/components/Layout(.test).tsx → layout(.test).tsx      LessonView.tsx → lesson-view.tsx
src/components/QueryError.tsx → query-error.tsx           ShutdownButton.tsx → shutdown-button.tsx
src/components/SpeakButton.tsx → speak-button.tsx         StepBar.tsx → step-bar.tsx
src/components/Toaster(.test).tsx → toaster(.test).tsx    VoiceBanner.tsx → voice-banner.tsx
src/pages/CreateProfilePage.tsx → create-profile-page.tsx IpaPage.tsx → ipa-page.tsx
src/pages/LessonAndTest.test.tsx → lesson-and-test.test.tsx LessonPage.tsx → lesson-page.tsx
src/pages/ProfilePages.test.tsx → profile-pages.test.tsx  ProfileSelectPage.tsx → profile-select-page.tsx
src/pages/ReviewPage.tsx → review-page.tsx                RoadmapAndWords.test.tsx → roadmap-and-words.test.tsx
src/pages/RoadmapPage.tsx → roadmap-page.tsx              SessionPage.tsx → session-page.tsx
src/pages/SettingsPage(.test).tsx → settings-page(.test).tsx StatsAndIpa.test.tsx → stats-and-ipa.test.tsx
src/pages/StatsPage.tsx → stats-page.tsx                  StudyPages.test.tsx → study-pages.test.tsx
src/pages/TestPage.tsx → test-page.tsx                    TodayPage.tsx → today-page.tsx
src/pages/WordBankPage.tsx → word-bank-page.tsx
src/pages/settings/{Backup,Content,Profile,Transfer}Settings.tsx → {backup,content,profile,transfer}-settings.tsx
```

- [ ] **Step 1: Kiểm tra mốc xanh trước khi đổi**

Run: `npm test && npm run build`
Expected: mọi test PASS, build thành công. Nếu đỏ, dừng và báo — không đổi tên trên nền đỏ.

- [ ] **Step 2: Viết script đổi tên**

Tạo `frontend/scripts/kebab-rename.mjs`:

```js
// Chạy một lần từ frontend/: node scripts/kebab-rename.mjs
// Đổi tên file trong src/ và e2e/ sang kebab-case bằng git mv, sửa import tương đối trỏ tới chúng.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const files = execFileSync('git', ['ls-files', 'src', 'e2e'], { encoding: 'utf8' }).trim().split('\n');

const renames = new Map(); // đường dẫn tuyệt đối cũ → mới
for (const f of files) {
  const next = join(dirname(f), kebab(basename(f)));
  if (next !== f) renames.set(resolve(f), resolve(next));
}

// 1. Sửa import (thư mục không đổi nên đường dẫn tương đối tính từ vị trí hiện tại vẫn đúng).
const IMPORT = /(from\s+|import\s+|import\s*\(\s*|vi\.mock\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;
for (const f of files) {
  if (!/\.(ts|tsx|mjs)$/.test(f)) continue;
  const abs = resolve(f);
  const src = readFileSync(abs, 'utf8');
  const out = src.replace(IMPORT, (match, pre, quote, spec) => {
    const base = resolve(dirname(abs), spec);
    for (const ext of ['', '.ts', '.tsx']) {
      const target = renames.get(base + ext);
      if (!target) continue;
      let next = relative(dirname(abs), target.slice(0, target.length - ext.length)).split(sep).join('/');
      if (!next.startsWith('.')) next = './' + next;
      return pre + quote + next + quote;
    }
    return match;
  });
  if (out !== src) writeFileSync(abs, out);
}

// 2. git mv qua tên trung gian: macOS/Windows không phân biệt hoa thường.
for (const [from, to] of renames) {
  const tmp = to + '.tmp-rename';
  execFileSync('git', ['mv', from, tmp]);
  execFileSync('git', ['mv', tmp, to]);
}
console.log(`Đã đổi tên ${renames.size} file`);
```

- [ ] **Step 3: Chạy script**

Run: `node scripts/kebab-rename.mjs`
Expected: `Đã đổi tên 46 file`

- [ ] **Step 4: Kiểm tra không còn tên viết hoa và không còn import cũ**

Run: `git ls-files src e2e | grep -E '[A-Z]' ; grep -rnE "from '\.{1,2}/[^']*[A-Z][^']*'" src e2e`
Expected: không in ra dòng nào.

- [ ] **Step 5: Xoá script, cập nhật `frontend/CLAUDE.md`**

Run: `rm scripts/kebab-rename.mjs && rmdir scripts`

Trong `frontend/CLAUDE.md` thay các tên file cũ bằng tên mới: `src/api/queryClient.ts` → `src/api/query-client.ts`, `src/test/mockApi.ts` → `src/test/mock-api.ts`, `speechStub.ts` → `speech-stub.ts`, `src/components/Flashcard.test.tsx` → `src/components/flashcard.test.tsx`, `<QueryError>` giữ nguyên (tên component), `App.tsx` → `app.tsx`. Thêm một dòng vào mục Kiến trúc:

```
**Đặt tên**: file và thư mục trong `src/`, `e2e/` dùng kebab-case (`session-page.tsx`, `query-client.ts`); tên component/hàm trong code giữ PascalCase/camelCase.
```

- [ ] **Step 6: Test + build**

Run: `npm test && npm run build`
Expected: PASS như Step 1, cùng số test.

- [ ] **Step 7: Commit**

```bash
git add -A src e2e CLAUDE.md
git commit -m "refactor(frontend): đổi tên file sang kebab-case

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 1b: Tách test ra thư mục `frontend/test/` ngang hàng `src/`

**Mục tiêu:** `src/` chỉ còn code chạy thật. Mọi `*.test.ts(x)` chuyển sang `frontend/test/` theo đúng cấu trúc thư mục của `src/`; helper test (`src/test/*`) chuyển sang `frontend/test/support/`. Test import code bằng alias `@/` (→ `src/`), import helper bằng `@test/` (→ `test/support/`).

**Files:**
- Modify: `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/CLAUDE.md`
- Move: mọi `frontend/src/**/*.test.ts(x)` → `frontend/test/**` (giữ thư mục con); `frontend/src/test/{mock-api,render,setup,speech-stub}.*` → `frontend/test/support/`
- Modify: import trong mọi file đã chuyển

Bảng chuyển (sau Task 1):

```
src/app.test.tsx                       → test/app.test.tsx
src/engines.test.ts                    → test/engines.test.ts
src/api/client.test.ts                 → test/api/client.test.ts
src/components/*.test.tsx              → test/components/*.test.tsx
src/pages/*.test.tsx                   → test/pages/*.test.tsx
src/speech/speech.test.ts              → test/speech/speech.test.ts
src/test/mock-api.ts                   → test/support/mock-api.ts
src/test/render.tsx                    → test/support/render.tsx
src/test/setup.ts                      → test/support/setup.ts
src/test/speech-stub.ts                → test/support/speech-stub.ts
```

- [ ] **Step 1: Mốc xanh**

Run (trong `frontend/`): `npm test 2>&1 | tail -5` — ghi lại số file test và số test.

- [ ] **Step 2: Alias và cấu hình**

`vite.config.ts` — thêm alias và trỏ vitest sang thư mục mới:

```ts
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
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/support/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
```

`tsconfig.json` — thêm vào `compilerOptions`:

```json
"paths": { "@/*": ["./src/*"], "@test/*": ["./test/support/*"] }
```

và đổi `"include"` thành `["src", "test", "e2e", "vite.config.ts", "playwright.config.ts"]`.

- [ ] **Step 3: Chuyển file bằng `git mv`**

```bash
cd frontend
mkdir -p test/support
git mv src/test/mock-api.ts src/test/render.tsx src/test/setup.ts src/test/speech-stub.ts test/support/
for f in $(git ls-files 'src/*.test.ts' 'src/*.test.tsx' 'src/**/*.test.ts' 'src/**/*.test.tsx'); do
  dest="test/${f#src/}"; mkdir -p "$(dirname "$dest")"; git mv "$f" "$dest"
done
rmdir src/test 2>/dev/null || true
```

Kiểm tra: `git ls-files src | grep -E '\.test\.|/test/'` → rỗng.

- [ ] **Step 4: Sửa import**

Trong mọi file dưới `test/`:
- import tới code chạy thật (trước đây `./x`, `../x`, `../../x` trỏ vào `src/`) → `@/<đường dẫn trong src>` (ví dụ `import { Flashcard } from '@/components/flashcard'`, `import App from '@/app'`).
- import tới helper (trước đây `../test/mock-api`, `./test/render`…) → `@test/<tên>` (ví dụ `import { mockApi, problem } from '@test/mock-api'`).
- Trong chính `test/support/*.ts(x)`: import code thật dùng `@/…`, import helper khác dùng `./…`.
- `vi.mock('…')` cũng đổi theo cùng quy tắc.
- `test/engines.test.ts` đọc `package.json` bằng `resolve(__dirname, '../package.json')` — vẫn đúng vì `test/` cùng cấp `src/`; kiểm tra lại.

Kiểm tra không còn import tương đối vượt ra ngoài `test/`: `grep -rnE "from '(\.\./)+(api|components|pages|speech|ipa|app|dates|router|shell|ui)" test` → rỗng.

- [ ] **Step 5: Test + build**

Run: `npm test && npm run build`
Expected: cùng số file test và số test như Step 1, tất cả PASS; `tsc --noEmit` type-check cả `test/`.

- [ ] **Step 6: Cập nhật `frontend/CLAUDE.md`**

Sửa các đường dẫn helper (`src/test/mock-api.ts` → `test/support/mock-api.ts`, `src/test/render.tsx` → `test/support/render.tsx`, `src/test/setup.ts` → `test/support/setup.ts`, `speech-stub.ts`), ví dụ lệnh chạy một file (`npx vitest run test/components/flashcard.test.tsx`), và thêm vào mục Test:

```
- Test nằm ở `test/` ngang hàng `src/`, cùng cấu trúc thư mục (`src/pages/today-page.tsx` ↔ `test/pages/…test.tsx`). Helper ở `test/support/`. Import code bằng `@/…`, helper bằng `@test/…`.
```

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts tsconfig.json CLAUDE.md src test
git commit -m "refactor(frontend): tách test ra thư mục test/ ngang hàng src/

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

> **Quy đổi đường dẫn cho Task 2–9 (đọc trước khi làm):** kế hoạch dưới đây viết trước khi có Task 1b. Áp dụng:
> - Mọi file test `src/<x>.test.ts(x)` trong kế hoạch → `test/<x>.test.ts(x)` (ví dụ `src/router.test.tsx` → `test/router.test.tsx`, `src/shell/nav-bar.test.tsx` → `test/shell/nav-bar.test.tsx`, `src/ui/ui.test.tsx` → `test/ui/ui.test.tsx`, `src/components/layout.test.tsx` → `test/components/layout.test.tsx`, `src/shell/require-profile.test.tsx` → `test/shell/require-profile.test.tsx`).
> - `src/test/mock-api.ts`, `src/test/render.tsx`, `src/test/setup.ts`, `src/test/speech-stub.ts` → `test/support/…`.
> - Trong code mẫu: import code thật từ test/helper → `@/…` (ví dụ `'./client'` trong test client → `'@/api/client'`; `'../api/client'` trong mock-api → `'@/api/client'`; `'../router'` trong render → `'@/router'`); import helper → `'@test/mock-api'`, `'@test/render'`, `'@test/speech-stub'`.
> - Lệnh `npx vitest run src/…test.tsx` → `npx vitest run test/…test.tsx`.

---

### Task 2: Gọi API bằng axios

**Files:**
- Modify: `frontend/package.json` (thêm `axios`)
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/test/mock-api.ts`, `frontend/src/test/setup.ts`
- Modify: `frontend/src/api/client.test.ts`, `frontend/src/components/layout.test.tsx:57-61`

- [ ] **Step 1: Cài axios**

Run: `npm install axios@^1.20.0`
Expected: `package.json` có `"axios": "^1.20.0"` trong `dependencies`.

- [ ] **Step 2: Viết lại helper giả API trong test**

Thay toàn bộ `src/test/mock-api.ts`:

```ts
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { http } from '../api/client';

export interface MockReply { status?: number; body?: unknown }
export type MockHandler = (body: unknown) => MockReply;
export interface MockCall { method: string; path: string; body: unknown }

const realAdapter = http.defaults.adapter;

function install(adapter: AxiosAdapter) {
  http.defaults.adapter = adapter;
}

/** Trả adapter thật cho instance axios (gọi trong afterEach của setup.ts). */
export function resetApiMock() {
  http.defaults.adapter = realAdapter;
}

function respond(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosResponse {
  const response: AxiosResponse = {
    data: body === undefined ? '' : body,
    status,
    statusText: String(status),
    headers: new AxiosHeaders({ 'content-type': 'application/json' }),
    config,
  };
  if (status >= 200 && status < 300) return response;
  throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, null, response);
}

/** Giả backend: khoá "METHOD /path?query" (không có tiền tố /api). Không có handler → 404 ProblemDetail. */
export function mockApi(handlers: Record<string, MockHandler>): MockCall[] {
  const calls: MockCall[] = [];
  install(async (config) => {
    const method = (config.method ?? 'get').toUpperCase();
    const path = config.url ?? '';
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    calls.push({ method, path, body });
    const handler = handlers[`${method} ${path}`];
    if (!handler) {
      return respond(config, 404, { status: 404, code: 'NOT_FOUND', detail: `Không có mock cho ${method} ${path}` });
    }
    const reply = handler(body);
    return respond(config, reply.status ?? 200, reply.body);
  });
  return calls;
}

/** Giả mất kết nối: mọi request lỗi mạng (không có response). */
export function mockNetworkDown() {
  install(async (config) => {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  });
}

export function problem(status: number, code: string, detail: string): MockReply {
  return { status, body: { status, code, detail } };
}
```

Thêm vào `src/test/setup.ts` (giữ phần cũ):

```ts
import { resetApiMock } from './mock-api';

afterEach(() => {
  resetApiMock();
});
```

- [ ] **Step 3: Viết lại test của client (đang đỏ vì client chưa có `http`)**

Thay toàn bộ `src/api/client.test.ts`:

```ts
import { vi } from 'vitest';
import { api, ApiError, setProfileRequiredHandler } from './client';
import { mockApi, mockNetworkDown, problem } from '../test/mock-api';

test('lỗi ProblemDetail thành ApiError có code, detail và errors', async () => {
  mockApi({ 'GET /x': () => ({ status: 400, body: { status: 400, code: 'CONTENT_INVALID', detail: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] } }) });
  const err = await api.get('/x').catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err).toMatchObject({ status: 400, code: 'CONTENT_INVALID', message: 'Nội dung không hợp lệ', errors: ['words[0].meaningVi: bắt buộc'] });
});

test('lỗi không có ProblemDetail thành HTTP_<status>', async () => {
  mockApi({ 'GET /x': () => ({ status: 502, body: undefined }) });
  await expect(api.get('/x')).rejects.toMatchObject({ status: 502, code: 'HTTP_502', message: 'Lỗi 502' });
});

test('204 trả về undefined, 200 trả về JSON', async () => {
  mockApi({
    'POST /profiles/1/select': () => ({ status: 204 }),
    'GET /health': () => ({ body: { app: 'ielts-app' } }),
  });
  await expect(api.post('/profiles/1/select', {})).resolves.toBeUndefined();
  await expect(api.get('/health')).resolves.toEqual({ app: 'ielts-app' });
});

test('mất kết nối thành ApiError NETWORK', async () => {
  mockNetworkDown();
  await expect(api.get('/health')).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
});

test('PROFILE_REQUIRED gọi handler chuyển về chọn hồ sơ', async () => {
  const handler = vi.fn();
  setProfileRequiredHandler(handler);
  mockApi({ 'GET /roadmap': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ') });
  await api.get('/roadmap').catch(() => undefined);
  expect(handler).toHaveBeenCalledOnce();
});

test('gửi JSON thành object, gửi FormData giữ nguyên FormData', async () => {
  const calls = mockApi({ 'POST /words': () => ({ body: {} }), 'POST /content/import': () => ({ body: [] }) });
  await api.post('/words', { headword: 'x' });
  await api.post('/content/import', new FormData());
  expect(calls[0]).toMatchObject({ method: 'POST', path: '/words', body: { headword: 'x' } });
  expect(calls[1].body).toBeInstanceOf(FormData);
});

test('PUT và DELETE đi đúng phương thức', async () => {
  const calls = mockApi({ 'PUT /profiles/current': () => ({ body: { id: 1 } }), 'DELETE /profiles/current': () => ({ status: 204 }) });
  await api.put('/profiles/current', { name: 'Lan' });
  await api.del('/profiles/current');
  expect(calls.map((c) => c.method)).toEqual(['PUT', 'DELETE']);
});
```

- [ ] **Step 4: Chạy test, xác nhận đỏ**

Run: `npx vitest run src/api/client.test.ts`
Expected: FAIL — `http` không được xuất từ `./client` (import trong mock-api lỗi).

- [ ] **Step 5: Viết lại client**

Thay toàn bộ `src/api/client.ts`:

```ts
import axios from 'axios';

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

/** Instance axios duy nhất của app. Test thay `http.defaults.adapter` (xem test/mock-api.ts). */
export const http = axios.create({ baseURL: '/api' });

function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }
  const { status, data } = error.response;
  const problem = (data !== null && typeof data === 'object' ? data : {}) as { code?: string; detail?: string; errors?: string[] };
  const err = new ApiError(status, problem.code ?? `HTTP_${status}`, problem.detail ?? `Lỗi ${status}`, problem.errors ?? []);
  if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
  return err;
}

http.interceptors.response.use((res) => res, (error: unknown) => Promise.reject(toApiError(error)));

async function request<T>(method: 'get' | 'post' | 'put' | 'delete', path: string, body?: unknown): Promise<T> {
  const res = await http.request<T>({ method, url: path, data: body });
  return (res.status === 204 || (res.data as unknown) === '' ? undefined : res.data) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('get', path),
  post: <T>(path: string, body?: unknown) => request<T>('post', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('put', path, body),
  del: <T>(path: string) => request<T>('delete', path),
};
```

- [ ] **Step 6: Chạy test client**

Run: `npx vitest run src/api/client.test.ts`
Expected: 7 test PASS.

- [ ] **Step 7: Sửa test layout đang giả `fetch` trực tiếp**

Trong `src/components/layout.test.tsx`, test `'lỗi mạng thì hiện màn lỗi có nút thử lại'`: thay dòng `vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));` bằng `mockNetworkDown();` và thêm `mockNetworkDown` vào import từ `'../test/mock-api'`.

Kiểm tra không còn chỗ nào giả `fetch`:
Run: `grep -rn "stubGlobal('fetch'" src`
Expected: không có dòng nào.

- [ ] **Step 8: Toàn bộ test + build**

Run: `npm test && npm run build`
Expected: PASS hết, build OK.

- [ ] **Step 9: Thử thật với backend**

Backend chạy ở 8765 (`cd ../backend && ./mvnw spring-boot:run -Dspring-boot.run.arguments=--app.open-browser=false`, `JAVA_HOME` trỏ JDK 21). Run `npm run dev`, mở http://localhost:5173, chọn/tạo hồ sơ, vào Cài đặt → tải xuất hồ sơ và nhập nội dung JSON (FormData). Expected: không lỗi trong console, upload FormData thành công.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/api/client.ts src/api/client.test.ts src/test/mock-api.ts src/test/setup.ts src/components/layout.test.tsx
git commit -m "feat(frontend): gọi API bằng axios, test giả backend qua adapter

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2b: Tách cấu hình ra `src/config/`, kiểu dữ liệu ra `src/types/`

**Mục tiêu:** cấu hình hạ tầng (axios, interceptor, TanStack Query) nằm ở `src/config/`; kiểu dữ liệu dùng chung nằm ở `src/types/`; `src/api/` chỉ còn lớp gọi API.

**Cấu trúc đích:**

```
src/config/axios.ts          tạo instance `http` (baseURL '/api') và gắn interceptor
src/config/interceptors.ts   toApiError + setupInterceptors(instance) + setProfileRequiredHandler
src/config/query-client.ts   createQueryClient (chuyển từ src/api/query-client.ts, nội dung giữ nguyên)
src/api/api-error.ts         class ApiError (không phụ thuộc gì — tránh import vòng config ↔ api)
src/api/client.ts            request<T>() + api.get/post/put/del (dùng `http` từ config/axios)
src/api/endpoints.ts         giữ nguyên, import kiểu từ ../types/api
src/types/api.ts             chuyển từ src/api/types.ts, nội dung giữ nguyên
```

Chiều phụ thuộc: `api/client` → `config/axios` → `config/interceptors` → `api/api-error`. `types/*` không import gì ngoài kiểu.

**Files:**
- Create: `src/config/axios.ts`, `src/config/interceptors.ts`, `src/api/api-error.ts`
- Move: `src/api/query-client.ts` → `src/config/query-client.ts`; `src/api/types.ts` → `src/types/api.ts`
- Modify: `src/api/client.ts`, mọi file import `ApiError`, `setProfileRequiredHandler`, `http`, `createQueryClient`, hoặc `../api/types`; `test/support/mock-api.ts`, `test/support/render.tsx`, test liên quan; `frontend/CLAUDE.md`

- [ ] **Step 1: Mốc xanh** — `npm test` ghi số test.

- [ ] **Step 2: Chuyển file bằng `git mv`**

```bash
cd frontend
mkdir -p src/config src/types
git mv src/api/query-client.ts src/config/query-client.ts
git mv src/api/types.ts src/types/api.ts
```

- [ ] **Step 3: Tách `client.ts`**

`src/api/api-error.ts`:

```ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
  }
}
```

`src/config/interceptors.ts`:

```ts
import axios, { type AxiosInstance } from 'axios';
import { ApiError } from '../api/api-error';

let profileRequiredHandler: () => void = () => undefined;

/** App đăng ký hành động khi backend báo chưa chọn hồ sơ (xoá cache + về /profiles). */
export function setProfileRequiredHandler(fn: () => void) {
  profileRequiredHandler = fn;
}

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error) || !error.response) {
    return new ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.');
  }
  const { status, data } = error.response;
  const problem = (data !== null && typeof data === 'object' ? data : {}) as { code?: string; detail?: string; errors?: string[] };
  const err = new ApiError(status, problem.code ?? `HTTP_${status}`, problem.detail ?? `Lỗi ${status}`, problem.errors ?? []);
  if (err.code === 'PROFILE_REQUIRED') profileRequiredHandler();
  return err;
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.response.use((res) => res, (error: unknown) => Promise.reject(toApiError(error)));
}
```

`src/config/axios.ts`:

```ts
import axios from 'axios';
import { setupInterceptors } from './interceptors';

/** Instance axios duy nhất của app. Test thay `http.defaults.adapter` (xem test/support/mock-api.ts). */
export const http = axios.create({ baseURL: '/api' });

setupInterceptors(http);
```

`src/api/client.ts` chỉ còn:

```ts
import { http } from '../config/axios';

async function request<T>(method: 'get' | 'post' | 'put' | 'delete', path: string, body?: unknown): Promise<T> {
  const res = await http.request<T>({ method, url: path, data: body });
  return (res.status === 204 || (res.data as unknown) === '' ? undefined : res.data) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('get', path),
  post: <T>(path: string, body?: unknown) => request<T>('post', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('put', path, body),
  del: <T>(path: string) => request<T>('delete', path),
};
```

(Nếu Task 2 đã viết khác đôi chút — ví dụ kiểu hay chú thích — giữ phần tốt hơn, miễn đúng cấu trúc đích và hợp đồng: `ApiError(status, code, message, errors)`, 204/rỗng → `undefined`, lỗi mạng → `NETWORK`, `PROFILE_REQUIRED` → handler.)

- [ ] **Step 4: Sửa import toàn bộ**

- `ApiError` → `../api/api-error` (trong `src/`) / `@/api/api-error` (trong `test/`).
- `setProfileRequiredHandler` → `config/interceptors`.
- `http` → `config/axios` (gồm `test/support/mock-api.ts`: `import { http } from '@/config/axios'`).
- `createQueryClient` → `config/query-client` (`main.tsx`, `test/support/render.tsx`, …).
- `../api/types` / `./types` → `../types/api` (hoặc `@/types/api` trong test).
- `test/api/client.test.ts` import `api` từ `@/api/client`, `ApiError` từ `@/api/api-error`, `setProfileRequiredHandler` từ `@/config/interceptors`.

Kiểm tra: `grep -rnE "api/(types|query-client)|from '\./types'" src test` → rỗng; `grep -rn "ApiError" src test | grep "api/client"` → rỗng.

- [ ] **Step 5: Test + build** — `npm test && npm run build`: cùng số test, PASS.

- [ ] **Step 6: Cập nhật `frontend/CLAUDE.md`** — mục "Gọi API" và "TanStack Query": `src/api/client.ts` → `src/api/client.ts` (wrapper) + `src/config/axios.ts` / `src/config/interceptors.ts`; `src/api/types.ts` → `src/types/api.ts`; `src/api/queryClient.ts`/`query-client.ts` → `src/config/query-client.ts`. Thêm dòng:

```
**Cấu trúc**: hạ tầng (axios, interceptor, TanStack Query) ở `src/config/`; kiểu dữ liệu dùng chung ở `src/types/`; `src/api/` chỉ có `ApiError`, wrapper `api.*` và `endpoints`.
```

- [ ] **Step 7: Commit**

```bash
git add src test CLAUDE.md
git commit -m "refactor(frontend): tách cấu hình axios/query ra src/config, kiểu dữ liệu ra src/types

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

> **Quy đổi bổ sung sau Task 2b (cho Task 3–9):** `createQueryClient` import từ `config/query-client` (không còn `api/query-client`); `setProfileRequiredHandler` từ `config/interceptors`; `ApiError` từ `api/api-error`; `http` từ `config/axios`; kiểu từ `types/api` (không còn `api/types`). Kiểu dùng chung mới (ví dụ `Skill` ở Task 4) đặt ở `src/types/` (`src/types/skill.ts`), còn dữ liệu/giá trị (`SKILL_META`) ở nơi dùng (`src/ui/skill.ts`).

---

### Task 3: Định tuyến bằng `createBrowserRouter` + khung app

Task này chỉ dựng **cấu trúc** (route, shell, nav) với style tạm tối thiểu; Task 4 làm đẹp.

**Files:**
- Create: `src/router.tsx`, `src/shell/require-profile.tsx`, `src/shell/app-shell.tsx`, `src/shell/focus-shell.tsx`, `src/shell/nav-bar.tsx`, `src/shell/center-action.tsx`, `src/shell/route-error.tsx`
- Create test: `src/router.test.tsx`, `src/shell/nav-bar.test.tsx`
- Modify: `src/app.tsx`, `src/main.tsx`, `src/test/render.tsx`, `src/app.test.tsx`
- Move + modify: `src/components/layout.test.tsx` → `src/shell/require-profile.test.tsx`
- Delete: `src/components/layout.tsx`

- [ ] **Step 1: Thêm `renderRoute` vào helper render**

Thay `src/test/render.tsx`:

```tsx
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { createQueryClient } from '../api/query-client';
import { routes } from '../router';

/** Render một component trong router khai báo (cho test component/trang lẻ). */
export function renderAt(ui: ReactElement, route = '/') {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Render cả cây route thật của app ở một URL (cho test định tuyến/shell). */
export function renderRoute(path: string) {
  const client = createQueryClient();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, router };
}
```

- [ ] **Step 2: Viết test định tuyến (đỏ)**

Tạo `src/router.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { renderRoute } from './test/render';
import { mockApi } from './test/mock-api';
import { stubSpeech } from './test/speech-stub';

const profile = { id: 1, name: 'Lan', avatar: '🦊', hasPin: false, dailyMinutes: 30, voice: null, speechRate: 1 };
const health = { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null };

function signedIn(extra: Record<string, () => { body?: unknown; status?: number }> = {}) {
  stubSpeech();
  mockApi({ 'GET /profiles/current': () => ({ body: profile }), 'GET /health': () => ({ body: health }), ...extra });
}

test('/profiles nằm ngoài khung app', () => {
  mockApi({ 'GET /profiles': () => ({ body: [] }) });
  renderRoute('/profiles');
  expect(screen.getByTestId('page-profiles')).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test.each(['/', '/roadmap', '/words', '/ipa', '/stats', '/settings'])('%s dùng AppShell có điều hướng', async (path) => {
  signedIn();
  renderRoute(path);
  expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  expect(screen.getAllByRole('navigation')).toHaveLength(1);
});

test.each(['/session', '/review', '/lessons/S0-U01-G1', '/units/S0-U01/test', '/stages/S0/test'])(
  '%s dùng FocusShell không có điều hướng', async (path) => {
    signedIn();
    renderRoute(path);
    expect(await screen.findByTestId('focus-shell')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

test('đường dẫn lạ quay về trang chủ', async () => {
  signedIn();
  const { router } = renderRoute('/khong-co');
  expect(await screen.findByTestId('app-shell')).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/');
});
```

Run: `npx vitest run src/router.test.tsx`
Expected: FAIL — không tìm thấy module `./router`.

- [ ] **Step 3: Tạo `require-profile.tsx`** (chuyển logic từ `components/layout.tsx`)

```tsx
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { configureSpeech } from '../speech/speech';

export const CURRENT_PROFILE_KEY = ['profile', 'current'] as const;

/** Hồ sơ đang dùng; dùng chung cache với RequireProfile nên không gọi lại API. */
export function useCurrentProfile() {
  return useQuery({ queryKey: CURRENT_PROFILE_KEY, queryFn: endpoints.currentProfile, meta: { silent: true } });
}

export default function RequireProfile() {
  const { data: profile, error, isLoading, refetch } = useCurrentProfile();

  useEffect(() => {
    if (profile) configureSpeech({ voice: profile.voice, rate: profile.speechRate });
  }, [profile]);

  if (isLoading) return <p className="p-8 text-[var(--text-2)]">Đang tải…</p>;
  if (error instanceof ApiError && error.code === 'PROFILE_REQUIRED') return <Navigate to="/profiles" replace />;
  if (error || !profile) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md p-4 text-center">
        <p>{error instanceof ApiError ? error.message : 'Không tải được dữ liệu.'}</p>
        <button type="button" onClick={() => refetch()}>Thử lại</button>
      </div>
    );
  }
  return <Outlet />;
}
```

- [ ] **Step 4: Tạo `center-action.tsx`, `nav-bar.tsx`, `app-shell.tsx`, `focus-shell.tsx`, `route-error.tsx`**

`src/shell/center-action.tsx` — ô hành động giữa, đích cấu hình được (sau này trỏ sang chế độ AI):

```tsx
import { Link } from 'react-router';

export interface CenterActionTarget { to: string; label: string }

/** Hành động chính ở giữa tab bar / đầu sidebar. Hiện là buổi học hôm nay; đổi đích ở đây khi có chế độ AI. */
export const CENTER_ACTION: CenterActionTarget = { to: '/session', label: 'Buổi học hôm nay' };

export function CenterAction({ target = CENTER_ACTION }: { target?: CenterActionTarget }) {
  return (
    <Link to={target.to} aria-label={target.label} data-testid="center-action">
      <span className="center-action-label">{target.label}</span>
    </Link>
  );
}
```

`src/shell/nav-bar.tsx` — **một** `<nav>`:

```tsx
import { NavLink } from 'react-router';
import { CenterAction } from './center-action';

export const NAV_ITEMS = [
  { to: '/', label: 'Hôm nay', icon: 'home' },
  { to: '/roadmap', label: 'Lộ trình', icon: 'map' },
  { to: '/stats', label: 'Tiến độ', icon: 'chart' },
  { to: '/settings', label: 'Cá nhân', icon: 'person' },
] as const;

export function NavBar() {
  const [first, second, ...rest] = NAV_ITEMS;
  return (
    <nav aria-label="Điều hướng chính" data-testid="nav-bar">
      <NavLink to={first.to} end>{first.label}</NavLink>
      <NavLink to={second.to}>{second.label}</NavLink>
      <CenterAction />
      {rest.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
    </nav>
  );
}
```

`src/shell/app-shell.tsx`:

```tsx
import { Outlet } from 'react-router';
import { HealthBanner } from '../components/health-banner';
import { VoiceBanner } from '../components/voice-banner';
import { NavBar } from './nav-bar';

export default function AppShell() {
  return (
    <div data-testid="app-shell">
      <NavBar />
      <main>
        <HealthBanner />
        <VoiceBanner />
        <Outlet />
      </main>
    </div>
  );
}
```

`src/shell/focus-shell.tsx`:

```tsx
import { Outlet } from 'react-router';
import { HealthBanner } from '../components/health-banner';

/** Màn tập trung (buổi học, ôn thẻ, bài học, kiểm tra): không điều hướng; mỗi trang tự có TopBar. */
export default function FocusShell() {
  return (
    <div data-testid="focus-shell">
      <HealthBanner />
      <Outlet />
    </div>
  );
}
```

`src/shell/route-error.tsx`:

```tsx
import { Link, useRouteError } from 'react-router';

export default function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div role="alert" data-testid="route-error" className="mx-auto mt-16 max-w-md p-4 text-center">
      <p>Có lỗi khi hiển thị trang này.</p>
      <Link to="/">Về trang chủ</Link>
    </div>
  );
}
```

- [ ] **Step 5: Tạo `router.tsx`**

```tsx
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import RequireProfile from './shell/require-profile';
import AppShell from './shell/app-shell';
import FocusShell from './shell/focus-shell';
import RouteError from './shell/route-error';
import ProfileSelectPage from './pages/profile-select-page';
import CreateProfilePage from './pages/create-profile-page';
import TodayPage from './pages/today-page';
import SessionPage from './pages/session-page';
import ReviewPage from './pages/review-page';
import LessonPage from './pages/lesson-page';
import TestPage from './pages/test-page';
import RoadmapPage from './pages/roadmap-page';
import WordBankPage from './pages/word-bank-page';
import IpaPage from './pages/ipa-page';
import StatsPage from './pages/stats-page';
import SettingsPage from './pages/settings-page';

export const routes: RouteObject[] = [
  { path: '/profiles', element: <ProfileSelectPage />, errorElement: <RouteError /> },
  { path: '/profiles/new', element: <CreateProfilePage />, errorElement: <RouteError /> },
  {
    element: <RequireProfile />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: 'roadmap', element: <RoadmapPage /> },
          { path: 'words', element: <WordBankPage /> },
          { path: 'ipa', element: <IpaPage /> },
          { path: 'stats', element: <StatsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
      {
        element: <FocusShell />,
        children: [
          { path: 'session', element: <SessionPage /> },
          { path: 'review', element: <ReviewPage /> },
          { path: 'lessons/:code', element: <LessonPage /> },
          { path: 'units/:code/test', element: <TestPage kind="UNIT" /> },
          { path: 'stages/:code/test', element: <TestPage kind="STAGE" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
```

- [ ] **Step 6: Viết lại `app.tsx` và `main.tsx`**

`src/app.tsx`:

```tsx
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { setProfileRequiredHandler } from './api/client';
import { Toaster } from './components/toaster';
import type { createAppRouter } from './router';

type AppRouter = ReturnType<typeof createAppRouter>;

const KEEP_ON_LOGOUT = ['profiles', 'health'];

export default function App({ router, queryClient }: { router: AppRouter; queryClient: QueryClient }) {
  useEffect(() => {
    setProfileRequiredHandler(() => {
      queryClient.removeQueries({ predicate: (q) => !KEEP_ON_LOGOUT.includes(String(q.queryKey[0])) });
      router.navigate('/profiles', { replace: true });
    });
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { createQueryClient } from './api/query-client';
import { createAppRouter } from './router';
import './index.css';

const queryClient = createQueryClient();
const router = createAppRouter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>,
);
```

Thay `src/app.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import App from './app';
import { createQueryClient } from './api/query-client';
import { routes } from './router';
import { mockApi, problem } from './test/mock-api';
import { stubSpeech } from './test/speech-stub';

test('PROFILE_REQUIRED ở bất kỳ request nào đưa về /profiles', async () => {
  stubSpeech();
  mockApi({
    'GET /profiles/current': () => problem(401, 'PROFILE_REQUIRED', 'Chưa chọn hồ sơ'),
    'GET /profiles': () => ({ body: [] }),
    'GET /health': () => ({ body: { app: 'ielts-app', status: 'UP', recoveredFrom: null, restoredFrom: null } }),
  });
  const router = createMemoryRouter(routes, { initialEntries: ['/stats'] });
  render(<App router={router} queryClient={createQueryClient()} />);
  await waitFor(() => expect(router.state.location.pathname).toBe('/profiles'));
  expect(await screen.findByTestId('page-profiles')).toBeInTheDocument();
});
```

- [ ] **Step 7: Chuyển test layout sang `require-profile.test.tsx`**

Run: `git mv src/components/layout.test.tsx src/shell/require-profile.test.tsx && git rm src/components/layout.tsx`

Sửa `src/shell/require-profile.test.tsx`: bỏ hàm `renderLayout` dựa trên `<Routes>`; mọi test dùng `renderRoute('/')` từ `../test/render`, import `mockApi`, `problem`, `mockNetworkDown` từ `../test/mock-api`, `stubSpeech` từ `../test/speech-stub`. Kỳ vọng mới:
- `'chưa chọn hồ sơ thì về trang chọn hồ sơ'`: thêm handler `'GET /profiles': () => ({ body: [] })`; kỳ vọng `await screen.findByTestId('page-profiles')`.
- `'có hồ sơ thì hiện điều hướng'`: kỳ vọng các link `'Hôm nay'`, `'Lộ trình'`, `'Tiến độ'`, `'Cá nhân'` và link `'Buổi học hôm nay'` (thay danh sách nhãn cũ). Trang chủ gọi `GET /progress/summary` (query key `['summary']`); thêm mock `'GET /progress/summary'` trả object rỗng hợp kiểu `Summary` trong `src/api/types.ts`, hoặc để 404 nếu test không kiểm nội dung trang.
- Hai test banner (khôi phục DB, không có giọng tiếng Anh) và test lỗi mạng (`mockNetworkDown()`, nút `'Thử lại'`) giữ nguyên kỳ vọng.

- [ ] **Step 8: Test nav**

Tạo `src/shell/nav-bar.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { NavBar } from './nav-bar';
import { renderAt } from '../test/render';

test('đánh dấu đúng mục đang mở', () => {
  renderAt(<NavBar />, '/stats');
  expect(screen.getByRole('link', { name: 'Tiến độ' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
});

test('trang chủ chỉ active ở đúng "/"', () => {
  renderAt(<NavBar />, '/');
  expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
});

test('nút giữa dẫn tới buổi học hôm nay', () => {
  renderAt(<NavBar />, '/');
  expect(screen.getByRole('link', { name: 'Buổi học hôm nay' })).toHaveAttribute('href', '/session');
});
```

- [ ] **Step 9: Toàn bộ test + build**

Run: `npm test && npm run build`
Expected: PASS hết (gồm `router.test.tsx` 13 test, `nav-bar.test.tsx` 3 test), build OK. Nếu một test trang cũ đỏ vì trang vẫn chứa link "Thống kê"/"Cài đặt" cố định trong nội dung — sửa test theo nhãn mới, không đổi hành vi.

- [ ] **Step 10: Thử thật**

Với backend + `npm run dev`: F5 ở `/roadmap`, `/lessons/S0-U01-G1` mở đúng trang; vào `/session` không thấy nav; xoá cookie `JSESSIONID` rồi bấm một trang → về `/profiles`.

- [ ] **Step 11: Commit**

```bash
git add -A src
git commit -m "feat(frontend): định tuyến bằng createBrowserRouter, tách AppShell/FocusShell

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Token sáng/tối, thư viện UI, thành phần dùng chung, làm đẹp khung app

**Trước khi làm:** nạp skill `apple-design`, `emil-design-eng`, `mobile-native`, `pick-ui-library`, `ask-sonner`.

**Files:**
- Modify: `package.json`, `index.html`, `src/index.css`
- Create: `src/styles/tokens.css`, `src/ui/*` (danh sách ở Step 4), `src/ui/*.test.tsx` (Step 6)
- Modify: `src/components/toaster.tsx`, `src/components/toaster.test.tsx`, `src/components/query-error.tsx`, `src/components/health-banner.tsx`, `src/components/voice-banner.tsx`, `src/components/speak-button.tsx`, `src/components/shutdown-button.tsx`, `src/shell/*.tsx`

- [ ] **Step 1: Cài thư viện**

Run: `npm install motion@^14.1.0 sonner@^2.0.8 @base-ui/react@^1.9.0 clsx@^2.1.1 class-variance-authority@^0.7.1`
Expected: 5 gói trong `dependencies`. Tra API `@base-ui/react` 1.9 và `motion` 14 bằng context7 trước khi dùng.

- [ ] **Step 2: `index.html` cho mobile + sáng/tối**

Thay phần `<head>`:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F6FB" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0B0E17" />
<title>IELTS App</title>
```

- [ ] **Step 3: Token**

Tạo `src/styles/tokens.css` với **đúng các tên biến dưới đây** (các task sau dùng chúng). Giá trị là điểm xuất phát đã kiểm tương phản sơ bộ; được tinh chỉnh nhưng không đổi tên, và phải giữ WCAG AA cho `--text*` trên `--surface`/`--bg-base` và `--on-accent` trên `--accent`.

```css
:root {
  color-scheme: light dark;

  --bg-base: #F4F6FB;
  --bg-gradient:
    radial-gradient(at 0% 0%, #CFE6FF 0, transparent 55%),
    radial-gradient(at 100% 8%, #FFE7D6 0, transparent 50%),
    radial-gradient(at 15% 100%, #D9F5E6 0, transparent 55%);
  --surface: #FFFFFF;
  --surface-2: #F2F3F7;
  --material: rgb(255 255 255 / 0.72);
  --separator: rgb(60 60 67 / 0.12);

  --text: #111827;
  --text-2: #4B5563;
  --text-3: #6B7280;

  --accent: #7C5CFC;
  --accent-pressed: #6A47F0;
  --accent-soft: #EEE9FF;
  --accent-text: #5B3CE0;
  --on-accent: #FFFFFF;

  --skill-grammar: #2F6BFF;
  --skill-pronunciation: #8B5CF6;
  --skill-listening: #0D9488;
  --skill-reading: #D97706;
  --skill-vocab: #E11D48;

  --success: #15803D;
  --warning: #B45309;
  --danger: #DC2626;

  --shadow-card: 0 1px 2px rgb(16 24 40 / 0.04), 0 4px 16px rgb(16 24 40 / 0.06);
  --shadow-float: 0 8px 24px rgb(124 92 252 / 0.35);
  --card-border: transparent;

  --radius-card: 22px;
  --radius-control: 14px;
  --radius-pill: 9999px;

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --duration-press: 140ms;
  --duration-fast: 200ms;
  --duration-base: 300ms;

  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-base: #0B0E17;
    --bg-gradient:
      radial-gradient(at 0% 0%, rgb(56 88 160 / 0.35) 0, transparent 55%),
      radial-gradient(at 100% 8%, rgb(120 70 110 / 0.28) 0, transparent 50%),
      radial-gradient(at 15% 100%, rgb(30 110 90 / 0.25) 0, transparent 55%);
    --surface: #161A24;
    --surface-2: #1F2430;
    --material: rgb(22 26 36 / 0.72);
    --separator: rgb(255 255 255 / 0.08);

    --text: #F3F4F6;
    --text-2: #B4B9C4;
    --text-3: #8D93A0;

    --accent: #7C5CFC;
    --accent-pressed: #8E73FF;
    --accent-soft: rgb(155 133 255 / 0.16);
    --accent-text: #B3A3FF;
    --on-accent: #FFFFFF;

    --skill-grammar: #6B9BFF;
    --skill-pronunciation: #A78BFA;
    --skill-listening: #2DD4BF;
    --skill-reading: #FBBF24;
    --skill-vocab: #FB7185;

    --success: #4ADE80;
    --warning: #FBBF24;
    --danger: #F87171;

    --shadow-card: none;
    --shadow-float: 0 8px 24px rgb(0 0 0 / 0.5);
    --card-border: rgb(255 255 255 / 0.06);
  }
}

@theme inline {
  --color-bg: var(--bg-base);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-separator: var(--separator);
  --color-text: var(--text);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  --color-accent: var(--accent);
  --color-accent-pressed: var(--accent-pressed);
  --color-accent-soft: var(--accent-soft);
  --color-accent-text: var(--accent-text);
  --color-on-accent: var(--on-accent);
  --color-grammar: var(--skill-grammar);
  --color-pronunciation: var(--skill-pronunciation);
  --color-listening: var(--skill-listening);
  --color-reading: var(--skill-reading);
  --color-vocab: var(--skill-vocab);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
}

/* Không đổi theo sáng/tối → khai giá trị thẳng trong @theme (KHÔNG viết `--x: var(--x)` trong @theme inline: tự tham chiếu, thành vòng lặp nếu bị đặt vào layer/:host). */
@theme static {
  --radius-card: 22px;
  --radius-control: 14px;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

Thay `src/index.css`: `@import "tailwindcss"; @import "./styles/tokens.css";` rồi lớp base:
- `html, body`: `background: var(--bg-gradient), var(--bg-base); background-attachment: fixed; color: var(--text); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent;`
- `#root`: `min-height: 100dvh`.
- `input, textarea, select`: `font-size: max(16px, 1rem)`.
- `button, a, [role=button]`: `-webkit-user-select: none; user-select: none; touch-action: manipulation`.
- `@media (prefers-reduced-motion: reduce)`: tắt transition/animation transform (giữ opacity ngắn).
- Giữ lại lớp `.markdown …` (đổi màu sang token). **Xoá** `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.card`, `.input`, `.badge` — thay bằng component `src/ui`. Trang chưa làm lại (Task 5–7) sẽ mất style tạm thời; chấp nhận được vì các task đó thay hết. Không được để lỗi build: các lớp không còn định nghĩa chỉ là chuỗi vô hại.

- [ ] **Step 4: Thành phần `src/ui/`** — viết theo đúng API sau (các task sau dựa vào), style theo token + skill:

```ts
// cn.ts
export function cn(...inputs: ClassValue[]): string // clsx

// skill.ts — một nguồn sự thật cho màu/nhãn kỹ năng
export type Skill = 'GRAMMAR' | 'PRONUNCIATION' | 'LISTENING' | 'READING' | 'VOCAB';
export const SKILL_META: Record<Skill, { label: string; color: string /* tên lớp tailwind: 'grammar' | ... */; icon: IconName }>;
// label: Ngữ pháp, Phát âm, Nghe, Đọc, Từ vựng

// icons.tsx — SVG nội tuyến, stroke 1.75–2, currentColor, aria-hidden
export type IconName = 'home' | 'map' | 'chart' | 'person' | 'play' | 'back' | 'close' | 'check' | 'cross'
  | 'speaker' | 'book' | 'headphones' | 'mic' | 'text' | 'cards' | 'search' | 'plus' | 'flame' | 'clock'
  | 'star' | 'lock' | 'chevron-right' | 'settings' | 'download' | 'upload' | 'power' | 'sparkle';
export function Icon(props: { name: IconName; size?: number; className?: string }): JSX.Element;

// button.tsx (cva) — nhấn thu scale(0.97) var(--duration-press) var(--ease-out)
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; block?: boolean;
}): JSX.Element // loading ⇒ disabled + aria-busy="true", giữ nguyên chữ để tên accessible không đổi
export function ButtonLink(props: LinkProps & { variant?: ...; size?: ...; block?: boolean }): JSX.Element // <Link> cùng style

// icon-button.tsx — nút tròn 40–44px; aria-label bắt buộc
export function IconButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }): JSX.Element
export function IconLink(props: LinkProps & { icon: IconName; label: string }): JSX.Element

// card.tsx
export function Card(props: HTMLAttributes<HTMLDivElement> & { as?: 'div' | 'section' | 'article'; padded?: boolean; interactive?: boolean }): JSX.Element

// list-row.tsx — bảng nhóm kiểu iOS
export function ListGroup(props: { title?: string; footer?: ReactNode; children: ReactNode }): JSX.Element // <section> + <ul>
export function ListRow(props: { title: ReactNode; subtitle?: ReactNode; leading?: ReactNode; trailing?: ReactNode;
  to?: string; onClick?: () => void; chevron?: boolean }): JSX.Element // <li>; to ⇒ Link, onClick ⇒ button

// progress-bar.tsx — role="progressbar" aria-valuemin=0 aria-valuemax=100 aria-valuenow
export function ProgressBar(props: { value: number /* 0..1 */; label: string; color?: Skill | 'accent'; showValue?: boolean }): JSX.Element
// progress-ring.tsx — cùng ngữ nghĩa ARIA
export function ProgressRing(props: { value: number; label: string; size?: number; children?: ReactNode }): JSX.Element

// stat-tile.tsx — icon + số lớn tabular-nums + nhãn
export function StatTile(props: { icon: IconName; tone?: Skill | 'accent' | 'warning'; value: ReactNode; label: string; testId?: string }): JSX.Element
// testId gắn lên phần tử chứa số (để giữ 'stat-streak' có text đúng bằng số)

// skill-tile.tsx — ô "Luyện tập": vòng màu + icon + nhãn, là Link
export function SkillTile(props: { to: string; label: string; icon: IconName; tone: Skill | 'accent' }): JSX.Element

// segmented.tsx — base-ui (RadioGroup hoặc Tabs), điều khiển được, phím mũi tên
export function Segmented<T extends string>(props: { label: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[] }): JSX.Element // label là tên accessible của nhóm

// sheet.tsx — base-ui Dialog, trượt từ dưới lên trên mobile (lò xo motion), dialog giữa màn ở ≥lg
export function Sheet(props: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }): JSX.Element
// dialog.tsx — xác nhận (thay window.confirm)
export function ConfirmDialog(props: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string;
  confirmLabel: string; destructive?: boolean; onConfirm: () => void }): JSX.Element

// text-field.tsx — label luôn liên kết với input (getByLabel phải chạy)
export function TextField(props: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }): JSX.Element
// select.tsx — <select> gốc đã style (giữ selectOption trong test/E2E)
export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }): JSX.Element
// switch.tsx — base-ui Switch
export function Switch(props: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }): JSX.Element

// badge.tsx
export function Badge(props: { tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | Skill; children: ReactNode }): JSX.Element
// empty-state.tsx
export function EmptyState(props: { icon?: IconName; title: string; description?: string; action?: ReactNode }): JSX.Element
// skeleton.tsx — aria-hidden; kèm <span className="sr-only">Đang tải…</span> ở nơi dùng
export function Skeleton(props: { className?: string }): JSX.Element

// page-header.tsx — tiêu đề lớn (h1 ~34px) + phụ đề + hành động; back ⇒ IconLink 'back'
export function PageHeader(props: { title: string; subtitle?: ReactNode; back?: string; actions?: ReactNode }): JSX.Element
// top-bar.tsx — cho FocusShell: nút quay lại tròn, tiêu đề + phụ đề giữa, slot phải; dính trên, vật liệu kính, safe-area-top
export function TopBar(props: { title: string; subtitle?: string; back: string; backLabel?: string; trailing?: ReactNode }): JSX.Element
```

- [ ] **Step 5: Làm đẹp khung app và các component chung**

- `nav-bar.tsx`: `<lg` — tab bar cố định đáy, vật liệu kính (`background: var(--material); backdrop-filter: blur(20px) saturate(180%)`), `padding-bottom: env(safe-area-inset-bottom)`, 4 mục icon + nhãn, `CenterAction` là nút tròn 56–60px nổi lên trên (màu accent, `--shadow-float`, icon `sparkle` hoặc `play`), nhãn của nó chỉ đọc cho trình đọc màn hình. `≥lg` — sidebar cố định trái ~260px, cùng vật liệu, `CenterAction` thành nút lớn ở đầu có chữ hiện, thẻ hồ sơ (avatar + tên từ `useCurrentProfile()`) + link "Đổi hồ sơ" (`/profiles?manual=1`) ở cuối. Mục đang chọn: chỉ báo trượt bằng `motion` `layoutId` (tắt khi reduced-motion). **Vẫn một `<nav>`**; link "Đổi hồ sơ" ở sidebar ẩn bằng CSS dưới `lg`. Vì NavBar giờ gọi `useCurrentProfile()`, thêm `mockApi({ 'GET /profiles/current': () => ({ body: profile }) })` vào đầu mỗi test trong `src/shell/nav-bar.test.tsx`.
- `app-shell.tsx`: nền gradient token; `<main>` có `padding-bottom` chừa tab bar + safe-area dưới `lg`, `margin-left` chừa sidebar ở `≥lg`; nội dung `max-w-[1100px]` ở `≥lg`, `max-w-[640px]` căn giữa ở 768–1023px.
- `focus-shell.tsx`: toàn màn, `min-h-dvh`, nội dung `max-w-[720px]` căn giữa.
- `toaster.tsx`: thay bằng `sonner`. Giữ export `toast(message, kind)` và `notifyError(e)` cùng hành vi (bỏ qua `PROFILE_REQUIRED`); `<Toaster>` là `<SonnerToaster>` vị trí `top-center` trên mobile, `bottom-right` ≥lg, theme `system`. Sửa `toaster.test.tsx` cho phù hợp nhưng giữ 2 kiểm tra: lỗi ApiError hiện đúng thông báo; `PROFILE_REQUIRED` không hiện toast.
- `query-error.tsx`, `health-banner.tsx`, `voice-banner.tsx`, `speak-button.tsx`, `shutdown-button.tsx`: dựng lại bằng `src/ui`, giữ nguyên chữ và hành vi. `shutdown-button` đang dùng `window.confirm('Tắt app? …')` → đổi sang `ConfirmDialog` cùng câu hỏi, nút xác nhận "Tắt app" (cập nhật test đang stub `window.confirm` để bấm nút trong dialog).

- [ ] **Step 6: Test thành phần UI**

Tạo `src/ui/ui.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Button } from './button';
import { ProgressBar } from './progress-bar';
import { Segmented } from './segmented';
import { StatTile } from './stat-tile';
import { TextField } from './text-field';
import { renderAt } from '../test/render';

test('Button loading thì bị khoá và báo bận, tên không đổi', async () => {
  const onClick = vi.fn();
  renderAt(<Button loading onClick={onClick}>Lưu</Button>);
  const btn = screen.getByRole('button', { name: 'Lưu' });
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('aria-busy', 'true');
  await userEvent.click(btn);
  expect(onClick).not.toHaveBeenCalled();
});

test('ProgressBar có ngữ nghĩa progressbar theo phần trăm', () => {
  renderAt(<ProgressBar value={0.6} label="Tiến độ unit" />);
  const bar = screen.getByRole('progressbar', { name: 'Tiến độ unit' });
  expect(bar).toHaveAttribute('aria-valuenow', '60');
});

test('Segmented đổi giá trị bằng click', async () => {
  function Demo() {
    const [v, setV] = useState<'ALL' | 'NEW'>('ALL');
    return <><Segmented label="Trạng thái" value={v} onChange={setV}
      options={[{ value: 'ALL', label: 'Tất cả' }, { value: 'NEW', label: 'Mới' }]} /><p>giá trị: {v}</p></>;
  }
  renderAt(<Demo />);
  await userEvent.click(screen.getByRole('radio', { name: 'Mới' }));
  expect(screen.getByText('giá trị: NEW')).toBeInTheDocument();
});

test('StatTile gắn testId lên phần tử chứa số', () => {
  renderAt(<StatTile icon="flame" value={12} label="Chuỗi ngày" testId="stat-streak" />);
  expect(screen.getByTestId('stat-streak')).toHaveTextContent(/^12$/);
});

test('TextField liên kết label với input', () => {
  renderAt(<TextField label="Tên" defaultValue="Lan" />);
  expect(screen.getByLabelText('Tên')).toHaveValue('Lan');
});
```

Nếu `Segmented` dùng base-ui Tabs thay RadioGroup thì đổi `'radio'` thành `'tab'` — chọn một và ghi trong JSDoc của `segmented.tsx`; các task sau dùng đúng role đó.

Run: `npx vitest run src/ui`
Expected: 5 test PASS.

- [ ] **Step 7: Toàn bộ test + build + soát bằng mắt**

Run: `npm test && npm run build` → PASS.
Với backend + dev server, dùng Playwright MCP chụp `/` và `/session` ở 390×844 và 1280×800, sáng và tối (`browser_emulate_media` colorScheme). Kiểm tra: tab bar không đè nội dung cuối trang, sidebar không chồng nội dung, chữ trên kính đọc được ở cả hai chế độ.

- [ ] **Step 8: Commit**

```bash
git add -A package.json package-lock.json index.html src
git commit -m "feat(frontend): token sáng/tối, thành phần UI dùng chung, khung app kiểu Apple

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5–7: Làm lại các màn (chạy song song)

Ba task dưới đây **chạy song song sau Task 4**, mỗi task chỉ sửa file trong phần **Files** của mình (cùng test của chúng). Không task nào sửa `src/ui/*`, `src/shell/*`, `src/styles/*`, `src/index.css`; cần thêm biến thể cho thành phần UI thì tạo component cục bộ trong file trang, ghi lại trong báo cáo để review gom về `src/ui` sau.

**Quy trình chung cho mỗi màn** (lặp cho từng trang trong task):
1. Nạp skill `apple-design`, `emil-design-eng`, `mobile-native`. Đọc trang hiện tại và test của nó; liệt kê hành vi mà test đang khoá.
2. Viết lại JSX bằng `src/ui/*` theo bảng hướng thiết kế dưới đây và spec §5. Giữ nguyên query key, mutation, logic, `data-testid`, chữ mà E2E dùng (trừ khi task ghi đổi).
3. Mọi query chính: có skeleton khi tải, `QueryError` khi lỗi (có `onRetry` và `backTo` khi là màn tập trung), `EmptyState` khi rỗng — không còn "Đang tải…" vô hạn.
4. Chạy test của trang: `npx vitest run src/pages/<file>.test.tsx` (hoặc test component) → PASS. Sửa selector/chữ trong test nếu giao diện đổi, không bỏ kiểm tra hành vi.
5. Soát bằng mắt qua Playwright MCP ở 390×844 và 1280×800, sáng + tối; thử tên hồ sơ 40 ký tự, danh sách rỗng, số lớn (≥ 1000).
6. Commit riêng cho từng màn: `feat(frontend): <tên màn> theo giao diện mới`.

Kết thúc task: `npm test && npm run build` PASS, rồi báo cáo các component cục bộ đã tạo.

### Task 5: Hôm nay, Buổi học, Ôn thẻ

**Files:** `src/pages/today-page.tsx`, `src/pages/session-page.tsx`, `src/pages/review-page.tsx`, `src/components/flashcard.tsx`, `src/components/flashcard.test.tsx`, `src/components/step-bar.tsx`, `src/pages/study-pages.test.tsx`

| Màn | Bắt buộc |
|---|---|
| Hôm nay (`/`) | `PageHeader` tiêu đề "Chào, \<tên\>" (tên từ `useCurrentProfile()`), phụ đề động viên ngắn. Thẻ "Buổi học hôm nay" (giống "Daily Challenge"): số thẻ cần ôn, từ mới, nút **`ButtonLink` "Bắt đầu buổi học"** → `/session` (giữ đúng chữ — E2E bấm nó); đã xong ⇒ dòng **"✓ Bạn đã hoàn thành buổi học hôm nay"** (giữ đúng chữ) + link Ôn thêm. Thẻ "Đang học": unit hiện tại, % lớn tabular-nums, `ProgressBar`. Lưới **Luyện tập** 4 `SkillTile`: Ôn thẻ `/review`, Kho từ `/words`, Phát âm IPA `/ipa`, Lộ trình `/roadmap` — nhãn link đúng "Ôn thẻ", "Kho từ", "Phát âm IPA", "Lộ trình" (E2E bấm "Kho từ"; "Lộ trình" trùng tên với nav → đặt `aria-label="Mở lộ trình"` cho ô này). ≥lg: 2 cột (trái: buổi học + đang học; phải: chuỗi ngày, thẻ đến hạn, luyện tập). |
| Buổi học (`/session`) | `TopBar` title "Buổi học hôm nay", back `/`. `StepBar` gọn 3 bước (Ôn tập · Từ mới · Bài chính) dưới TopBar, **giữ `data-testid="session-step"` và `data-step`**. Bước thẻ: `Flashcard` lớn giữa màn. Bước LESSON: `LessonView` như cũ (component thuộc Task 6 — chỉ dùng, không sửa). DONE: thẻ tổng kết giữ chữ **"🎉 Xong buổi học hôm nay!"** và "Bạn đã ôn N thẻ", 3 hành động Về trang chủ / Ôn thêm / Lộ trình. |
| Ôn thẻ (`/review`) | `TopBar` "Ôn thẻ", phụ đề "Còn N thẻ". Cùng `Flashcard`. Hết thẻ ⇒ `EmptyState` + link về trang chủ. Giữ `gcTime: 0` của query thẻ đến hạn. |
| `Flashcard` | Mặt trước: từ lớn + `SpeakButton`. Mặt sau: IPA US/UK, loại từ, nghĩa, ví dụ (có loa). Lật bằng lò xo `motion` (xoay Y hoặc crossfade+scale; reduced-motion ⇒ crossfade). 4 nút chấm (Quên/Khó/Được/Dễ) tông màu danger/warning/accent/success, hiện phím tắt 1–4 nhỏ ở ≥lg. **Giữ**: nút "Lật thẻ" (tên accessible chứa "Lật thẻ"), `Space` lật, `1–4` chấm chỉ khi đã lật, bỏ `e.repeat` và phím có Ctrl/Alt/Meta, `Space` không lật khi focus ở BUTTON/A khác, `busy` khoá chấm. Không animate giữa hai thẻ liên tiếp quá 200ms. |

### Task 6: Bài học, Kiểm tra, Lộ trình, IPA

**Files:** `src/pages/lesson-page.tsx`, `src/pages/test-page.tsx`, `src/components/lesson-view.tsx`, `src/components/exercise-set.tsx`, `src/components/exercise-set.test.tsx`, `src/pages/lesson-and-test.test.tsx`, `src/pages/roadmap-page.tsx`, `src/pages/ipa-page.tsx`, `src/pages/roadmap-and-words.test.tsx` (chỉ phần roadmap), `src/pages/stats-and-ipa.test.tsx` (chỉ phần IPA), `src/components/labels.ts`

| Màn | Bắt buộc |
|---|---|
| Bài học (`/lessons/:code`) | `TopBar` title = tên bài, subtitle = "\<Thứ\> · \<loại bài\>", back `/roadmap`. Badge loại bài theo `SKILL_META`. Lý thuyết Markdown trong `.markdown`: cỡ chữ 17px, dòng 1.6, bảng cuộn ngang trên mobile (`overflow-x:auto`). Lỗi query (vd. `UNIT_LOCKED`) ⇒ `QueryError` có backTo `/roadmap`. |
| `LessonView` / `ExerciseSet` | Câu hỏi trong `Card`, lựa chọn MCQ/MINIMAL_PAIR là nút lớn chạm được (≥44px); FILL/DICTATION là `TextField` (giữ `spellCheck={false}`, `autoCapitalize="off"`, `Enter` không nộp cả bài). Sau khi nộp: đúng/sai bằng màu + icon check/cross + giải thích. **Giữ chữ nút "Nộp bài", "Đã học xong bài này", và prop `doneLabel`** ("Hoàn thành buổi học" do SessionPage truyền). |
| Kiểm tra (`/units/:code/test`, `/stages/:code/test`) | `TopBar` "Kiểm tra cuối unit"/"Kiểm tra chuyển chặng". Đếm "Câu x/y". Kết quả: `ProgressRing` % lớn, Badge Đạt/Chưa đạt, danh sách unit yếu (STAGE). Giữ `meta: { silent: true }` và xử lý lỗi hiện có. |
| Lộ trình (`/roadmap`) | `PageHeader` **"Lộ trình"** (giữ heading — E2E kiểm tra). Mỗi chặng là `ListGroup`; mỗi unit là hàng: số thứ tự, tên, trạng thái (`lock` / đang học nổi bật accent / `check`). Unit đang học mở sẵn, hiện các bài theo thứ trong tuần với màu `SKILL_META` + trạng thái hoàn thành + link bài kiểm tra khi đủ điều kiện. Unit khoá không bấm được. |
| IPA (`/ipa`) | `PageHeader` "Phát âm IPA", back `/`. Nhóm Nguyên âm / Nguyên âm đôi / Phụ âm; mỗi âm là ô vuông chạm được: ký hiệu lớn, từ ví dụ, bấm để đọc. Lưới 4 cột mobile, 8 cột ≥lg. |

### Task 7: Tiến độ, Kho từ, Cài đặt, Chọn hồ sơ, Tạo hồ sơ

**Files:** `src/pages/stats-page.tsx`, `src/components/heatmap.tsx`, `src/components/known-chart.tsx`, `src/pages/stats-and-ipa.test.tsx` (chỉ phần stats), `src/pages/word-bank-page.tsx`, `src/pages/roadmap-and-words.test.tsx` (chỉ phần kho từ), `src/pages/settings-page.tsx`, `src/pages/settings/*.tsx`, `src/pages/settings-page.test.tsx`, `src/pages/profile-select-page.tsx`, `src/pages/create-profile-page.tsx`, `src/components/avatar-picker.tsx`, `src/pages/profile-pages.test.tsx`

| Màn | Bắt buộc |
|---|---|
| Tiến độ (`/stats`) | `PageHeader` "Tiến độ", phụ đề động viên. Thẻ tổng quan (unit hiện tại / chặng, % hoàn thành chặng). 3 `StatTile`: Chuỗi ngày (`flame`, **testId `stat-streak`**, chỉ chứa số), Thời gian học (`clock`, dạng "14g 30p"), Bài đã xong (`star`). Heatmap: ô bo góc, thang màu accent theo token, có `aria-label` trên phần tử có role phù hợp. Biểu đồ từ đã thuộc: SVG tự vẽ dùng token (không thêm thư viện chart). Điểm kiểm tra: `ListGroup`. ≥lg: 2 cột. |
| Kho từ (`/words`) | `PageHeader` "Kho từ", back `/`, nút "Thêm từ" mở `Sheet` chứa form (không gửi chuỗi rỗng cho trường tuỳ chọn — bỏ trường đó). Ô tìm `TextField` (label "Tìm từ"). Lọc trạng thái: **`Segmented` label "Trạng thái"** với Tất cả / Mới / Đang học / Đã thuộc. **Một cấu trúc DOM duy nhất**: danh sách mỗi từ là phần tử `data-testid="word-row"` (headword, IPA, nghĩa, badge trạng thái, loa); ≥lg CSS grid thành dạng bảng có hàng tiêu đề. Rỗng ⇒ `EmptyState` tiêu đề **"Không có từ nào"** (giữ chữ — E2E). |
| Cá nhân / Cài đặt (`/settings`) | Dùng `useCurrentProfile()` / `CURRENT_PROFILE_KEY` từ `src/shell/require-profile.tsx` thay cho key `['profile', 'current']` ghi cứng trong `profile-settings.tsx`. `PageHeader` "Cá nhân". Thẻ hồ sơ đầu trang (avatar lớn, tên, số phút/ngày) + `ButtonLink` **"Đổi hồ sơ"** → `/profiles?manual=1`. Các nhóm `ListGroup`: Hồ sơ (sửa tên/avatar/PIN/phút trong `Sheet`, xoá hồ sơ bằng `ConfirmDialog` destructive), Giọng đọc (`Select` giọng + tốc độ, nút nghe thử), Nội dung (import JSON), Sao lưu (danh sách, tạo, khôi phục, thư mục, tải .db), Chuyển hồ sơ (xuất/nhập), Ứng dụng (mở thư mục log, Tắt app). Giữ mọi hành vi trong `settings-page.test.tsx`. Hai chỗ đang dùng `window.confirm` (khôi phục bản sao lưu trong `backup-settings.tsx`, xoá hồ sơ trong `profile-settings.tsx`) đổi sang `ConfirmDialog` cùng nội dung câu hỏi; test đang stub `window.confirm` đổi sang bấm nút xác nhận trong dialog. |
| Chọn hồ sơ (`/profiles`) | Toàn màn nền gradient, tiêu đề "Ai đang học?". Lưới avatar tròn lớn + tên (nút có tên accessible chứa tên hồ sơ — E2E bấm `/Lan/`). Có PIN ⇒ `Sheet` nhập PIN (input số, `inputMode="numeric"`). Ô "+ Thêm hồ sơ" → `/profiles/new`. Giữ logic `?manual=1`, tự vào khi chỉ có 1 hồ sơ không PIN, loading/error state. **Giữ `data-testid="page-profiles"`**. |
| Tạo hồ sơ (`/profiles/new`) | Form một cột kiểu grouped: `TextField` **label "Tên"** (E2E dùng `getByLabel('Tên')`), `AvatarPicker` dạng lưới, PIN tuỳ chọn, số phút/ngày, giọng đọc. Nút **"Tạo hồ sơ"** (giữ chữ). Giữ chống tạo trùng khi thử lại. |

---

### Task 8: Cập nhật E2E

**Files:** `frontend/e2e/study.spec.ts`

- [ ] **Step 1: Sửa selector theo giao diện mới**

Trong `e2e/study.spec.ts`:
- `page.getByRole('link', { name: 'Thống kê' })` → `page.getByRole('link', { name: 'Tiến độ' })`.
- Trong test hai hồ sơ: `page.getByLabel('Trạng thái').selectOption('LEARNING')` → `page.getByRole('radio', { name: 'Đang học' }).click()` (dùng đúng role mà `Segmented` chốt ở Task 4).
- `page.locator('tbody tr').first()` → `page.getByTestId('word-row').first()`.
- Nếu Task 5–7 đổi chữ nào mà E2E dùng thì cập nhật cho khớp (danh sách chữ được giữ đã ghi trong từng task; mọi thay đổi phải có lý do trong báo cáo).

- [ ] **Step 2: Build jar có giao diện mới và chạy E2E**

Run (từ thư mục gốc repo):
```bash
cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw -q -Papp clean package -DskipTests && cd ../frontend && JAVA_HOME=$(/usr/libexec/java_home -v 21) npx playwright test
```
Expected: 3 test PASS. Nếu máy không có Microsoft Edge (`channel: 'msedge'`), chạy tạm bằng Chromium của Playwright mà **không sửa** `playwright.config.ts`: `npx playwright install chromium && npx playwright test --config=<bản sao tạm trong scratchpad đặt channel undefined>`; ghi rõ trong báo cáo là đã chạy bằng Chromium.

- [ ] **Step 3: Commit**

```bash
git add e2e/study.spec.ts
git commit -m "test(e2e): cập nhật selector theo giao diện mới

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Review tổng

**Files:** chỉ đọc + báo cáo; sửa nhỏ được phép nếu kèm test.

- [ ] **Step 1:** `npm test && npm run build` PASS; ghi số test.
- [ ] **Step 2:** Đối chiếu spec §1–§7 từng mục, ghi mục chưa đạt.
- [ ] **Step 3:** Chụp mọi màn (13 URL) ở 390×844 và 1280×800, sáng và tối bằng Playwright MCP; lưu vào scratchpad; nhận xét theo skill `apple-design` / `emil-design-eng` (phân cấp thị giác, khoảng cách, tương phản, nhất quán màu kỹ năng).
- [ ] **Step 4:** Chạy skill `break-ui` trên Hôm nay, Kho từ, Tiến độ, Chọn hồ sơ (tên dài, rỗng, số lớn).
- [ ] **Step 5:** Kiểm tra offline: `grep -rnE "https?://" src index.html` không có tài nguyên tải lúc chạy (link tài liệu trong comment thì được).
- [ ] **Step 6:** Kiểm tra kebab-case: `git ls-files src e2e | grep -E '[A-Z]'` rỗng.
- [ ] **Step 7:** Gom component cục bộ các task 5–7 báo cáo có thể đưa về `src/ui` (đề xuất, không tự làm nếu lớn).
- [ ] **Step 8:** Cập nhật `frontend/CLAUDE.md`: mục Kiến trúc (axios `http` + adapter giả trong test, `router.tsx`, `shell/`, `src/ui`, token), mục Test (`renderRoute`, `mockNetworkDown`), bỏ mô tả cũ về `.btn/.card` trong `index.css`. Commit `docs(frontend): cập nhật CLAUDE.md theo giao diện mới`.
- [ ] **Step 9:** Báo cáo: đã đạt / chưa đạt / đề xuất, kèm đường dẫn ảnh chụp.

---

## Đợt 2 — sau review tổng (bổ sung 2026-10-13)

Nguồn: báo cáo review tổng (Task 9) và báo cáo đối chiếu skill `apple-design` (56% quy tắc đạt hẳn, 4 vi phạm — chủ yếu ở cử chỉ kéo sheet và lò xo).

### Task 10: Chữ & font
- Font: SF Pro hệ thống trên máy Apple (`-apple-system`), **Inter** đóng gói qua `@fontsource-variable/inter` cho máy khác; không nhúng font của Apple. Kiểm tra tiếng Việt + IPA.
- Cỡ chữ mặc định 14px qua thang token (không đổi `font-size` của `html`); ô nhập 16px trên `pointer: coarse`; quét bỏ cỡ chữ viết cứng.
- Tracking theo cỡ, line-height ≈1.45 cho tiếng Việt nhiều dòng, chữ trên vật liệu kính đủ tương phản.
- Lỗi nhỏ: thanh trượt sáng trong chế độ tối, "Band 4" mồ côi, tiêu đề tên dài, màu "Chưa đạt" thống nhất, trạng thái rỗng cho hồ sơ mới, gộp `PracticeTile` vào `SkillTile`, ô không phải kỹ năng không mượn màu kỹ năng.

### Task 10b: Chuyển `src/ui` → `src/components/ui` (sau Task 10, trước Task 11/13)
- `git mv frontend/src/ui frontend/src/components/ui`; test tương ứng `frontend/test/ui` → `frontend/test/components/ui` (giữ cấu trúc gương với `src/`).
- Sửa mọi import: trong `src/` dùng đường dẫn tương đối mới; trong `test/` dùng `@/components/ui/…`. Kiểm tra `grep -rnE "(/|@/)ui/" src test` chỉ còn `components/ui`.
- Cập nhật `frontend/CLAUDE.md`, ghi chú trong code (`src/ui` → `src/components/ui`). Commit riêng chỉ đổi đường dẫn; test + build xanh, cùng số test.

### Task 11: Chuyển động theo `apple-design` (chạy song song Task 13)
- `src/components/ui/motion.ts`: một nguồn lò xo — chạm/nhấn không nảy; nảy nhẹ (bounce ≈0.2) chỉ sau cử chỉ kéo; `visualDuration`.
- Sheet: đi theo ngón tay 1:1, thả quyết định bằng **phép chiếu quán tính** (deceleration 0.998) + **hướng vận tốc lúc thả**, lò xo ngăn kéo của Apple (damping 0.8, ~0.31s), rubber-band tăng dần ở mép trên (hằng số 0.55), bắt lại được khi đang đóng, kéo được từ nội dung khi đã cuộn tới đầu; reduced-motion → mờ dần.
- Flashcard: lật bằng `rotateY` dạng số (ngắt giữa chừng giữ vận tốc); đưa focus về nút chấm sau khi lật.
- TopBar: lớp kính hiện dần theo cuộn, viền mềm. Lộ trình: mở unit + chevron chung một lò xo. Reduced-transparency tắt blur.
- Thay "✓"/"🎉" bằng icon (cập nhật E2E theo).

### Task 13: Tải trang lười + lỗi theo shell (worktree riêng, song song Task 11)
- Route `lazy` cho từng trang (React Router 8), tách `react-markdown`/`remark-gfm` vào chunk của bài học; `motion` chỉ phần cần (`LazyMotion` nếu hợp lý, giữ `layoutId`).
- `errorElement` cho từng shell (AppShell/FocusShell) để lỗi một trang không làm mất khung điều hướng.
- Ẩn "Thử lại" với lỗi 4xx không thử lại được; trang bài học không báo lỗi hai lần.
- Mục tiêu: chunk khởi đầu < 500 kB, không còn cảnh báo kích thước của Vite.

### Task 12: Gom component dùng chung về `src/components/ui` (sau Task 11)
- Chuyển `Eyebrow`/`SectionTitle`, `IconChip`, `DownloadRow`, `FileRow`, `GroupItem`, `FormGroup`, `Kbd` vào `src/components/ui` (kebab-case, có test); giữ cục bộ các mảnh chỉ dùng một chỗ (`OptionChoice`, `UnitRow`, `ResultCard`…).

### Task 14: E2E + review cuối đợt 2
- Build jar `-Papp`, chạy E2E; đối chiếu lại skill `apple-design`; cập nhật `frontend/CLAUDE.md`.
