package vn.ieltsapp.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.support.IntegrationTest;

class SchemaTest extends IntegrationTest {

    @Test
    void allTablesExist() {
        List<String> tables = jdbc.sql("SELECT name FROM sqlite_master WHERE type = 'table'")
                .query(String.class).list();
        assertThat(tables).contains("stage", "unit", "profile", "word", "unit_word", "lesson", "test",
                "exercise", "card", "review_log", "unit_progress", "lesson_progress",
                "exercise_attempt", "test_result", "study_session");
    }

    @Test
    void foreignKeysAndWalAreEnabled() {
        assertThat(jdbc.sql("PRAGMA foreign_keys").query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("PRAGMA journal_mode").query(String.class).single()).isEqualToIgnoringCase("wal");
    }
}
