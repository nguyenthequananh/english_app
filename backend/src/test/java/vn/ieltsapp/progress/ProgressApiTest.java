package vn.ieltsapp.progress;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class ProgressApiTest extends IntegrationTest {
    MockHttpSession session;
    long pid;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
        pid = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
    }

    @Test
    void summaryBeforeAndAfterFinishingSession() throws Exception {
        getAs("/api/progress/summary", session)
                .andExpect(jsonPath("$.streak").value(0))
                .andExpect(jsonPath("$.finishedToday").value(false))
                .andExpect(jsonPath("$.currentUnit.code").value("S0-U01"))
                .andExpect(jsonPath("$.currentUnit.lessonsTotal").value(2));

        getAs("/api/session/today", session);
        for (String w : new String[] {"hello", "book", "go"}) {
            postJson("/api/session/today/cards/" + wordId(w), Map.of("grade", "GOOD"), session);
        }
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session);

        getAs("/api/progress/summary", session)
                .andExpect(jsonPath("$.streak").value(1))
                .andExpect(jsonPath("$.finishedToday").value(true))
                .andExpect(jsonPath("$.currentUnit.lessonsDone").value(1))
                .andExpect(jsonPath("$.currentUnit.testReady").value(false));

        clock.plusDays(1);
        getAs("/api/progress/summary", session)
                .andExpect(jsonPath("$.dueCount").value(3))
                .andExpect(jsonPath("$.streak").value(1));
    }

    @Test
    void statsCountKnownWordsAndHeatmap() throws Exception {
        long hello = wordId("hello");
        jdbc.sql("INSERT INTO card VALUES (?, ?, 2.5, 21, 4, 0, '2026-10-26', '2026-09-01T09:00')").params(pid, hello).update();
        jdbc.sql("INSERT INTO card VALUES (?, ?, 2.5, 6, 2, 0, '2026-10-08', '2026-09-01T09:00')").params(pid, wordId("book")).update();
        jdbc.sql("INSERT INTO review_log (profile_id, word_id, grade, prev_interval, new_interval, reviewed_at) VALUES (?, ?, 'GOOD', 15, 21, '2026-10-01T20:00')")
                .params(pid, hello).update();
        jdbc.sql("INSERT INTO study_session (profile_id, study_date, state_json, started_at, finished_at, minutes) VALUES (?, '2026-10-03', '{}', '2026-10-03T20:00', '2026-10-03T20:31', 31)")
                .param(pid).update();

        getAs("/api/progress/stats", session)
                .andExpect(jsonPath("$.knownWords").value(1))
                .andExpect(jsonPath("$.learningWords").value(1))
                .andExpect(jsonPath("$.heatmap[0].date").value("2026-10-03"))
                .andExpect(jsonPath("$.heatmap[0].minutes").value(31))
                .andExpect(jsonPath("$.knownByWeek[0].weekStart").value("2026-09-28"))
                .andExpect(jsonPath("$.knownByWeek[0].total").value(1))
                .andExpect(jsonPath("$.tests.length()").value(0));
    }
}
