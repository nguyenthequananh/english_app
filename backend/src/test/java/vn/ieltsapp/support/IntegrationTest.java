package vn.ieltsapp.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestClockConfig.class)
public abstract class IntegrationTest {
    protected static final Path HOME;

    static {
        try {
            HOME = Files.createTempDirectory("ielts-test");
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
        clock.set(LocalDate.of(2026, 10, 5));
    }
}
