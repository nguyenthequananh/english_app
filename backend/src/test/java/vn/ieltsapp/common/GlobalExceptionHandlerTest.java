package vn.ieltsapp.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class GlobalExceptionHandlerTest extends IntegrationTest {

    @Test
    void unexpectedErrorBecomesInternalProblem() throws Exception {
        MockHttpSession session = newProfileSession("Thành");
        long profileId = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
        jdbc.sql("INSERT INTO study_session (profile_id, study_date, state_json, started_at) VALUES (?, '2026-10-05', 'hỏng', '2026-10-05T09:00')")
                .param(profileId).update();
        getAs("/api/session/today", session)
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL"))
                .andExpect(jsonPath("$.detail").value("Có lỗi không mong muốn, xem log"));
    }

    @Test
    void springErrorsKeepTheirStatus() throws Exception {
        mvc.perform(get("/api/khong-ton-tai"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mvc.perform(post("/api/health"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().exists("Allow"))
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
        mvc.perform(post("/api/profiles").contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType());
    }
}
