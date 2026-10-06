package vn.ieltsapp.backup;

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

/** Chạy trong main() TRƯỚC khi Spring mở DB: thay ielts.db bằng bản sao lưu đã chọn. */
public final class StartupRestore {
    public static final String MARKER = "restore-pending.txt";

    private StartupRestore() {}

    public static Optional<String> applyPending(Path home) throws IOException {
        Path marker = home.resolve(MARKER);
        if (!Files.exists(marker)) return Optional.empty();
        Path source = Path.of(Files.readString(marker).trim());
        Files.delete(marker);
        if (!Files.exists(source)) return Optional.empty();

        Path db = home.resolve("ielts.db");
        if (Files.exists(db)) {
            Files.copy(db, home.resolve("ielts-before-restore.db"), REPLACE_EXISTING);
        }
        Files.deleteIfExists(home.resolve("ielts.db-wal"));
        Files.deleteIfExists(home.resolve("ielts.db-shm"));
        Files.copy(source, db, REPLACE_EXISTING);
        return Optional.of(source.getFileName().toString());
    }
}
