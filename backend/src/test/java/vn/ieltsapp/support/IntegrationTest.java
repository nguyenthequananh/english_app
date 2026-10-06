package vn.ieltsapp.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestClockConfig.class)
public abstract class IntegrationTest {
    protected static final Path HOME;

    static {
        try {
            HOME = Files.createTempDirectory("ielts-test");
            System.setProperty("app.home", HOME.toString());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.home", HOME::toString);
        registry.add("app.open-browser", () -> "false");
        registry.add("app.content.bootstrap", () -> "false");
    }

    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcClient jdbc;
    @Autowired protected ObjectMapper json;
    @Autowired protected MutableClock clock;

    @BeforeEach
    void resetState() {
        TestDb.clear(jdbc);
        clock.set(LocalDate.of(2026, 10, 5));
    }

    protected ResultActions postJson(String url, Object body, MockHttpSession session) throws Exception {
        return mvc.perform(post(url).session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)));
    }

    protected ResultActions getAs(String url, MockHttpSession session) throws Exception {
        return mvc.perform(get(url).session(session));
    }

    protected JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    protected MockHttpSession newProfileSession(String name) throws Exception {
        JsonNode created = body(postJson("/api/profiles", Map.of("name", name), new MockHttpSession())
                .andExpect(status().isCreated()));
        MockHttpSession session = new MockHttpSession();
        postJson("/api/profiles/" + created.get("id").asLong() + "/select", Map.of(), session)
                .andExpect(status().isNoContent());
        return session;
    }
}
