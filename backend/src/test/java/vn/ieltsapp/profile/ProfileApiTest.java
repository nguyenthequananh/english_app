package vn.ieltsapp.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class ProfileApiTest extends IntegrationTest {

    @Test
    void createListAndSelectWithoutPin() throws Exception {
        JsonNode created = body(postJson("/api/profiles", Map.of("name", "Thành", "avatar", "🦊"), new MockHttpSession())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hasPin").value(false))
                .andExpect(jsonPath("$.dailyMinutes").value(30)));
        long id = created.get("id").asLong();

        mvc.perform(get("/api/profiles")).andExpect(jsonPath("$[0].name").value("Thành"));

        MockHttpSession session = new MockHttpSession();
        postJson("/api/profiles/" + id + "/select", Map.of(), session).andExpect(status().isNoContent());
        getAs("/api/profiles/current", session).andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void currentWithoutSelectionIs401() throws Exception {
        mvc.perform(get("/api/profiles/current"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("PROFILE_REQUIRED"));
    }

    @Test
    void pinIsRequiredAndChecked() throws Exception {
        long id = body(postJson("/api/profiles", Map.of("name", "Lan", "pin", "1234"), new MockHttpSession()))
                .get("id").asLong();

        postJson("/api/profiles/" + id + "/select", Map.of(), new MockHttpSession())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("PIN_INVALID"));
        postJson("/api/profiles/" + id + "/select", Map.of("pin", "9999"), new MockHttpSession())
                .andExpect(status().isForbidden());
        postJson("/api/profiles/" + id + "/select", Map.of("pin", "1234"), new MockHttpSession())
                .andExpect(status().isNoContent());

        String hash = jdbc.sql("SELECT pin_hash FROM profile WHERE id = ?").param(id).query(String.class).single();
        assertThat(hash).isNotEqualTo("1234").startsWith("$2");
    }

    @Test
    void invalidInputIs400() throws Exception {
        postJson("/api/profiles", Map.of("name", " "), new MockHttpSession())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
        postJson("/api/profiles", Map.of("name", "A", "pin", "12"), new MockHttpSession())
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateAndRemovePin() throws Exception {
        MockHttpSession session = newProfileSession("Minh");
        mvc.perform(put("/api/profiles/current").session(session).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Minh Anh\",\"pin\":\"4321\",\"speechRate\":0.8}"))
                .andExpect(jsonPath("$.name").value("Minh Anh"))
                .andExpect(jsonPath("$.hasPin").value(true))
                .andExpect(jsonPath("$.speechRate").value(0.8));
        mvc.perform(put("/api/profiles/current").session(session).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"removePin\":true}"))
                .andExpect(jsonPath("$.hasPin").value(false))
                .andExpect(jsonPath("$.name").value("Minh Anh"));
    }

    @Test
    void deleteCurrentRemovesProfile() throws Exception {
        MockHttpSession session = newProfileSession("Tạm");
        mvc.perform(delete("/api/profiles/current").session(session)).andExpect(status().isNoContent());
        mvc.perform(get("/api/profiles")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void staleSessionOfDeletedProfileIs401() throws Exception {
        MockHttpSession session = newProfileSession("Cũ");
        jdbc.sql("DELETE FROM profile").update();
        getAs("/api/profiles/current", session).andExpect(status().isUnauthorized());
    }
}
