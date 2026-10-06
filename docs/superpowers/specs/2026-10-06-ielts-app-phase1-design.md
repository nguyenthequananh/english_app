# IELTS App – Giai đoạn 1: Thiết kế

- Ngày: 2026-10-06
- Trạng thái: chờ duyệt
- Phạm vi: Giai đoạn 1 (nền tảng + lộ trình + Chặng 0)

## 1. Mục tiêu và bối cảnh

App học tiếng Anh cá nhân, chạy trên laptop Windows, giúp người học đi từ mất gốc (< 4.0) lên **IELTS 7.0** với khoảng **30 phút học mỗi ngày** (ước tính 24–30 tháng).

**Yêu cầu đã chốt:**
- Ứng dụng desktop cá nhân trên Windows, backend viết bằng Java.
- Kiến trúc: Spring Boot chạy local + giao diện React mở trong trình duyệt.
- Chạy 100% offline, không dùng AI, không cần server ngoài.
- Nhiều hồ sơ (profile) trên cùng một máy, không có tài khoản online.
- Giao diện và phần giải thích bằng tiếng Việt; nội dung học bằng tiếng Anh.
- Nội dung lấy từ nguồn miễn phí (Oxford 3000/5000, Academic Word List…) và đóng gói sẵn. Có thể import thêm bằng file JSON.

**Tiêu chí thành công của Giai đoạn 1:**
- Tạo hồ sơ, học trọn một buổi 30 phút gồm ôn tập + từ mới + bài chính; tắt giữa chừng thì mở lại học tiếp đúng chỗ.
- Flashcard ôn tập ngắt quãng (SM-2) chạy đúng qua nhiều ngày.
- Có đầy đủ nội dung Chặng 0 (khoảng 24 unit), học tuần tự, có bài kiểm tra cuối unit và cuối chặng.
- Đóng gói thành bản portable `.zip`, giải nén ra là chạy trên máy không cài Java.

**Ngoài phạm vi Giai đoạn 1:** module Reading/Listening/Writing/Speaking chuyên sâu, nội dung Chặng 1–3, AI, nhắc học bằng thông báo Windows, chế độ tối, gamification, tự cập nhật app, đồng bộ online.

## 2. Lộ trình học

| Chặng | Thời gian | Mục tiêu | Nội dung chính |
|---|---|---|---|
| S0. Xây nền | Tháng 1–6 | ~4.0 | Phát âm IPA, ngữ pháp cơ bản (12 thì, cấu trúc câu), ~1000 từ A1–A2 (Oxford 3000), nghe chậm |
| S1. Tiền IELTS | Tháng 7–12 | ~5.0 | Từ B1 (hết Oxford 3000), ngữ pháp trung cấp (bị động, mệnh đề quan hệ, câu điều kiện), đọc đoạn ngắn, làm quen dạng đề |
| S2. IELTS nền | Tháng 13–20 | ~6.0 | Từ B2 (Oxford 5000) + AWL sublist 1–5, luyện theo dạng câu hỏi Reading/Listening, dàn ý Writing Task 1/2 |
| S3. Bứt phá 7.0 | Tháng 21–28 | 7.0 | AWL 6–10, collocation, paraphrase, đề full có bấm giờ, thi thử hàng tháng |

**Quy tắc:**
- Mỗi chặng chia thành các unit, mỗi unit tương ứng 1 tuần học. Unit có danh sách từ, các bài học theo thứ trong tuần và một bài kiểm tra cuối unit.
- Lộ trình tiến theo **mức hoàn thành**, không theo lịch. Unit tiếp theo mở khi bài kiểm tra cuối unit đạt ≥ 60%.
- Bài kiểm tra chuyển chặng đạt ≥ 70% thì mở chặng tiếp theo. Nếu chưa đạt, app liệt kê các unit có tỷ lệ sai cao để ôn lại.
- Unit đã hoàn thành luôn mở lại được để ôn.

## 3. Buổi học 30 phút

Module `session` ghép buổi học mỗi ngày cho hồ sơ đang dùng:

| Bước | Thời lượng | Nội dung |
|---|---|---|
| 1. Ôn tập | ~10 phút | Các thẻ đến hạn (`due_date <= hôm nay`), tối đa 60 thẻ, thẻ quá hạn lâu nhất xếp trước. Thẻ còn lại để sang hôm sau |
| 2. Từ mới | ~5 phút | 8–10 từ chưa học của unit hiện tại (mặc định 10). Bỏ qua bước này nếu số thẻ cần ôn > 100 |
| 3. Bài chính | ~15 phút | Bài học của unit hiện tại theo thứ trong tuần |

**Lịch xoay vòng trong tuần:** T2 ngữ pháp · T3 phát âm/nghe · T4 bài tập ngữ pháp · T5 đọc · T6 nghe · T7 ôn tuần + kiểm tra cuối unit · CN nghỉ hoặc học bù.

- Bài chính lấy theo thứ trong tuần. Nếu bài của ngày đó đã làm, hoặc unit không có bài cho ngày đó, thì lấy **bài sớm nhất chưa hoàn thành** trong unit.
- Bài kiểm tra cuối unit mở khi đã hoàn thành mọi bài học của unit.
- Trạng thái buổi học (bước hiện tại, danh sách thẻ, vị trí đang làm) được lưu vào `study_session.state` sau mỗi thao tác để có thể học tiếp.
- Một ngày có tối đa một buổi học chính. Học xong mà vẫn muốn học tiếp thì có thể chọn "Ôn thêm" hoặc "Học bài tiếp theo".

**Thuật toán SM-2** (người học tự chấm 4 mức):

| Mức | Chất lượng q | Kết quả |
|---|---|---|
| Quên | 1 | `repetitions = 0`, `interval = 1`, `lapses += 1`, thẻ quay lại cuối hàng đợi của buổi học |
| Khó | 3 | Tính theo SM-2 |
| Được | 4 | Tính theo SM-2 |
| Dễ | 5 | Tính theo SM-2 |

- Khi q ≥ 3: `repetitions = 0 → interval = 1`; `= 1 → interval = 6`; lớn hơn thì `interval = round(interval × ease)`; sau đó `repetitions += 1`.
- Mọi mức đều cập nhật `ease = max(1.3, ease + 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))`. Ease mặc định là 2.5.
- `due_date = hôm nay + interval`. Mỗi lần chấm ghi một dòng vào `review_log`.

## 4. Màn hình

| Màn | Nội dung |
|---|---|
| Chọn hồ sơ | Hiện khi mở app. Nếu máy chỉ có 1 hồ sơ và không có PIN thì vào thẳng. Có nút "+ Thêm hồ sơ" |
| Tạo hồ sơ | Tên, avatar, PIN (tùy chọn), số phút mỗi ngày (mặc định 30), giọng đọc. Bắt đầu từ S0-U01 |
| Hôm nay | Nút bắt đầu/tiếp tục buổi học, chuỗi ngày học, số thẻ đến hạn, tiến độ unit hiện tại |
| Buổi học | Thanh tiến độ 3 bước, đồng hồ đếm giờ, nội dung từng bước, màn tổng kết khi xong |
| Flashcard | Mặt trước: từ + loa. Mặt sau: IPA, loại từ, nghĩa tiếng Việt, câu ví dụ (có loa). 4 nút chấm. Phím tắt: `Space` lật thẻ, `1–4` chấm |
| Bài ngữ pháp | Lý thuyết (Markdown) → bài tập trắc nghiệm/điền từ, có giải thích ngay sau mỗi câu |
| Phát âm | Bảng IPA có âm mẫu, bài tập cặp âm dễ nhầm (minimal pairs) |
| Lộ trình | Bản đồ Chặng → Unit, trạng thái: khóa / đang học / hoàn thành |
| Kho từ | Tìm và lọc từ theo trạng thái (mới / đang học / đã thuộc), tự thêm từ của mình |
| Thống kê | Heatmap ngày học, số từ đã thuộc theo thời gian, điểm các bài kiểm tra |
| Cài đặt | Hồ sơ (tên/avatar/PIN/xóa), giọng đọc và tốc độ đọc, import nội dung JSON, sao lưu/khôi phục, thư mục sao lưu, mở thư mục log |

- Từ được tính là **"đã thuộc"** khi `interval_days ≥ 21`.
- **Chuỗi ngày học** tăng thêm 1 khi hoàn thành buổi học chính trong ngày. Ngày Chủ nhật không học thì không làm mất chuỗi.
- **Âm thanh:** dùng Web Speech API (`speechSynthesis`) của trình duyệt, tức là giọng đọc có sẵn của Windows, chạy offline. Nếu không tìm thấy giọng `en-*`, app hiện hướng dẫn cài thêm giọng trong Windows Settings.
- **PIN:** 4–6 chữ số, lưu dạng băm BCrypt. Đây chỉ là khóa nhẹ để tránh dùng nhầm hồ sơ, không phải cơ chế bảo mật.

## 5. Kiến trúc

**Công nghệ:**
- Backend: Java 21, Spring Boot 3, Maven, Spring JDBC (`JdbcClient`), SQLite (`sqlite-jdbc`), Flyway. Không dùng JPA: dialect SQLite của Hibernate xử lý kiểu ngày/giờ và khóa ghi kém ổn định, trong khi SQL thuần với SQLite đơn giản và dễ kiểm soát hơn.
- Ngày lưu dạng TEXT ISO (`2026-10-05`), thời điểm lưu dạng `LocalDateTime` theo giờ máy (`2026-10-05T09:00`).
- Frontend: React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query.

**Cấu trúc repo:**
```
APP_TA/
├── backend/     Spring Boot (Maven), React build được chép vào src/main/resources/static
├── frontend/    React + Vite
├── content/     JSON nội dung: stage-0/unit-01.json, ...
└── docs/
```

**Module backend** (package theo tính năng, mỗi module gồm controller / service / repository / entity riêng):

| Module | Trách nhiệm |
|---|---|
| `profile` | Tạo/sửa/xóa hồ sơ, kiểm tra PIN, lưu hồ sơ đang dùng trong HTTP session |
| `roadmap` | Chặng/unit, tính trạng thái khóa/mở, xử lý mở khóa sau khi kiểm tra |
| `session` | Ghép buổi học, lưu và khôi phục trạng thái buổi học |
| `vocab` | Từ vựng, thẻ, SM-2, kho từ, từ do người dùng thêm |
| `lesson` | Bài học (ngữ pháp/phát âm/đọc/nghe), bài tập, chấm bài |
| `assessment` | Bài kiểm tra cuối unit và cuối chặng |
| `progress` | Chuỗi ngày học, thống kê, heatmap |
| `content` | Đọc và kiểm tra JSON, import (ghi đè theo `code`, xoá bài học/câu hỏi đã bị bỏ khỏi file), nạp lại nội dung đóng gói kèm vào DB ở mỗi lần khởi động |
| `backup` | Sao lưu tự động/thủ công, khôi phục, xuất/nhập hồ sơ |
| `settings` | Cấu hình app (cổng, thư mục sao lưu) |

- Mọi API dữ liệu cá nhân đều lấy `profile_id` từ HTTP session, không nhận từ client. Chưa chọn hồ sơ thì trả về 401.
- API dùng prefix `/api/**`. Các đường dẫn còn lại trả về `index.html` để React Router xử lý.
- Bảo vệ `/api/**` khỏi DNS rebinding và POST giả mạo từ trang web khác: request có header `Host` không phải `127.0.0.1`/`localhost` bị từ chối (403, `code: FORBIDDEN_ORIGIN`); request thay đổi dữ liệu (khác GET/HEAD/OPTIONS) có header `Origin` thì host của `Origin` cũng phải là `127.0.0.1`/`localhost` (cổng nào cũng được, để Vite dev server ở 5173 dùng được).
- **Quyết định:** nội dung đóng gói kèm app được nạp lại (upsert theo `code`) ở mỗi lần khởi động, không chỉ lần chạy đầu tiên, để bản cập nhật app mang theo nội dung mới/đã sửa mà không mất tiến độ học.

## 6. Mô hình dữ liệu

**Nội dung (dùng chung cho mọi hồ sơ).** Mỗi bảng có `code` cố định để import lại không bị trùng.

| Bảng | Cột chính |
|---|---|
| `stage` | `code` (S0..S3), `title`, `target_band`, `sort_order` |
| `unit` | `code` (S0-U01), `stage_code`, `title`, `sort_order` |
| `word` | `id`, `code` (`headword#pos`, ví dụ `light#adj`), `headword`, `pos`, `ipa_us`, `ipa_uk`, `meaning_vi`, `example_en`, `example_vi`, `cefr`, `source` (OXFORD/AWL/USER), `profile_id` (chỉ có với từ USER) |
| `unit_word` | `unit_code`, `word_id`, `sort_order` |
| `lesson` | `code`, `unit_code`, `type` (GRAMMAR/PRONUNCIATION/READING/LISTENING), `day` (MON..SAT), `title`, `body_md`, `sort_order` |
| `exercise` | `code`, `lesson_code` (hoặc `test_code`), `type` (MCQ/FILL/MINIMAL_PAIR), `prompt`, `options_json`, `answer`, `explanation_vi` |
| `test` | `code`, `kind` (UNIT/STAGE), `unit_code` hoặc `stage_code`, `pass_ratio` |

**Cá nhân (đều có `profile_id`, xóa hồ sơ thì xóa dây chuyền theo):**

| Bảng | Cột chính |
|---|---|
| `profile` | `id`, `name`, `avatar`, `pin_hash`, `daily_minutes`, `voice`, `speech_rate`, `created_at` |
| `card` | `profile_id`, `word_id` (PK kép), `ease`, `interval_days`, `repetitions`, `lapses`, `due_date`, `created_at` |
| `review_log` | `id`, `profile_id`, `word_id`, `grade`, `prev_interval`, `new_interval`, `reviewed_at` |
| `unit_progress` | `profile_id`, `unit_code`, `status` (LOCKED/ACTIVE/DONE), `started_at`, `completed_at` |
| `lesson_progress` | `profile_id`, `lesson_code`, `score`, `completed_at` |
| `exercise_attempt` | `id`, `profile_id`, `exercise_code`, `answer`, `correct`, `attempted_at` |
| `test_result` | `id`, `profile_id`, `test_code`, `score`, `passed`, `taken_at` |
| `study_session` | `id`, `profile_id`, `study_date`, `state_json`, `started_at`, `finished_at`, `minutes` |

**Định dạng file nội dung** (`content/stage-0/unit-01.json`):
```json
{
  "code": "S0-U01", "stage": "S0", "title": "Chào hỏi & Thì hiện tại đơn", "order": 1,
  "words": [
    { "headword": "hello", "pos": "exclamation", "ipaUs": "/həˈloʊ/", "ipaUk": "/həˈləʊ/",
      "meaningVi": "xin chào", "exampleEn": "Hello, I'm Thanh.", "exampleVi": "Xin chào, tôi là Thanh.",
      "cefr": "A1", "source": "OXFORD" }
  ],
  "lessons": [
    { "code": "S0-U01-G1", "type": "GRAMMAR", "day": "MON", "title": "Thì hiện tại đơn",
      "bodyMd": "...",
      "exercises": [
        { "code": "S0-U01-G1-E1", "type": "MCQ", "prompt": "She ___ to school every day.",
          "options": ["go", "goes", "going"], "answer": "goes",
          "explanationVi": "Chủ ngữ ngôi thứ 3 số ít nên động từ thêm -es." }
      ] }
  ],
  "test": { "code": "S0-U01-T", "kind": "UNIT", "passRatio": 0.6, "exercises": [ ] }
}
```
File `content/stage-0/stage.json` khai báo thông tin chặng và bài kiểm tra chuyển chặng (`kind: STAGE`, `passRatio: 0.7`).

## 7. Xử lý lỗi

- Mọi lỗi API trả về theo định dạng Problem Detail (`@RestControllerAdvice`), gồm mã lỗi và thông báo tiếng Việt. Frontend hiện toast và giữ nguyên trạng thái trang.
- **Import nội dung:** kiểm tra JSON trước khi ghi (thiếu trường, `code` trùng trong file, `answer` không nằm trong `options`, `unit_code` không tồn tại). Mỗi file import trong một transaction, có lỗi thì không ghi gì và báo lỗi kèm đường dẫn tới trường sai.
- **Cổng bận:** app gọi `/api/health` ở cổng đó. Nếu là instance của chính app thì chỉ mở trình duyệt vào đó; nếu không thì thử lần lượt `8766`…`8775` và lưu cổng thực tế vào `config.yml`.
- **Không có giọng tiếng Anh:** hiện banner hướng dẫn, các tính năng khác vẫn dùng bình thường.
- **DB hỏng (quyết định):** khi khởi động, nếu `ielts.db` hỏng thì app tự khôi phục từ bản sao lưu lành gần nhất (file hỏng được dời sang `ielts-corrupt-*.db`), và `/api/health` trả `recoveredFrom` để giao diện báo cho người dùng, thay vì hiện trang lỗi. DB đang bị instance khác giữ (bận) không bị coi là hỏng.
- **Lỗi không mong muốn:** trả 500 với `code: INTERNAL`, thông báo "Có lỗi không mong muốn, xem log", và ghi log mức ERROR. Lỗi chuẩn của Spring (404, 405, ...) giữ nguyên mã HTTP.

## 8. Hạ tầng và cấu hình

**Lúc chạy:**
```
Trình duyệt ──http://127.0.0.1:8765──▶ IELTS App (Spring Boot + JRE đóng gói kèm)
                                          │
                                          ▼
                     %USERPROFILE%\.ielts-app\
                       ├─ ielts.db     (SQLite, WAL)
                       ├─ backups\     (7 bản gần nhất)
                       ├─ logs\        (xoay vòng 14 ngày)
                       └─ config.yml
```
- Chỉ lắng nghe trên `127.0.0.1`. Dữ liệu nằm tách khỏi thư mục cài app.
- Khi khởi động, app tự mở trình duyệt mặc định (`Desktop.browse`) sau khi `/api/health` sẵn sàng.
- Tắt app: nút "Tắt app" gọi `POST /api/app/shutdown`, server trả 202 `{"message": "Đang tắt app..."}` rồi đóng Spring context và thoát JVM sau khoảng 300 ms. Khôi phục bản sao lưu cần tắt app bằng nút này rồi mở lại.
- Mọi `/api/**` chỉ nhận `Host` là `127.0.0.1`/`localhost` và, với request thay đổi dữ liệu, `Origin` cũng phải là `127.0.0.1`/`localhost` (xem §5).

**`application.yml` chính:**
```yaml
app:
  home: ${user.home}/.ielts-app
  backup: { dir: "${app.home}/backups", keep: 7 }
server: { address: 127.0.0.1, port: 8765 }
spring:
  datasource:
    url: jdbc:sqlite:${app.home}/ielts.db?journal_mode=WAL&foreign_keys=on&busy_timeout=5000
    hikari.maximum-pool-size: 1
  flyway: { enabled: true, locations: classpath:db/migration }
logging:
  file.name: ${app.home}/logs/app.log
  logback.rollingpolicy: { max-history: 14, max-file-size: 10MB }
```

**Tham số JVM:** `-Xms64m -Xmx256m -XX:+UseSerialGC -Dfile.encoding=UTF-8`

**Sao lưu:**
- Tự động: mỗi ngày một bản, giữ 7 bản. Kiểm tra lúc khởi động và mỗi giờ khi app chạy liên tục qua ngày mới (`app.backup.schedule-enabled`, mặc định `true`). Dùng `VACUUM INTO` để có bản sao nhất quán khi đang ở chế độ WAL; chạy ngoài transaction vì pool chỉ có 1 kết nối.
- Trước mỗi lần Flyway chạy migration mới thì sao lưu thêm một bản.
- Thủ công: xuất toàn bộ DB, hoặc xuất một hồ sơ ra JSON và nhập lại.
- Thư mục sao lưu có thể đổi sang thư mục OneDrive/Google Drive để có bản sao ngoài máy.

**Build và đóng gói:**
- `mvnw package`: `frontend-maven-plugin` cài Node 22, chạy `npm ci && npm run build` (output vào `backend/src/main/resources/static`), sau đó build jar.
- `jlink` tạo runtime rút gọn (`java.base, java.sql, java.desktop, java.logging, java.naming, java.management, jdk.unsupported`), rồi `jpackage --type app-image` tạo bản portable, nén thành `.zip` (~80–100 MB).
- Bộ cài `.msi` là tùy chọn (cần WiX Toolset).
- Vite dev server ở cổng 5173, proxy `/api` sang `127.0.0.1:8765`.

**Môi trường phát triển:** JDK Temurin 21, Maven Wrapper, Node 22 LTS, IntelliJ IDEA / VS Code, DB Browser for SQLite, Git + GitHub private repo. CI tùy chọn: GitHub Actions (runner Windows) chạy test mỗi lần push, build bản portable lên GitHub Releases khi gắn tag `v*`.

**Yêu cầu máy:**

| | Chạy app | Phát triển |
|---|---|---|
| OS | Windows 10/11 64-bit | Windows 10/11 64-bit |
| RAM | 4 GB tối thiểu (app + tab trình duyệt dùng ~400–650 MB) | 8 GB tối thiểu, 16 GB khuyên dùng |
| Ổ đĩa | ~300 MB | ~10 GB, nên dùng SSD |
| Trình duyệt | Edge/Chrome bản mới | Edge/Chrome |

## 9. Kiểm thử

| Tầng | Công cụ | Nội dung |
|---|---|---|
| Logic lõi (TDD) | JUnit 5 | SM-2, ghép buổi học (giới hạn thẻ, chọn bài theo thứ, bài sớm nhất chưa làm), mở khóa unit/chặng, chấm bài, chuỗi ngày học |
| Import | JUnit + JSON mẫu | File hợp lệ, các trường hợp lỗi, import lại không trùng, tiến độ học được giữ nguyên |
| API + DB | `@SpringBootTest` + SQLite trong thư mục tạm | Các endpoint chính, dữ liệu tách đúng theo `profile_id`, sao lưu/khôi phục |
| Frontend | Vitest + React Testing Library | Flashcard (lật thẻ, phím tắt, chấm), luồng buổi học, học tiếp chỗ dở |
| End-to-end | Playwright | Tạo hồ sơ → học trọn một buổi → kiểm tra Thống kê; hai hồ sơ không thấy dữ liệu của nhau |

- Logic tính theo ngày nhận `java.time.Clock` qua injection để test được nhiều ngày liên tiếp.

## 10. Nội dung Chặng 0

- Khoảng 24 unit; mỗi unit 40–50 từ (tổng ~1000 từ A1–A2 từ Oxford 3000), 4–5 bài học và 1 bài kiểm tra cuối unit.
- Phát âm: 44 âm IPA và các cặp âm dễ nhầm, rải đều trong 8 unit đầu.
- Ngữ pháp: 12 thì cơ bản, danh từ đếm được/không đếm được, mạo từ, giới từ thời gian/nơi chốn, so sánh, động từ khuyết thiếu cơ bản, câu hỏi Wh-.
- Nghĩa tiếng Việt, câu ví dụ và bài tập do người phát triển soạn, có thể dùng công cụ hỗ trợ khi soạn. Mỗi file phải qua bộ kiểm tra của module `content` trước khi commit.
- Kiểm tra bản quyền: danh sách từ Oxford 3000/5000 và AWL chỉ dùng danh sách headword; định nghĩa và ví dụ tự soạn, không chép từ từ điển.
