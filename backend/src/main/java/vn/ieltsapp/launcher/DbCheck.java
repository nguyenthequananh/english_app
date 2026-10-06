package vn.ieltsapp.launcher;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.Optional;
import vn.ieltsapp.backup.BackupFiles;

/** Chạy trong main() trước Spring: DB hỏng thì cất sang bên và lấy bản sao lưu lành gần nhất. */
public final class DbCheck {
    private DbCheck() {}

    public static Optional<String> ensureUsable(Path home) throws IOException {
        Path db = home.resolve("ielts.db");
        if (!Files.exists(db) || isHealthy(db)) return Optional.empty();

        Files.move(db, home.resolve("ielts-corrupt-" + LocalDateTime.now().format(BackupFiles.TS) + ".db"));
        Files.deleteIfExists(home.resolve("ielts.db-wal"));
        Files.deleteIfExists(home.resolve("ielts.db-shm"));
        for (Path backup : BackupFiles.list(BackupFiles.backupDir(home))) {
            if (isHealthy(backup)) {
                Files.copy(backup, db);
                return Optional.of(backup.getFileName().toString());
            }
        }
        return Optional.of("NONE");
    }

    static boolean isHealthy(Path file) {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file);
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("PRAGMA quick_check")) {
            return rs.next() && "ok".equalsIgnoreCase(rs.getString(1));
        } catch (SQLException e) {
            return false;
        }
    }
}
