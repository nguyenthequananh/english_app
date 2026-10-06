package vn.ieltsapp.vocab;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class VocabApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    @Test
    void reviewCreatesCardAndSchedulesWithSm2() throws Exception {
        long hello = wordId("hello");
        postJson("/api/cards/" + hello + "/review", Map.of("grade", "GOOD"), session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.intervalDays").value(1))
                .andExpect(jsonPath("$.dueDate").value("2026-10-06"));

        clock.plusDays(1);
        getAs("/api/cards/due", session).andExpect(jsonPath("$[0].headword").value("hello"));
        postJson("/api/cards/" + hello + "/review", Map.of("grade", "GOOD"), session)
                .andExpect(jsonPath("$.intervalDays").value(6));

        assertThat(jdbc.sql("SELECT COUNT(*) FROM review_log").query(Integer.class).single()).isEqualTo(2);
        getAs("/api/cards/due", session).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void wordBankFiltersByStatusAndQuery() throws Exception {
        postJson("/api/cards/" + wordId("book") + "/review", Map.of("grade", "GOOD"), session);
        getAs("/api/words?status=LEARNING", session)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].word.headword").value("book"));
        getAs("/api/words?status=NEW", session).andExpect(jsonPath("$.length()").value(5));
        getAs("/api/words?q=táo", session).andExpect(jsonPath("$[0].word.headword").value("apple"));
        getAs("/api/words?status=SAI", session).andExpect(status().isBadRequest());
    }

    @Test
    void userWordsArePrivateToTheirProfile() throws Exception {
        postJson("/api/words", Map.of("headword", "serendipity", "pos", "noun", "meaningVi", "sự tình cờ may mắn"), session)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.source").value("USER"));
        postJson("/api/words", Map.of("headword", "Serendipity", "pos", "noun", "meaningVi", "x"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WORD_EXISTS"));
        postJson("/api/words", Map.of("headword", "hello", "pos", "exclamation", "meaningVi", "x"), session)
                .andExpect(status().isConflict());

        long userWordId = jdbc.sql("SELECT id FROM word WHERE headword = 'serendipity'").query(Long.class).single();
        MockHttpSession other = newProfileSession("Lan");
        getAs("/api/words?q=serendipity", other).andExpect(jsonPath("$.length()").value(0));
        postJson("/api/cards/" + userWordId + "/review", Map.of("grade", "GOOD"), other)
                .andExpect(status().isNotFound());
    }

    @Test
    void reviewRequiresValidGradeAndExistingWord() throws Exception {
        postJson("/api/cards/999999/review", Map.of("grade", "GOOD"), session).andExpect(status().isNotFound());
        postJson("/api/cards/" + wordId("go") + "/review", Map.of(), session).andExpect(status().isBadRequest());
    }

    @Test
    void deletingProfileRemovesOnlyItsData() throws Exception {
        postJson("/api/cards/" + wordId("go") + "/review", Map.of("grade", "GOOD"), session);
        postJson("/api/words", Map.of("headword", "mine", "pos", "pronoun", "meaningVi", "của tôi"), session);
        MockHttpSession other = newProfileSession("Lan");
        postJson("/api/cards/" + wordId("go") + "/review", Map.of("grade", "EASY"), other);

        mvc.perform(delete("/api/profiles/current").session(session)).andExpect(status().isNoContent());

        assertThat(jdbc.sql("SELECT COUNT(*) FROM card").query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT COUNT(*) FROM review_log").query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT COUNT(*) FROM word WHERE source = 'USER'").query(Integer.class).single()).isZero();
        assertThat(jdbc.sql("SELECT COUNT(*) FROM word").query(Integer.class).single()).isEqualTo(6);
    }
}
