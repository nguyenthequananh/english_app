package vn.ieltsapp.backup;

import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/backups")
public class BackupController {
    private final BackupService service;
    private final Clock clock;

    public BackupController(BackupService service, Clock clock) {
        this.service = service;
        this.clock = clock;
    }

    @GetMapping
    public List<BackupInfo> list() { return service.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BackupInfo create() { return service.backupNow("manual"); }

    @PostMapping("/{name}/restore")
    public Map<String, String> restore(@PathVariable String name) {
        service.scheduleRestore(name);
        return Map.of("message", "Đã lên lịch khôi phục. Hãy tắt app (nút Tắt app) rồi mở lại để hoàn tất.");
    }

    @GetMapping("/export")
    public ResponseEntity<Resource> export() {
        Path file = service.exportToTempFile();
        String filename = "ielts-export-" + LocalDate.now(clock) + ".db";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(new FileSystemResource(file));
    }
}
