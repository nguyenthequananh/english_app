# Nội dung Chặng 0 + DICTATION — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Soạn đủ 24 unit Chặng 0 + bài kiểm tra chặng, thêm dạng bài tập DICTATION, và một bộ test chặn nội dung sai trước khi commit.

**Architecture:** Nội dung là các file JSON trong `content/stage-0/` được Maven copy vào classpath và import khi khởi động (`ContentBootstrap` → `ContentService.importFiles`). DICTATION là một giá trị `type` mới của bài tập: validator chấp nhận, `ExerciseGrader` chấm theo chuẩn hoá riêng, `ExerciseSet` hiển thị nút nghe + ô gõ. `ContentFolderTest` đọc thư mục `content/` thật và kiểm tra cấu trúc, số lượng, trùng lặp.

**Tech Stack:** Java 21, Spring Boot 3.5.6, JUnit 5 + AssertJ, Jackson; React 19 + TypeScript, Vitest + Testing Library; Web Speech API.

**Spec:** `docs/superpowers/specs/2026-10-09-stage0-content-design.md` (spec gốc: `docs/superpowers/specs/2026-10-06-ielts-app-phase1-design.md`)

## Global Constraints

- Nhánh làm việc: `feat/content-stage0`. Lệnh backend chạy trong `backend/`: `./mvnw test` (lọc test: `./mvnw test -Dtest=A,B` — dùng dấu phẩy). Frontend trong `frontend/`: `npx vitest run`, `npx tsc -b`.
- Không thêm thư viện mới.
- Loại bài tập hợp lệ sau plan này: `MCQ`, `FILL`, `MINIMAL_PAIR`, `DICTATION`. Loại bài học: `GRAMMAR`, `PRONUNCIATION`, `READING`, `LISTENING`. Ngày: `MON`..`SAT`.
- Mỗi unit: file `content/stage-0/unit-NN.json` (NN = 01..24), `code` = `S0-UNN`, `stage` = `S0`, `order` = NN.
- 5 bài học cố định mỗi unit: `S0-UNN-G1` GRAMMAR MON (6–8 câu MCQ/FILL), `S0-UNN-P1` PRONUNCIATION TUE (5–6 câu; unit 1–8 chỉ MINIMAL_PAIR, unit 9–24 MINIMAL_PAIR hoặc MCQ), `S0-UNN-G2` GRAMMAR WED (6–8 câu MCQ/FILL), `S0-UNN-R1` READING THU (đúng 5 câu MCQ), `S0-UNN-L1` LISTENING FRI (5–6 câu, tất cả DICTATION).
- Bài kiểm tra unit `S0-UNN-T`: `kind` `UNIT`, `passRatio` 0.6, 12–15 câu, có ít nhất 1 câu DICTATION.
- Mã bài tập: `<mã bài hoặc bài kiểm tra>-E<n>`, n bắt đầu từ 1, liên tục.
- Từ vựng: 40–45 từ/unit (test cho phép 40–50), mỗi từ đủ `headword`, `pos`, `ipaUs`, `ipaUk`, `meaningVi`, `exampleEn`, `exampleVi`, `cefr` ∈ {`A1`,`A2`}, `source` = `OXFORD`. Một từ (`WordCode.of(headword, pos)`) chỉ ở đúng một unit trong cả chặng. Tổng 950–1100 từ.
- Bài kiểm tra chặng `S0-T` trong `stage.json`: `kind` `STAGE`, `passRatio` 0.7, đúng 30 câu.
- DICTATION: `prompt` = câu được đọc; `answer` = các đáp án chấp nhận ngăn bởi `|`, phương án đầu là câu chuẩn; không có `options`.
- Chuẩn hoá chấm DICTATION: hạ chữ thường (Locale.ROOT), `’` → `'`, mọi ký tự không phải chữ/số/khoảng trắng/`'` thay bằng dấu cách, gộp khoảng trắng, trim.
- Bản quyền: chỉ dùng danh sách headword Oxford 3000; nghĩa, ví dụ, đoạn văn, bài tập tự soạn, không chép từ điển.
- Commit message tiếng Việt, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Câu DICTATION có số, dấu gạch nối hoặc dạng rút gọn ("6"/"six", "twenty-one", "I'm"/"I am") — người học gõ đúng nghĩa phải được chấm đúng → mỗi câu DICTATION có số hoặc dạng rút gọn phải khai báo đủ phương án trong `answer` (quy tắc trong `docs/content-authoring.md`, Task 3); grader thay `-` bằng dấu cách (test ở Task 1).
2. Một từ xuất hiện ở hai unit sẽ bị unit sau "cướp" lặng lẽ khi import → `ContentFolderTest.noWordAppearsInTwoUnits` (Task 3) chạy sau mỗi đợt soạn.
3. Lỗi gõ tên khoá JSON (`exampleVI`, `ipa_us`) bị Jackson bỏ qua lặng lẽ → `ContentFolderTest` đọc bằng mapper bật `FAIL_ON_UNKNOWN_PROPERTIES` (Task 3).
4. Câu đáp án DICTATION lộ ra màn hình hoặc tooltip trước khi nộp → test frontend kiểm tra `document.body.innerHTML` không chứa câu (Task 2).
5. File nội dung hợp lệ riêng lẻ nhưng import thật vẫn lỗi (va chạm mã với dữ liệu khác) → `ContentFolderImportTest` import toàn bộ thư mục thật qua `ContentService` (Task 3).

---

### Task 1: DICTATION ở backend (validator + grader)

**Files:**
- Modify: `backend/src/main/java/vn/ieltsapp/content/ContentValidator.java`
- Modify: `backend/src/main/java/vn/ieltsapp/lesson/ExerciseGrader.java`
- Test: `backend/src/test/java/vn/ieltsapp/content/ContentValidatorTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/lesson/ExerciseGraderTest.java`

**Interfaces:**
- Produces: `ContentValidator.EXERCISE_TYPES` chứa `"DICTATION"`; `ExerciseGrader.isCorrect("DICTATION", answer, given)`; `ExerciseGrader.normalizeSentence(String)` (package-private, static).

- [ ] **Step 1: Viết test validator** — thêm vào `ContentValidatorTest`:

```java
    @Test
    void dictationNeedsNoOptions() {
        UnitFile u = validUnit();
        ExerciseDef d = new ExerciseDef("S0-U01-G1-E1", "DICTATION", "I live in Hanoi.", null,
                "I live in Hanoi.", "Nghe chép");
        UnitFile ok = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", "LISTENING", "FRI", "t", "b", List.of(d))), u.test());
        assertThat(ContentValidator.validateUnit(ok, Set.of("S0"))).isEmpty();
    }
```

- [ ] **Step 2: Viết test grader** — thêm vào `ExerciseGraderTest`:

```java
    @Test
    void dictationIgnoresCasePunctuationAndExtraSpaces() {
        String a = "She gets up at six o'clock.|She gets up at 6 o'clock.";
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, "she gets up at six o'clock")).isTrue();
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, "  She  gets up at 6 o’clock!! ")).isTrue();
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, "she gets up at six oclock")).isFalse();
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, "she get up at six o'clock")).isFalse();
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, "")).isFalse();
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, "   ")).isFalse();
        assertThat(ExerciseGrader.isCorrect("DICTATION", a, null)).isFalse();
    }

    @Test
    void dictationTreatsHyphenAsSpace() {
        assertThat(ExerciseGrader.isCorrect("DICTATION", "He is twenty-one.", "he is twenty one")).isTrue();
        assertThat(ExerciseGrader.isCorrect("DICTATION", "He is twenty-one.", "He is twenty-one")).isTrue();
    }

    @Test
    void normalizeSentenceKeepsApostropheAndLetters() {
        assertThat(ExerciseGrader.normalizeSentence(" I’m   Lan, from Huế. ")).isEqualTo("i'm lan from huế");
    }
```

- [ ] **Step 3: Chạy test, thấy fail**

Run (trong `backend/`): `./mvnw test -Dtest=ContentValidatorTest,ExerciseGraderTest`
Expected: FAIL — `dictationNeedsNoOptions` báo `type: không hợp lệ`; test grader không biên dịch được (`normalizeSentence` chưa có).

- [ ] **Step 4: Sửa validator** — trong `ContentValidator.java`:

```java
    static final Set<String> EXERCISE_TYPES = Set.of("MCQ", "FILL", "MINIMAL_PAIR", "DICTATION");
```

- [ ] **Step 5: Sửa grader** — trong `ExerciseGrader.java`, `isCorrect` thành:

```java
    public static boolean isCorrect(String type, String answer, String given) {
        if (given == null) return false;
        if ("FILL".equals(type)) {
            String g = normalize(given);
            return Arrays.stream(answer.split("\\|")).map(ExerciseGrader::normalize).anyMatch(g::equals);
        }
        if ("DICTATION".equals(type)) {
            String g = normalizeSentence(given);
            if (g.isEmpty()) return false;
            return Arrays.stream(answer.split("\\|")).map(ExerciseGrader::normalizeSentence).anyMatch(g::equals);
        }
        return answer.equals(given.trim());
    }
```

và thêm sau `normalize`:

```java
    /** Chuẩn hoá câu nghe chép: bỏ chữ hoa, dấu câu, khoảng trắng thừa; giữ chữ, số và dấu nháy đơn. */
    static String normalizeSentence(String s) {
        return s.toLowerCase(Locale.ROOT).replace('’', '\'')
                .replaceAll("[^\\p{L}\\p{N}\\s']", " ")
                .replaceAll("\\s+", " ").trim();
    }
```

- [ ] **Step 6: Chạy test, thấy pass**

Run: `./mvnw test -Dtest=ContentValidatorTest,ExerciseGraderTest`
Expected: PASS. Sau đó chạy `./mvnw test` toàn bộ: PASS (122 + 4 test mới).

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/vn/ieltsapp/content/ContentValidator.java backend/src/main/java/vn/ieltsapp/lesson/ExerciseGrader.java backend/src/test/java/vn/ieltsapp/content/ContentValidatorTest.java backend/src/test/java/vn/ieltsapp/lesson/ExerciseGraderTest.java
git commit -m "feat(backend): dạng bài tập DICTATION (nghe chép chính tả)"
```

---

### Task 2: DICTATION ở frontend

**Files:**
- Modify: `frontend/src/api/types.ts:5`
- Modify: `frontend/src/components/ExerciseSet.tsx`
- Test: `frontend/src/components/ExerciseSet.test.tsx`

**Interfaces:**
- Consumes: `speak(text: string, override?: Partial<SpeechSettings>): boolean` từ `frontend/src/speech/speech.ts`; `stubSpeech()` từ `frontend/src/test/speechStub.ts` (trả mảng `{ text, voice, rate }` các câu đã đọc).
- Produces: `ExerciseType` gồm `'DICTATION'`.

- [ ] **Step 1: Viết test** — thêm vào cuối `ExerciseSet.test.tsx`:

```tsx
test('DICTATION: không lộ câu, có nút nghe thường và nghe chậm, gõ rồi nộp', async () => {
  const user = userEvent.setup();
  const spoken = stubSpeech();
  const onSubmit = vi.fn();
  render(<ExerciseSet exercises={[{ code: 'D1', type: 'DICTATION', prompt: 'I live in Hanoi.', options: null }]}
    onSubmit={onSubmit} />);
  expect(document.body.innerHTML).not.toContain('I live in Hanoi');
  await user.click(screen.getByRole('button', { name: 'Nghe câu' }));
  await user.click(screen.getByRole('button', { name: 'Nghe chậm' }));
  expect(spoken.map((s) => [s.text, s.rate])).toEqual([['I live in Hanoi.', 1], ['I live in Hanoi.', 0.7]]);
  await user.type(screen.getByLabelText('Câu 1'), 'i live in hanoi');
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(onSubmit).toHaveBeenCalledWith({ D1: 'i live in hanoi' });
});

test('DICTATION: sau khi chấm thì hiện câu đáp án', () => {
  stubSpeech();
  render(<ExerciseSet exercises={[{ code: 'D1', type: 'DICTATION', prompt: 'I live in Hanoi.', options: null }]}
    onSubmit={() => undefined}
    results={[{ code: 'D1', given: 'i live in hanoy', correct: false, answer: 'I live in Hanoi.', explanationVi: null }]} />);
  expect(screen.getByText('✗ Sai — đáp án: I live in Hanoi.')).toBeInTheDocument();
  expect(screen.getByLabelText('Câu 1')).toBeDisabled();
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run (trong `frontend/`): `npx vitest run src/components/ExerciseSet.test.tsx`
Expected: FAIL — không tìm thấy nút "Nghe câu" (và `tsc` báo `'DICTATION'` không thuộc `ExerciseType`).

- [ ] **Step 3: Sửa type** — `frontend/src/api/types.ts` dòng 5:

```ts
export type ExerciseType = 'MCQ' | 'FILL' | 'MINIMAL_PAIR' | 'DICTATION';
```

- [ ] **Step 4: Sửa `ExerciseSet.tsx`** — thêm import `import { speak } from '../speech/speech';`. Trong `ExerciseItem`, thay khối hiển thị đề và khối ô nhập thành:

```tsx
      {exercise.type === 'MINIMAL_PAIR' ? (
        <div className="flex items-center gap-2">
          <span>Nghe và chọn từ đúng:</span>
          <SpeakButton text={exercise.prompt} label="Nghe từ" />
        </div>
      ) : exercise.type === 'DICTATION' ? (
        <div className="flex flex-wrap items-center gap-2">
          <span>Nghe và chép lại câu:</span>
          <button type="button" className="btn btn-ghost" aria-label="Nghe câu" onClick={() => speak(exercise.prompt)}>🔊 Nghe câu</button>
          <button type="button" className="btn btn-ghost" aria-label="Nghe chậm" onClick={() => speak(exercise.prompt, { rate: 0.7 })}>🐢 Nghe chậm</button>
        </div>
      ) : (
        <p className="font-medium">{exercise.prompt}</p>
      )}
      {exercise.type === 'FILL' || exercise.type === 'DICTATION' ? (
        <input className="input mt-2" aria-label={`Câu ${index}`} value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
```

(Phần `options.map(...)` phía sau giữ nguyên.) `aria-label` cố định để tên truy cập không chứa emoji; tuyệt đối không đưa `exercise.prompt` vào `aria-label` hay `title`.

- [ ] **Step 5: Chạy test, thấy pass**

Run: `npx vitest run` rồi `npx tsc -b`
Expected: toàn bộ PASS (57 + 2), tsc không lỗi.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/types.ts frontend/src/components/ExerciseSet.tsx frontend/src/components/ExerciseSet.test.tsx
git commit -m "feat(frontend): giao diện bài nghe chép chính tả (nghe thường/nghe chậm)"
```

---

### Task 3: Bộ test thư mục content + hướng dẫn soạn + soạn lại Unit 01

**Files:**
- Create: `backend/src/test/java/vn/ieltsapp/content/ContentFolderTest.java`
- Create: `backend/src/test/java/vn/ieltsapp/content/ContentFolderImportTest.java`
- Create: `docs/content-authoring.md`
- Modify (viết lại toàn bộ): `content/stage-0/unit-01.json`

**Interfaces:**
- Consumes: `ContentValidator.validateStage/validateUnit`, `ContentModel.*`, `WordCode.of`, `ContentService.importFiles(List<NamedContent>)` → `List<ImportResult>` (`ImportResult(file, ok, errors)`), `NamedContent(String name, byte[] bytes)`, lớp cơ sở `vn.ieltsapp.support.IntegrationTest`.
- Produces: `ContentFolderTest` (các task soạn nội dung chạy nó), `docs/content-authoring.md` (các task soạn nội dung đọc nó), `unit-01.json` làm mẫu chuẩn.

- [ ] **Step 1: Viết `ContentFolderTest.java`**

```java
package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.common.WordCode;
import vn.ieltsapp.content.ContentModel.*;

/** Kiểm tra nội dung thật trong ../content/stage-0 (chạy cùng ./mvnw test). */
class ContentFolderTest {
    static final Path DIR = Path.of("..", "content", "stage-0");
    static final ObjectMapper STRICT = JsonMapper.builder()
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
    static final List<String> LESSON_SUFFIX = List.of("G1", "P1", "G2", "R1", "L1");
    static final List<String> LESSON_TYPE = List.of("GRAMMAR", "PRONUNCIATION", "GRAMMAR", "READING", "LISTENING");
    static final List<String> LESSON_DAY = List.of("MON", "TUE", "WED", "THU", "FRI");

    static StageFile stage() throws IOException {
        return STRICT.readValue(DIR.resolve("stage.json").toFile(), StageFile.class);
    }

    static SortedMap<Integer, UnitFile> units() throws IOException {
        SortedMap<Integer, UnitFile> map = new TreeMap<>();
        try (Stream<Path> files = Files.list(DIR)) {
            for (Path p : files.filter(f -> f.getFileName().toString().matches("unit-\\d{2}\\.json")).toList()) {
                int n = Integer.parseInt(p.getFileName().toString().substring(5, 7));
                map.put(n, STRICT.readValue(p.toFile(), UnitFile.class));
            }
        }
        return map;
    }

    static List<String> codes(List<ExerciseDef> xs) {
        return xs == null ? List.of() : xs.stream().map(ExerciseDef::code).toList();
    }

    static List<String> expectedCodes(String prefix, int count) {
        List<String> out = new ArrayList<>();
        for (int i = 1; i <= count; i++) out.add(prefix + "-E" + i);
        return out;
    }

    @Test
    void stageFileIsValid() throws IOException {
        assertThat(ContentValidator.validateStage(stage())).isEmpty();
    }

    @Test
    void everyUnitFollowsTheTemplate() throws IOException {
        SortedMap<Integer, UnitFile> units = units();
        assertThat(units).isNotEmpty();
        List<String> problems = new ArrayList<>();
        for (var entry : units.entrySet()) {
            int n = entry.getKey();
            UnitFile u = entry.getValue();
            String code = String.format("S0-U%02d", n);
            String at = "unit-" + String.format("%02d", n) + ": ";
            ContentValidator.validateUnit(u, Set.of("S0")).forEach(e -> problems.add(at + e));
            if (!code.equals(u.code())) problems.add(at + "code phải là " + code);
            if (!Integer.valueOf(n).equals(u.order())) problems.add(at + "order phải là " + n);
            if (u.words() == null || u.words().size() < 40 || u.words().size() > 50) {
                problems.add(at + "cần 40–50 từ");
            }
            for (WordDef w : u.words() == null ? List.<WordDef>of() : u.words()) {
                String wp = at + "từ '" + w.headword() + "': ";
                for (var f : Map.of("ipaUs", Objects.toString(w.ipaUs(), ""), "ipaUk", Objects.toString(w.ipaUk(), ""),
                        "exampleEn", Objects.toString(w.exampleEn(), ""), "exampleVi", Objects.toString(w.exampleVi(), "")).entrySet()) {
                    if (f.getValue().isBlank()) problems.add(wp + f.getKey() + " trống");
                }
                if (!"A1".equals(w.cefr()) && !"A2".equals(w.cefr())) problems.add(wp + "cefr phải là A1/A2");
                if (!"OXFORD".equals(w.source())) problems.add(wp + "source phải là OXFORD");
            }
            List<LessonDef> lessons = u.lessons() == null ? List.of() : u.lessons();
            if (lessons.size() != 5) {
                problems.add(at + "cần đúng 5 bài học G1,P1,G2,R1,L1");
            } else {
                for (int i = 0; i < 5; i++) {
                    LessonDef l = lessons.get(i);
                    String lc = code + "-" + LESSON_SUFFIX.get(i);
                    String lp = at + lc + ": ";
                    if (!lc.equals(l.code())) problems.add(at + "bài thứ " + (i + 1) + " phải có code " + lc);
                    if (!LESSON_TYPE.get(i).equals(l.type())) problems.add(lp + "type phải là " + LESSON_TYPE.get(i));
                    if (!LESSON_DAY.get(i).equals(l.day())) problems.add(lp + "day phải là " + LESSON_DAY.get(i));
                    List<ExerciseDef> xs = l.exercises() == null ? List.of() : l.exercises();
                    if (!codes(xs).equals(expectedCodes(lc, xs.size()))) problems.add(lp + "mã bài tập phải là " + lc + "-E1..En");
                    Set<String> types = new HashSet<>();
                    xs.forEach(x -> types.add(x.type()));
                    switch (LESSON_SUFFIX.get(i)) {
                        case "G1", "G2" -> {
                            if (xs.size() < 6 || xs.size() > 8) problems.add(lp + "cần 6–8 câu");
                            if (!Set.of("MCQ", "FILL").containsAll(types)) problems.add(lp + "chỉ dùng MCQ/FILL");
                        }
                        case "P1" -> {
                            if (xs.size() < 5 || xs.size() > 6) problems.add(lp + "cần 5–6 câu");
                            Set<String> allowed = n <= 8 ? Set.of("MINIMAL_PAIR") : Set.of("MINIMAL_PAIR", "MCQ");
                            if (!allowed.containsAll(types)) problems.add(lp + "loại câu chỉ được " + allowed);
                        }
                        case "R1" -> {
                            if (xs.size() != 5) problems.add(lp + "cần đúng 5 câu");
                            if (!Set.of("MCQ").containsAll(types)) problems.add(lp + "chỉ dùng MCQ");
                        }
                        case "L1" -> {
                            if (xs.size() < 5 || xs.size() > 6) problems.add(lp + "cần 5–6 câu");
                            if (!Set.of("DICTATION").equals(types)) problems.add(lp + "chỉ dùng DICTATION");
                        }
                        default -> { }
                    }
                    for (ExerciseDef x : xs) {
                        if (x.explanationVi() == null || x.explanationVi().isBlank()) problems.add(lp + x.code() + " thiếu explanationVi");
                        if ("DICTATION".equals(x.type()) && x.options() != null && !x.options().isEmpty()) {
                            problems.add(lp + x.code() + " DICTATION không có options");
                        }
                    }
                }
            }
            TestDef t = u.test();
            if (t != null) {
                String tc = code + "-T";
                List<ExerciseDef> xs = t.exercises() == null ? List.of() : t.exercises();
                if (!tc.equals(t.code())) problems.add(at + "test.code phải là " + tc);
                if (!Double.valueOf(0.6).equals(t.passRatio())) problems.add(at + "test.passRatio phải là 0.6");
                if (xs.size() < 12 || xs.size() > 15) problems.add(at + "test cần 12–15 câu");
                if (!codes(xs).equals(expectedCodes(tc, xs.size()))) problems.add(at + "mã câu test phải là " + tc + "-E1..En");
                if (xs.stream().noneMatch(x -> "DICTATION".equals(x.type()))) problems.add(at + "test cần ít nhất 1 câu DICTATION");
                for (ExerciseDef x : xs) {
                    if (x.explanationVi() == null || x.explanationVi().isBlank()) problems.add(at + x.code() + " thiếu explanationVi");
                }
            }
        }
        assertThat(problems).isEmpty();
    }

    @Test
    void noWordAppearsInTwoUnits() throws IOException {
        Map<String, String> owner = new HashMap<>();
        List<String> dups = new ArrayList<>();
        for (UnitFile u : units().values()) {
            for (WordDef w : u.words()) {
                String code = WordCode.of(w.headword(), w.pos());
                String prev = owner.putIfAbsent(code, u.code());
                if (prev != null && !prev.equals(u.code())) dups.add(code + " ở " + prev + " và " + u.code());
            }
        }
        assertThat(dups).isEmpty();
    }

    @Test
    void noCodeAppearsInTwoFiles() throws IOException {
        Map<String, String> owner = new HashMap<>();
        List<String> dups = new ArrayList<>();
        StageFile s = stage();
        codes(s.test() == null ? null : s.test().exercises()).forEach(c -> owner.put(c, "stage.json"));
        for (UnitFile u : units().values()) {
            List<String> all = new ArrayList<>();
            u.lessons().forEach(l -> { all.add(l.code()); all.addAll(codes(l.exercises())); });
            all.add(u.test().code());
            all.addAll(codes(u.test().exercises()));
            for (String c : all) {
                String prev = owner.putIfAbsent(c, u.code());
                if (prev != null && !prev.equals(u.code())) dups.add(c + " ở " + prev + " và " + u.code());
            }
        }
        assertThat(dups).isEmpty();
    }

    @Disabled("Bật ở Task 12 khi đủ 24 unit")
    @Test
    void stageIsComplete() throws IOException {
        SortedMap<Integer, UnitFile> units = units();
        List<Integer> expected = new ArrayList<>();
        for (int i = 1; i <= 24; i++) expected.add(i);
        assertThat(new ArrayList<>(units.keySet())).isEqualTo(expected);
        int total = units.values().stream().mapToInt(u -> u.words().size()).sum();
        assertThat(total).isBetween(950, 1100);
        TestDef t = stage().test();
        assertThat(t.code()).isEqualTo("S0-T");
        assertThat(t.passRatio()).isEqualTo(0.7);
        assertThat(codes(t.exercises())).isEqualTo(expectedCodes("S0-T", 30));
        assertThat(t.exercises()).allSatisfy(x -> assertThat(x.explanationVi()).isNotBlank());
    }
}
```

- [ ] **Step 2: Viết `ContentFolderImportTest.java`**

```java
package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;
import vn.ieltsapp.support.IntegrationTest;

/** Import toàn bộ ../content thật qua ContentService: mọi file phải nạp được. */
class ContentFolderImportTest extends IntegrationTest {
    @Autowired ContentService contentService;

    @Test
    void wholeContentFolderImports() throws Exception {
        List<NamedContent> files = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(Path.of("..", "content"))) {
            for (Path p : paths.filter(f -> f.toString().endsWith(".json")).toList()) {
                files.add(new NamedContent(p.toString(), Files.readAllBytes(p)));
            }
        }
        assertThat(files).isNotEmpty();
        List<ImportResult> results = contentService.importFiles(files);
        assertThat(results).allSatisfy(r -> assertThat(r.errors()).as(r.file()).isEmpty());
        assertThat(results).allMatch(ImportResult::ok);
    }
}
```

(Nếu `IntegrationTest` đã có sẵn một `ContentService` được inject dưới tên khác, dùng nó thay vì `@Autowired` mới.)

- [ ] **Step 3: Chạy test, thấy fail**

Run (trong `backend/`): `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest`
Expected: `everyUnitFollowsTheTemplate` FAIL (unit-01 hiện chỉ 5 từ, 2 bài học); `ContentFolderImportTest` PASS; các test còn lại PASS; `stageIsComplete` bị bỏ qua.

- [ ] **Step 4: Viết `docs/content-authoring.md`** với đúng nội dung sau:

````markdown
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
- `meaningVi` ngắn gọn, đúng nghĩa được dùng trong ví dụ; nhiều nghĩa thì ngăn bằng `; `.
- `exampleEn` 5–12 từ, chỉ dùng từ A1–A2 và ngữ pháp đã học đến unit đó; `exampleVi` dịch tự nhiên.
- Bối cảnh Việt Nam: tên người (Lan, Minh, Hoa, Nam…), địa danh (Hanoi, Da Nang, Hue…).

## Bài học

- `bodyMd` tiếng Việt, Markdown: tiêu đề `##`, giải thích ngắn, bảng hoặc gạch đầu dòng, ví dụ in nghiêng. Ngữ pháp 150–300 từ; phát âm nêu khẩu hình + ví dụ từ.
- READING: `bodyMd` có hướng dẫn 1 dòng tiếng Việt rồi đoạn văn tiếng Anh 80–150 từ (dùng nhiều từ của unit), câu hỏi MCQ tiếng Anh đơn giản, 3 lựa chọn.
- LISTENING: `bodyMd` hướng dẫn nghe chép (tiếng Việt) + mẹo nghe của unit. Câu DICTATION 4–10 từ, dùng từ vựng/ngữ pháp unit.
- MINIMAL_PAIR: `prompt` là từ được đọc, `options` 2–3 từ dễ nhầm (thật, có nghĩa), `answer` = `prompt`. Đổi vị trí đáp án đúng giữa các câu.
- MCQ phát âm (unit 9–24): ví dụ "Which word has stress on the first syllable?" hoặc "How is -ed pronounced in 'watched'?" với options `/t/`, `/d/`, `/ɪd/`.
- MCQ: 3 lựa chọn (đôi khi 2 hoặc 4), đáp án đúng nằm ở vị trí khác nhau giữa các câu. FILL: dạng "They ___ (live) near the sea."; mọi cách viết đúng khai báo trong `answer` bằng `|` (ví dụ `don't like|do not like`).

## DICTATION

```json
{ "code": "S0-U04-L1-E1", "type": "DICTATION", "prompt": "She gets up at six o'clock.",
  "answer": "She gets up at six o'clock.|She gets up at 6 o'clock.", "explanationVi": "gets: ngôi 3 số ít thêm -s." }
```

- Không có `options`. `answer` phương án đầu = `prompt`.
- Câu có số: khai báo cả dạng chữ và dạng số. Câu có dạng rút gọn (I'm, don't, it's…): khai báo cả dạng đầy đủ.
- Khi chấm, chữ hoa, dấu câu, dấu gạch nối và khoảng trắng thừa bị bỏ qua; dấu nháy đơn được giữ.
- Tránh tên riêng khó đoán chính tả trong câu nghe chép (chỉ dùng tên rất phổ biến: Lan, Nam, Tom, Anna).
````

- [ ] **Step 5: Viết lại `content/stage-0/unit-01.json`** theo `docs/content-authoring.md`: unit 1 "Chào hỏi & động từ to be", P1 âm /ɪ/–/iː/, 40–45 từ (giữ các từ hello/name/live/work/family nếu hợp chủ đề — `live`, `work` nên chuyển sang unit 4 thì bỏ khỏi unit 1), G1 *to be* khẳng định + đại từ nhân xưng, G2 *to be* phủ định và câu hỏi Yes/No, R1 đoạn tự giới thiệu, L1 5–6 câu DICTATION, test 12–15 câu. Đây là file mẫu cho mọi unit sau nên phải chỉn chu nhất.

- [ ] **Step 6: Chạy test, thấy pass**

Run: `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` → PASS (1 test bị skip: `stageIsComplete`). Sau đó `./mvnw test` toàn bộ → PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/test/java/vn/ieltsapp/content/ContentFolderTest.java backend/src/test/java/vn/ieltsapp/content/ContentFolderImportTest.java docs/content-authoring.md content/stage-0/unit-01.json
git commit -m "test(content): kiểm tra thư mục nội dung + hướng dẫn soạn + soạn lại unit 01"
```

---

### Task 4: Soạn unit 02–04

**Files:**
- Create: `content/stage-0/unit-02.json`, `content/stage-0/unit-03.json`, `content/stage-0/unit-04.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 02 — Gia đình. G1 tính từ sở hữu (my/your/his/her/our/their) + sở hữu cách 's; G2 *have/has* (khẳng định, phủ định, câu hỏi). P1 /æ/ /e/ /ʌ/ (ví dụ cặp: bad–bed, cat–cut, ten–tan).
- Unit 03 — Nhà cửa & đồ vật. G1 *There is/There are*; G2 mạo từ a/an/the + danh từ số nhiều (-s/-es, bất quy tắc thường gặp). P1 /ɒ/ /ɔː/ /ʊ/ /uː/ (US: /ɑː/ cho "hot"; ví dụ: full–fool, pull–pool, cot–caught).
- Unit 04 — Thói quen hằng ngày. G1 hiện tại đơn khẳng định (I/you/we/they + V; he/she/it + V-s/es, quy tắc thêm -es/-ies); G2 hiện tại đơn luyện tập: động từ chỉ hoạt động hằng ngày + cụm thời gian (every day, in the morning). P1 /ɜː/ /ə/ /ɑː/ (ví dụ: bird–bud, heart–hurt).

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-02.json`** theo hướng dẫn, rồi chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-03.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-04.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — đọc lại từng file: IPA đúng chuẩn US/UK, nghĩa tiếng Việt đúng với câu ví dụ, mỗi MCQ có đúng một đáp án đúng, câu DICTATION có số/dạng rút gọn đã khai báo đủ phương án, đáp án MCQ không luôn nằm cùng vị trí.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-02.json content/stage-0/unit-03.json content/stage-0/unit-04.json
git commit -m "content: Chặng 0 unit 02–04"
```

---

### Task 5: Soạn unit 05–07

**Files:**
- Create: `content/stage-0/unit-05.json`, `content/stage-0/unit-06.json`, `content/stage-0/unit-07.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 05 — Thời gian & lịch. G1 hiện tại đơn phủ định (don't/doesn't) và câu hỏi (Do/Does…?, trả lời ngắn); G2 trạng từ tần suất (always, usually, often, sometimes, never) + vị trí trong câu, nói giờ/ngày/tháng. P1 nguyên âm đôi /eɪ/ /aɪ/ /ɔɪ/ (ví dụ: late–light, buy–boy).
- Unit 06 — Đồ ăn & thức uống. G1 danh từ đếm được/không đếm được + a/an/some; G2 some/any, much/many, a lot of. P1 /aʊ/ /əʊ/ /ɪə/ /eə/ /ʊə/ (ví dụ: now–no, here–hair).
- Unit 07 — Mua sắm & tiền. G1 How much/How many + giá tiền; G2 this/that/these/those. P1 phụ âm /p b t d k g f v θ ð s z/ (ví dụ cặp: pig–big, fan–van, think–sink, they–day, ice–eyes).

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-05.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-06.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-07.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-05.json content/stage-0/unit-06.json content/stage-0/unit-07.json
git commit -m "content: Chặng 0 unit 05–07"
```

---

### Task 6: Soạn unit 08–10

**Files:**
- Create: `content/stage-0/unit-08.json`, `content/stage-0/unit-09.json`, `content/stage-0/unit-10.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 08 — Thành phố & chỉ đường. G1 giới từ nơi chốn (in, on, at, next to, between, opposite, behind, in front of); G2 câu mệnh lệnh + chỉ đường (turn left, go straight, Don't…). P1 phụ âm /ʃ ʒ tʃ dʒ m n ŋ l r w j h/ (ví dụ: ship–chip, chin–gin, light–right, thin–thing).
- Unit 09 — Công việc. G1 hiện tại tiếp diễn khẳng định (am/is/are + V-ing, quy tắc thêm -ing); G2 hiện tại tiếp diễn phủ định + câu hỏi. P1 đuôi -s/-es: /s/ /z/ /ɪz/ (MCQ "How is -s pronounced in 'washes'?" + MINIMAL_PAIR nếu phù hợp).
- Unit 10 — Thời tiết & mùa. G1 phân biệt hiện tại đơn vs tiếp diễn (thói quen vs đang xảy ra, signal words); G2 luyện tập + động từ trạng thái không dùng tiếp diễn (like, want, know). P1 trọng âm từ 2 âm tiết (MCQ chọn âm tiết nhấn, ví dụ "weather", "today", "begin").

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-08.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-09.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-10.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-08.json content/stage-0/unit-09.json content/stage-0/unit-10.json
git commit -m "content: Chặng 0 unit 08–10"
```

---

### Task 7: Soạn unit 11–13

**Files:**
- Create: `content/stage-0/unit-11.json`, `content/stage-0/unit-12.json`, `content/stage-0/unit-13.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 11 — Sở thích & thể thao. G1 like/love/enjoy/hate + V-ing; G2 can/can't chỉ khả năng (khẳng định, phủ định, câu hỏi). P1 can /kən/ (dạng yếu) vs can't /kɑːnt/ (UK) /kænt/ (US) — MCQ nghe phân biệt trong câu + MINIMAL_PAIR "can"/"can't".
- Unit 12 — Tuổi thơ. G1 was/were khẳng định; G2 was/were phủ định + câu hỏi, there was/there were. P1 trọng âm từ 3 âm tiết (MCQ: "family", "computer", "holiday"…).
- Unit 13 — Cuối tuần. G1 quá khứ đơn có quy tắc khẳng định (-ed, quy tắc chính tả); G2 quá khứ đơn phủ định (didn't) + câu hỏi (Did…?), cụm thời gian quá khứ (yesterday, last week, ago). P1 đuôi -ed: /t/ /d/ /ɪd/.

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-11.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-12.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-13.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-11.json content/stage-0/unit-12.json content/stage-0/unit-13.json
git commit -m "content: Chặng 0 unit 11–13"
```

---

### Task 8: Soạn unit 14–16

**Files:**
- Create: `content/stage-0/unit-14.json`, `content/stage-0/unit-15.json`, `content/stage-0/unit-16.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 14 — Du lịch. G1 quá khứ đơn động từ bất quy tắc thường gặp (go–went, see–saw, take–took, buy–bought…); G2 câu hỏi quá khứ đơn với từ để hỏi (Where did…? What did…?). P1 âm cuối (lỗi người Việt nuốt âm cuối: MINIMAL_PAIR như bike–bite, rice–rise, white–wide; MCQ chọn từ có âm cuối khác).
- Unit 15 — Sức khỏe & cơ thể. G1 should/shouldn't (lời khuyên); G2 must/mustn't vs have to/don't have to. P1 cụm phụ âm (street, spring, desks, asked — MINIMAL_PAIR với cặp có thật như play–pray, glass–grass; MCQ đếm âm tiết, ví dụ 'How many syllables in \"asked\"?').
- Unit 16 — Trường học. G1 câu hỏi Wh- (what, where, when, who, why, how) với to be và trợ động từ; G2 How + tính từ/trạng từ (how old, how often, how long), câu hỏi chủ ngữ (Who teaches…?). P1 ngữ điệu câu hỏi (Wh- xuống giọng, Yes/No lên giọng — MCQ "Does this question go up or down at the end?").

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-14.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-15.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-16.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-14.json content/stage-0/unit-15.json content/stage-0/unit-16.json
git commit -m "content: Chặng 0 unit 14–16"
```

---

### Task 9: Soạn unit 17–19

**Files:**
- Create: `content/stage-0/unit-17.json`, `content/stage-0/unit-18.json`, `content/stage-0/unit-19.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 17 — Kế hoạch. G1 be going to (dự định, dự đoán có căn cứ); G2 will (quyết định tức thời, lời hứa, dự đoán) + so sánh với going to. P1 dạng yếu của to /tə/, for /fə/, of /əv/ (MCQ chọn cách đọc trong câu).
- Unit 18 — Đi lại. G1 giới từ thời gian in/on/at (in July, on Monday, at 7 o'clock); G2 by + phương tiện (by bus, on foot), cụm từ đi lại (get on/off, take a taxi). P1 nối âm phụ âm–nguyên âm (get on, take it — MCQ chọn chỗ nối âm).
- Unit 19 — Con người & tính cách. G1 so sánh hơn tính từ ngắn (-er, quy tắc chính tả, than); G2 so sánh hơn tính từ dài (more…), bất quy tắc (good–better, bad–worse), as…as. P1 trọng âm câu (từ nội dung được nhấn — MCQ chọn từ được nhấn).

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-17.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-18.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-19.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-17.json content/stage-0/unit-18.json content/stage-0/unit-19.json
git commit -m "content: Chặng 0 unit 17–19"
```

---

### Task 10: Soạn unit 20–22

**Files:**
- Create: `content/stage-0/unit-20.json`, `content/stage-0/unit-21.json`, `content/stage-0/unit-22.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 20 — Địa danh. G1 so sánh nhất tính từ ngắn (the -est); G2 so sánh nhất tính từ dài (the most…), bất quy tắc (the best, the worst), in/of sau so sánh nhất. P1 âm câm (k trong know, w trong write, b trong climb, l trong walk — MCQ chọn chữ câm).
- Unit 21 — Trải nghiệm. G1 hiện tại hoàn thành khẳng định/phủ định (have/has + V3, phân từ bất quy tắc thường gặp); G2 Have you ever…? ever/never, been vs gone. P1 dạng rút gọn (I've, she's, haven't — MCQ nhận dạng dạng rút gọn khi nghe; MINIMAL_PAIR như "I've"/"I").
- Unit 22 — Thay đổi. G1 hiện tại hoàn thành vs quá khứ đơn (thời điểm xác định vs không xác định); G2 for/since, How long have you…?, already/yet/just. P1 âm /h/ (hat–at, hair–air — MINIMAL_PAIR; dạng yếu của "have/has/him" trong câu).

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-20.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-21.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Soạn `unit-22.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 5: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi.
- [ ] **Step 6: Commit**

```bash
git add content/stage-0/unit-20.json content/stage-0/unit-21.json content/stage-0/unit-22.json
git commit -m "content: Chặng 0 unit 20–22"
```

---

### Task 11: Soạn unit 23–24

**Files:**
- Create: `content/stage-0/unit-23.json`, `content/stage-0/unit-24.json`

**Interfaces:**
- Consumes: quy tắc trong `docs/content-authoring.md`; mẫu `content/stage-0/unit-01.json`; danh sách từ đã dùng ở các unit trước (lệnh `grep` trong hướng dẫn).

Nội dung:
- Unit 23 — Kể chuyện. G1 quá khứ tiếp diễn (was/were + V-ing; when/while); G2 quá khứ hoàn thành (had + V3) để nói việc xảy ra trước một việc khác trong quá khứ. P1 ngữ điệu kể chuyện (nhấn từ nối first/then/after that, ngắt nhịp — MCQ).
- Unit 24 — Tổng ôn. G1 bảng 12 thì: 4 thì hiện tại/quá khứ/tương lai × đơn/tiếp diễn/hoàn thành/hoàn thành tiếp diễn — giới thiệu nhận diện các thì chưa học (tương lai tiếp diễn, tương lai hoàn thành, các thì hoàn thành tiếp diễn) ở mức nhận biết; G2 ôn tập phối hợp các thì đã học (chọn thì đúng theo dấu hiệu). P1 ôn tập phát âm (trộn các hiện tượng đã học). Từ vựng: từ A2 hữu ích chung còn thiếu (thời gian, cảm xúc, từ nối) — kiểm tra tổng số từ toàn chặng sau unit này nằm trong 950–1100 (`grep -c '"headword"' content/stage-0/unit-*.json`); nếu thiếu, bổ sung vào unit 23–24 trong giới hạn 40–50 từ/unit.

- [ ] **Step 1: Liệt kê từ đã dùng** — chạy lệnh `grep` trong hướng dẫn, ghi nhớ để không lặp.
- [ ] **Step 2: Soạn `unit-23.json`**, chạy `./mvnw test -Dtest=ContentFolderTest,ContentFolderImportTest` (trong `backend/`); sửa đến khi PASS.
- [ ] **Step 3: Soạn `unit-24.json`**, chạy lại test, sửa đến khi PASS.
- [ ] **Step 4: Tự soát** — IPA, nghĩa, một đáp án đúng mỗi MCQ, phương án DICTATION, vị trí đáp án MCQ thay đổi; tổng từ toàn chặng 950–1100.
- [ ] **Step 5: Commit**

```bash
git add content/stage-0/unit-23.json content/stage-0/unit-24.json
git commit -m "content: Chặng 0 unit 23–24"
```

---

### Task 12: Bài kiểm tra chặng + bật kiểm tra đủ chặng

**Files:**
- Modify: `content/stage-0/stage.json`
- Modify: `backend/src/test/java/vn/ieltsapp/content/ContentFolderTest.java` (bỏ `@Disabled` và import `Disabled` nếu không còn dùng)

**Interfaces:**
- Consumes: 24 file unit đã có; `ContentFolderTest.stageIsComplete`.

- [ ] **Step 1: Bật test** — xoá dòng `@Disabled("Bật ở Task 12 khi đủ 24 unit")` (và `import org.junit.jupiter.api.Disabled;`).
- [ ] **Step 2: Chạy test, thấy fail**

Run (trong `backend/`): `./mvnw test -Dtest=ContentFolderTest`
Expected: `stageIsComplete` FAIL — bài kiểm tra chặng hiện chỉ có 2 câu, không phải `S0-T-E1..E30`.

- [ ] **Step 3: Viết lại `test` trong `stage.json`** — giữ `code` `S0`, `title` `Xây nền`, `targetBand` 4.0, `order` 0; `test`: `code` `S0-T`, `kind` `STAGE`, `passRatio` 0.7, đúng 30 câu `S0-T-E1`..`S0-T-E30`, phủ đều 24 unit (mỗi unit ít nhất 1 câu; các thì và điểm ngữ pháp chính: to be, hiện tại đơn/tiếp diễn, quá khứ đơn, hiện tại hoàn thành, going to/will, so sánh, modal, giới từ, mạo từ, đếm được/không đếm được, câu hỏi Wh-), gồm ít nhất 20 MCQ/FILL, 4 DICTATION, 3 MINIMAL_PAIR; mọi câu có `explanationVi` ghi rõ thuộc unit nào (ví dụ "Unit 13 — quá khứ đơn: …").
- [ ] **Step 4: Chạy toàn bộ test**

Run: `./mvnw test` (backend) → PASS; trong `frontend/`: `npx vitest run` và `npx tsc -b` → PASS.

- [ ] **Step 5: Chạy thử app thật** — `npx playwright test` trong `frontend/` (Playwright dùng Edge, script `e2e/start-app.mjs` tự build và khởi động backend) → 3/3 PASS. Nếu môi trường không chạy được Playwright, ghi rõ trong báo cáo.

- [ ] **Step 6: Commit**

```bash
git add content/stage-0/stage.json backend/src/test/java/vn/ieltsapp/content/ContentFolderTest.java
git commit -m "content: bài kiểm tra chuyển chặng 0 (30 câu) + bật kiểm tra đủ 24 unit"
```
