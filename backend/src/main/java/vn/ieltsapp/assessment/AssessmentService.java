package vn.ieltsapp.assessment;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.lesson.*;
import vn.ieltsapp.roadmap.RoadmapService;

@Service
public class AssessmentService {
    static final double WEAK_THRESHOLD = 0.8;

    private final AssessmentRepository repo;
    private final ExerciseRepository exercises;
    private final LessonService lessons;
    private final RoadmapService roadmap;
    private final Clock clock;

    public AssessmentService(AssessmentRepository repo, ExerciseRepository exercises, LessonService lessons,
                             RoadmapService roadmap, Clock clock) {
        this.repo = repo;
        this.exercises = exercises;
        this.lessons = lessons;
        this.roadmap = roadmap;
        this.clock = clock;
    }

    public TestDto unitTest(long profileId, String unitCode) {
        requireUnitReady(profileId, unitCode);
        return toDto(repo.forUnit(unitCode).orElseThrow(() -> ApiException.notFound("bài kiểm tra")));
    }

    public TestDto stageTest(long profileId, String stageCode) {
        requireStageReady(profileId, stageCode);
        return toDto(repo.forStage(stageCode).orElseThrow(() -> ApiException.notFound("bài kiểm tra")));
    }

    @Transactional
    public TestResultDto submit(long profileId, String code, Map<String, String> answers) {
        TestRow test = repo.find(code).orElseThrow(() -> ApiException.notFound("bài kiểm tra"));
        boolean unitTest = "UNIT".equals(test.kind());
        if (unitTest) {
            requireUnitReady(profileId, test.unitCode());
        } else {
            requireStageReady(profileId, test.stageCode());
        }

        GradedAnswers graded = ExerciseGrader.gradeAll(exercises.byTest(code), answers);
        String now = LocalDateTime.now(clock).toString();
        for (ExerciseResult r : graded.results()) {
            exercises.saveAttempt(profileId, r.code(), r.given(), r.correct(), now);
        }
        boolean passed = graded.score() >= test.passRatio() - 1e-9;
        repo.saveResult(profileId, code, graded.score(), passed, now);

        List<String> weakUnits = List.of();
        if (passed && unitTest) {
            roadmap.onUnitTestPassed(profileId, test.unitCode());
        } else if (passed) {
            roadmap.onStageTestPassed(profileId, test.stageCode());
        } else if (!unitTest) {
            weakUnits = repo.bestUnitScores(profileId, test.stageCode()).entrySet().stream()
                    .filter(e -> e.getValue() < WEAK_THRESHOLD).map(Map.Entry::getKey).toList();
        }
        return new TestResultDto(graded.score(), passed, graded.results(), weakUnits);
    }

    private void requireUnitReady(long profileId, String unitCode) {
        roadmap.requireUnitOpen(profileId, unitCode);
        if (lessons.unitLessons(profileId, unitCode).stream().anyMatch(l -> !l.completed())) {
            throw new ApiException(HttpStatus.CONFLICT, "TEST_NOT_READY", "Cần hoàn thành tất cả bài học của unit trước");
        }
    }

    private void requireStageReady(long profileId, String stageCode) {
        if (!roadmap.stageUnitsDone(profileId, stageCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "TEST_NOT_READY", "Cần hoàn thành tất cả unit của chặng trước");
        }
    }

    private TestDto toDto(TestRow t) {
        return new TestDto(t.code(), t.kind(), t.passRatio(),
                exercises.byTest(t.code()).stream().map(ExerciseView::from).toList());
    }
}
