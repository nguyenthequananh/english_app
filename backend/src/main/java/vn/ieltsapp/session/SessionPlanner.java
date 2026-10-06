package vn.ieltsapp.session;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public final class SessionPlanner {
    public record LessonRef(String code, String day, int sortOrder, boolean completed) {}

    public record PlanInput(LocalDate today, List<Long> dueWordIds, int dueTotal, List<Long> newWordIds,
                            List<LessonRef> lessons) {}

    public record SessionPlan(List<Long> reviewWordIds, List<Long> newWordIds, String lessonCode) {}

    private SessionPlanner() {}

    public static SessionPlan plan(PlanInput in, PlannerSettings s) {
        List<Long> reviews = in.dueWordIds().stream().limit(s.maxReviews()).toList();
        List<Long> fresh = in.dueTotal() > s.skipNewWhenDueOver()
                ? List.of()
                : in.newWordIds().stream().limit(s.newWords()).toList();
        return new SessionPlan(reviews, fresh, pickLesson(in.lessons(), in.today()));
    }

    /** Bài của thứ hôm nay nếu chưa làm; không thì bài sớm nhất chưa làm; hết bài thì null. */
    static String pickLesson(List<LessonRef> lessons, LocalDate today) {
        String day = today.getDayOfWeek().name().substring(0, 3);
        List<LessonRef> open = lessons.stream().filter(l -> !l.completed())
                .sorted(Comparator.comparingInt(LessonRef::sortOrder)).toList();
        return open.stream().filter(l -> l.day().equals(day)).findFirst()
                .or(() -> open.stream().findFirst())
                .map(LessonRef::code)
                .orElse(null);
    }
}
