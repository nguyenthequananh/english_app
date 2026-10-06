package vn.ieltsapp.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class ProfileTransferApiTest extends IntegrationTest {

    @Test
    void exportThenImportCreatesEquivalentProfile() throws Exception {
        importFixtures();
        MockHttpSession session = newProfileSession("Thành");
        postJson("/api/cards/" + wordId("hello") + "/review", Map.of("grade", "GOOD"), session);
        postJson("/api/words", Map.of("headword", "serendipity", "pos", "noun", "meaningVi", "tình cờ"), session);
        long userWord = jdbc.sql("SELECT id FROM word WHERE headword = 'serendipity'").query(Long.class).single();
        postJson("/api/cards/" + userWord + "/review", Map.of("grade", "EASY"), session);
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of("S0-U01-G1-E1", "goes")), session);

        String exported = getAs("/api/profiles/current/export", session)
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString(".json")))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        long newId = body(mvc.perform(post("/api/profiles/import").contentType(MediaType.APPLICATION_JSON).content(exported))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.profile.name").value("Thành"))
                .andExpect(jsonPath("$.skippedRows").value(0)))
                .get("profile").get("id").asLong();

        long oldId = jdbc.sql("SELECT MIN(id) FROM profile").query(Long.class).single();
        assertThat(newId).isNotEqualTo(oldId);
        for (String table : new String[] {"card", "review_log", "unit_progress", "lesson_progress", "exercise_attempt"}) {
            int before = jdbc.sql("SELECT COUNT(*) FROM " + table + " WHERE profile_id = ?").param(oldId).query(Integer.class).single();
            int after = jdbc.sql("SELECT COUNT(*) FROM " + table + " WHERE profile_id = ?").param(newId).query(Integer.class).single();
            assertThat(after).as(table).isEqualTo(before).isPositive();
        }
        assertThat(jdbc.sql("SELECT COUNT(*) FROM word WHERE source = 'USER' AND profile_id = ?").param(newId)
                .query(Integer.class).single()).isEqualTo(1);

        MockHttpSession imported = new MockHttpSession();
        postJson("/api/profiles/" + newId + "/select", Map.of(), imported).andExpect(status().isNoContent());
        getAs("/api/words?q=serendipity", imported).andExpect(jsonPath("$[0].status").value("LEARNING"));
    }

    @Test
    void unknownContentRowsAreSkipped() throws Exception {
        String payload = """
                {"version":1,"profile":{"name":"Khách","dailyMinutes":30,"speechRate":1.0,"createdAt":"2026-10-01T09:00"},
                 "userWords":[],"cards":[{"word_code":"khong#co","user_word":0,"ease":2.5,"interval_days":1,
                   "repetitions":1,"lapses":0,"due_date":"2026-10-02","created_at":"2026-10-01T09:00"}],
                 "reviews":[],"unitProgress":[{"unit_code":"S9-U01","status":"ACTIVE","started_at":"2026-10-01T09:00"}],
                 "lessonProgress":[],"exerciseAttempts":[],"testResults":[],"studySessions":[]}
                """;
        mvc.perform(post("/api/profiles/import").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.skippedRows").value(2));
    }

    @Test
    void unsupportedVersionIsRejected() throws Exception {
        mvc.perform(post("/api/profiles/import").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"version\":99,\"profile\":{\"name\":\"X\"}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EXPORT_VERSION"));
    }
}
