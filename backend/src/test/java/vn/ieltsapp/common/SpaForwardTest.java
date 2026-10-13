package vn.ieltsapp.common;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
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

    @Test
    void indexHtmlAndClientRoutesAreNotCached() throws Exception {
        mvc.perform(get("/roadmap"))
                .andExpect(forwardedUrl("/index.html"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-cache")));
        mvc.perform(get("/units/S0-U01/test"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-cache")));
        mvc.perform(get("/")).andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-cache")));
        mvc.perform(get("/index.html")).andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-cache")));
    }

    @Test
    void apiResponsesKeepTheirCacheHeaders() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, not(containsString("no-cache"))));
    }

    @Test
    void hashedAssetsAreCachedLongTerm() throws Exception {
        mvc.perform(get("/assets/cache-test.js"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "max-age=31536000, public, immutable"));
        mvc.perform(get("/assets/khong-co.js")).andExpect(status().isNotFound());
    }
}
