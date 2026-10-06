package vn.ieltsapp.support;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;

public final class TestDb {
    private static final List<String> TABLES_CHILD_FIRST = List.of(
            "study_session", "test_result", "exercise_attempt", "lesson_progress", "unit_progress",
            "review_log", "card", "exercise", "test", "lesson", "unit_word", "word", "profile",
            "unit", "stage");

    private TestDb() {}

    public static void clear(JdbcClient jdbc) {
        for (String table : TABLES_CHILD_FIRST) {
            jdbc.sql("DELETE FROM " + table).update();
        }
    }
}
