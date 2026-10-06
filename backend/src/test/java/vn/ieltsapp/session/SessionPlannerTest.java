package vn.ieltsapp.session;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.LongStream;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.session.SessionPlanner.*;

class SessionPlannerTest {
    static final PlannerSettings SETTINGS = new PlannerSettings(60, 10, 100);
    static final LocalDate MONDAY = LocalDate.of(2026, 10, 5);
    static final LocalDate WEDNESDAY = LocalDate.of(2026, 10, 7);
    static final LocalDate SUNDAY = LocalDate.of(2026, 10, 11);

    static List<Long> ids(int n) { return LongStream.rangeClosed(1, n).boxed().toList(); }

    static final List<LessonRef> WEEK = List.of(
            new LessonRef("G1", "MON", 1, false),
            new LessonRef("P1", "TUE", 2, false),
            new LessonRef("G2", "WED", 3, false));

    @Test
    void reviewsAreCappedAndNewWordsLimited() {
        SessionPlan plan = SessionPlanner.plan(new PlanInput(MONDAY, ids(75), 75, ids(15), WEEK), SETTINGS);
        assertThat(plan.reviewWordIds()).hasSize(60).startsWith(1L, 2L);
        assertThat(plan.newWordIds()).hasSize(10);
    }

    @Test
    void newWordsSkippedWhenBacklogTooLarge() {
        assertThat(SessionPlanner.plan(new PlanInput(MONDAY, ids(60), 101, ids(5), WEEK), SETTINGS).newWordIds()).isEmpty();
        assertThat(SessionPlanner.plan(new PlanInput(MONDAY, ids(60), 100, ids(5), WEEK), SETTINGS).newWordIds()).hasSize(5);
    }

    @Test
    void picksLessonForTodayWhenOpen() {
        assertThat(SessionPlanner.plan(new PlanInput(WEDNESDAY, List.of(), 0, List.of(), WEEK), SETTINGS).lessonCode())
                .isEqualTo("G2");
    }

    @Test
    void fallsBackToEarliestOpenLesson() {
        List<LessonRef> wedDone = List.of(
                new LessonRef("G1", "MON", 1, true),
                new LessonRef("P1", "TUE", 2, false),
                new LessonRef("G2", "WED", 3, true));
        assertThat(SessionPlanner.plan(new PlanInput(WEDNESDAY, List.of(), 0, List.of(), wedDone), SETTINGS).lessonCode())
                .isEqualTo("P1");
        assertThat(SessionPlanner.plan(new PlanInput(SUNDAY, List.of(), 0, List.of(), WEEK), SETTINGS).lessonCode())
                .isEqualTo("G1");
    }

    @Test
    void noLessonWhenAllCompleted() {
        List<LessonRef> allDone = List.of(new LessonRef("G1", "MON", 1, true));
        assertThat(SessionPlanner.plan(new PlanInput(MONDAY, List.of(), 0, List.of(), allDone), SETTINGS).lessonCode())
                .isNull();
    }
}
