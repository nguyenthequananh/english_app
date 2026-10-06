package vn.ieltsapp.progress;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Set;

public final class StreakCalculator {
    private StreakCalculator() {}

    public static int currentStreak(Set<LocalDate> studyDays, LocalDate today) {
        if (studyDays.isEmpty()) return 0;
        LocalDate earliest = Collections.min(studyDays);
        LocalDate day = studyDays.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (!day.isBefore(earliest)) {
            if (studyDays.contains(day)) {
                streak++;
            } else if (day.getDayOfWeek() != DayOfWeek.SUNDAY) {
                break;
            }
            day = day.minusDays(1);
        }
        return streak;
    }
}
