package vn.ieltsapp.lesson;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.roadmap.RoadmapService;

@Service
public class LessonService {
    private final LessonRepository lessons;
    private final ExerciseRepository exercises;
    private final RoadmapService roadmap;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public LessonService(LessonRepository lessons, ExerciseRepository exercises, RoadmapService roadmap,
                         ApplicationEventPublisher events, Clock clock) {
        this.lessons = lessons;
        this.exercises = exercises;
        this.roadmap = roadmap;
        this.events = events;
        this.clock = clock;
    }

    public LessonDto get(long profileId, String code) {
        LessonRow lesson = openLesson(profileId, code);
        Double best = lessons.bestScores(profileId, lesson.unitCode()).get(code);
        List<ExerciseView> views = exercises.byLesson(code).stream().map(ExerciseView::from).toList();
        return new LessonDto(lesson.code(), lesson.unitCode(), lesson.type(), lesson.day(), lesson.title(),
                lesson.bodyMd(), views, best);
    }

    @Transactional
    public LessonSubmitResult submit(long profileId, String code, Map<String, String> answers) {
        openLesson(profileId, code);
        GradedAnswers graded = ExerciseGrader.gradeAll(exercises.byLesson(code), answers);
        String now = LocalDateTime.now(clock).toString();
        for (ExerciseResult r : graded.results()) {
            exercises.saveAttempt(profileId, r.code(), r.given(), r.correct(), now);
        }
        lessons.saveProgress(profileId, code, graded.score(), now);
        events.publishEvent(new LessonCompletedEvent(profileId, code));
        return new LessonSubmitResult(graded.score(), graded.results());
    }

    public List<LessonSummary> unitLessons(long profileId, String unitCode) {
        Map<String, Double> done = lessons.bestScores(profileId, unitCode);
        return lessons.byUnit(unitCode).stream()
                .map(l -> new LessonSummary(l.code(), l.type(), l.day(), l.title(), l.sortOrder(),
                        done.containsKey(l.code())))
                .toList();
    }

    private LessonRow openLesson(long profileId, String code) {
        LessonRow lesson = lessons.find(code).orElseThrow(() -> ApiException.notFound("bài học"));
        roadmap.requireUnitOpen(profileId, lesson.unitCode());
        return lesson;
    }
}
