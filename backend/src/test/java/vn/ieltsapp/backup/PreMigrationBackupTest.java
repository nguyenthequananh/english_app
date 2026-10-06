package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PreMigrationBackupTest {
    @TempDir Path home;

    @Test
    void backsUpOnlyWhenUpgradingExistingDb() throws Exception {
        String url = "jdbc:sqlite:" + home.resolve("ielts.db");
        var strategy = new FlywayBackupConfig().backupBeforeMigrate(home.toString());

        strategy.migrate(Flyway.configure().dataSource(url, null, null).locations("classpath:db/migration").load());
        assertThat(BackupFiles.list(home.resolve("backups"))).isEmpty();

        strategy.migrate(Flyway.configure().dataSource(url, null, null)
                .locations("classpath:db/migration", "classpath:db/test-migration").load());
        assertThat(BackupFiles.list(home.resolve("backups")))
                .singleElement().satisfies(p -> assertThat(p.getFileName().toString()).endsWith("-premigrate.db"));
    }
}
