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

    /** DICTATION: phương án đầu của answer = prompt; MINIMAL_PAIR: answer = prompt. */
    static void checkAnswerMatchesPrompt(String prefix, ExerciseDef x, List<String> problems) {
        String answer = Objects.toString(x.answer(), "");
        if ("DICTATION".equals(x.type()) && !answer.split("\\|")[0].equals(x.prompt())) {
            problems.add(prefix + x.code() + " DICTATION: phương án đầu của answer phải trùng prompt");
        }
        if ("MINIMAL_PAIR".equals(x.type()) && !answer.equals(x.prompt())) {
            problems.add(prefix + x.code() + " MINIMAL_PAIR: answer phải trùng prompt");
        }
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
            if (u.words() == null || u.words().size() < 40 || u.words().size() > 45) {
                problems.add(at + "cần 40–45 từ");
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
                        checkAnswerMatchesPrompt(lp, x, problems);
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
                    checkAnswerMatchesPrompt(at, x, problems);
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
