package vn.ieltsapp.progress;

import java.util.List;

public final class ProgressDtos {
    private ProgressDtos() {}

    public record Summary(int streak, int dueCount, CurrentUnit currentUnit, boolean finishedToday) {}

    public record CurrentUnit(String code, String title, int lessonsDone, int lessonsTotal, boolean testReady) {}

    public record Stats(int streak, int knownWords, int learningWords, List<DayMinutes> heatmap,
                        List<WeekCount> knownByWeek, List<TestResultItem> tests) {}

    public record DayMinutes(String date, int minutes) {}

    public record WeekCount(String weekStart, int total) {}

    public record TestResultItem(String testCode, String kind, double score, boolean passed, String takenAt) {}
}
