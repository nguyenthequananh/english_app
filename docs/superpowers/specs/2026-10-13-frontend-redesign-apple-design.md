# Giao diện mới theo phong cách Apple – Thiết kế

- Ngày: 2026-10-13
- Trạng thái: đã duyệt
- Phạm vi: chỉ `frontend/`. Không đổi API backend, không đổi nội dung.

## 1. Mục tiêu

Làm lại toàn bộ giao diện theo nguyên tắc thiết kế của Apple (skill `apple-design`, `emil-design-eng`, `mobile-native` trong `.claude/skills/`) và ảnh mẫu do người dùng cung cấp (app học tiếng Anh trên iPhone: nền dải màu mềm, thẻ trắng bo tròn, tab bar dưới có nút tròn nổi ở giữa, màu nhấn tím).

- **Mobile-first**: màn điện thoại là thiết kế gốc, sau này sẽ đóng gói thành app. Trên màn rộng thì bố cục kiểu web.
- **Sáng + tối** theo cài đặt hệ thống (`prefers-color-scheme`), không có nút chuyển.
- Đồng thời đổi nền tảng frontend: gọi API bằng **axios**, định tuyến bằng **`createBrowserRouter`**, dữ liệu vẫn qua **TanStack Query**.

**Tiêu chí thành công**
- Mọi màn hiện có đều được làm lại, chạy đúng ở 390px và 1280px, cả sáng lẫn tối.
- Hành vi học giữ nguyên: buổi học, flashcard (phím `Space`, `1–4`), chấm bài, mở khoá unit, sao lưu, đổi hồ sơ.
- `npm test`, `npm run build` và E2E đều xanh.
- App vẫn chạy 100% offline: không tải font, icon, CSS từ mạng lúc chạy.

**Ngoài phạm vi:** chế độ giao tiếp với AI (spec giai đoạn 1 quy định "không AI" — cần spec riêng), mọi thay đổi backend, đóng gói app mobile/desktop, kiến trúc backend cho mobile.

## 2. Ngôn ngữ hình ảnh

### Token

Mọi màu, bóng, bán kính, đường cong chuyển động khai báo một lần dưới dạng biến CSS trong `src/styles/tokens.css`, nối vào Tailwind 4 bằng `@theme`. Component không dùng mã màu cứng.

| Nhóm | Sáng | Tối |
|---|---|---|
| Nền trang | dải màu mềm: xanh trời → bạc hà → hồng đào, độ bão hoà thấp | xanh đen, cùng dải màu nhưng tối và dịu |
| Bề mặt thẻ | trắng | xám than hơi trong |
| Vật liệu kính (thanh trên, tab bar, sidebar) | trắng bán trong suốt + `backdrop-filter: blur()` + `saturate()` | tối bán trong suốt, cùng kỹ thuật |
| Chữ | 3 cấp: chính / phụ / mờ | tương ứng |
| Nhấn chính | tím (vùng `#7C5CFC`) | tím sáng hơn một bậc để đủ tương phản |
| Màu kỹ năng | Ngữ pháp xanh dương · Phát âm tím · Nghe xanh ngọc · Đọc cam · Từ vựng đỏ | biến thể sáng hơn |
| Trạng thái | thành công xanh lá · cảnh báo hổ phách · lỗi đỏ | tương ứng |

- Tương phản chữ/nền đạt WCAG AA ở cả hai chế độ.
- Thẻ: bán kính 20–24px, phân tầng bằng bóng bán trong suốt nhiều lớp thay cho viền đặc. Ở chế độ tối dùng viền 1px rất mờ thay bóng.
- Màu kỹ năng dùng nhất quán ở mọi nơi nhắc tới loại bài (lưới luyện tập, lộ trình, thanh tiến độ kỹ năng).

### Chữ

- Font hệ thống: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`. Không nhúng font ngoài. Kiểm tra dấu tiếng Việt và ký tự IPA hiển thị đúng.
- Tiêu đề lớn kiểu iOS (khoảng 34px, đậm, tracking âm nhẹ) ở đầu mỗi màn chính; thu nhỏ vào thanh trên khi cuộn là tuỳ chọn, không bắt buộc.
- Số liệu lớn (chuỗi ngày, %, phút) dùng `font-variant-numeric: tabular-nums`.

### Chuyển động

- Đường cong và thời lượng là token (`--ease-out`, `--ease-in-out`, `--duration-*`); hiệu ứng lò xo dùng thư viện `motion`.
- Nhấn nút: thu về `scale(0.97)` trong 100–160ms, `ease-out`.
- Sheet trượt từ dưới lên, chỉ báo tab đang chọn trượt theo, lật flashcard: dùng lò xo, ngắt giữa chừng được.
- Không animate thao tác lặp tần suất cao (chấm thẻ liên tiếp không có hiệu ứng làm chậm nhịp).
- `prefers-reduced-motion: reduce` → bỏ chuyển động vị trí/tỉ lệ, chỉ giữ đổi độ mờ ngắn.

## 3. Bố cục

### Điện thoại (< 768px)

- **Tab bar** kính mờ cố định dưới đáy, tôn trọng `env(safe-area-inset-bottom)`: **Hôm nay** (`/`) · **Lộ trình** (`/roadmap`) · **[nút tròn giữa]** · **Tiến độ** (`/stats`) · **Cá nhân** (`/settings`).
- **Nút tròn giữa**: tạm thời là "Bắt đầu buổi học" / "Tiếp tục buổi học" → `/session`. Thiết kế nút như một ô có thể đổi đích để sau này trỏ sang chế độ giao tiếp AI mà không phải sửa layout.
- **Hôm nay** có lưới **Luyện tập** (giống "Practice Now" trong ảnh mẫu): Ôn thẻ (`/review`), Kho từ (`/words`), Phát âm IPA (`/ipa`), Lộ trình. Đây là đường vào các màn không có trên tab bar.
- **Cá nhân** chứa thông tin hồ sơ, nút **Đổi hồ sơ**, và các nhóm cài đặt hiện có.
- Màn phụ trong tab (Kho từ, IPA) có thanh trên với nút quay lại.

### Màn rộng (≥ 1024px) — bố cục web

- Sidebar kính mờ bên trái chứa cùng các mục điều hướng, nút "Bắt đầu buổi học" nổi bật ở đầu sidebar, thẻ hồ sơ + Đổi hồ sơ ở cuối.
- Nội dung rộng tối đa ~1100px; Hôm nay và Tiến độ chia 2 cột; Kho từ có thể hiện dạng bảng.
- 768–1023px: dùng bố cục điện thoại với nội dung căn giữa, rộng tối đa ~640px.

**Ràng buộc:** chỉ render **một** phần tử `<nav>`; CSS đổi nó thành tab bar hay sidebar theo độ rộng. Không render hai bộ link song song (trùng tên link làm test và trình đọc màn hình bị lặp).

### Màn tập trung

Buổi học (`/session`), Ôn thẻ (`/review`), Bài học (`/lessons/:code`), Kiểm tra (`/units/:code/test`, `/stages/:code/test`): toàn màn hình, **ẩn tab bar/sidebar**. Thanh trên gồm nút quay lại tròn, tiêu đề + phụ đề ở giữa (như màn giữa của ảnh mẫu). Thanh tiến độ của buổi học nằm ngay dưới thanh trên.

### Chi tiết "như app thật" (skill `mobile-native`)

- `viewport-fit=cover`, `env(safe-area-inset-*)` cho thanh trên và tab bar; `min-height: 100dvh` thay `100vh`.
- `-webkit-tap-highlight-color: transparent`; hiệu ứng hover chỉ trong `@media (hover: hover)`.
- Ô nhập có `font-size` ≥ 16px để iOS không tự zoom.
- `<meta name="theme-color">` cho cả hai chế độ; `color-scheme: light dark`.
- Không cho chọn chữ trên nút/thẻ điều hướng khi nhấn giữ.

## 4. Kiến trúc frontend

### Đặt tên file và thư mục

Mọi file và thư mục trong `frontend/src/` và `frontend/e2e/` dùng **kebab-case**. Tên component/hàm/kiểu xuất ra trong code giữ nguyên quy ước (PascalCase cho component, camelCase cho hàm) — chỉ đổi tên file.

| Cũ | Mới |
|---|---|
| `App.tsx`, `App.test.tsx` | `app.tsx`, `app.test.tsx` |
| `pages/SessionPage.tsx` | `pages/session-page.tsx` |
| `pages/settings/BackupSettings.tsx` | `pages/settings/backup-settings.tsx` |
| `components/Flashcard.test.tsx` | `components/flashcard.test.tsx` |
| `api/queryClient.ts` | `api/query-client.ts` |
| `ipa/ipaData.ts`, `test/mockApi.ts`, `test/speechStub.ts` | `ipa/ipa-data.ts`, `test/mock-api.ts`, `test/speech-stub.ts` |

- File mới tạo (`src/ui/*`, `src/router.tsx`, `src/styles/tokens.css`…) cũng theo kebab-case: `src/ui/progress-bar.tsx`, `src/ui/list-row.tsx`.
- Đổi tên bằng `git mv` để giữ lịch sử. macOS/Windows không phân biệt hoa thường nên file chỉ khác hoa/thường (`Flashcard.tsx` → `flashcard.tsx`) phải đổi qua tên trung gian: `git mv Flashcard.tsx flashcard.tmp.tsx && git mv flashcard.tmp.tsx flashcard.tsx`.
- Test tách khỏi `src/`: mọi `*.test.ts(x)` nằm trong `frontend/test/` ngang hàng `src/`, cùng cấu trúc thư mục; helper test ở `frontend/test/support/`. Test import code bằng alias `@/` (→ `src/`), helper bằng `@test/` (→ `test/support/`). Commit riêng, ngay sau commit đổi tên.
- Làm thành **một commit riêng chỉ đổi tên + sửa import**, test xanh, trước mọi thay đổi giao diện — để diff design không lẫn với diff đổi tên.

### Định tuyến

- `src/router.tsx` khai báo cây route bằng `createBrowserRouter`; `main.tsx` render `<RouterProvider>` bên trong `QueryClientProvider`.
- Cây route:
  - `/profiles`, `/profiles/new` — ngoài khung app.
  - Route layout **AppShell** (cần hồ sơ; có nav): `/`, `/roadmap`, `/words`, `/ipa`, `/stats`, `/settings`.
  - Route layout **FocusShell** (cần hồ sơ; không nav): `/session`, `/review`, `/lessons/:code`, `/units/:code/test`, `/stages/:code/test`.
  - `*` → về `/`.
- Mỗi layout có `errorElement` hiển thị lỗi thân thiện thay cho trang trắng.
- **Giữ nguyên mọi URL** để đường dẫn cũ, F5 ở đường dẫn con và backend `SpaForwardController` vẫn đúng.
- Không dùng loader của router để tải dữ liệu — TanStack Query vẫn là tầng dữ liệu duy nhất.
- Xử lý `PROFILE_REQUIRED`: xoá cache (trừ `profiles`, `health`) rồi `router.navigate('/profiles', { replace: true })` — cùng hành vi hiện tại.

### Gọi API bằng axios

- `src/api/client.ts` xuất một instance axios `http` (`baseURL: '/api'`, adapter mặc định — XHR trên trình duyệt, cookie cùng origin tự gửi).
- Test giả backend bằng cách thay `http.defaults.adapter` (helper `mockApi` giữ nguyên chữ ký và khoá `"METHOD /path"`). **Không** dùng `adapter: 'fetch'`: adapter đó tự dựng `new Request('/api/…')` với URL tương đối, môi trường test (Node) từ chối nên mọi request thành lỗi mạng.
- Interceptor phản hồi giữ **nguyên hợp đồng** hiện tại:
  - lỗi có ProblemDetail → `ApiError(status, code, detail, errors)`;
  - không phải JSON → `code: HTTP_<status>`;
  - không kết nối được → `ApiError(0, 'NETWORK', 'Không kết nối được tới app. App có thể đã tắt, hãy mở lại.')`;
  - `PROFILE_REQUIRED` → gọi handler đã đăng ký.
- `api.get/post/put/del` và `src/api/endpoints.ts` giữ chữ ký cũ để trang không phải đổi cách gọi. Upload `FormData` và tải file vẫn chạy.

### Thư viện thêm

| Thư viện | Dùng cho |
|---|---|
| `axios` | gọi API |
| `motion` | lò xo: sheet, chỉ báo tab, lật thẻ, chuyển màn |
| `sonner` | thay `components/Toaster` tự viết; giữ API `notifyError` cho nơi đang gọi |
| base-ui (tên gói npm hiện hành, tra trước khi cài) | Dialog, Sheet, Tabs/Segmented, Switch, Select có sẵn a11y |
| `clsx`, `class-variance-authority` | lớp CSS có điều kiện và biến thể component |

Icon: SVG nội tuyến trong `src/ui/icons.tsx` (nét 1.75–2px, góc bo, theo tinh thần SF Symbols). Không dùng emoji làm icon điều hướng.

### Thành phần dùng chung — `src/ui/`

`Button` (primary / secondary / ghost / danger, size sm/md/lg, trạng thái loading), `IconButton` (tròn, như nút quay lại), `Card`, `ListRow` / `ListGroup` (kiểu bảng cài đặt iOS), `ProgressBar`, `ProgressRing`, `StatTile` (icon + số lớn + nhãn), `SkillTile` (ô màu kỹ năng như "Practice Now"), `Segmented`, `Sheet`, `Dialog`, `TextField`, `Select`, `Switch`, `Badge`, `EmptyState`, `Skeleton`, `PageHeader` (tiêu đề lớn + phụ đề + hành động), `TopBar` (màn tập trung), `NavBar` (một `<nav>` responsive), `CenterAction` (nút tròn giữa).

`QueryError`, `HealthBanner`, `VoiceBanner`, `SpeakButton` được làm lại bằng các thành phần trên, giữ nguyên hành vi.

## 5. Từng màn

| Màn | Hướng thiết kế |
|---|---|
| Chọn hồ sơ | Lưới avatar lớn tròn kiểu "Ai đang học?", PIN nhập trong sheet, nút "+ Thêm hồ sơ" |
| Tạo hồ sơ | Form một cột kiểu iOS grouped; chọn avatar dạng lưới |
| Hôm nay | "Chào, \<tên\>" tiêu đề lớn; thẻ buổi học hôm nay (tiến độ, nút Bắt đầu/Tiếp tục); thẻ "Đang học" với unit hiện tại + % lớn + thanh tiến độ; lưới Luyện tập; chuỗi ngày + thẻ đến hạn |
| Buổi học | FocusShell; thanh 3 bước (Ôn tập · Từ mới · Bài chính) gọn; flashcard lớn giữa màn; 4 nút chấm màu theo mức; màn xong có tổng kết |
| Ôn thẻ | Như bước ôn của buổi học, có đếm thẻ còn lại |
| Bài học | FocusShell; lý thuyết Markdown dễ đọc (cỡ chữ, dòng, bảng cuộn ngang trên điện thoại); bài tập từng câu, phản hồi đúng/sai ngay bằng màu + giải thích |
| Kiểm tra | FocusShell; đếm câu, nộp, màn kết quả % lớn, qua/chưa qua, unit yếu |
| Lộ trình | Chặng → Unit dạng danh sách có trạng thái (khoá / đang học / xong); unit đang học nổi bật; mở unit xem các bài theo thứ trong tuần với màu kỹ năng |
| Kho từ | Ô tìm + `Segmented` trạng thái; điện thoại dạng danh sách thẻ từ, màn rộng dạng bảng; thêm từ trong sheet |
| IPA | Lưới ô âm có loa, nhóm nguyên âm / phụ âm |
| Tiến độ | Bố cục theo màn phải của ảnh mẫu: thẻ tổng quan; 3 `StatTile` (chuỗi ngày, thời gian học, bài đã xong); heatmap; biểu đồ từ đã thuộc; điểm kiểm tra |
| Cá nhân / Cài đặt | Thẻ hồ sơ ở đầu + Đổi hồ sơ; các nhóm dạng `ListGroup`: Hồ sơ, Giọng đọc, Nội dung, Sao lưu, Chuyển hồ sơ, Tắt app |

Mọi màn có trạng thái đang tải (skeleton), lỗi (`QueryError`) và rỗng (`EmptyState`) — không còn chỗ nào kẹt ở "Đang tải…" khi query lỗi.

## 6. Ràng buộc giữ nguyên

- Toàn bộ chữ giao diện tiếng Việt; nội dung học tiếng Anh.
- Phím tắt flashcard và các bảo vệ hiện có (bỏ `e.repeat`, bỏ phím có Ctrl/Alt/Meta, `Space` không lật khi focus ở nút/link khác; ô gõ tắt spellcheck, `Enter` không nộp cả bài).
- Các `data-testid` hiện có (`page-*`, `session-step` + `data-step`, `stat-streak`, `layout`…) giữ nguyên tên và ý nghĩa.
- `speech.ts`, `dates.ts`, `ipa/ipaData.ts`, `api/types.ts` không đổi hành vi.
- Không gọi `fetch`/axios trực tiếp trong trang; mọi request qua `endpoints`.

## 7. Kiểm thử

- `npm test`: test hiện có phải xanh. Được sửa test khi chữ/cấu trúc đổi nhưng **không được xoá kiểm tra hành vi**. Thêm test cho: interceptor axios (ProblemDetail, NETWORK, PROFILE_REQUIRED), cây route (đúng shell cho từng URL, `*` về `/`), NavBar (đúng mục đang chọn).
- `npm run build` xanh (gồm `tsc --noEmit`).
- E2E (`e2e/study.spec.ts`): cập nhật nhãn link nếu đổi (ví dụ "Thống kê" → "Tiến độ") và cách đọc Kho từ nếu không còn `tbody tr` ở viewport mặc định; luồng kiểm tra giữ nguyên.
- Rà soát hình ảnh: chụp mọi màn ở 390×844 và 1280×800, sáng và tối; thử dữ liệu xấu nhất (tên dài, danh sách rỗng, số lớn) theo skill `break-ui`.

## 8. Cách triển khai

Làm trên nhánh `feat/redesign-apple`, chia cho subagent:

0. **Đổi tên** (agent nền, commit riêng): mọi file/thư mục frontend sang kebab-case, sửa import, test + build xanh.
1. **Nền** (cùng agent, làm tiếp): thư viện, token sáng/tối, `src/ui/*`, AppShell/FocusShell/NavBar/CenterAction, router, axios client, sonner, cập nhật helper test.
2. **Các màn** (3 agent song song, mỗi agent sở hữu file riêng):
   - A: Hôm nay, Buổi học, Ôn thẻ, `Flashcard`, `StepBar`.
   - B: Bài học, Kiểm tra, `LessonView`, `ExerciseSet`, Lộ trình, IPA.
   - C: Tiến độ (`Heatmap`, `KnownChart`), Kho từ, Cài đặt (4 nhóm), Chọn hồ sơ, Tạo hồ sơ.
3. **Review** (một agent): test, build, E2E, chụp màn hình, `break-ui`, đối chiếu spec này.
