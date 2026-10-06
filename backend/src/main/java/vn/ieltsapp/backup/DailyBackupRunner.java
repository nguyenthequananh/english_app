package vn.ieltsapp.backup;

import java.time.Clock;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Sao lưu tự động mỗi ngày một bản: lúc khởi động và kiểm tra lại mỗi giờ. Chạy ngoài transaction (pool = 1). */
@Component
@Order(2)
public class DailyBackupRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DailyBackupRunner.class);

    private final BackupService backups;
    private final JdbcClient jdbc;
    private final Clock clock;

    public DailyBackupRunner(BackupService backups, JdbcClient jdbc, Clock clock) {
        this.backups = backups;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Override
    public void run(ApplicationArguments args) {
        backupIfDue();
    }

    @Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT1H")
    public void backupIfDue() {
        try {
            int profiles = jdbc.sql("SELECT COUNT(*) FROM profile").query(Integer.class).single();
            if (profiles > 0 && !backups.hasBackupOn(LocalDate.now(clock))) {
                log.info("Sao lưu tự động: {}", backups.backupNow("auto").name());
            }
        } catch (RuntimeException e) {
            log.warn("Sao lưu tự động thất bại", e);
        }
    }
}
