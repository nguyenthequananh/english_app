package vn.ieltsapp.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import vn.ieltsapp.support.IntegrationTest;

class HealthControllerTest extends IntegrationTest {

    @Test
    void healthReportsAppName() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.app").value("ielts-app"))
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void unknownApiPathReturns404() throws Exception {
        mvc.perform(get("/api/khong-ton-tai")).andExpect(status().isNotFound());
    }
}
