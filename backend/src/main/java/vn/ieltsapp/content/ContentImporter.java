package vn.ieltsapp.content;

import java.util.List;
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
        if (!errors.isEmpty()) throw new ContentValidationException(errors);
        repo.upsertStage(f);
        if (f.test() != null) importTest(f.test(), null, f.code());
    }

    @Transactional
    public void importUnit(UnitFile f) {
        List<String> errors = ContentValidator.validateUnit(f, repo.stageCodes());
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
        }
        importTest(f.test(), f.code(), null);
    }

    private void importTest(TestDef t, String unitCode, String stageCode) {
        repo.upsertTest(t, unitCode, stageCode);
        for (int j = 0; j < t.exercises().size(); j++) {
            repo.upsertExercise(t.exercises().get(j), null, t.code(), j + 1);
        }
    }
}
