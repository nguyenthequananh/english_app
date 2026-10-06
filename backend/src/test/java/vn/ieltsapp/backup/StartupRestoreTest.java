package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class StartupRestoreTest {
    @TempDir Path home;

    @Test
    void noMarkerDoesNothing() throws Exception {
        assertThat(StartupRestore.applyPending(home)).isEmpty();
    }

    @Test
    void appliesPendingRestoreAndKeepsPreviousCopy() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "cũ");
        Files.writeString(home.resolve("ielts.db-wal"), "wal");
        Path backup = Files.createDirectories(home.resolve("sao lưu")).resolve("ielts-20261005-090000-manual.db");
        Files.writeString(backup, "bản sao");
        Files.writeString(home.resolve(StartupRestore.MARKER), backup.toAbsolutePath().toString());

        assertThat(StartupRestore.applyPending(home)).contains("ielts-20261005-090000-manual.db");
        assertThat(Files.readString(home.resolve("ielts.db"))).isEqualTo("bản sao");
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
}
