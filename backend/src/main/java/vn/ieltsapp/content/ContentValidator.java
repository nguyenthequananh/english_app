package vn.ieltsapp.content;

import java.util.*;
import vn.ieltsapp.common.WordCode;
import vn.ieltsapp.content.ContentModel.*;

public final class ContentValidator {
    static final Set<String> LESSON_TYPES = Set.of("GRAMMAR", "PRONUNCIATION", "READING", "LISTENING");
    static final Set<String> DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT");
    static final Set<String> EXERCISE_TYPES = Set.of("MCQ", "FILL", "MINIMAL_PAIR");
    static final Set<String> SOURCES = Set.of("OXFORD", "AWL", "USER");

    private ContentValidator() {}

    public static List<String> validateStage(StageFile f) {
        List<String> e = new ArrayList<>();
        required(e, "code", f.code());
        required(e, "title", f.title());
        if (f.targetBand() == null) e.add("targetBand: bắt buộc");
        if (f.order() == null) e.add("order: bắt buộc");
        if (f.test() != null) validateTest(e, "test", f.test(), "STAGE", new HashSet<>());
        return e;
    }

    public static List<String> validateUnit(UnitFile f, Set<String> knownStages) {
        List<String> e = new ArrayList<>();
        required(e, "code", f.code());
        required(e, "stage", f.stage());
        required(e, "title", f.title());
        if (f.order() == null) e.add("order: bắt buộc");
        if (f.stage() != null && !f.stage().isBlank() && !knownStages.contains(f.stage())) {
            e.add("stage: chặng '" + f.stage() + "' không tồn tại");
        }

        if (f.words() == null) {
            e.add("words: bắt buộc");
        } else {
            Set<String> wordCodes = new HashSet<>();
            for (int i = 0; i < f.words().size(); i++) {
                WordDef w = f.words().get(i);
                String p = "words[" + i + "]";
                required(e, p + ".headword", w.headword());
                required(e, p + ".pos", w.pos());
                required(e, p + ".meaningVi", w.meaningVi());
                if (w.source() != null && !SOURCES.contains(w.source())) e.add(p + ".source: không hợp lệ");
                if (notBlank(w.headword()) && notBlank(w.pos())) {
                    String code = WordCode.of(w.headword(), w.pos());
                    if (!wordCodes.add(code)) e.add(p + ": trùng từ '" + code + "'");
                }
            }
        }

        Set<String> codes = new HashSet<>();
        if (f.lessons() == null) {
            e.add("lessons: bắt buộc");
        } else {
            for (int i = 0; i < f.lessons().size(); i++) {
                LessonDef l = f.lessons().get(i);
                String p = "lessons[" + i + "]";
                uniqueCode(e, p + ".code", l.code(), codes);
                if (!LESSON_TYPES.contains(l.type())) e.add(p + ".type: không hợp lệ");
                if (!DAYS.contains(l.day())) e.add(p + ".day: phải là MON..SAT");
                required(e, p + ".title", l.title());
                required(e, p + ".bodyMd", l.bodyMd());
                List<ExerciseDef> xs = l.exercises() == null ? List.of() : l.exercises();
                for (int j = 0; j < xs.size(); j++) {
                    validateExercise(e, p + ".exercises[" + j + "]", xs.get(j), codes);
                }
            }
        }

        if (f.test() == null) {
            e.add("test: bắt buộc");
        } else {
            validateTest(e, "test", f.test(), "UNIT", codes);
        }
        return e;
    }

    private static void validateTest(List<String> e, String p, TestDef t, String kind, Set<String> codes) {
        uniqueCode(e, p + ".code", t.code(), codes);
        if (!kind.equals(t.kind())) e.add(p + ".kind: phải là " + kind);
        if (t.passRatio() != null && (t.passRatio() <= 0 || t.passRatio() > 1)) {
            e.add(p + ".passRatio: phải trong (0, 1]");
        }
        if (t.exercises() == null || t.exercises().isEmpty()) {
            e.add(p + ".exercises: cần ít nhất 1 câu");
            return;
        }
        for (int j = 0; j < t.exercises().size(); j++) {
            validateExercise(e, p + ".exercises[" + j + "]", t.exercises().get(j), codes);
        }
    }

    private static void validateExercise(List<String> e, String p, ExerciseDef x, Set<String> codes) {
        uniqueCode(e, p + ".code", x.code(), codes);
        if (!EXERCISE_TYPES.contains(x.type())) e.add(p + ".type: không hợp lệ");
        required(e, p + ".prompt", x.prompt());
        required(e, p + ".answer", x.answer());
        if ("MCQ".equals(x.type()) || "MINIMAL_PAIR".equals(x.type())) {
            if (x.options() == null || x.options().size() < 2) {
                e.add(p + ".options: cần ít nhất 2 lựa chọn");
            } else if (x.answer() != null && !x.options().contains(x.answer())) {
                e.add(p + ".answer: không nằm trong options");
            }
        }
    }

    private static void uniqueCode(List<String> e, String path, String code, Set<String> codes) {
        if (!notBlank(code)) {
            e.add(path + ": bắt buộc");
        } else if (!codes.add(code)) {
            e.add(path + ": trùng '" + code + "'");
        }
    }

    private static void required(List<String> e, String path, String value) {
        if (!notBlank(value)) e.add(path + ": bắt buộc");
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
