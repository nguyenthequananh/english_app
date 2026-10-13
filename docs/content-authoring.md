# Hướng dẫn soạn nội dung Chặng 0

File: `content/stage-0/unit-NN.json`. Mẫu chuẩn: `unit-01.json` — mọi unit theo đúng khuôn này.
Kiểm tra sau khi soạn (trong `backend/`): `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest`.

## Khung chương trình

| # | Chủ đề | Ngữ pháp (G1 → G2) | Phát âm (P1) |
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

## Cấu trúc bắt buộc (ContentFolderTest kiểm tra)

- `code` `S0-UNN`, `stage` `S0`, `order` NN, `title` tiếng Việt "Chủ đề & ngữ pháp chính".
- `words`: 40–45 từ. 5 bài học theo đúng thứ tự:
  - `S0-UNN-G1` GRAMMAR MON — 6–8 câu MCQ/FILL.
  - `S0-UNN-P1` PRONUNCIATION TUE — 5–6 câu; unit 1–8 chỉ MINIMAL_PAIR; unit 9–24 MINIMAL_PAIR hoặc MCQ.
  - `S0-UNN-G2` GRAMMAR WED — 6–8 câu MCQ/FILL.
  - `S0-UNN-R1` READING THU — đúng 5 câu MCQ.
  - `S0-UNN-L1` LISTENING FRI — 5–6 câu, tất cả DICTATION.
- `test`: `S0-UNN-T`, `kind` UNIT, `passRatio` 0.6, 12–15 câu trộn các dạng, ít nhất 1 DICTATION, ít nhất 3 câu kiểm tra từ vựng của unit.
- Mã câu: `<mã bài>-E1`, `-E2`, … liên tục. Mọi câu có `explanationVi`.

## Từ vựng

- Chọn từ A1–A2 trong danh sách headword Oxford 3000, hợp chủ đề unit. Ưu tiên từ dùng được ngay trong bài đọc/nghe/ngữ pháp của unit.
- Một từ (headword + pos) chỉ ở MỘT unit trong cả chặng. Trước khi soạn, liệt kê từ đã dùng: `grep -ho '"headword": *"[^"]*", *"pos": *"[^"]*"' content/stage-0/unit-*.json | sort`.
- Từ cần cho ngữ pháp nhưng đã có ở unit trước thì cứ dùng trong câu, không khai báo lại.
- `pos` (chữ thường, tiếng Anh): noun, verb, adjective, adverb, pronoun, preposition, determiner, conjunction, exclamation, number, modal verb, phrase.
- `ipaUs`/`ipaUk` có dấu `/…/`, trọng âm `ˈ`; US dùng /oʊ/, /ɝː/, /ɑː/ cho "hot"; UK dùng /əʊ/, /ɜː/, /ɒ/. Viết theo cách phát âm chuẩn của từ điển, không phỏng đoán.
- Kiểu IPA theo `unit-01.json`: không chấm tách âm tiết (`/ˈtiːtʃər/`, không `/ˈtiː.tʃər/`); UK không có r cuối và không ghi `(r)` (`/ˈtiːtʃə/`); `ˈ` cho trọng âm chính, `ˌ` cho trọng âm phụ (`/ˌæftərˈnuːn/`).
- `meaningVi` ngắn gọn, đúng nghĩa được dùng trong ví dụ; nhiều nghĩa thì ngăn bằng `; `.
- `exampleEn` 5–12 từ, chỉ dùng từ A1–A2 và ngữ pháp đã học đến unit đó; `exampleVi` dịch tự nhiên.
- Bối cảnh Việt Nam: tên người (Lan, Minh, Hoa, Nam…), địa danh (Hanoi, Da Nang, Hue…).

## Bài học

- `bodyMd` tiếng Việt, Markdown: tiêu đề `##`, giải thích ngắn, bảng hoặc gạch đầu dòng, ví dụ in nghiêng. Ngữ pháp 150–300 từ; phát âm nêu khẩu hình + ví dụ từ.
- READING: `bodyMd` có hướng dẫn 1 dòng tiếng Việt rồi đoạn văn tiếng Anh 80–150 từ (dùng nhiều từ của unit), câu hỏi MCQ tiếng Anh đơn giản, 3 lựa chọn.
- LISTENING: `bodyMd` hướng dẫn nghe chép (tiếng Việt) + mẹo nghe của unit. Bài L1 của unit-01 phải nhắc người học chuyển bộ gõ tiếng Việt (Unikey/EVKey, Telex) sang tiếng Anh (E) trước khi gõ, vì Telex đổi *w* thành *ư*, *dd* thành *đ*. Câu DICTATION 4–10 từ, dùng từ vựng/ngữ pháp unit.
- MINIMAL_PAIR: `prompt` là từ được đọc, `options` 2–3 từ dễ nhầm (thật, có nghĩa), `answer` = `prompt`. Đổi vị trí đáp án đúng giữa các câu.
  - `prompt` có thể là câu ngắn khi hiện tượng chỉ nghe được trong câu (ví dụ can/can't); `options` là các câu chỉ khác nhau ở điểm cần nghe.
- MCQ phát âm (unit 9–24): ví dụ "Which word has stress on the first syllable?" hoặc "How is -ed pronounced in 'watched'?" với options `/t/`, `/d/`, `/ɪd/`.
- MCQ: 3 lựa chọn (đôi khi 2 hoặc 4), đáp án đúng nằm ở vị trí khác nhau giữa các câu. FILL: dạng "They ___ (live) near the sea."; mọi cách viết đúng khai báo trong `answer` bằng `|` (ví dụ `don't like|do not like`).
- FILL có *to be*, *have*, *will*, *do*… phải khai báo cả dạng viết tắt: `are|'re`, `is|'s`, `'m not|am not`, `isn't|is not|'s not`.

## DICTATION

```json
{ "code": "S0-U04-L1-E1", "type": "DICTATION", "prompt": "She gets up at six o'clock.",
  "answer": "She gets up at six o'clock.|She gets up at 6 o'clock.", "explanationVi": "gets: ngôi 3 số ít thêm -s." }
```

- Không có `options`. `answer` phương án đầu = `prompt`.
- Câu có số: khai báo cả dạng chữ và dạng số. Câu có dạng rút gọn (I'm, don't, it's…): khai báo cả dạng đầy đủ.
- Khi chấm, chữ hoa, dấu câu, dấu gạch nối và khoảng trắng thừa bị bỏ qua; dấu nháy đơn được giữ.
- Tránh tên riêng khó đoán chính tả trong câu nghe chép (chỉ dùng tên rất phổ biến: Lan, Nam, Tom, Anna).
