package vn.ieltsapp.support;

import java.time.*;

public class MutableClock extends Clock {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private Instant now = LocalDate.of(2026, 10, 5).atTime(9, 0).atZone(ZONE).toInstant();

    public void set(LocalDate date) { now = date.atTime(9, 0).atZone(ZONE).toInstant(); }
    public void plusDays(long days) { now = now.plus(Duration.ofDays(days)); }
    public void plusMinutes(long minutes) { now = now.plus(Duration.ofMinutes(minutes)); }
    public void plusSeconds(long seconds) { now = now.plusSeconds(seconds); }

    @Override public ZoneId getZone() { return ZONE; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return now; }
}
