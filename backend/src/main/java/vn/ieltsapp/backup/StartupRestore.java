package vn.ieltsapp.backup;

import static java.nio.file.StandardCopyOption.ATOMIC_MOVE;
import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Chạy trong main() TRƯỚC khi Spring mở DB: thay ielts.db bằng bản sao lưu đã chọn. */
public final class StartupRestore {
    public static final String MARKER = "restore-pending.txt";
    private static final Logger log = LoggerFactory.getLogger(StartupRestore.class);

    private StartupRestore() {}

    public static Optional<String> applyPending(Path home) throws IOException {
        Path marker = home.resolve(MARKER);
        if (!Files.exists(marker)) return Optional.empty();
        Path source;
        try {
            source = Path.of(Files.readString(marker).trim());
        } catch (IOException | RuntimeException e) {
            log.warn("Bỏ qua yêu cầu khôi phục không đọc được", e);
            Files.deleteIfExists(marker);
            return Optional.empty();
        }
        Files.deleteIfExists(marker);
        if (!Files.exists(source) || !isHealthy(source)) {
            log.warn("Bỏ qua yêu cầu khôi phục: bản sao lưu thiếu hoặc hỏng: {}", source);
            return Optional.empty();
        }

        Path db = home.resolve("ielts.db");
        Path restoring = home.resolve("ielts.db.restoring");
        if (Files.exists(db)) {
            Files.copy(db, home.resolve("ielts-before-restore.db"), REPLACE_EXISTING);
        }
        Files.copy(source, restoring, REPLACE_EXISTING);
        Files.deleteIfExists(home.resolve("ielts.db-wal"));
        Files.deleteIfExists(home.resolve("ielts.db-shm"));
        try {
            Files.move(restoring, db, ATOMIC_MOVE, REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(restoring, db, REPLACE_EXISTING);
        }
        return Optional.of(source.getFileName().toString());
    }

    private static boolean isHealthy(Path file) {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file);
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("PRAGMA quick_check")) {
            return rs.next() && "ok".equals(rs.getString(1));
        } catch (Exception e) {
            return false;
        }
    }
}
