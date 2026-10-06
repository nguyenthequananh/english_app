package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import vn.ieltsapp.common.ApiException;
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
    void scheduledCheckBacksUpAgainOnNextDayWhileRunning() throws Exception {
        newProfileSession("Thành");
        runner.backupIfDue();
        runner.backupIfDue();
        clock.plusDays(1);
        runner.backupIfDue();
        assertThat(BackupFiles.list(HOME.resolve("backups"))).extracting(p -> p.getFileName().toString())
                .containsExactly("ielts-20261006-090000-auto.db", "ielts-20261005-090000-auto.db");
    }

    @Test
    void backupIfDueIsScheduledHourly() throws Exception {
        Scheduled scheduled = DailyBackupRunner.class.getMethod("backupIfDue").getAnnotation(Scheduled.class);
        assertThat(scheduled).isNotNull();
        assertThat(scheduled.fixedDelayString()).isEqualTo("PT1H");
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

    @Test
    void backupDirThatIsARegularFileDoesNotBreakStartup() throws Exception {
        newProfileSession("Thành");
        Path file = Files.writeString(HOME.resolve("not-a-dir"), "x");
        AppConfigFile config = AppConfigFile.load(HOME);
        config.setBackupDir(file.toString());
        config.save();
        assertThatCode(() -> runner.run(null)).doesNotThrowAnyException();
    }

    @Test
    void unreadableBackupDirDuringCheckDoesNotBreakStartup() throws Exception {
        newProfileSession("Thành");
        BackupService unreadable = new BackupService(null, clock, HOME.toString(), 7) {
            @Override
            public boolean hasBackupOn(LocalDate day) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Không đọc được thư mục sao lưu");
            }
        };
        DailyBackupRunner failing = new DailyBackupRunner(unreadable, jdbc, clock);
        assertThatCode(() -> failing.run(null)).doesNotThrowAnyException();
    }
}
