# Giai đoạn 3 — Nội dung Chặng 0 + bài nghe chép chính tả

- Ngày: 2026-10-09
- Spec gốc: `docs/superpowers/specs/2026-10-06-ielts-app-phase1-design.md` (mục 6 định dạng nội dung, mục 10 nội dung Chặng 0)
- Nhánh: `feat/content-stage0`

## 1. Mục tiêu

- Soạn đủ 24 unit của Chặng 0 (A1–A2, ~1000 từ) và bài kiểm tra chuyển chặng, đúng định dạng JSON mà module `content` đang import.
- Thêm dạng bài tập `DICTATION` (nghe chép chính tả) để bài Nghe có bài tập thật, chạy offline bằng giọng đọc Windows.
- Thêm test kiểm tra toàn bộ thư mục `content/` để bắt lỗi nội dung trước khi commit.

Người soạn nội dung: Claude; người dùng duyệt một lượt khi xong cả 24 unit.

**Ngoài phạm vi:** Chặng 1–3, audio thu sẵn, dạng bài tập khác ngoài `DICTATION`, đổi giao diện ngoài phần bài tập.

## 2. Khung chương trình

| # | Chủ đề | Ngữ pháp | Phát âm |
|---|---|---|---|
| 1 | Chào hỏi & bản thân | *to be*, đại từ nhân xưng | /ɪ/–/iː/ |
| 2 | Gia đình | tính từ sở hữu, 's, *have/has* | /æ/ /e/ /ʌ/ |
| 3 | Nhà cửa & đồ vật | *There is/are*, a/an/the, số nhiều | /ɒ/ /ɔː/ /ʊ/ /uː/ |
| 4 | Thói quen hằng ngày | Hiện tại đơn (khẳng định) | /ɜː/ /ə/ /ɑː/ |
| 5 | Thời gian & lịch | Hiện tại đơn (phủ định, câu hỏi), trạng từ tần suất | /eɪ/ /aɪ/ /ɔɪ/ |
| 6 | Đồ ăn & thức uống | Danh từ đếm được/không đếm được, some/any, much/many | /aʊ/ /əʊ/ /ɪə/ /eə/ /ʊə/ |
| 7 | Mua sắm & tiền | How much/many, this/that/these/those | /p b t d k g f v θ ð s z/ |
| 8 | Thành phố & chỉ đường | Giới từ nơi chốn, câu mệnh lệnh | /ʃ ʒ tʃ dʒ m n ŋ l r w j h/ |
| 9 | Công việc | Hiện tại tiếp diễn | Đuôi -s/-es |
| 10 | Thời tiết & mùa | Hiện tại đơn vs tiếp diễn | Trọng âm từ 2 âm tiết |
| 11 | Sở thích & thể thao | like/love + V-ing, can/can't | can vs can't |
| 12 | Tuổi thơ | was/were | Trọng âm từ 3 âm tiết |
| 13 | Cuối tuần | Quá khứ đơn có quy tắc | Đuôi -ed |
| 14 | Du lịch | Quá khứ đơn bất quy tắc, câu hỏi | Âm cuối |
| 15 | Sức khỏe & cơ thể | should, must/have to | Cụm phụ âm |
| 16 | Trường học | Câu hỏi Wh- tổng hợp | Ngữ điệu câu hỏi |
| 17 | Kế hoạch | be going to, will | Dạng yếu (to, for, of) |
| 18 | Đi lại | in/on/at chỉ thời gian, by + phương tiện | Nối âm |
| 19 | Con người & tính cách | So sánh hơn | Trọng âm câu |
| 20 | Địa danh | So sánh nhất | Âm câm |
| 21 | Trải nghiệm | Hiện tại hoàn thành (ever/never) | Dạng rút gọn |
| 22 | Thay đổi | Hiện tại hoàn thành vs quá khứ đơn, for/since | Âm /h/ |
| 23 | Kể chuyện | Quá khứ tiếp diễn, quá khứ hoàn thành | Ngữ điệu kể chuyện |
| 24 | Tổng ôn | Bảng 12 thì (giới thiệu các thì tiếp diễn/hoàn thành còn lại) | Ôn tập |

Unit 01 mẫu hiện có được soạn lại theo khung này (giữ mã `S0-U01`).

## 3. Cấu trúc một unit

File `content/stage-0/unit-NN.json` (NN = 01..24), `order` = NN, `stage` = `S0`.

| Mã bài | type | day | Nội dung | Bài tập |
|---|---|---|---|---|
| `S0-UNN-G1` | GRAMMAR | MON | Ngữ pháp phần 1: giải thích tiếng Việt, bảng, ví dụ | 6–8 câu MCQ/FILL |
| `S0-UNN-P1` | PRONUNCIATION | TUE | Âm/hiện tượng phát âm, mẹo khẩu hình | 5–6 câu MINIMAL_PAIR |
| `S0-UNN-G2` | GRAMMAR | WED | Ngữ pháp phần 2 (phủ định/câu hỏi/mở rộng) | 6–8 câu MCQ/FILL |
| `S0-UNN-R1` | READING | THU | Đoạn văn 80–150 từ dùng từ vựng của unit | 5 câu MCQ |
| `S0-UNN-L1` | LISTENING | FRI | Hướng dẫn nghe chép | 5–6 câu DICTATION |

- Bài kiểm tra unit `S0-UNN-T`: `kind: UNIT`, `passRatio: 0.6`, 12–15 câu trộn MCQ/FILL/MINIMAL_PAIR/DICTATION.
- Mã bài tập: `<mã bài>-E<n>` (ví dụ `S0-U05-L1-E3`, `S0-U05-T-E12`).
- Từ vựng: 40–45 từ/unit; mỗi từ có `headword`, `pos`, `ipaUs`, `ipaUk`, `meaningVi`, `exampleEn`, `exampleVi`, `cefr` (A1/A2), `source: "OXFORD"`. Một từ (theo `headword`+`pos`) chỉ xuất hiện ở đúng một unit.
- MINIMAL_PAIR: `prompt` là từ được đọc, `options` gồm 2–3 từ dễ nhầm, `answer` = `prompt`. Với unit có bài phát âm không phải cặp âm (trọng âm, ngữ điệu…), dùng MCQ (ví dụ chọn âm tiết mang trọng âm) thay cho MINIMAL_PAIR.
- READING: đoạn văn nằm trong `bodyMd`; câu hỏi MCQ bằng tiếng Anh đơn giản.
- `explanationVi` có ở mọi câu.
- Bài kiểm tra chặng `S0-T` (trong `stage.json`): 30 câu phủ đều 24 unit, `passRatio: 0.7`.

**Bản quyền:** chỉ dùng danh sách headword Oxford 3000; nghĩa, ví dụ, đoạn văn, bài tập đều tự soạn.

## 4. Dạng bài tập DICTATION

**Định dạng:**
```json
{ "code": "S0-U04-L1-E1", "type": "DICTATION", "prompt": "She gets up at six o'clock.",
  "answer": "She gets up at six o'clock.|She gets up at 6 o'clock.", "explanationVi": "..." }
```
- `prompt`: câu được đọc. `answer`: các đáp án chấp nhận, ngăn bởi `|`; đáp án đầu tiên là câu hiển thị sau khi chấm.

**Backend:**
- `ContentValidator.EXERCISE_TYPES` thêm `DICTATION`; DICTATION không cần `options`.
- `ExerciseGrader.isCorrect`: với DICTATION, chuẩn hoá cả đáp án và câu trả lời rồi so khớp với từng phương án: hạ chữ thường, đổi `’` thành `'`, bỏ mọi ký tự không phải chữ/số/khoảng trắng/dấu nháy đơn, gộp khoảng trắng, trim.
  - "she gets up at six oclock" **không** khớp "She gets up at six o'clock." (nháy đơn được giữ); "she gets up at six o'clock" khớp.
- Câu trả lời rỗng → sai.

**Frontend:**
- `ExerciseType` thêm `'DICTATION'`.
- `ExerciseSet`: với DICTATION hiện "Nghe và chép lại câu:", nút "Nghe" (tốc độ cài đặt) và nút "Nghe chậm" (rate 0.7), ô nhập văn bản. Câu gốc không hiển thị trước khi nộp; sau khi chấm, câu đáp án hiện qua `result.answer` như dạng FILL.
- Nút nghe của DICTATION không đưa câu vào `aria-label`/`title` (tránh lộ đáp án khi rê chuột).
- Câu được gửi xuống trình duyệt trong `prompt` (bắt buộc để giọng đọc chạy được) — chấp nhận vì app cá nhân, giống MINIMAL_PAIR hiện nay.

## 5. Test kiểm tra thư mục content

Test JUnit `ContentFolderTest` (backend, chạy cùng `./mvnw test`) đọc `../content` bằng chính `ObjectMapper`/`ContentValidator` của app:
- `stage.json` và mọi `unit-*.json` qua `ContentValidator` không lỗi.
- Đúng 24 unit, `order` = 1..24 liên tục, mã `S0-U01`..`S0-U24` khớp tên file.
- Mỗi unit: 40–50 từ, 4–5 bài học, có bài kiểm tra 12–15 câu.
- Không trùng từ (theo `WordCode.of(headword, pos)`) giữa các unit; không trùng mã bài/bài tập toàn chặng.
- Tổng số từ 950–1100.
- Mọi từ có đủ `ipaUs`, `ipaUk`, `exampleEn`, `exampleVi`, `cefr` ∈ {A1, A2}.
- Mỗi unit có ít nhất 1 bài DICTATION trong bài LISTENING.

Trong lúc soạn dở (chưa đủ 24 unit), phần "đúng 24 unit" và "tổng số từ" chỉ được bật ở task cuối; các kiểm tra theo từng file chạy ngay từ đầu.

## 6. Kiểm thử

- Backend: test cho validator (DICTATION hợp lệ không cần options), grader (bảng ca chuẩn hoá ở mục 4), `ContentFolderTest`.
- Frontend: test `ExerciseSet` cho DICTATION (không hiện câu trước khi nộp, nút Nghe chậm gọi `speak` với rate 0.7, gửi đúng câu trả lời).
- Cuối cùng: app import đủ 24 unit khi khởi động (test tích hợp import thư mục `content/` thật không lỗi), chạy lại toàn bộ test backend/frontend và Playwright.
