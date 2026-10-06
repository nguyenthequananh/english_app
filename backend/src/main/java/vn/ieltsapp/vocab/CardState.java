package vn.ieltsapp.vocab;

import java.time.LocalDate;

public record CardState(double ease, int intervalDays, int repetitions, int lapses, LocalDate dueDate) {
    public static final double DEFAULT_EASE = 2.5;

    public static CardState fresh(LocalDate today) {
        return new CardState(DEFAULT_EASE, 0, 0, 0, today);
    }
}
