package vn.ieltsapp.lesson;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class LessonApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    @Test
    void lessonHidesAnswers() throws Exception {
        getAs("/api/lessons/S0-U01-G1", session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Thì hiện tại đơn"))
                .andExpect(jsonPath("$.exercises.length()").value(2))
                .andExpect(jsonPath("$.exercises[0].options[1]").value("goes"))
                .andExpect(jsonPath("$.exercises[0].answer").doesNotExist());
    }

    @Test
    void lockedLessonIsForbidden() throws Exception {
        getAs("/api/lessons/S0-U02-G1", session)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("UNIT_LOCKED"));
        getAs("/api/lessons/KHONG-CO", session).andExpect(status().isNotFound());
    }

    @Test
    void submitGradesSavesAttemptsAndKeepsBestScore() throws Exception {
        postJson("/api/lessons/S0-U01-G1/submit",
                Map.of("answers", Map.of("S0-U01-G1-E1", "goes", "S0-U01-G1-E2", "plays")), session)
                .andExpect(jsonPath("$.score").value(0.5))
                .andExpect(jsonPath("$.results[1].correct").value(false))
                .andExpect(jsonPath("$.results[1].answer").value("play"))
                .andExpect(jsonPath("$.results[1].explanationVi").value("Chủ ngữ số nhiều giữ nguyên động từ."));
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session)
                .andExpect(jsonPath("$.score").value(0.0));

        assertThat(jdbc.sql("SELECT COUNT(*) FROM exercise_attempt").query(Integer.class).single()).isEqualTo(4);
        getAs("/api/units/S0-U01/lessons", session)
                .andExpect(jsonPath("$[0].code").value("S0-U01-G1"))
                .andExpect(jsonPath("$[0].completed").value(true))
                .andExpect(jsonPath("$[1].completed").value(false));
        getAs("/api/lessons/S0-U01-G1", session).andExpect(jsonPath("$.bestScore").value(0.5));
    }

    @Test
    void submitWithoutAnswersFieldIs400() throws Exception {
        postJson("/api/lessons/S0-U01-G1/submit", Map.of(), session).andExpect(status().isBadRequest());
    }
}
