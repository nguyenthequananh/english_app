package vn.ieltsapp.vocab;

import java.time.LocalDate;

/** SM-2: khoảng ôn kế tiếp tính bằng ease TRƯỚC khi cập nhật. */
public final class Sm2 {
    static final double MIN_EASE = 1.3;

    private Sm2() {}

    public static CardState schedule(CardState current, Grade grade, LocalDate today) {
        int q = grade.quality();
        double ease = Math.max(MIN_EASE, current.ease() + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (q < 3) {
            return new CardState(ease, 1, 0, current.lapses() + 1, today.plusDays(1));
        }
        int interval = switch (current.repetitions()) {
            case 0 -> 1;
            case 1 -> 6;
            default -> (int) Math.round(current.intervalDays() * current.ease());
        };
        return new CardState(ease, interval, current.repetitions() + 1, current.lapses(), today.plusDays(interval));
    }
}
