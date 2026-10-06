package vn.ieltsapp.backup;

import java.awt.Desktop;
import java.awt.GraphicsEnvironment;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.common.AppConfigFile;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    public record SettingsDto(String appHome, String backupDir, String logDir) {}

    public record SettingsUpdate(String backupDir) {}

    private final Path home;

    public SettingsController(@Value("${app.home}") String home) { this.home = Path.of(home); }

    @GetMapping
    public SettingsDto get() {
        return new SettingsDto(home.toString(), BackupFiles.backupDir(home).toString(), home.resolve("logs").toString());
    }

    @PutMapping
    public SettingsDto update(@RequestBody SettingsUpdate request) {
        AppConfigFile config = AppConfigFile.load(home);
        String dir = request.backupDir();
        if (dir == null || dir.isBlank()) {
            config.setBackupDir(null);
        } else {
            Path path;
            try {
                path = Path.of(dir.trim());
            } catch (InvalidPathException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Đường dẫn không hợp lệ");
            }
            if (!path.isAbsolute()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Thư mục phải là đường dẫn tuyệt đối");
            }
            try {
                Files.createDirectories(path);
            } catch (IOException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Không tạo được thư mục: " + path);
            }
            config.setBackupDir(path.toString());
        }
        config.save();
        return get();
    }

    @PostMapping("/open-logs")
    public ResponseEntity<Void> openLogs() throws IOException {
        if (GraphicsEnvironment.isHeadless() || !Desktop.isDesktopSupported()) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_SUPPORTED", "Không mở được thư mục trên máy này");
        }
        Path logs = Files.createDirectories(home.resolve("logs"));
        Desktop.getDesktop().open(logs.toFile());
        return ResponseEntity.noContent().build();
    }
}
