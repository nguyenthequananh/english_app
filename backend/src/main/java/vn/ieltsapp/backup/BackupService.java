package vn.ieltsapp.backup;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.ieltsapp.common.ApiException;

@Service
public class BackupService {
    private final DataSource dataSource;
    private final Clock clock;
    private final Path home;
    private final int keep;

    public BackupService(DataSource dataSource, Clock clock, @Value("${app.home}") String home,
                         @Value("${app.backup.keep:7}") int keep) {
        this.dataSource = dataSource;
        this.clock = clock;
        this.home = Path.of(home);
        this.keep = keep;
    }

    public Path dir() { return BackupFiles.backupDir(home); }

    public synchronized BackupInfo backupNow(String reason) {
        try (Connection c = dataSource.getConnection()) {
            Path file = BackupFiles.vacuumInto(c, dir(), reason, LocalDateTime.now(clock));
            BackupFiles.prune(dir(), keep);
            return info(file);
        } catch (SQLException | IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Sao lưu thất bại: " + e.getMessage());
        }
    }

    public List<BackupInfo> list() {
        try {
            List<BackupInfo> result = new ArrayList<>();
            for (Path p : BackupFiles.list(dir())) result.add(info(p));
            return result;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Không đọc được thư mục sao lưu");
        }
    }

    public boolean hasBackupOn(LocalDate day) {
        String prefix = "ielts-" + day.format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        return list().stream().anyMatch(b -> b.name().startsWith(prefix));
    }

    public void scheduleRestore(String name) {
        if (!BackupFiles.NAME.matcher(name).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BACKUP_NAME_INVALID", "Tên bản sao lưu không hợp lệ");
        }
        Path file = dir().resolve(name);
        if (!Files.exists(file)) throw ApiException.notFound("bản sao lưu");
        try {
            Files.writeString(home.resolve(StartupRestore.MARKER), file.toAbsolutePath().toString());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Không ghi được yêu cầu khôi phục");
        }
    }

    public Path exportToTempFile() {
        try (Connection c = dataSource.getConnection()) {
            Path tmpDir = Files.createTempDirectory("ielts-export");
            Path file = BackupFiles.vacuumInto(c, tmpDir, "export", LocalDateTime.now(clock));
            file.toFile().deleteOnExit();
            tmpDir.toFile().deleteOnExit();
            return file;
        } catch (SQLException | IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Xuất dữ liệu thất bại: " + e.getMessage());
        }
    }

    private BackupInfo info(Path p) throws IOException {
        LocalDateTime created = LocalDateTime.ofInstant(Files.getLastModifiedTime(p).toInstant(), clock.getZone());
        return new BackupInfo(p.getFileName().toString(), Files.size(p), created.toString());
    }
}
