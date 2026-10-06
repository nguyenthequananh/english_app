package vn.ieltsapp.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class SessionApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    private void answer(String headword, String grade) throws Exception {
        postJson("/api/session/today/cards/" + wordId(headword), Map.of("grade", grade), session)
                .andExpect(status().isOk());
    }

    @Test
    void firstDayStartsWithNewWordsThenMondayLesson() throws Exception {
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.studyDate").value("2026-10-05"))
                .andExpect(jsonPath("$.step").value("NEW"))
                .andExpect(jsonPath("$.currentCard.headword").value("hello"))
                .andExpect(jsonPath("$.newLeft").value(3))
                .andExpect(jsonPath("$.lessonCode").value("S0-U01-G1"))
                .andExpect(jsonPath("$.finished").value(false));
    }

    @Test
    void fullSessionFlowFinishesAfterLesson() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");
        getAs("/api/session/today", session).andExpect(jsonPath("$.step").value("LESSON"));

        clock.plusMinutes(25);
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session);

        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.step").value("DONE"))
                .andExpect(jsonPath("$.finished").value(true))
                .andExpect(jsonPath("$.cardsDone").value(3));
        assertThat(jdbc.sql("SELECT minutes FROM study_session").query(Integer.class).single()).isEqualTo(25);
    }

    @Test
    void againRequeuesCardAtEnd() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "AGAIN");
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.currentCard.headword").value("book"))
                .andExpect(jsonPath("$.newLeft").value(3));
    }

    @Test
    void outOfOrderOrDuplicateAnswerIsRejected() throws Exception {
        getAs("/api/session/today", session);
        postJson("/api/session/today/cards/" + wordId("go"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CARD_MISMATCH"));
        answer("hello", "GOOD");
        postJson("/api/session/today/cards/" + wordId("hello"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CARD_MISMATCH"));
        assertThat(jdbc.sql("SELECT COUNT(*) FROM review_log").query(Integer.class).single()).isEqualTo(1);
    }

    @Test
    void nextDayReviewsDueCardsAndPicksTuesdayLesson() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");

        clock.plusDays(1);
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.studyDate").value("2026-10-06"))
                .andExpect(jsonPath("$.step").value("REVIEW"))
                .andExpect(jsonPath("$.reviewsLeft").value(3))
                .andExpect(jsonPath("$.newLeft").value(0))
                .andExpect(jsonPath("$.lessonCode").value("S0-U01-P1"));
    }

    @Test
    void midnightRolloverKeepsAnsweredCardsAndStartsNewDay() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");

        clock.plusDays(1);
        postJson("/api/session/today/cards/" + wordId("book"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NO_SESSION"));
        assertThat(jdbc.sql("SELECT COUNT(*) FROM card").query(Integer.class).single()).isEqualTo(1);
        getAs("/api/session/today", session).andExpect(jsonPath("$.studyDate").value("2026-10-06"));
    }

    @Test
    void cardAnswerDuringLessonStepIsRejected() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");
        postJson("/api/session/today/cards/" + wordId("hello"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WRONG_STEP"));
    }

    @Test
    void lessonCompletedOutOfBandFinishesSessionWhenCardsAreDone() throws Exception {
        getAs("/api/session/today", session).andExpect(jsonPath("$.step").value("NEW"));
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session).andExpect(status().isOk());
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.step").value("DONE"))
                .andExpect(jsonPath("$.finished").value(true));
        assertThat(jdbc.sql("SELECT finished_at FROM study_session").query(String.class).single()).isNotNull();
    }

    @Test
    void sessionStuckInLessonIsSettledWhenViewed() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");
        long profileId = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
        jdbc.sql("INSERT INTO lesson_progress VALUES (?, 'S0-U01-G1', 1.0, '2026-10-05T09:10')").param(profileId).update();
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.step").value("DONE"))
                .andExpect(jsonPath("$.finished").value(true));
    }
}
