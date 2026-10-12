package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.content.ContentModel.*;

class ContentValidatorTest {

    static ExerciseDef mcq(String code) {
        return new ExerciseDef(code, "MCQ", "She ___ to school.", List.of("go", "goes"), "goes", "ngôi 3 số ít");
    }

    static UnitFile validUnit() {
        return new UnitFile("S0-U01", "S0", "Unit 1", 1,
                List.of(new WordDef("hello", "exclamation", null, null, "xin chào", null, null, "A1", null)),
                List.of(new LessonDef("S0-U01-G1", "GRAMMAR", "MON", "Hiện tại đơn", "## Bài", List.of(mcq("S0-U01-G1-E1")))),
                new TestDef("S0-U01-T", "UNIT", 0.6, List.of(mcq("S0-U01-T-E1"))));
    }

    @Test
    void validUnitHasNoErrors() {
        assertThat(ContentValidator.validateUnit(validUnit(), Set.of("S0"))).isEmpty();
    }

    @Test
    void unknownStageIsReported() {
        assertThat(ContentValidator.validateUnit(validUnit(), Set.of()))
                .contains("stage: chặng 'S0' không tồn tại");
    }

    @Test
    void missingWordMeaningIsReported() {
        UnitFile u = validUnit();
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(),
                List.of(new WordDef("hello", "exclamation", null, null, " ", null, null, null, null)),
                u.lessons(), u.test());
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0"))).contains("words[0].meaningVi: bắt buộc");
    }

    @Test
    void answerMustBeAmongOptions() {
        UnitFile u = validUnit();
        ExerciseDef wrong = new ExerciseDef("S0-U01-G1-E1", "MCQ", "p", List.of("a", "b"), "c", null);
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", "GRAMMAR", "MON", "t", "b", List.of(wrong))), u.test());
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0")))
                .contains("lessons[0].exercises[0].answer: không nằm trong options");
    }

    @Test
    void duplicateCodesAndBadDayAreReported() {
        UnitFile u = validUnit();
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", "GRAMMAR", "SUN", "t", "b", List.of(mcq("X1"), mcq("X1")))),
                u.test());
        List<String> errors = ContentValidator.validateUnit(bad, Set.of("S0"));
        assertThat(errors).contains("lessons[0].day: phải là MON..SAT", "lessons[0].exercises[1].code: trùng 'X1'");
    }

    @Test
    void duplicateWordsAndMissingTestAreReported() {
        UnitFile u = validUnit();
        WordDef w = u.words().get(0);
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), List.of(w, w), u.lessons(), null);
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0")))
                .contains("words[1]: trùng từ 'hello#exclamation'", "test: bắt buộc");
    }

    @Test
    void unitTestMustHaveUnitKind() {
        UnitFile u = validUnit();
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(), u.lessons(),
                new TestDef("S0-U01-T", "STAGE", 0.6, List.of(mcq("S0-U01-T-E1"))));
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0"))).contains("test.kind: phải là UNIT");
    }

    @Test
    void stageValidation() {
        StageFile ok = new StageFile("S0", "Xây nền", 4.0, 0,
                new TestDef("S0-T", "STAGE", 0.7, List.of(mcq("S0-T-E1"))));
        assertThat(ContentValidator.validateStage(ok)).isEmpty();

        StageFile bad = new StageFile("S0", "", null, 0, new TestDef("S0-T", "STAGE", 1.5, List.of()));
        assertThat(ContentValidator.validateStage(bad)).contains(
                "title: bắt buộc", "targetBand: bắt buộc", "test.passRatio: phải trong (0, 1]",
                "test.exercises: cần ít nhất 1 câu");
    }

    @Test
    void missingTypeAndDayAreReportedNotThrown() {
        UnitFile u = validUnit();
        ExerciseDef nullTypeExercise = new ExerciseDef("X1", null, "p", List.of("a", "b"), "a", null);
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", null, null, "t", "b", List.of(nullTypeExercise))), u.test());
        List<String> errors = ContentValidator.validateUnit(bad, Set.of("S0"));
        assertThat(errors).contains("lessons[0].type: không hợp lệ", "lessons[0].day: phải là MON..SAT",
                "lessons[0].exercises[0].type: không hợp lệ");
    }

    @Test
    void dictationNeedsNoOptions() {
        UnitFile u = validUnit();
        ExerciseDef d = new ExerciseDef("S0-U01-G1-E1", "DICTATION", "I live in Hanoi.", null,
                "I live in Hanoi.", "Nghe chép");
        UnitFile ok = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", "LISTENING", "FRI", "t", "b", List.of(d))), u.test());
        assertThat(ContentValidator.validateUnit(ok, Set.of("S0"))).isEmpty();
    }
}
