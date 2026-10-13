# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend của IELTS App — xem `../CLAUDE.md` cho bức tranh chung. Mọi lệnh dưới đây chạy trong `frontend/`.

## Lệnh

```bash
npm run dev                                   # http://localhost:5173, proxy /api → 127.0.0.1:8765 (cần backend chạy)
npm run build                                 # tsc --noEmit rồi vite build → dist/
npm test                                      # vitest run (jsdom)
npx vitest run test/components/flashcard.test.tsx       # một file
npx vitest run -t "lật thẻ"                             # lọc theo tên test
npx playwright test                           # E2E: cần jar đã build bằng -Papp và JAVA_HOME = JDK 21
```

Node ≥ 22.22 — `test/engines.test.ts` kiểm tra cả trường `engines` lẫn phiên bản Node đang chạy, nên `npm test` đỏ trên Node cũ.

Phiên bản thư viện mới hơn tên thường gặp (React Router **8**, Vite 8, Vitest 5, TypeScript 7, Tailwind 4): import router từ `react-router` (không có `react-router-dom`). Tra tài liệu đúng phiên bản trước khi dùng API lạ.

## Kiến trúc

**Đặt tên**: file và thư mục trong `src/`, `e2e/` dùng kebab-case (`session-page.tsx`, `query-client.ts`); tên component/hàm trong code giữ PascalCase/camelCase.

**Gọi API**: mọi request qua `src/api/client.ts` (`api.get/post/put/del`, đường dẫn tương đối `/api…`, cookie session cùng origin tự gửi) — bản thân `client.ts` chỉ là wrapper mỏng gọi instance axios `http` (`baseURL: '/api'`, adapter mặc định XHR) khai ở `src/config/axios.ts`; interceptor chuẩn hoá lỗi nằm ở `src/config/interceptors.ts`. Chiều phụ thuộc một chiều: `api/client` → `config/axios` → `config/interceptors` → `api/api-error`. Đừng đặt `adapter: 'fetch'` (adapter đó dựng `new Request('/api/…')` với URL tương đối, jsdom/Node từ chối → mọi request thành NETWORK trong test). Lỗi được chuẩn hoá thành `ApiError(status, code, message, errors)` (`src/api/api-error.ts`) đọc từ ProblemDetail của backend; lỗi mạng → `code: 'NETWORK'`. Khi gặp `PROFILE_REQUIRED`, handler `registerProfileRequiredHandler` (`app.tsx`, gọi đồng bộ trong `main.tsx` ngay sau khi tạo router + queryClient) xoá cache (trừ `profiles`, `health`) và đưa về `/profiles`. Thêm endpoint thì khai trong `src/api/endpoints.ts`, kiểu trong `src/types/api.ts` — trang không gọi `fetch` trực tiếp.

**TanStack Query** (`src/config/query-client.ts`): không retry, không refetch khi focus. `QueryCache`/`MutationCache` tự hiện toast cho mọi lỗi; đặt `meta: { silent: true }` khi trang tự xử lý lỗi (ví dụ `SessionPage` tự reload khi gặp `CARD_MISMATCH`/`NO_SESSION`/`WRONG_STEP`). Trang có query chính thì hiển thị `<QueryError>` (thông báo + Thử lại + link quay về) thay vì kẹt ở "Đang tải…".

**Cấu trúc `src/`**: `config/` hạ tầng (axios, interceptor, TanStack Query); `types/` chỉ chứa kiểu (`api.ts` DTO backend, `skill.ts`, `icon.ts`) — giá trị như `SKILL_META` ở nơi dùng (`ui/skill.ts`); `api/` chỉ có `ApiError`, wrapper `api.*` và `endpoints`; `ui/` bộ thành phần dùng chung; `shell/` khung app; `pages/` các màn (`pages/settings/` các nhóm của màn Cá nhân); `components/` thành phần nghiệp vụ (flashcard, lesson-view, exercise-set, heatmap…), nhãn tiếng Việt cho enum backend ở `components/labels.ts`.

**Định tuyến** (`src/router.tsx`): mảng `routes` + `createAppRouter()` (`createBrowserRouter`); `main.tsx` tạo router + queryClient rồi render `<App>` (`app.tsx`: `QueryClientProvider` + `RouterProvider` + `Toaster`). Không dùng loader của router — TanStack Query là tầng dữ liệu duy nhất. Cây route:
- `/profiles`, `/profiles/new` — ngoài khung app.
- `RequireProfile` (`shell/require-profile.tsx`: tải hồ sơ hiện tại, `PROFILE_REQUIRED` → `/profiles`, cấu hình giọng đọc; `useCurrentProfile()` dùng chung cache `['profile','current']`), bên trong:
  - `AppShell` (`data-testid="app-shell"`, có nav + banner sức khoẻ/giọng đọc): `/`, `/roadmap`, `/words`, `/ipa`, `/stats`, `/settings`.
  - `FocusShell` (`data-testid="focus-shell"`, toàn màn, không nav; mỗi trang tự có `TopBar`): `/session`, `/review`, `/lessons/:code`, `/units/:code/test`, `/stages/:code/test`.
- `*` → `/`. Lỗi render bắt ở `RouteError` (`errorElement`).

`shell/nav-bar.tsx` render **một** `<nav>` duy nhất: <`lg` là tab bar kính mờ dính đáy, ≥`lg` là sidebar (CSS đổi, không render hai bộ link — trùng tên link làm test và trình đọc màn hình bị lặp). Nút tròn giữa là `shell/center-action.tsx` (`CENTER_ACTION` — đổi đích ở đó, không sửa layout). "Đổi hồ sơ" dẫn tới `/profiles?manual=1` (không tự chọn khi chỉ có một hồ sơ). Nút Tắt app nằm trong Cá nhân → Ứng dụng.

**Buổi học**: `SessionPage` render theo `step` do backend trả (`REVIEW`/`NEW` → `Flashcard`, `LESSON` → `LessonView`, `DONE`). Kết quả chấm thẻ ghi thẳng vào cache bằng `setQueryData(['session','today'], …)`; frontend không tự suy trạng thái buổi học.

**Flashcard**: phím `Space` lật, `1–4` chấm. Bỏ qua `e.repeat` và phím có Ctrl/Alt/Meta để giữ phím không chấm SM-2 nhiều lần; `Space` không lật khi focus đang ở nút/link khác. Ô gõ (FILL/DICTATION) tắt spellcheck, `Enter` không nộp cả bài.

**Âm thanh** (`src/speech/speech.ts`): chỉ dùng Web Speech API (`speechSynthesis`, giọng có sẵn của Windows, offline). `configureSpeech` nhận giọng/tốc độ từ hồ sơ; "nghe chậm" tính tương đối theo `currentSpeechRate()`. Máy không có giọng `en-*` thì `speak()` trả `false` và `VoiceBanner` hướng dẫn cài giọng — các tính năng khác vẫn phải dùng được. Không thêm thư viện TTS/âm thanh từ mạng: app phải chạy offline.

**Style**: Tailwind 4 qua `@tailwindcss/vite`, không có `tailwind.config`. Sáng/tối theo `prefers-color-scheme`, không có nút chuyển. Token ở `src/styles/tokens.css`: màu đổi theo chế độ khai ở `:root` (bản tối trong `@media (prefers-color-scheme: dark)`) rồi nối vào Tailwind bằng `@theme inline` (`bg-surface`, `text-text-2`, `bg-accent`, `text-grammar`…); hằng số không đổi giữa sáng/tối (`--radius-card/control/pill`, `--font-sans`, `--ease-out`, `--ease-in-out`) khai **một lần** bằng giá trị thật trong `@theme static` (`rounded-card`, `ease-out`, `var(--radius-card)` đều dùng được) — đừng khai lại chúng ở `:root` hay trỏ `--x: var(--x)` (tự tham chiếu). Thời lượng chuyển động dùng token `--duration-press/fast/base/progress` qua `duration-(--duration-fast)`, không viết `duration-200` trần. Component không dùng mã màu cứng. Màu kỹ năng (`grammar/pronunciation/listening/reading/vocab`, nguồn sự thật `SKILL_META` trong `ui/skill.ts`, lớp `tone-*` qua `toneClass()`) chỉ dùng cho thứ thuộc về loại bài; trạng thái dùng `tone-success/warning/danger`, còn lại `tone-accent`/`tone-neutral`. Không tải gì từ mạng lúc chạy (font hệ thống, icon SVG nội tuyến ở `ui/icons.tsx`). Thành phần dùng chung ở `src/ui/` (`Button` (biến thể `primary/secondary/ghost/danger/danger-solid`), `Card`, `ListGroup/ListRow`, `ProgressBar`, `StatTile`, `SkillTile`, `Segmented` (role `radio`), `Sheet`, `ConfirmDialog`, `TextField`, `Select`, `Switch`, `Badge`, `EmptyState`, `Skeleton`, `PageHeader`, `TopBar`, `Icon`…) — dùng lại thay vì viết chuỗi utility; các lớp `.btn/.card/.input/.badge` cũ đã bỏ. Lớp tiện ích trong `src/index.css`: `pressable`, `focus-ring`, `material`, `card-edge`, `text-large-title`, `tone-*`/`tone-chip`. Toast bằng `sonner` qua `toast()`/`notifyError()` của `components/toaster`. Nội dung bài học là Markdown render bằng `react-markdown` trong khối `.markdown`.

## Test

- Test nằm ở `test/` ngang hàng `src/`, cùng cấu trúc thư mục (`src/pages/today-page.tsx` ↔ `test/pages/…test.tsx`). Helper ở `test/support/`. Import code bằng `@/…`, helper bằng `@test/…`.
- Vitest + Testing Library, `globals: true`, setup ở `test/support/setup.ts` (tự `unstubAllGlobals`/`restoreAllMocks` sau mỗi test).
- Render (`test/support/render.tsx`): `renderAt(ui, route)` — QueryClient thật + `MemoryRouter`, cho trang/component lẻ (trang dùng `useCurrentProfile` thì mock thêm `GET /profiles/current`); `renderRoute(path)` — cả cây `routes` thật qua `createMemoryRouter` (có `RequireProfile` + shell), trả thêm `router` để đọc `router.state.location`.
- Giả lập backend bằng `mockApi({ 'GET /session/today': () => ({ body: … }) })` (`test/support/mock-api.ts`, thay `http.defaults.adapter` của instance axios): khoá là `"METHOD /path?query"` **không** có tiền tố `/api`; thiếu handler → 404 JSON. Trả về mảng `calls` để kiểm tra request đã gửi. Lỗi dạng ProblemDetail dùng `problem(status, code, detail)`; mất kết nối dùng `mockNetworkDown()`. `setup.ts` tự `resetApiMock()` sau mỗi test và giả `matchMedia` (không query nào khớp → bố cục điện thoại, không reduced-motion).
- `stubSpeech()` (`test/support/speech-stub.ts`) để giả `speechSynthesis` trong jsdom.
- Mỗi trang có `data-testid="page-…"`, các chỉ số quan trọng có testid riêng (`session-step` + `data-step`, `stat-streak`, `today-streak`, `word-row`, `app-shell`/`focus-shell`…) — test và E2E (`e2e/study.spec.ts`) bám vào đó, đổi testid thì sửa test theo.
- Chọn theo vai trò: `Segmented` là `radio` (`getByRole('radio', { name: 'Đang học' })`); link "Hôm nay" cần `exact: true` vì nút giữa tên "Buổi học hôm nay"; Kho từ là `role="table"`/`row` (không còn `tbody tr`).
- E2E: `e2e/start-app.mjs` chạy jar thật ở `backend/target/` với thư mục dữ liệu tạm `%TEMP%/ielts-e2e` (xoá sạch mỗi lần), cổng 8775, trình duyệt Edge (`channel: 'msedge'`). `/session` nằm trong FocusShell (không có nav) — muốn sang trang khác phải về trang chủ trước.
