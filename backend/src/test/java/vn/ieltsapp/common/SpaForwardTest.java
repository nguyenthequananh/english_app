package vn.ieltsapp.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import vn.ieltsapp.support.IntegrationTest;

class SpaForwardTest extends IntegrationTest {

    @Test
    void clientRoutesForwardToIndexHtml() throws Exception {
        mvc.perform(get("/roadmap")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/lessons/S0-U01-G1")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/units/S0-U01/test")).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/profiles/new")).andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void apiAndAssetsAreNotForwarded() throws Exception {
        mvc.perform(get("/api/khong-ton-tai"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mvc.perform(get("/assets/index-abc.js")).andExpect(forwardedUrl(null));
        mvc.perform(get("/favicon.ico")).andExpect(forwardedUrl(null));
    }
}
