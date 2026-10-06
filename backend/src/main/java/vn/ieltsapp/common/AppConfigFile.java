package vn.ieltsapp.common;

import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

/** ${app.home}/config.yml: cổng đang dùng và thư mục sao lưu. */
public final class AppConfigFile {
    private final Path file;
    private final Map<String, Object> values;

    private AppConfigFile(Path file, Map<String, Object> values) {
        this.file = file;
        this.values = values;
    }

    public static AppConfigFile load(Path home) {
        Path file = home.resolve("config.yml");
        Map<String, Object> values = new LinkedHashMap<>();
        if (Files.exists(file)) {
            try (Reader reader = Files.newBufferedReader(file)) {
                Object loaded = new Yaml().load(reader);
                if (loaded instanceof Map<?, ?> map) {
                    map.forEach((k, v) -> values.put(String.valueOf(k), v));
                }
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            } catch (RuntimeException e) {
                values.clear(); // file hỏng: dùng mặc định
            }
        }
        return new AppConfigFile(file, values);
    }

    public Optional<Integer> port() {
        return values.get("port") instanceof Number n ? Optional.of(n.intValue()) : Optional.empty();
    }

    public void setPort(int port) { values.put("port", port); }

    public Optional<String> backupDir() {
        return values.get("backupDir") instanceof String s && !s.isBlank() ? Optional.of(s) : Optional.empty();
    }

    public void setBackupDir(String dir) {
        if (dir == null || dir.isBlank()) {
            values.remove("backupDir");
        } else {
            values.put("backupDir", dir);
        }
    }

    public void save() {
        DumperOptions options = new DumperOptions();
        options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        try {
            Files.createDirectories(file.getParent());
            Files.writeString(file, new Yaml(options).dump(values));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
