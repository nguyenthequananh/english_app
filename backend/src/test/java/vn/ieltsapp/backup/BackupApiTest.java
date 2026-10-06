package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class BackupApiTest extends IntegrationTest {

    @BeforeEach
    void setUp() throws Exception {
        newProfileSession("Thành");
    }

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(HOME.resolve("config.yml"));
        Files.deleteIfExists(HOME.resolve(StartupRestore.MARKER));
        for (Path dir : new Path[] {HOME.resolve("backups"), HOME.resolve("sao lưu dữ liệu")}) {
            if (Files.exists(dir)) {
                try (Stream<Path> files = Files.walk(dir)) {
                    files.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
                }
            }
        }
    }

    static int profilesIn(Path dbFile) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + dbFile);
             ResultSet rs = c.createStatement().executeQuery("SELECT COUNT(*) FROM profile")) {
            rs.next();
            return rs.getInt(1);
        }
    }

    @Test
    void manualBackupProducesValidDatabase() throws Exception {
        String name = body(mvc.perform(post("/api/backups")).andExpect(status().isCreated())).get("name").asText();
        assertThat(name).matches("ielts-20261005-090000-manual\\.db");
        assertThat(profilesIn(HOME.resolve("backups").resolve(name))).isEqualTo(1);
        mvc.perform(get("/api/backups")).andExpect(jsonPath("$[0].name").value(name));
    }

    @Test
    void keepsOnlySevenNewestBackups() throws Exception {
        for (int i = 0; i < 9; i++) {
            mvc.perform(post("/api/backups")).andExpect(status().isCreated());
            clock.plusSeconds(1);
        }
        mvc.perform(get("/api/backups"))
                .andExpect(jsonPath("$.length()").value(7))
                .andExpect(jsonPath("$[0].name").value("ielts-20261005-090008-manual.db"));
    }

    @Test
    void backupDirWithSpacesAndVietnameseWorks() throws Exception {
        Path dir = HOME.resolve("sao lưu dữ liệu");
        mvc.perform(put("/api/settings").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("backupDir", dir.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backupDir").value(dir.toString()));
        String name = body(mvc.perform(post("/api/backups"))).get("name").asText();
        assertThat(profilesIn(dir.resolve(name))).isEqualTo(1);
    }

    @Test
    void relativeBackupDirIsRejected() throws Exception {
        mvc.perform(put("/api/settings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"backupDir\":\"tuong-doi\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void restoreWritesMarkerAndRejectsBadNames() throws Exception {
        String name = body(mvc.perform(post("/api/backups"))).get("name").asText();
        mvc.perform(post("/api/backups/" + name + "/restore")).andExpect(status().isOk());
        assertThat(Files.readString(HOME.resolve(StartupRestore.MARKER))).endsWith(name);

        mvc.perform(post("/api/backups/..%2Fielts.db/restore")).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/backups/ielts-20990101-000000-manual.db/restore")).andExpect(status().isNotFound());
    }

    @Test
    void exportDownloadsDatabaseFile() throws Exception {
        mvc.perform(get("/api/backups/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("ielts-export-")));
    }

    @Test
    void openLogsInHeadlessTestIsNotSupported() throws Exception {
        mvc.perform(post("/api/settings/open-logs"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NOT_SUPPORTED"));
    }
}
