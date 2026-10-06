package vn.ieltsapp.backup;

import java.io.IOException;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import org.flywaydb.core.api.MigrationInfoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayBackupConfig {

    /** Sao lưu trước khi nâng cấp DB đã có dữ liệu (đã có migration áp dụng và còn migration mới). */
    @Bean
    public FlywayMigrationStrategy backupBeforeMigrate(@Value("${app.home}") String home) {
        return flyway -> {
            MigrationInfoService info = flyway.info();
            if (info.applied().length > 0 && info.pending().length > 0) {
                try (Connection c = flyway.getConfiguration().getDataSource().getConnection()) {
                    Path h = Path.of(home);
                    BackupFiles.vacuumInto(c, BackupFiles.backupDir(h), "premigrate", LocalDateTime.now());
                } catch (SQLException | IOException e) {
                    throw new IllegalStateException("Không sao lưu được trước khi nâng cấp DB", e);
                }
            }
            flyway.migrate();
        };
    }
}
