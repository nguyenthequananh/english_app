package vn.ieltsapp.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.ieltsapp.support.IntegrationTest;
import vn.ieltsapp.support.RecordingAppExiter;

class AppControllerTest extends IntegrationTest {
    @Autowired RecordingAppExiter exiter;

    @Test
    void shutdownRespondsThenExitsOnAnotherThread() throws Exception {
        exiter.reset();
        mvc.perform(post("/api/app/shutdown"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("Đang tắt app..."));
        assertThat(exiter.awaitExit(5000)).isTrue();
    }
}
