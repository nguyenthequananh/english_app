package vn.ieltsapp.backup;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Bật lịch sao lưu hằng giờ khi app chạy lâu qua nửa đêm; test tắt bằng app.backup.schedule-enabled=false. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.backup.schedule-enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingConfig {}
