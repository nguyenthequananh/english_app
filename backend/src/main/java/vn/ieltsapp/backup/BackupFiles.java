package vn.ieltsapp.backup;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import vn.ieltsapp.common.AppConfigFile;

public final class BackupFiles {
    public static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    public static final Pattern NAME = Pattern.compile("ielts-\\d{8}-\\d{6}-[a-z]+(-\\d+)?\\.db");

    private BackupFiles() {}

    public static Path backupDir(Path home) {
        return AppConfigFile.load(home).backupDir().map(Path::of).orElse(home.resolve("backups"));
    }

    /** VACUUM INTO tạo bản sao nhất quán kể cả khi DB đang ở chế độ WAL. Không được gọi trong transaction. */
    public static Path vacuumInto(Connection connection, Path dir, String reason, LocalDateTime now)
            throws SQLException, IOException {
        Files.createDirectories(dir);
        String base = "ielts-" + now.format(TS) + "-" + reason;
        Path target = dir.resolve(base + ".db");
        for (int i = 2; Files.exists(target); i++) {
            target = dir.resolve(base + "-" + i + ".db");
        }
        try (PreparedStatement ps = connection.prepareStatement("VACUUM INTO ?")) {
            ps.setString(1, target.toString());
            ps.execute();
        }
        return target;
    }

    public static List<Path> list(Path dir) throws IOException {
        if (!Files.isDirectory(dir)) return List.of();
        try (Stream<Path> files = Files.list(dir)) {
            return files.filter(p -> NAME.matcher(p.getFileName().toString()).matches())
                    .sorted(Comparator.comparing((Path p) -> p.getFileName().toString()).reversed())
                    .toList();
        }
    }

    public static void prune(Path dir, int keep) throws IOException {
        List<Path> all = list(dir);
        for (Path old : all.subList(Math.min(keep, all.size()), all.size())) {
            Files.deleteIfExists(old);
        }
    }
}
