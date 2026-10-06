package vn.ieltsapp.launcher;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import org.sqlite.SQLiteErrorCode;
import org.sqlite.SQLiteException;
import java.time.LocalDateTime;
import java.util.Optional;
import vn.ieltsapp.backup.BackupFiles;

/** Chạy trong main() trước Spring: DB hỏng thì cất sang bên và lấy bản sao lưu lành gần nhất. */
public final class DbCheck {
    private DbCheck() {}

    public static Optional<String> ensureUsable(Path home) throws IOException {
        Path db = home.resolve("ielts.db");
        if (!Files.exists(db) || check(db) != Health.CORRUPT) return Optional.empty();

        Files.move(db, home.resolve("ielts-corrupt-" + LocalDateTime.now().format(BackupFiles.TS) + ".db"));
        Files.deleteIfExists(home.resolve("ielts.db-wal"));
        Files.deleteIfExists(home.resolve("ielts.db-shm"));
        for (Path backup : BackupFiles.list(BackupFiles.backupDir(home))) {
            if (check(backup) == Health.OK) {
                Files.copy(backup, db);
                return Optional.of(backup.getFileName().toString());
            }
        }
        return Optional.of("NONE");
    }

    enum Health { OK, CORRUPT, UNKNOWN }

    static boolean isHealthy(Path file) {
        return check(file) == Health.OK;
    }

    /** CORRUPT chỉ khi chắc chắn hỏng; bận/khóa/lỗi I/O là UNKNOWN (không được đụng vào DB). */
    static Health check(Path file) {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file + "?busy_timeout=5000");
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("PRAGMA quick_check")) {
            return rs.next() && "ok".equalsIgnoreCase(rs.getString(1)) ? Health.OK : Health.CORRUPT;
        } catch (SQLException e) {
            if (e instanceof SQLiteException se
                    && (se.getResultCode() == SQLiteErrorCode.SQLITE_CORRUPT
                        || se.getResultCode() == SQLiteErrorCode.SQLITE_NOTADB)) {
                return Health.CORRUPT;
            }
            String m = String.valueOf(e.getMessage()).toLowerCase();
            return m.contains("not a database") || m.contains("malformed") ? Health.CORRUPT : Health.UNKNOWN;
        }
    }
}
