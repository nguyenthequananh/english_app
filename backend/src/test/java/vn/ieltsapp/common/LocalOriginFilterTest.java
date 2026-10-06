package vn.ieltsapp.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import vn.ieltsapp.support.IntegrationTest;

class LocalOriginFilterTest extends IntegrationTest {

    @Test
    void foreignHostIsRejected() throws Exception {
        mvc.perform(get("/api/health").header(HttpHeaders.HOST, "evil.com"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ORIGIN"));
        mvc.perform(get("/api/health").header(HttpHeaders.HOST, "evil.com:8765"))
                .andExpect(status().isForbidden());
    }

    @Test
    void localHostsAreAllowed() throws Exception {
        mvc.perform(get("/api/health").header(HttpHeaders.HOST, "127.0.0.1:8765")).andExpect(status().isOk());
        mvc.perform(get("/api/health").header(HttpHeaders.HOST, "localhost:8765")).andExpect(status().isOk());
    }

    @Test
    void crossSitePostIsRejected() throws Exception {
        mvc.perform(post("/api/profiles").header(HttpHeaders.ORIGIN, "https://evil.com")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ORIGIN"));
        mvc.perform(post("/api/profiles").header(HttpHeaders.ORIGIN, "null")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void postFromViteDevServerIsAllowed() throws Exception {
        mvc.perform(post("/api/profiles").header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\"}"))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/profiles").header(HttpHeaders.ORIGIN, "http://127.0.0.1:8765")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Y\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void getWithForeignOriginIsNotBlockedByOriginCheck() throws Exception {
        mvc.perform(get("/api/health").header(HttpHeaders.ORIGIN, "https://evil.com")).andExpect(status().isOk());
    }
}
