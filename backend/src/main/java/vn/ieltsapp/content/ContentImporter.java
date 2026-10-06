package vn.ieltsapp.content;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.content.ContentModel.*;

@Service
public class ContentImporter {
    private final ContentRepository repo;

    public ContentImporter(ContentRepository repo) { this.repo = repo; }

    @Transactional
    public void importStage(StageFile f) {
        List<String> errors = ContentValidator.validateStage(f);
        if (errors.isEmpty() && f.test() != null) errors = collisions(null, f.code(), List.of(), f.test());
        if (!errors.isEmpty()) throw new ContentValidationException(errors);
        repo.upsertStage(f);
        if (f.test() != null) importTest(f.test(), null, f.code());
    }

    @Transactional
    public void importUnit(UnitFile f) {
        List<String> errors = ContentValidator.validateUnit(f, repo.stageCodes());
        if (errors.isEmpty()) errors = collisions(f.code(), null, f.lessons(), f.test());
        if (!errors.isEmpty()) throw new ContentValidationException(errors);
        repo.upsertUnit(f);
        repo.replaceUnitWords(f.code(), f.words().stream().map(repo::upsertGlobalWord).toList());
        for (int i = 0; i < f.lessons().size(); i++) {
            LessonDef lesson = f.lessons().get(i);
            repo.upsertLesson(f.code(), lesson, i + 1);
            List<ExerciseDef> exercises = lesson.exercises() == null ? List.of() : lesson.exercises();
            for (int j = 0; j < exercises.size(); j++) {
                repo.upsertExercise(exercises.get(j), lesson.code(), null, j + 1);
            }
            repo.deleteLessonExercisesExcept(lesson.code(), codes(exercises));
        }
        repo.deleteUnitLessonsExcept(f.code(),
                f.lessons().stream().map(LessonDef::code).collect(Collectors.toSet()));
        importTest(f.test(), f.code(), null);
    }

    private static Set<String> codes(List<ExerciseDef> exercises) {
        return exercises.stream().map(ExerciseDef::code).collect(Collectors.toSet());
    }

    private List<String> collisions(String unitCode, String stageCode, List<LessonDef> lessons, TestDef test) {
        List<String> errors = new ArrayList<>();
        for (int i = 0; i < lessons.size(); i++) {
            LessonDef l = lessons.get(i);
            String owner = repo.lessonUnit(l.code()).orElse(null);
            if (owner != null && !owner.equals(unitCode)) {
                errors.add("lessons[" + i + "].code: '" + l.code() + "' đã thuộc unit '" + owner + "'");
            }
            List<ExerciseDef> xs = l.exercises() == null ? List.of() : l.exercises();
            for (int j = 0; j < xs.size(); j++) {
                exerciseCollision(errors, "lessons[" + i + "].exercises[" + j + "]", xs.get(j).code(), l.code(), null);
            }
        }
        if (test != null) {
            String t = test.code();
            if (repo.testExists(t)
                    && (!Objects.equals(repo.testUnit(t).orElse(null), unitCode)
                        || !Objects.equals(repo.testStage(t).orElse(null), stageCode))) {
                errors.add("test.code: '" + t + "' đã thuộc nơi khác");
            }
            List<ExerciseDef> xs = test.exercises() == null ? List.of() : test.exercises();
            for (int j = 0; j < xs.size(); j++) {
                exerciseCollision(errors, "test.exercises[" + j + "]", xs.get(j).code(), null, t);
            }
        }
        return errors;
    }

    private void exerciseCollision(List<String> errors, String path, String code, String lessonCode, String testCode) {
        if (code == null || !repo.exerciseExists(code)) return;
        if (!Objects.equals(repo.exerciseLesson(code).orElse(null), lessonCode)
                || !Objects.equals(repo.exerciseTest(code).orElse(null), testCode)) {
            errors.add(path + ".code: '" + code + "' đã thuộc bài khác");
        }
    }

    private void importTest(TestDef t, String unitCode, String stageCode) {
        repo.upsertTest(t, unitCode, stageCode);
        for (int j = 0; j < t.exercises().size(); j++) {
            repo.upsertExercise(t.exercises().get(j), null, t.code(), j + 1);
        }
        repo.deleteTestExercisesExcept(t.code(), codes(t.exercises()));
    }
}
