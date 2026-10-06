package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class StartupRestoreTest {
    @TempDir Path home;

    static void sqlite(Path file, String value) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file); Statement s = c.createStatement()) {
            s.execute("CREATE TABLE t (v TEXT)");
            s.execute("INSERT INTO t VALUES ('" + value + "')");
        }
    }

    static String valueIn(Path file) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file);
             ResultSet rs = c.createStatement().executeQuery("SELECT v FROM t")) {
            rs.next();
            return rs.getString(1);
        }
    }

    @Test
    void noMarkerDoesNothing() throws Exception {
        assertThat(StartupRestore.applyPending(home)).isEmpty();
    }

    @Test
    void appliesPendingRestoreAndKeepsPreviousCopy() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "cũ");
        Files.writeString(home.resolve("ielts.db-wal"), "wal");
        Path backup = Files.createDirectories(home.resolve("sao lưu")).resolve("ielts-20261005-090000-manual.db");
        sqlite(backup, "bản sao");
        Files.writeString(home.resolve(StartupRestore.MARKER), backup.toAbsolutePath().toString());

        assertThat(StartupRestore.applyPending(home)).contains("ielts-20261005-090000-manual.db");
        assertThat(valueIn(home.resolve("ielts.db"))).isEqualTo("bản sao");
        assertThat(home.resolve("ielts.db.restoring")).doesNotExist();
        assertThat(Files.readString(home.resolve("ielts-before-restore.db"))).isEqualTo("cũ");
        assertThat(home.resolve("ielts.db-wal")).doesNotExist();
        assertThat(home.resolve(StartupRestore.MARKER)).doesNotExist();
    }

    @Test
    void missingBackupFileIsIgnored() throws Exception {
        Files.writeString(home.resolve(StartupRestore.MARKER), home.resolve("khong-co.db").toString());
        assertThat(StartupRestore.applyPending(home)).isEmpty();
        assertThat(home.resolve(StartupRestore.MARKER)).doesNotExist();
    }

    @Test
    void malformedMarkerIsDeletedAndIgnored() throws Exception {
        Files.writeString(home.resolve(StartupRestore.MARKER), "\u0000bad");
        assertThat(StartupRestore.applyPending(home)).isEmpty();
        assertThat(home.resolve(StartupRestore.MARKER)).doesNotExist();
    }

    @Test
    void corruptSourceLeavesDbUntouched() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "cũ");
        Path bad = home.resolve("hong.db");
        Files.writeString(bad, "không phải sqlite, chỉ là văn bản".repeat(200));
        Files.writeString(home.resolve(StartupRestore.MARKER), bad.toString());

        assertThat(StartupRestore.applyPending(home)).isEmpty();
        assertThat(Files.readString(home.resolve("ielts.db"))).isEqualTo("cũ");
        assertThat(home.resolve(StartupRestore.MARKER)).doesNotExist();
    }
}
