# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend của IELTS App — xem `../CLAUDE.md` cho bức tranh chung. Mọi lệnh dưới đây chạy trong `frontend/`.

## Lệnh

```bash
npm run dev                                   # http://localhost:5173, proxy /api → 127.0.0.1:8765 (cần backend chạy)
npm run build                                 # tsc --noEmit rồi vite build → dist/
npm test                                      # vitest run (jsdom)
npx vitest run src/components/flashcard.test.tsx        # một file
npx vitest run -t "lật thẻ"                             # lọc theo tên test
npx playwright test                           # E2E: cần jar đã build bằng -Papp và JAVA_HOME = JDK 21
```

Node ≥ 22.22 — `src/engines.test.ts` kiểm tra cả trường `engines` lẫn phiên bản Node đang chạy, nên `npm test` đỏ trên Node cũ.

Phiên bản thư viện mới hơn tên thường gặp (React Router **8**, Vite 8, Vitest 5, TypeScript 7, Tailwind 4): import router từ `react-router` (không có `react-router-dom`). Tra tài liệu đúng phiên bản trước khi dùng API lạ.

## Kiến trúc

**Đặt tên**: file và thư mục trong `src/`, `e2e/` dùng kebab-case (`session-page.tsx`, `query-client.ts`); tên component/hàm trong code giữ PascalCase/camelCase.

**Gọi API**: mọi request qua `src/api/client.ts` (`api.get/post/put/del`, đường dẫn tương đối `/api…`, cookie session `same-origin`). Lỗi được chuẩn hoá thành `ApiError(status, code, message, errors)` đọc từ ProblemDetail của backend; lỗi mạng → `code: 'NETWORK'`. Khi gặp `PROFILE_REQUIRED`, handler đăng ký trong `app.tsx` xoá cache (trừ `profiles`, `health`) và đưa về `/profiles`. Thêm endpoint thì khai trong `src/api/endpoints.ts`, kiểu trong `src/api/types.ts` — trang không gọi `fetch` trực tiếp.

**TanStack Query** (`src/api/query-client.ts`): không retry, không refetch khi focus. `QueryCache`/`MutationCache` tự hiện toast cho mọi lỗi; đặt `meta: { silent: true }` khi trang tự xử lý lỗi (ví dụ `SessionPage` tự reload khi gặp `CARD_MISMATCH`/`NO_SESSION`/`WRONG_STEP`). Trang có query chính thì hiển thị `<QueryError>` (thông báo + Thử lại + link quay về) thay vì kẹt ở "Đang tải…".

**Định tuyến** (`app.tsx`): `/profiles`, `/profiles/new` ở ngoài; mọi trang khác nằm trong `<Layout>` (thanh điều hướng, banner sức khoẻ/giọng đọc, nút tắt app). Trang ở `src/pages/`, thành phần dùng chung ở `src/components/`, nhãn tiếng Việt cho enum backend ở `components/labels.ts`.

**Buổi học**: `SessionPage` render theo `step` do backend trả (`REVIEW`/`NEW` → `Flashcard`, `LESSON` → `LessonView`, `DONE`). Kết quả chấm thẻ ghi thẳng vào cache bằng `setQueryData(['session','today'], …)`; frontend không tự suy trạng thái buổi học.

**Flashcard**: phím `Space` lật, `1–4` chấm. Bỏ qua `e.repeat` và phím có Ctrl/Alt/Meta để giữ phím không chấm SM-2 nhiều lần; `Space` không lật khi focus đang ở nút/link khác. Ô gõ (FILL/DICTATION) tắt spellcheck, `Enter` không nộp cả bài.

**Âm thanh** (`src/speech/speech.ts`): chỉ dùng Web Speech API (`speechSynthesis`, giọng có sẵn của Windows, offline). `configureSpeech` nhận giọng/tốc độ từ hồ sơ; "nghe chậm" tính tương đối theo `currentSpeechRate()`. Máy không có giọng `en-*` thì `speak()` trả `false` và `VoiceBanner` hướng dẫn cài giọng — các tính năng khác vẫn phải dùng được. Không thêm thư viện TTS/âm thanh từ mạng: app phải chạy offline.

**Style**: Tailwind 4 qua `@tailwindcss/vite`, không có `tailwind.config`. Các lớp thành phần dùng chung (`.btn`, `.btn-primary`, `.card`, `.input`, `.badge`, `.markdown …`) khai trong `src/index.css` — dùng lại thay vì viết lại chuỗi utility. Nội dung bài học là Markdown render bằng `react-markdown` trong khối `.markdown`.

## Test

- Vitest + Testing Library, `globals: true`, setup ở `src/test/setup.ts` (tự `unstubAllGlobals`/`restoreAllMocks` sau mỗi test).
- Render bằng `renderAt(ui, route)` (`src/test/render.tsx`) — tạo QueryClient thật + `MemoryRouter`.
- Giả lập backend bằng `mockApi({ 'GET /session/today': () => ({ body: … }) })` (`src/test/mock-api.ts`): khoá là `"METHOD /path?query"` **không** có tiền tố `/api`; thiếu handler → 404 JSON. Trả về mảng `calls` để kiểm tra request đã gửi. Lỗi dạng ProblemDetail dùng `problem(status, code, detail)`.
- `speech-stub.ts` để giả `speechSynthesis` trong jsdom.
- Mỗi trang có `data-testid="page-…"`, các chỉ số quan trọng có testid riêng (`session-step`, `stat-streak`…) — test và E2E (`e2e/study.spec.ts`) bám vào đó, đổi testid thì sửa test theo.
- E2E: `e2e/start-app.mjs` chạy jar thật ở `backend/target/` với thư mục dữ liệu tạm `%TEMP%/ielts-e2e` (xoá sạch mỗi lần), cổng 8775, trình duyệt Edge (`channel: 'msedge'`).
