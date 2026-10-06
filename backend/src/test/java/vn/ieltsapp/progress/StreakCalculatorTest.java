package vn.ieltsapp.progress;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {
    // 2026-09-28 là thứ Hai; 2026-10-04 là Chủ nhật.
    static Set<LocalDate> days(String... isoDates) {
        Set<LocalDate> set = new HashSet<>();
        for (String d : isoDates) set.add(LocalDate.parse(d));
        return set;
    }

    static final Set<LocalDate> FULL_WEEK = days("2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01",
            "2026-10-02", "2026-10-03", "2026-10-05");

    @Test
    void sundayOffDoesNotBreakStreak() {
        assertThat(StreakCalculator.currentStreak(FULL_WEEK, LocalDate.parse("2026-10-05"))).isEqualTo(7);
    }

    @Test
    void todayNotYetStudiedCountsFromYesterday() {
        assertThat(StreakCalculator.currentStreak(FULL_WEEK, LocalDate.parse("2026-10-06"))).isEqualTo(7);
    }

    @Test
    void missingAWeekdayBreaksStreak() {
        assertThat(StreakCalculator.currentStreak(FULL_WEEK, LocalDate.parse("2026-10-07"))).isZero();
        Set<LocalDate> gap = days("2026-09-30", "2026-10-02", "2026-10-03", "2026-10-05");
        assertThat(StreakCalculator.currentStreak(gap, LocalDate.parse("2026-10-05"))).isEqualTo(3);
    }

    @Test
    void sundayTodayWithoutStudyKeepsWeekStreak() {
        Set<LocalDate> week = days("2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03");
        assertThat(StreakCalculator.currentStreak(week, LocalDate.parse("2026-10-04"))).isEqualTo(6);
    }

    @Test
    void emptyHistoryIsZero() {
        assertThat(StreakCalculator.currentStreak(Set.of(), LocalDate.parse("2026-10-05"))).isZero();
    }
}
