package vn.ieltsapp.assessment;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class AssessmentApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    private void completeU01Lessons() throws Exception {
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session);
        postJson("/api/lessons/S0-U01-P1/submit", Map.of("answers", Map.of()), session);
    }

    private void passUnit(String testCode, Map<String, String> answers) throws Exception {
        postJson("/api/tests/" + testCode + "/submit", Map.of("answers", answers), session)
                .andExpect(jsonPath("$.passed").value(true));
    }

    @Test
    void unitTestRequiresAllLessonsDone() throws Exception {
        getAs("/api/units/S0-U01/test", session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TEST_NOT_READY"));
        completeU01Lessons();
        getAs("/api/units/S0-U01/test", session)
                .andExpect(jsonPath("$.code").value("S0-U01-T"))
                .andExpect(jsonPath("$.exercises.length()").value(2))
                .andExpect(jsonPath("$.exercises[0].answer").doesNotExist());
    }

    @Test
    void failingUnitTestKeepsNextUnitLocked() throws Exception {
        completeU01Lessons();
        postJson("/api/tests/S0-U01-T/submit", Map.of("answers", Map.of()), session)
                .andExpect(jsonPath("$.score").value(0.0))
                .andExpect(jsonPath("$.passed").value(false));
        getAs("/api/roadmap", session).andExpect(jsonPath("$.stages[0].units[1].status").value("LOCKED"));
    }

    @Test
    void passingUnitTestUnlocksNextUnit() throws Exception {
        completeU01Lessons();
        passUnit("S0-U01-T", Map.of("S0-U01-T-E1", "has", "S0-U01-T-E2", "go"));
        getAs("/api/roadmap", session)
                .andExpect(jsonPath("$.stages[0].units[0].status").value("DONE"))
                .andExpect(jsonPath("$.stages[0].units[1].status").value("ACTIVE"));
    }

    @Test
    void stageTestFlowWithWeakUnitsThenPass() throws Exception {
        getAs("/api/stages/S0/test", session).andExpect(status().isConflict());

        completeU01Lessons();
        passUnit("S0-U01-T", Map.of("S0-U01-T-E1", "has"));
        postJson("/api/lessons/S0-U02-G1/submit", Map.of("answers", Map.of()), session);
        passUnit("S0-U02-T", Map.of("S0-U02-T-E1", "an"));

        getAs("/api/stages/S0/test", session).andExpect(jsonPath("$.kind").value("STAGE"));
        postJson("/api/tests/S0-T/submit", Map.of("answers", Map.of("S0-T-E1", "is")), session)
                .andExpect(jsonPath("$.passed").value(false))
                .andExpect(jsonPath("$.weakUnits.length()").value(1))
                .andExpect(jsonPath("$.weakUnits[0]").value("S0-U01"));

        postJson("/api/tests/S0-T/submit", Map.of("answers", Map.of("S0-T-E1", "is", "S0-T-E2", "am")), session)
                .andExpect(jsonPath("$.passed").value(true));
        getAs("/api/roadmap", session)
                .andExpect(jsonPath("$.stages[0].status").value("DONE"))
                .andExpect(jsonPath("$.stages[1].units[0].status").value("ACTIVE"));
    }

    @Test
    void submittingLockedUnitTestIsForbidden() throws Exception {
        postJson("/api/tests/S0-U02-T/submit", Map.of("answers", Map.of()), session)
                .andExpect(status().isForbidden());
        postJson("/api/tests/KHONG-CO/submit", Map.of("answers", Map.of()), session)
                .andExpect(status().isNotFound());
    }
}
