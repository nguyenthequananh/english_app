package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ieltsapp.common.AppConfigFile;
import vn.ieltsapp.support.IntegrationTest;

class DailyBackupRunnerTest extends IntegrationTest {
    @Autowired DailyBackupRunner runner;

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(HOME.resolve("config.yml"));
        Files.deleteIfExists(HOME.resolve("not-a-dir"));
        Path dir = HOME.resolve("backups");
        if (Files.exists(dir)) {
            try (Stream<Path> files = Files.walk(dir)) {
                files.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
            }
        }
    }

    @Test
    void noProfileMeansNoBackup() throws Exception {
        runner.run(null);
        assertThat(BackupFiles.list(HOME.resolve("backups"))).isEmpty();
    }

    @Test
    void createsOneAutoBackupPerDay() throws Exception {
        newProfileSession("Thành");
        runner.run(null);
        runner.run(null);
        assertThat(BackupFiles.list(HOME.resolve("backups")))
                .singleElement().satisfies(p -> assertThat(p.getFileName().toString()).endsWith("-auto.db"));
    }

    @Test
    void failingBackupDirDoesNotBreakStartup() throws Exception {
        newProfileSession("Thành");
        Path file = Files.writeString(HOME.resolve("not-a-dir"), "x");
        AppConfigFile config = AppConfigFile.load(HOME);
        config.setBackupDir(file.resolve("sub").toString());
        config.save();
        assertThatCode(() -> runner.run(null)).doesNotThrowAnyException();
    }
}
