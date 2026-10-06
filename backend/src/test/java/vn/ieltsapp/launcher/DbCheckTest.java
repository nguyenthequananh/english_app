package vn.ieltsapp.launcher;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class DbCheckTest {
    @TempDir Path home;

    static void createDb(Path file) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file)) {
            c.createStatement().execute("CREATE TABLE t (x INTEGER)");
        }
    }

    @Test
    void healthyOrMissingDbNeedsNothing() throws Exception {
        assertThat(DbCheck.ensureUsable(home)).isEmpty();
        createDb(home.resolve("ielts.db"));
        assertThat(DbCheck.ensureUsable(home)).isEmpty();
    }

    @Test
    void corruptDbIsReplacedByNewestHealthyBackup() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "đây không phải SQLite");
        Path backups = Files.createDirectories(home.resolve("backups"));
        createDb(backups.resolve("ielts-20261004-090000-auto.db"));
        Files.writeString(backups.resolve("ielts-20261005-090000-auto.db"), "bản sao cũng hỏng");

        assertThat(DbCheck.ensureUsable(home)).contains("ielts-20261004-090000-auto.db");
        assertThat(DbCheck.isHealthy(home.resolve("ielts.db"))).isTrue();
        try (var files = Files.list(home)) {
            assertThat(files.map(p -> p.getFileName().toString())).anyMatch(n -> n.startsWith("ielts-corrupt-"));
        }
    }

    @Test
    void corruptDbWithoutBackupReportsNone() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "hỏng");
        assertThat(DbCheck.ensureUsable(home)).contains("NONE");
        assertThat(home.resolve("ielts.db")).doesNotExist();
    }
}
