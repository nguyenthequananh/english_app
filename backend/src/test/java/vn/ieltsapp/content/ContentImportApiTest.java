package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import org.springframework.mock.web.MockHttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockMultipartFile;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;
import vn.ieltsapp.support.IntegrationTest;

class ContentImportApiTest extends IntegrationTest {

    private int count(String table) {
        return jdbc.sql("SELECT COUNT(*) FROM " + table).query(Integer.class).single();
    }

    private MockMultipartFile fixture(String name) throws Exception {
        return new MockMultipartFile("files", name, "application/json",
                new ClassPathResource("fixtures/" + name).getContentAsByteArray());
    }

    @Test
    void importsAllFixturesThroughApi() throws Exception {
        var request = multipart("/api/content/import");
        for (String name : FIXTURES) request.file(fixture(name));
        mvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[*].ok").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(true))));

        assertThat(count("stage")).isEqualTo(2);
        assertThat(count("unit")).isEqualTo(3);
        assertThat(count("word")).isEqualTo(6);
        assertThat(count("lesson")).isEqualTo(4);
        assertThat(count("test")).isEqualTo(5);
        assertThat(count("exercise")).isEqualTo(12);
        String options = jdbc.sql("SELECT options_json FROM exercise WHERE code = 'S0-U01-G1-E1'")
                .query(String.class).single();
        assertThat(options).isEqualTo("[\"go\",\"goes\",\"going\"]");
    }

    @Test
    void reimportUpdatesContentAndKeepsLearnerProgress() throws Exception {
        importFixtures();
        newProfileSession("Thành");
        long profileId = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
        long hello = wordId("hello");
        jdbc.sql("INSERT INTO card VALUES (?, ?, 2.5, 6, 2, 0, '2026-10-11', '2026-10-05T09:00')")
                .params(profileId, hello).update();
        jdbc.sql("INSERT INTO lesson_progress VALUES (?, 'S0-U01-G1', 1.0, '2026-10-05T09:00')").param(profileId).update();
        // Từ Task 8 trở đi, tạo hồ sơ đã tự sinh dòng này, nên dùng OR REPLACE.
        jdbc.sql("INSERT OR REPLACE INTO unit_progress VALUES (?, 'S0-U01', 'ACTIVE', '2026-10-05T09:00', NULL)").param(profileId).update();

        String edited = new String(new ClassPathResource("fixtures/unit-s0-u01.json").getContentAsByteArray(),
                StandardCharsets.UTF_8).replace("\"xin chào\"", "\"chào bạn\"").replace("\"MON\"", "\"WED\"");
        List<ImportResult> results = contentService.importFiles(
                List.of(new NamedContent("unit-s0-u01.json", edited.getBytes(StandardCharsets.UTF_8))));

        assertThat(results.get(0).ok()).isTrue();
        assertThat(count("word")).isEqualTo(6);
        assertThat(jdbc.sql("SELECT meaning_vi FROM word WHERE id = ?").param(hello).query(String.class).single())
                .isEqualTo("chào bạn");
        assertThat(jdbc.sql("SELECT day FROM lesson WHERE code = 'S0-U01-G1'").query(String.class).single())
                .isEqualTo("WED");
        assertThat(count("card")).isEqualTo(1);
        assertThat(count("lesson_progress")).isEqualTo(1);
        assertThat(count("unit_progress")).isEqualTo(1);
    }

    @Test
    void invalidUnitIsRejectedAndNothingIsWritten() throws Exception {
        importFixtures();
        String bad = """
                {"code":"S0-U09","stage":"S0","title":"Lỗi","order":9,"words":[],
                 "lessons":[{"code":"S0-U09-G1","type":"GRAMMAR","day":"MON","title":"t","bodyMd":"b",
                   "exercises":[{"code":"S0-U09-E1","type":"MCQ","prompt":"p","options":["a","b"],"answer":"c"}]}],
                 "test":{"code":"S0-U09-T","kind":"UNIT","exercises":[{"code":"S0-U09-T1","type":"FILL","prompt":"p","answer":"a"}]}}
                """;
        List<ImportResult> results = contentService.importFiles(
                List.of(new NamedContent("bad.json", bad.getBytes(StandardCharsets.UTF_8))));

        assertThat(results.get(0).ok()).isFalse();
        assertThat(results.get(0).errors()).contains("lessons[0].exercises[0].answer: không nằm trong options");
        assertThat(jdbc.sql("SELECT COUNT(*) FROM unit WHERE code = 'S0-U09'").query(Integer.class).single()).isZero();
    }

    @Test
    void codeOwnedByAnotherUnitIsRejected() throws Exception {
        importFixtures();
        String clash = """
                {"code":"S0-U03","stage":"S0","title":"Trùng","order":3,"words":[],
                 "lessons":[{"code":"S0-U01-G1","type":"GRAMMAR","day":"MON","title":"t","bodyMd":"b",
                   "exercises":[]},
                 {"code":"S0-U03-G1","type":"GRAMMAR","day":"MON","title":"t","bodyMd":"b",
                   "exercises":[{"code":"S0-U01-G1-E1","type":"FILL","prompt":"p","answer":"a"}]}],
                 "test":{"code":"S0-U01-T","kind":"UNIT","exercises":[{"code":"S0-U03-T1","type":"FILL","prompt":"p","answer":"a"}]}}
                """;
        List<ImportResult> results = contentService.importFiles(
                List.of(new NamedContent("clash.json", clash.getBytes(StandardCharsets.UTF_8))));

        assertThat(results.get(0).ok()).isFalse();
        assertThat(results.get(0).errors()).contains(
                "lessons[0].code: 'S0-U01-G1' đã thuộc unit 'S0-U01'",
                "lessons[1].exercises[0].code: 'S0-U01-G1-E1' đã thuộc bài khác",
                "test.code: 'S0-U01-T' đã thuộc nơi khác");
        assertThat(jdbc.sql("SELECT unit_code FROM lesson WHERE code = 'S0-U01-G1'").query(String.class).single())
                .isEqualTo("S0-U01");
        assertThat(count("unit")).isEqualTo(3);
    }

    @Test
    void brokenJsonAndUnknownStageAreReported() {
        List<ImportResult> results = contentService.importFiles(List.of(
                new NamedContent("broken.json", "{ không phải json".getBytes(StandardCharsets.UTF_8)),
                new NamedContent("orphan.json", """
                        {"code":"S9-U01","stage":"S9","title":"x","order":1,"words":[],"lessons":[],
                         "test":{"code":"S9-U01-T","kind":"UNIT","exercises":[{"code":"S9-T1","type":"FILL","prompt":"p","answer":"a"}]}}
                        """.getBytes(StandardCharsets.UTF_8))));

        assertThat(results).hasSize(2);
        ImportResult broken = results.stream().filter(r -> r.file().equals("broken.json")).findFirst().orElseThrow();
        ImportResult orphan = results.stream().filter(r -> r.file().equals("orphan.json")).findFirst().orElseThrow();
        assertThat(broken.ok()).isFalse();
        assertThat(broken.errors().get(0)).startsWith("JSON không hợp lệ");
        assertThat(orphan.errors()).contains("stage: chặng 'S9' không tồn tại");
    }

    @Test
    void reimportRemovesLessonsAndExercisesDroppedFromFile() throws Exception {
        importFixtures();
        MockHttpSession session = newProfileSession("Thành");
        long profileId = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of("S0-U01-G1-E1", "goes")), session)
                .andExpect(status().isOk());
        postJson("/api/lessons/S0-U01-P1/submit", Map.of("answers", Map.of()), session).andExpect(status().isOk());

        ObjectNode unit = (ObjectNode) json.readTree(new ClassPathResource("fixtures/unit-s0-u01.json").getContentAsByteArray());
        ArrayNode lessons = (ArrayNode) unit.get("lessons");
        lessons.remove(1);                                          // bỏ bài S0-U01-P1
        ((ArrayNode) lessons.get(0).get("exercises")).remove(1);    // bỏ câu S0-U01-G1-E2
        ((ArrayNode) unit.get("test").get("exercises")).remove(1);  // bỏ câu S0-U01-T-E2
        List<ImportResult> results = contentService.importFiles(
                List.of(new NamedContent("unit-s0-u01.json", json.writeValueAsBytes(unit))));
        assertThat(results.get(0).ok()).as(results.toString()).isTrue();

        getAs("/api/units/S0-U01/lessons", session)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].code").value("S0-U01-G1"));
        getAs("/api/lessons/S0-U01-P1", session).andExpect(status().isNotFound());
        getAs("/api/lessons/S0-U01-G1", session).andExpect(jsonPath("$.exercises.length()").value(1));
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of("S0-U01-G1-E1", "goes")), session)
                .andExpect(jsonPath("$.score").value(1.0))
                .andExpect(jsonPath("$.results.length()").value(1));

        assertThat(jdbc.sql("SELECT code FROM exercise WHERE code LIKE 'S0-U01-%' ORDER BY code")
                .query(String.class).list()).containsExactly("S0-U01-G1-E1", "S0-U01-T-E1");
        assertThat(jdbc.sql("SELECT lesson_code FROM lesson_progress WHERE profile_id = ?").param(profileId)
                .query(String.class).list()).containsExactly("S0-U01-G1");
        assertThat(jdbc.sql("SELECT COUNT(*) FROM exercise_attempt WHERE exercise_code = 'S0-U01-P1-E1'")
                .query(Integer.class).single()).isEqualTo(1);
    }
}
