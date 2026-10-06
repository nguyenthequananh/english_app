# IELTS App – Backend lõi: Kế hoạch triển khai (Kế hoạch 1/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây backend Spring Boot chạy local cho app học IELTS: hồ sơ, nạp nội dung, flashcard SM-2, lộ trình, bài học, kiểm tra, buổi học 30 phút, thống kê, sao lưu và trình khởi động. Toàn bộ dùng được qua REST API.

**Architecture:** Một ứng dụng Spring Boot (Maven), chia package theo tính năng (`profile`, `content`, `vocab`, `roadmap`, `lesson`, `assessment`, `session`, `progress`, `backup`, `launcher`, `common`). Truy cập SQLite bằng `JdbcClient`, schema do Flyway quản lý. Logic thuần (SM-2, ghép buổi học, tính chuỗi ngày) tách thành lớp không phụ thuộc Spring và viết theo TDD. Các module giao tiếp qua service công khai, cộng thêm 2 sự kiện (`ProfileCreatedEvent`, `LessonCompletedEvent`).

**Tech Stack:** Java 21, Spring Boot 3.5.x (web, jdbc, validation), sqlite-jdbc, Flyway, spring-security-crypto (BCrypt), SnakeYAML, JUnit 5, AssertJ, MockMvc.

**Spec:** `docs/superpowers/specs/2026-10-06-ielts-app-phase1-design.md`

**Chuỗi kế hoạch:** Kế hoạch 1 (bản này): backend lõi · Kế hoạch 2: frontend React + chuyển tiếp SPA + đóng gói jpackage + Playwright · Kế hoạch 3: soạn nội dung Chặng 0 (24 unit).

## Global Constraints

- Java 21, Spring Boot 3.5.x (bản patch mới nhất), Maven Wrapper; package gốc `vn.ieltsapp`; thư mục `backend/`.
- Truy cập DB chỉ qua `JdbcClient` (không dùng JPA). Schema chỉ thay đổi bằng migration Flyway trong `backend/src/main/resources/db/migration`.
- SQLite URL: `jdbc:sqlite:${app.home}/ielts.db?journal_mode=WAL&foreign_keys=on&busy_timeout=5000`, Hikari `maximum-pool-size: 1`.
- Thư mục dữ liệu `app.home` mặc định là `${user.home}/.ielts-app`.
- `server.address: 127.0.0.1`, cổng mặc định `8765`; nếu bận thì thử `8766`…`8775`.
- Mọi API có prefix `/api`. Lỗi trả về dạng `ProblemDetail`, có thuộc tính `code` (chuỗi IN_HOA) và `detail` bằng tiếng Việt; lỗi nội dung có thêm `errors` (danh sách chuỗi).
- Dữ liệu cá nhân luôn lấy `profile_id` từ HTTP session (attribute `profileId`) thông qua `@CurrentProfileId`, không bao giờ nhận từ client.
- "Hôm nay" luôn lấy từ bean `Clock` (`LocalDate.now(clock)`). Ngày lưu TEXT `yyyy-MM-dd`; thời điểm lưu `LocalDateTime.now(clock).toString()`.
- Buổi học: tối đa 60 thẻ ôn, 10 từ mới, bỏ từ mới nếu số thẻ đến hạn > 100. Từ "đã thuộc" khi `interval_days >= 21`.
- Qua unit: `pass_ratio` mặc định 0.6; qua chặng: 0.7. Sao lưu giữ 7 bản.
- Không gọi mạng ra ngoài (ngoài `127.0.0.1`), không dùng AI.
- Lệnh chạy test (Git Bash, từ thư mục `backend/`): `./mvnw -q test -Dtest=<TênTest>`.

## Review Focus

1. **Hai tab cùng trả lời một thẻ** (bấm đúp, hoặc mở 2 tab): lần thứ hai phải bị từ chối (409 `CARD_MISMATCH`), không được chấm thẻ hai lần. → test trong Task 12.
2. **Qua nửa đêm khi đang học dở**: thẻ đã chấm vẫn được lưu; lần trả lời tiếp theo nhận 409 `NO_SESSION`, và `GET /api/session/today` tạo buổi học mới cho ngày mới. → test trong Task 12.
3. **Import lại nội dung đã sửa** (đổi nghĩa từ, đổi thứ bài) sau khi người dùng đã học: thẻ, tiến độ bài học và tiến độ unit phải giữ nguyên. → test trong Task 6.
4. **Xóa một hồ sơ** phải xóa sạch dữ liệu của hồ sơ đó (thẻ, lịch sử, từ tự thêm), không đụng tới hồ sơ khác. → test trong Task 7.
5. **Đường dẫn có dấu cách và tiếng Việt** (ví dụ thư mục sao lưu `sao lưu dữ liệu` trong OneDrive): sao lưu vẫn chạy và tạo ra file DB hợp lệ. → test trong Task 14.

---

### Task 1: Khung project, health check, định dạng lỗi

**Files:**
- Create: `.gitignore`
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/vn/ieltsapp/IeltsApplication.java`
- Create: `backend/src/main/java/vn/ieltsapp/common/AppHome.java`
- Create: `backend/src/main/java/vn/ieltsapp/common/ClockConfig.java`
- Create: `backend/src/main/java/vn/ieltsapp/common/ApiException.java`
- Create: `backend/src/main/java/vn/ieltsapp/common/GlobalExceptionHandler.java`
- Create: `backend/src/main/java/vn/ieltsapp/common/HealthController.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/db/migration/.gitkeep`
- Create: `backend/src/test/java/vn/ieltsapp/support/MutableClock.java`
- Create: `backend/src/test/java/vn/ieltsapp/support/TestClockConfig.java`
- Create: `backend/src/test/java/vn/ieltsapp/support/IntegrationTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/common/HealthControllerTest.java`

**Interfaces:**
- Produces: `ApiException(HttpStatus status, String code, String message)`, `ApiException(HttpStatus, String, String, List<String> details)`, `ApiException.notFound(String what)`, `getStatus()`, `getCode()`, `getDetails()`.
- Produces: bean `Clock`; test bean `MutableClock` (`set(LocalDate)`, `plusDays(long)`, `plusMinutes(long)`, `plusSeconds(long)`), mặc định 2026-10-05 09:00 (thứ Hai) múi giờ Asia/Ho_Chi_Minh.
- Produces: `IntegrationTest` (abstract, có `mvc`, `jdbc`, `json`, `clock`, thư mục tạm tĩnh `HOME`).
- Produces: `GET /api/health` → `{"app":"ielts-app","status":"UP","recoveredFrom":null,"restoredFrom":null}`.

- [ ] **Step 1: Tạo Maven project và Maven Wrapper**

`.gitignore` (gốc repo):
```gitignore
backend/target/
frontend/node_modules/
frontend/dist/
*.db
*.db-wal
*.db-shm
.idea/
*.iml
.vscode/
```

`backend/pom.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.6</version>
    <relativePath/>
  </parent>

  <groupId>vn.ieltsapp</groupId>
  <artifactId>ielts-app</artifactId>
  <version>0.1.0</version>
  <name>ielts-app</name>

  <properties>
    <java.version>21</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>org.xerial</groupId>
      <artifactId>sqlite-jdbc</artifactId>
    </dependency>
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.security</groupId>
      <artifactId>spring-security-crypto</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <resources>
      <resource>
        <directory>src/main/resources</directory>
      </resource>
      <resource>
        <directory>../content</directory>
        <targetPath>content</targetPath>
      </resource>
    </resources>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
```
Nếu `3.5.6` không tải được, dùng bản 3.5.x mới nhất trên Maven Central. Không tự ý lên 4.x.

Tạo wrapper (cần Maven 3.9 trên máy, chỉ dùng một lần):
```bash
cd backend && mvn -N wrapper:wrapper -Dmaven=3.9.9
```

- [ ] **Step 2: Viết lớp hỗ trợ test và test health (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/support/MutableClock.java`:
```java
package vn.ieltsapp.support;

import java.time.*;

public class MutableClock extends Clock {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private Instant now = LocalDate.of(2026, 10, 5).atTime(9, 0).atZone(ZONE).toInstant();

    public void set(LocalDate date) { now = date.atTime(9, 0).atZone(ZONE).toInstant(); }
    public void plusDays(long days) { now = now.plus(Duration.ofDays(days)); }
    public void plusMinutes(long minutes) { now = now.plus(Duration.ofMinutes(minutes)); }
    public void plusSeconds(long seconds) { now = now.plusSeconds(seconds); }

    @Override public ZoneId getZone() { return ZONE; }
    @Override public Clock withZone(ZoneId zone) { return this; }
    @Override public Instant instant() { return now; }
}
```

`backend/src/test/java/vn/ieltsapp/support/TestClockConfig.java`:
```java
package vn.ieltsapp.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestClockConfig {
    @Bean
    @Primary
    public MutableClock mutableClock() { return new MutableClock(); }
}
```

`backend/src/test/java/vn/ieltsapp/support/IntegrationTest.java`:
```java
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
```

`backend/src/test/java/vn/ieltsapp/common/HealthControllerTest.java`:
```java
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
```

- [ ] **Step 3: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=HealthControllerTest`
Expected: FAIL (lỗi biên dịch: chưa có `IeltsApplication`/cấu hình).

- [ ] **Step 4: Viết code tối thiểu**

`backend/src/main/java/vn/ieltsapp/common/AppHome.java`:
```java
package vn.ieltsapp.common;

import java.nio.file.Path;

public final class AppHome {
    private AppHome() {}

    public static Path resolve() {
        String configured = System.getProperty("app.home");
        if (configured != null && !configured.isBlank()) {
            return Path.of(configured);
        }
        return Path.of(System.getProperty("user.home"), ".ielts-app");
    }
}
```

`backend/src/main/java/vn/ieltsapp/IeltsApplication.java`:
```java
package vn.ieltsapp;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import vn.ieltsapp.common.AppHome;

@SpringBootApplication
public class IeltsApplication {

    public static void main(String[] args) throws IOException {
        Path home = AppHome.resolve();
        Files.createDirectories(home.resolve("logs"));
        List<String> all = new ArrayList<>(List.of(args));
        all.add("--app.home=" + home);
        SpringApplication.run(IeltsApplication.class, all.toArray(String[]::new));
    }
}
```

`backend/src/main/java/vn/ieltsapp/common/ClockConfig.java`:
```java
package vn.ieltsapp.common;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {
    @Bean
    public Clock clock() { return Clock.systemDefaultZone(); }
}
```

`backend/src/main/java/vn/ieltsapp/common/ApiException.java`:
```java
package vn.ieltsapp.common;

import java.util.List;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final List<String> details;

    public ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, List.of());
    }

    public ApiException(HttpStatus status, String code, String message, List<String> details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = List.copyOf(details);
    }

    public static ApiException notFound(String what) {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy " + what);
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public List<String> getDetails() { return details; }
}
```

`backend/src/main/java/vn/ieltsapp/common/GlobalExceptionHandler.java`:
```java
package vn.ieltsapp.common;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ProblemDetail handleApi(ApiException e) {
        ProblemDetail p = problem(e.getStatus(), e.getCode(), e.getMessage());
        if (!e.getDetails().isEmpty()) {
            p.setProperty("errors", e.getDetails());
        }
        return p;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleInvalid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return problem(HttpStatus.BAD_REQUEST, "VALIDATION", message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return problem(HttpStatus.BAD_REQUEST, "VALIDATION", e.getName() + ": giá trị không hợp lệ");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException e) {
        return problem(HttpStatus.BAD_REQUEST, "BAD_JSON", "Dữ liệu gửi lên không đúng định dạng");
    }

    static ProblemDetail problem(HttpStatusCode status, String code, String message) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, message);
        p.setProperty("code", code);
        return p;
    }
}
```

`backend/src/main/java/vn/ieltsapp/common/HealthController.java`:
```java
package vn.ieltsapp.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final String recoveredFrom;
    private final String restoredFrom;

    public HealthController(@Value("${app.recovered-from:}") String recoveredFrom,
                            @Value("${app.restored-from:}") String restoredFrom) {
        this.recoveredFrom = recoveredFrom;
        this.restoredFrom = restoredFrom;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app", "ielts-app");
        body.put("status", "UP");
        body.put("recoveredFrom", recoveredFrom.isBlank() ? null : recoveredFrom);
        body.put("restoredFrom", restoredFrom.isBlank() ? null : restoredFrom);
        return body;
    }
}
```

`backend/src/main/resources/application.yml`:
```yaml
app:
  home: ${user.home}/.ielts-app
  open-browser: true
  content:
    bootstrap: true
  session:
    max-reviews: 60
    new-words: 10
    skip-new-when-due-over: 100
  backup:
    keep: 7

server:
  address: 127.0.0.1
  port: 8765

spring:
  application:
    name: ielts-app
  datasource:
    url: jdbc:sqlite:${app.home}/ielts.db?journal_mode=WAL&foreign_keys=on&busy_timeout=5000
    hikari:
      maximum-pool-size: 1
  flyway:
    enabled: true
    locations: classpath:db/migration
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 50MB

logging:
  file:
    name: ${app.home}/logs/app.log
  logback:
    rollingpolicy:
      max-history: 14
      max-file-size: 10MB
```

Tạo file rỗng `backend/src/main/resources/db/migration/.gitkeep`.

- [ ] **Step 5: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=HealthControllerTest`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add .gitignore backend
git commit -m "feat(backend): khung Spring Boot, health check, định dạng lỗi"
```

---

### Task 2: Schema DB (Flyway V1)

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__init.sql`
- Delete: `backend/src/main/resources/db/migration/.gitkeep`
- Create: `backend/src/test/java/vn/ieltsapp/support/TestDb.java`
- Modify: `backend/src/test/java/vn/ieltsapp/support/IntegrationTest.java` (gọi `TestDb.clear` trong `resetState`)
- Test: `backend/src/test/java/vn/ieltsapp/common/SchemaTest.java`

**Interfaces:**
- Produces: các bảng `stage, unit, profile, word, unit_word, lesson, test, exercise, card, review_log, unit_progress, lesson_progress, exercise_attempt, test_result, study_session` với đúng tên cột dưới đây; các task sau viết SQL dựa trên những tên này.
- Produces: `TestDb.clear(JdbcClient)`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/common/SchemaTest.java`:
```java
package vn.ieltsapp.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.support.IntegrationTest;

class SchemaTest extends IntegrationTest {

    @Test
    void allTablesExist() {
        List<String> tables = jdbc.sql("SELECT name FROM sqlite_master WHERE type = 'table'")
                .query(String.class).list();
        assertThat(tables).contains("stage", "unit", "profile", "word", "unit_word", "lesson", "test",
                "exercise", "card", "review_log", "unit_progress", "lesson_progress",
                "exercise_attempt", "test_result", "study_session");
    }

    @Test
    void foreignKeysAndWalAreEnabled() {
        assertThat(jdbc.sql("PRAGMA foreign_keys").query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("PRAGMA journal_mode").query(String.class).single()).isEqualToIgnoringCase("wal");
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=SchemaTest`
Expected: FAIL ở `allTablesExist` (chưa có bảng).

- [ ] **Step 3: Viết migration**

Xóa `.gitkeep`, tạo `backend/src/main/resources/db/migration/V1__init.sql`:
```sql
CREATE TABLE stage (
    code        TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    target_band REAL NOT NULL,
    sort_order  INTEGER NOT NULL
);

CREATE TABLE unit (
    code       TEXT PRIMARY KEY,
    stage_code TEXT NOT NULL REFERENCES stage (code),
    title      TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE profile (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    avatar        TEXT,
    pin_hash      TEXT,
    daily_minutes INTEGER NOT NULL DEFAULT 30,
    voice         TEXT,
    speech_rate   REAL NOT NULL DEFAULT 1.0,
    created_at    TEXT NOT NULL
);

CREATE TABLE word (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL,
    headword   TEXT NOT NULL,
    pos        TEXT NOT NULL,
    ipa_us     TEXT,
    ipa_uk     TEXT,
    meaning_vi TEXT NOT NULL,
    example_en TEXT,
    example_vi TEXT,
    cefr       TEXT,
    source     TEXT NOT NULL,
    profile_id INTEGER REFERENCES profile (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX ux_word_global ON word (code) WHERE profile_id IS NULL;
CREATE UNIQUE INDEX ux_word_user ON word (profile_id, code) WHERE profile_id IS NOT NULL;

CREATE TABLE unit_word (
    unit_code  TEXT NOT NULL REFERENCES unit (code),
    word_id    INTEGER NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (unit_code, word_id)
);

CREATE TABLE lesson (
    code       TEXT PRIMARY KEY,
    unit_code  TEXT NOT NULL REFERENCES unit (code),
    type       TEXT NOT NULL,
    day        TEXT NOT NULL,
    title      TEXT NOT NULL,
    body_md    TEXT NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE TABLE test (
    code       TEXT PRIMARY KEY,
    kind       TEXT NOT NULL,
    unit_code  TEXT REFERENCES unit (code),
    stage_code TEXT REFERENCES stage (code),
    pass_ratio REAL NOT NULL
);

CREATE TABLE exercise (
    code           TEXT PRIMARY KEY,
    lesson_code    TEXT REFERENCES lesson (code),
    test_code      TEXT REFERENCES test (code),
    type           TEXT NOT NULL,
    prompt         TEXT NOT NULL,
    options_json   TEXT,
    answer         TEXT NOT NULL,
    explanation_vi TEXT,
    sort_order     INTEGER NOT NULL
);

CREATE TABLE card (
    profile_id    INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    word_id       INTEGER NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    ease          REAL NOT NULL,
    interval_days INTEGER NOT NULL,
    repetitions   INTEGER NOT NULL,
    lapses        INTEGER NOT NULL,
    due_date      TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    PRIMARY KEY (profile_id, word_id)
);
CREATE INDEX ix_card_due ON card (profile_id, due_date);

CREATE TABLE review_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id    INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    word_id       INTEGER NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    grade         TEXT NOT NULL,
    prev_interval INTEGER NOT NULL,
    new_interval  INTEGER NOT NULL,
    reviewed_at   TEXT NOT NULL
);
CREATE INDEX ix_review_log_profile ON review_log (profile_id, reviewed_at);

CREATE TABLE unit_progress (
    profile_id   INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    unit_code    TEXT NOT NULL REFERENCES unit (code),
    status       TEXT NOT NULL,
    started_at   TEXT,
    completed_at TEXT,
    PRIMARY KEY (profile_id, unit_code)
);

CREATE TABLE lesson_progress (
    profile_id   INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    lesson_code  TEXT NOT NULL REFERENCES lesson (code),
    score        REAL NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (profile_id, lesson_code)
);

CREATE TABLE exercise_attempt (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id    INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    exercise_code TEXT NOT NULL,
    answer        TEXT,
    correct       INTEGER NOT NULL,
    attempted_at  TEXT NOT NULL
);

CREATE TABLE test_result (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    test_code  TEXT NOT NULL REFERENCES test (code),
    score      REAL NOT NULL,
    passed     INTEGER NOT NULL,
    taken_at   TEXT NOT NULL
);

CREATE TABLE study_session (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL REFERENCES profile (id) ON DELETE CASCADE,
    study_date  TEXT NOT NULL,
    state_json  TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    finished_at TEXT,
    minutes     INTEGER NOT NULL DEFAULT 0,
    UNIQUE (profile_id, study_date)
);
```

`backend/src/test/java/vn/ieltsapp/support/TestDb.java`:
```java
package vn.ieltsapp.support;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;

public final class TestDb {
    private static final List<String> TABLES_CHILD_FIRST = List.of(
            "study_session", "test_result", "exercise_attempt", "lesson_progress", "unit_progress",
            "review_log", "card", "exercise", "test", "lesson", "unit_word", "word", "profile",
            "unit", "stage");

    private TestDb() {}

    public static void clear(JdbcClient jdbc) {
        for (String table : TABLES_CHILD_FIRST) {
            jdbc.sql("DELETE FROM " + table).update();
        }
    }
}
```

Sửa `resetState()` trong `IntegrationTest`:
```java
    @BeforeEach
    void resetState() {
        TestDb.clear(jdbc);
        clock.set(LocalDate.of(2026, 10, 5));
    }
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=SchemaTest+HealthControllerTest`
Expected: PASS. Nếu context lỗi với thông báo `Unsupported Database: SQLite`, dừng lại và báo cáo (Flyway cần module riêng cho SQLite); không tự đoán tên artifact.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(backend): schema SQLite V1"
```

---

### Task 3: Thuật toán SM-2

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/vocab/Grade.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/CardState.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/Sm2.java`
- Test: `backend/src/test/java/vn/ieltsapp/vocab/Sm2Test.java`

**Interfaces:**
- Produces: `enum Grade { AGAIN, HARD, GOOD, EASY }` với `int quality()` (1, 3, 4, 5).
- Produces: `record CardState(double ease, int intervalDays, int repetitions, int lapses, LocalDate dueDate)`, `CardState.fresh(LocalDate today)`.
- Produces: `Sm2.schedule(CardState current, Grade grade, LocalDate today) → CardState`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/vocab/Sm2Test.java`:
```java
package vn.ieltsapp.vocab;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class Sm2Test {
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 5);

    @Test
    void firstGoodReviewSchedulesTomorrow() {
        CardState next = Sm2.schedule(CardState.fresh(TODAY), Grade.GOOD, TODAY);
        assertThat(next.intervalDays()).isEqualTo(1);
        assertThat(next.repetitions()).isEqualTo(1);
        assertThat(next.ease()).isCloseTo(2.5, within(1e-9));
        assertThat(next.dueDate()).isEqualTo(TODAY.plusDays(1));
    }

    @Test
    void secondGoodReviewSchedulesSixDays() {
        CardState s = new CardState(2.5, 1, 1, 0, TODAY);
        CardState next = Sm2.schedule(s, Grade.GOOD, TODAY);
        assertThat(next.intervalDays()).isEqualTo(6);
        assertThat(next.repetitions()).isEqualTo(2);
        assertThat(next.dueDate()).isEqualTo(TODAY.plusDays(6));
    }

    @Test
    void laterReviewsMultiplyByPreviousEase() {
        CardState s = new CardState(2.5, 6, 2, 0, TODAY);
        CardState next = Sm2.schedule(s, Grade.GOOD, TODAY);
        assertThat(next.intervalDays()).isEqualTo(15);
        assertThat(next.repetitions()).isEqualTo(3);
    }

    @Test
    void easyRaisesEaseAndHardLowersIt() {
        assertThat(Sm2.schedule(CardState.fresh(TODAY), Grade.EASY, TODAY).ease()).isCloseTo(2.6, within(1e-9));
        assertThat(Sm2.schedule(CardState.fresh(TODAY), Grade.HARD, TODAY).ease()).isCloseTo(2.36, within(1e-9));
    }

    @Test
    void againResetsRepetitionsAndCountsLapse() {
        CardState s = new CardState(2.5, 15, 3, 0, TODAY);
        CardState next = Sm2.schedule(s, Grade.AGAIN, TODAY);
        assertThat(next.repetitions()).isZero();
        assertThat(next.intervalDays()).isEqualTo(1);
        assertThat(next.lapses()).isEqualTo(1);
        assertThat(next.ease()).isCloseTo(1.96, within(1e-9));
        assertThat(next.dueDate()).isEqualTo(TODAY.plusDays(1));
    }

    @Test
    void easeNeverDropsBelowMinimum() {
        CardState s = new CardState(1.3, 1, 0, 5, TODAY);
        assertThat(Sm2.schedule(s, Grade.AGAIN, TODAY).ease()).isCloseTo(1.3, within(1e-9));
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=Sm2Test`
Expected: FAIL (lỗi biên dịch: chưa có `Sm2`, `CardState`, `Grade`).

- [ ] **Step 3: Viết code**

`backend/src/main/java/vn/ieltsapp/vocab/Grade.java`:
```java
package vn.ieltsapp.vocab;

public enum Grade {
    AGAIN(1), HARD(3), GOOD(4), EASY(5);

    private final int quality;

    Grade(int quality) { this.quality = quality; }

    public int quality() { return quality; }
}
```

`backend/src/main/java/vn/ieltsapp/vocab/CardState.java`:
```java
package vn.ieltsapp.vocab;

import java.time.LocalDate;

public record CardState(double ease, int intervalDays, int repetitions, int lapses, LocalDate dueDate) {
    public static final double DEFAULT_EASE = 2.5;

    public static CardState fresh(LocalDate today) {
        return new CardState(DEFAULT_EASE, 0, 0, 0, today);
    }
}
```

`backend/src/main/java/vn/ieltsapp/vocab/Sm2.java`:
```java
package vn.ieltsapp.vocab;

import java.time.LocalDate;

/** SM-2: khoảng ôn kế tiếp tính bằng ease TRƯỚC khi cập nhật. */
public final class Sm2 {
    static final double MIN_EASE = 1.3;

    private Sm2() {}

    public static CardState schedule(CardState current, Grade grade, LocalDate today) {
        int q = grade.quality();
        double ease = Math.max(MIN_EASE, current.ease() + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        if (q < 3) {
            return new CardState(ease, 1, 0, current.lapses() + 1, today.plusDays(1));
        }
        int interval = switch (current.repetitions()) {
            case 0 -> 1;
            case 1 -> 6;
            default -> (int) Math.round(current.intervalDays() * current.ease());
        };
        return new CardState(ease, interval, current.repetitions() + 1, current.lapses(), today.plusDays(interval));
    }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=Sm2Test`
Expected: PASS (6 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(vocab): thuật toán SM-2"
```

---

### Task 4: Hồ sơ (profile), PIN, hồ sơ đang dùng trong session

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/profile/Profile.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileDto.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/CreateProfileRequest.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/UpdateProfileRequest.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/SelectProfileRequest.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileCreatedEvent.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileService.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileController.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/CurrentProfileId.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/CurrentProfileIdResolver.java`
- Create: `backend/src/main/java/vn/ieltsapp/common/WebConfig.java`
- Modify: `backend/src/test/java/vn/ieltsapp/support/IntegrationTest.java` (thêm helper)
- Test: `backend/src/test/java/vn/ieltsapp/profile/ProfileApiTest.java`

**Interfaces:**
- Consumes: `ApiException`, bean `Clock`.
- Produces: `@CurrentProfileId long profileId` dùng làm tham số controller (401 `PROFILE_REQUIRED` nếu chưa chọn hồ sơ hoặc hồ sơ đã bị xóa).
- Produces: `record ProfileCreatedEvent(long profileId)` được publish trong `ProfileService.create`.
- Produces: `ProfileRepository.insert(String name, String avatar, String pinHash, int dailyMinutes, String voice, double speechRate, String createdAt) → long`, `findById(long) → Optional<Profile>`.
- Produces: `ProfileService.get(long id) → Profile`.
- Produces: helper test `postJson(String url, Object body, MockHttpSession s)`, `getAs(String url, MockHttpSession s)`, `newProfileSession(String name) → MockHttpSession`, `body(ResultActions) → JsonNode`.
- API: `GET /api/profiles`, `POST /api/profiles` (201), `POST /api/profiles/{id}/select` (204), `GET|PUT|DELETE /api/profiles/current`.

- [ ] **Step 1: Thêm helper vào `IntegrationTest`**

Thêm các import và phương thức sau vào `IntegrationTest`:
```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.ResultActions;
```
```java
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
```

- [ ] **Step 2: Viết test API (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/profile/ProfileApiTest.java`:
```java
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
```

- [ ] **Step 3: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=ProfileApiTest`
Expected: FAIL (lỗi biên dịch / 404).

- [ ] **Step 4: Viết code**

`profile/Profile.java`:
```java
package vn.ieltsapp.profile;

public record Profile(long id, String name, String avatar, String pinHash, int dailyMinutes,
                      String voice, double speechRate, String createdAt) {}
```

`profile/ProfileDto.java`:
```java
package vn.ieltsapp.profile;

public record ProfileDto(long id, String name, String avatar, boolean hasPin, int dailyMinutes,
                         String voice, double speechRate) {
    public static ProfileDto from(Profile p) {
        return new ProfileDto(p.id(), p.name(), p.avatar(), p.pinHash() != null, p.dailyMinutes(),
                p.voice(), p.speechRate());
    }
}
```

`profile/CreateProfileRequest.java`:
```java
package vn.ieltsapp.profile;

import jakarta.validation.constraints.*;

public record CreateProfileRequest(
        @NotBlank @Size(max = 30) String name,
        @Size(max = 16) String avatar,
        @Pattern(regexp = "\\d{4,6}", message = "PIN gồm 4–6 chữ số") String pin,
        @Min(10) @Max(240) Integer dailyMinutes,
        @Size(max = 100) String voice) {}
```

`profile/UpdateProfileRequest.java`:
```java
package vn.ieltsapp.profile;

import jakarta.validation.constraints.*;

/** Trường null = giữ nguyên. */
public record UpdateProfileRequest(
        @Pattern(regexp = ".*\\S.*", message = "không được để trống") @Size(max = 30) String name,
        @Size(max = 16) String avatar,
        @Pattern(regexp = "\\d{4,6}", message = "PIN gồm 4–6 chữ số") String pin,
        Boolean removePin,
        @Min(10) @Max(240) Integer dailyMinutes,
        @Size(max = 100) String voice,
        @DecimalMin("0.5") @DecimalMax("2.0") Double speechRate) {}
```

`profile/SelectProfileRequest.java`:
```java
package vn.ieltsapp.profile;

public record SelectProfileRequest(String pin) {}
```

`profile/ProfileCreatedEvent.java`:
```java
package vn.ieltsapp.profile;

public record ProfileCreatedEvent(long profileId) {}
```

`profile/ProfileRepository.java`:
```java
package vn.ieltsapp.profile;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {
    private static final RowMapper<Profile> MAPPER = (rs, n) -> new Profile(
            rs.getLong("id"), rs.getString("name"), rs.getString("avatar"), rs.getString("pin_hash"),
            rs.getInt("daily_minutes"), rs.getString("voice"), rs.getDouble("speech_rate"),
            rs.getString("created_at"));

    private final JdbcClient jdbc;

    public ProfileRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<Profile> findAll() {
        return jdbc.sql("SELECT * FROM profile ORDER BY id").query(MAPPER).list();
    }

    public Optional<Profile> findById(long id) {
        return jdbc.sql("SELECT * FROM profile WHERE id = ?").param(id).query(MAPPER).optional();
    }

    public long insert(String name, String avatar, String pinHash, int dailyMinutes, String voice,
                       double speechRate, String createdAt) {
        return jdbc.sql("""
                        INSERT INTO profile (name, avatar, pin_hash, daily_minutes, voice, speech_rate, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id""")
                .params(name, avatar, pinHash, dailyMinutes, voice, speechRate, createdAt)
                .query(Long.class).single();
    }

    public void update(Profile p) {
        jdbc.sql("""
                        UPDATE profile SET name = ?, avatar = ?, pin_hash = ?, daily_minutes = ?, voice = ?, speech_rate = ?
                        WHERE id = ?""")
                .params(p.name(), p.avatar(), p.pinHash(), p.dailyMinutes(), p.voice(), p.speechRate(), p.id())
                .update();
    }

    public void delete(long id) {
        jdbc.sql("DELETE FROM profile WHERE id = ?").param(id).update();
    }
}
```

`profile/ProfileService.java`:
```java
package vn.ieltsapp.profile;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;

@Service
public class ProfileService {
    private final ProfileRepository repo;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public ProfileService(ProfileRepository repo, ApplicationEventPublisher events, Clock clock) {
        this.repo = repo;
        this.events = events;
        this.clock = clock;
    }

    public List<ProfileDto> list() {
        return repo.findAll().stream().map(ProfileDto::from).toList();
    }

    public Profile get(long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("hồ sơ"));
    }

    @Transactional
    public ProfileDto create(CreateProfileRequest r) {
        long id = repo.insert(r.name().trim(), r.avatar(), hashPin(r.pin()),
                r.dailyMinutes() == null ? 30 : r.dailyMinutes(), r.voice(), 1.0,
                LocalDateTime.now(clock).toString());
        events.publishEvent(new ProfileCreatedEvent(id));
        return ProfileDto.from(get(id));
    }

    public void verifyPin(long id, String pin) {
        Profile p = get(id);
        if (p.pinHash() != null && (pin == null || !encoder.matches(pin, p.pinHash()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "PIN_INVALID", "Mã PIN không đúng");
        }
    }

    @Transactional
    public ProfileDto update(long id, UpdateProfileRequest r) {
        Profile p = get(id);
        String pinHash = p.pinHash();
        if (Boolean.TRUE.equals(r.removePin())) {
            pinHash = null;
        } else if (r.pin() != null) {
            pinHash = hashPin(r.pin());
        }
        Profile updated = new Profile(p.id(),
                r.name() != null ? r.name().trim() : p.name(),
                r.avatar() != null ? r.avatar() : p.avatar(),
                pinHash,
                r.dailyMinutes() != null ? r.dailyMinutes() : p.dailyMinutes(),
                r.voice() != null ? r.voice() : p.voice(),
                r.speechRate() != null ? r.speechRate() : p.speechRate(),
                p.createdAt());
        repo.update(updated);
        return ProfileDto.from(updated);
    }

    @Transactional
    public void delete(long id) {
        repo.delete(id);
    }

    private String hashPin(String pin) {
        return pin == null || pin.isBlank() ? null : encoder.encode(pin);
    }
}
```

`profile/CurrentProfileId.java`:
```java
package vn.ieltsapp.profile;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentProfileId {}
```

`profile/CurrentProfileIdResolver.java`:
```java
package vn.ieltsapp.profile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import vn.ieltsapp.common.ApiException;

public class CurrentProfileIdResolver implements HandlerMethodArgumentResolver {
    public static final String SESSION_KEY = "profileId";

    private final ProfileRepository profiles;

    public CurrentProfileIdResolver(ProfileRepository profiles) { this.profiles = profiles; }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentProfileId.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mav,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        HttpSession session = request == null ? null : request.getSession(false);
        Object id = session == null ? null : session.getAttribute(SESSION_KEY);
        if (id instanceof Long profileId && profiles.findById(profileId).isPresent()) {
            return profileId;
        }
        if (session != null) {
            session.removeAttribute(SESSION_KEY);
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "PROFILE_REQUIRED", "Chưa chọn hồ sơ");
    }
}
```

`common/WebConfig.java`:
```java
package vn.ieltsapp.common;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import vn.ieltsapp.profile.CurrentProfileIdResolver;
import vn.ieltsapp.profile.ProfileRepository;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final ProfileRepository profiles;

    public WebConfig(ProfileRepository profiles) { this.profiles = profiles; }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new CurrentProfileIdResolver(profiles));
    }
}
```

`profile/ProfileController.java`:
```java
package vn.ieltsapp.profile;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService service) { this.service = service; }

    @GetMapping
    public List<ProfileDto> list() { return service.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileDto create(@Valid @RequestBody CreateProfileRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/select")
    public ResponseEntity<Void> select(@PathVariable long id,
                                       @RequestBody(required = false) SelectProfileRequest request,
                                       HttpSession session) {
        service.verifyPin(id, request == null ? null : request.pin());
        session.setAttribute(CurrentProfileIdResolver.SESSION_KEY, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/current")
    public ProfileDto current(@CurrentProfileId long profileId) {
        return ProfileDto.from(service.get(profileId));
    }

    @PutMapping("/current")
    public ProfileDto update(@CurrentProfileId long profileId, @Valid @RequestBody UpdateProfileRequest request) {
        return service.update(profileId, request);
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> delete(@CurrentProfileId long profileId, HttpSession session) {
        service.delete(profileId);
        session.invalidate();
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 5: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=ProfileApiTest`
Expected: PASS (7 test).

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(profile): hồ sơ, PIN, chọn hồ sơ theo session"
```

---

### Task 5: Mô hình và kiểm tra file nội dung

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentModel.java`
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentValidator.java`
- Test: `backend/src/test/java/vn/ieltsapp/content/ContentValidatorTest.java`

**Interfaces:**
- Produces: các record lồng trong `ContentModel`: `StageFile(code, title, Double targetBand, Integer order, TestDef test)`, `UnitFile(code, stage, title, Integer order, List<WordDef> words, List<LessonDef> lessons, TestDef test)`, `WordDef(headword, pos, ipaUs, ipaUk, meaningVi, exampleEn, exampleVi, cefr, source)`, `LessonDef(code, type, day, title, bodyMd, List<ExerciseDef> exercises)`, `ExerciseDef(code, type, prompt, List<String> options, answer, explanationVi)`, `TestDef(code, kind, Double passRatio, List<ExerciseDef> exercises)`.
- Produces: `ContentValidator.validateStage(StageFile) → List<String>`, `ContentValidator.validateUnit(UnitFile, Set<String> knownStages) → List<String>`. Mỗi lỗi có dạng `"<đường dẫn>: <lý do>"`, ví dụ `lessons[0].exercises[1].answer: không nằm trong options`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/content/ContentValidatorTest.java`:
```java
package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.content.ContentModel.*;

class ContentValidatorTest {

    static ExerciseDef mcq(String code) {
        return new ExerciseDef(code, "MCQ", "She ___ to school.", List.of("go", "goes"), "goes", "ngôi 3 số ít");
    }

    static UnitFile validUnit() {
        return new UnitFile("S0-U01", "S0", "Unit 1", 1,
                List.of(new WordDef("hello", "exclamation", null, null, "xin chào", null, null, "A1", null)),
                List.of(new LessonDef("S0-U01-G1", "GRAMMAR", "MON", "Hiện tại đơn", "## Bài", List.of(mcq("S0-U01-G1-E1")))),
                new TestDef("S0-U01-T", "UNIT", 0.6, List.of(mcq("S0-U01-T-E1"))));
    }

    @Test
    void validUnitHasNoErrors() {
        assertThat(ContentValidator.validateUnit(validUnit(), Set.of("S0"))).isEmpty();
    }

    @Test
    void unknownStageIsReported() {
        assertThat(ContentValidator.validateUnit(validUnit(), Set.of()))
                .contains("stage: chặng 'S0' không tồn tại");
    }

    @Test
    void missingWordMeaningIsReported() {
        UnitFile u = validUnit();
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(),
                List.of(new WordDef("hello", "exclamation", null, null, " ", null, null, null, null)),
                u.lessons(), u.test());
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0"))).contains("words[0].meaningVi: bắt buộc");
    }

    @Test
    void answerMustBeAmongOptions() {
        UnitFile u = validUnit();
        ExerciseDef wrong = new ExerciseDef("S0-U01-G1-E1", "MCQ", "p", List.of("a", "b"), "c", null);
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", "GRAMMAR", "MON", "t", "b", List.of(wrong))), u.test());
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0")))
                .contains("lessons[0].exercises[0].answer: không nằm trong options");
    }

    @Test
    void duplicateCodesAndBadDayAreReported() {
        UnitFile u = validUnit();
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(),
                List.of(new LessonDef("S0-U01-G1", "GRAMMAR", "SUN", "t", "b", List.of(mcq("X1"), mcq("X1")))),
                u.test());
        List<String> errors = ContentValidator.validateUnit(bad, Set.of("S0"));
        assertThat(errors).contains("lessons[0].day: phải là MON..SAT", "lessons[0].exercises[1].code: trùng 'X1'");
    }

    @Test
    void duplicateWordsAndMissingTestAreReported() {
        UnitFile u = validUnit();
        WordDef w = u.words().get(0);
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), List.of(w, w), u.lessons(), null);
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0")))
                .contains("words[1]: trùng từ 'hello#exclamation'", "test: bắt buộc");
    }

    @Test
    void unitTestMustHaveUnitKind() {
        UnitFile u = validUnit();
        UnitFile bad = new UnitFile(u.code(), u.stage(), u.title(), u.order(), u.words(), u.lessons(),
                new TestDef("S0-U01-T", "STAGE", 0.6, List.of(mcq("S0-U01-T-E1"))));
        assertThat(ContentValidator.validateUnit(bad, Set.of("S0"))).contains("test.kind: phải là UNIT");
    }

    @Test
    void stageValidation() {
        StageFile ok = new StageFile("S0", "Xây nền", 4.0, 0,
                new TestDef("S0-T", "STAGE", 0.7, List.of(mcq("S0-T-E1"))));
        assertThat(ContentValidator.validateStage(ok)).isEmpty();

        StageFile bad = new StageFile("S0", "", null, 0, new TestDef("S0-T", "STAGE", 1.5, List.of()));
        assertThat(ContentValidator.validateStage(bad)).contains(
                "title: bắt buộc", "targetBand: bắt buộc", "test.passRatio: phải trong (0, 1]",
                "test.exercises: cần ít nhất 1 câu");
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=ContentValidatorTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`content/ContentModel.java`:
```java
package vn.ieltsapp.content;

import java.util.List;

public final class ContentModel {
    private ContentModel() {}

    public record StageFile(String code, String title, Double targetBand, Integer order, TestDef test) {}

    public record UnitFile(String code, String stage, String title, Integer order,
                           List<WordDef> words, List<LessonDef> lessons, TestDef test) {}

    public record WordDef(String headword, String pos, String ipaUs, String ipaUk, String meaningVi,
                          String exampleEn, String exampleVi, String cefr, String source) {}

    public record LessonDef(String code, String type, String day, String title, String bodyMd,
                            List<ExerciseDef> exercises) {}

    public record ExerciseDef(String code, String type, String prompt, List<String> options,
                              String answer, String explanationVi) {}

    public record TestDef(String code, String kind, Double passRatio, List<ExerciseDef> exercises) {}
}
```

`content/ContentValidator.java`:
```java
package vn.ieltsapp.content;

import java.util.*;
import vn.ieltsapp.common.WordCode;
import vn.ieltsapp.content.ContentModel.*;

public final class ContentValidator {
    static final Set<String> LESSON_TYPES = Set.of("GRAMMAR", "PRONUNCIATION", "READING", "LISTENING");
    static final Set<String> DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT");
    static final Set<String> EXERCISE_TYPES = Set.of("MCQ", "FILL", "MINIMAL_PAIR");
    static final Set<String> SOURCES = Set.of("OXFORD", "AWL", "USER");

    private ContentValidator() {}

    public static List<String> validateStage(StageFile f) {
        List<String> e = new ArrayList<>();
        required(e, "code", f.code());
        required(e, "title", f.title());
        if (f.targetBand() == null) e.add("targetBand: bắt buộc");
        if (f.order() == null) e.add("order: bắt buộc");
        if (f.test() != null) validateTest(e, "test", f.test(), "STAGE", new HashSet<>());
        return e;
    }

    public static List<String> validateUnit(UnitFile f, Set<String> knownStages) {
        List<String> e = new ArrayList<>();
        required(e, "code", f.code());
        required(e, "stage", f.stage());
        required(e, "title", f.title());
        if (f.order() == null) e.add("order: bắt buộc");
        if (f.stage() != null && !f.stage().isBlank() && !knownStages.contains(f.stage())) {
            e.add("stage: chặng '" + f.stage() + "' không tồn tại");
        }

        if (f.words() == null) {
            e.add("words: bắt buộc");
        } else {
            Set<String> wordCodes = new HashSet<>();
            for (int i = 0; i < f.words().size(); i++) {
                WordDef w = f.words().get(i);
                String p = "words[" + i + "]";
                required(e, p + ".headword", w.headword());
                required(e, p + ".pos", w.pos());
                required(e, p + ".meaningVi", w.meaningVi());
                if (w.source() != null && !SOURCES.contains(w.source())) e.add(p + ".source: không hợp lệ");
                if (notBlank(w.headword()) && notBlank(w.pos())) {
                    String code = WordCode.of(w.headword(), w.pos());
                    if (!wordCodes.add(code)) e.add(p + ": trùng từ '" + code + "'");
                }
            }
        }

        Set<String> codes = new HashSet<>();
        if (f.lessons() == null) {
            e.add("lessons: bắt buộc");
        } else {
            for (int i = 0; i < f.lessons().size(); i++) {
                LessonDef l = f.lessons().get(i);
                String p = "lessons[" + i + "]";
                uniqueCode(e, p + ".code", l.code(), codes);
                if (!LESSON_TYPES.contains(l.type())) e.add(p + ".type: không hợp lệ");
                if (!DAYS.contains(l.day())) e.add(p + ".day: phải là MON..SAT");
                required(e, p + ".title", l.title());
                required(e, p + ".bodyMd", l.bodyMd());
                List<ExerciseDef> xs = l.exercises() == null ? List.of() : l.exercises();
                for (int j = 0; j < xs.size(); j++) {
                    validateExercise(e, p + ".exercises[" + j + "]", xs.get(j), codes);
                }
            }
        }

        if (f.test() == null) {
            e.add("test: bắt buộc");
        } else {
            validateTest(e, "test", f.test(), "UNIT", codes);
        }
        return e;
    }

    private static void validateTest(List<String> e, String p, TestDef t, String kind, Set<String> codes) {
        uniqueCode(e, p + ".code", t.code(), codes);
        if (!kind.equals(t.kind())) e.add(p + ".kind: phải là " + kind);
        if (t.passRatio() != null && (t.passRatio() <= 0 || t.passRatio() > 1)) {
            e.add(p + ".passRatio: phải trong (0, 1]");
        }
        if (t.exercises() == null || t.exercises().isEmpty()) {
            e.add(p + ".exercises: cần ít nhất 1 câu");
            return;
        }
        for (int j = 0; j < t.exercises().size(); j++) {
            validateExercise(e, p + ".exercises[" + j + "]", t.exercises().get(j), codes);
        }
    }

    private static void validateExercise(List<String> e, String p, ExerciseDef x, Set<String> codes) {
        uniqueCode(e, p + ".code", x.code(), codes);
        if (!EXERCISE_TYPES.contains(x.type())) e.add(p + ".type: không hợp lệ");
        required(e, p + ".prompt", x.prompt());
        required(e, p + ".answer", x.answer());
        if ("MCQ".equals(x.type()) || "MINIMAL_PAIR".equals(x.type())) {
            if (x.options() == null || x.options().size() < 2) {
                e.add(p + ".options: cần ít nhất 2 lựa chọn");
            } else if (x.answer() != null && !x.options().contains(x.answer())) {
                e.add(p + ".answer: không nằm trong options");
            }
        }
    }

    private static void uniqueCode(List<String> e, String path, String code, Set<String> codes) {
        if (!notBlank(code)) {
            e.add(path + ": bắt buộc");
        } else if (!codes.add(code)) {
            e.add(path + ": trùng '" + code + "'");
        }
    }

    private static void required(List<String> e, String path, String value) {
        if (!notBlank(value)) e.add(path + ": bắt buộc");
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
```

`backend/src/main/java/vn/ieltsapp/common/WordCode.java`:
```java
package vn.ieltsapp.common;

import java.util.Locale;

public final class WordCode {
    private WordCode() {}

    /** Mã ổn định của một từ: "headword#pos", chữ thường. */
    public static String of(String headword, String pos) {
        return headword.trim().toLowerCase(Locale.ROOT) + "#" + pos.trim().toLowerCase(Locale.ROOT);
    }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=ContentValidatorTest`
Expected: PASS (8 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(content): mô hình và bộ kiểm tra file nội dung"
```

---

### Task 6: Import nội dung (ghi đè theo code), API import, nạp lúc khởi động

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentValidationException.java`
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentImporter.java`
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentService.java`
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentController.java`
- Create: `backend/src/main/java/vn/ieltsapp/content/ContentBootstrap.java`
- Create: `backend/src/test/resources/fixtures/stage-s0.json`
- Create: `backend/src/test/resources/fixtures/stage-s1.json`
- Create: `backend/src/test/resources/fixtures/unit-s0-u01.json`
- Create: `backend/src/test/resources/fixtures/unit-s0-u02.json`
- Create: `backend/src/test/resources/fixtures/unit-s1-u01.json`
- Modify: `backend/src/test/java/vn/ieltsapp/support/IntegrationTest.java` (thêm `importFixtures()`, `wordId()`)
- Test: `backend/src/test/java/vn/ieltsapp/content/ContentImportApiTest.java`

**Interfaces:**
- Consumes: `ContentModel.*`, `ContentValidator`, `WordCode.of`, `ApiException`.
- Produces: `ContentService.importFiles(List<ContentService.NamedContent>) → List<ContentService.ImportResult>`; `record NamedContent(String name, byte[] bytes)`; `record ImportResult(String file, boolean ok, List<String> errors)`.
- Produces: `POST /api/content/import` (multipart, field `files`) → `List<ImportResult>`.
- Produces: helper test `importFixtures()` và `wordId(String headword) → long`.
- Fixture (dùng ở mọi task sau): S0 có U01 (từ: hello, book, go; bài S0-U01-G1 GRAMMAR MON gồm 2 câu, S0-U01-P1 PRONUNCIATION TUE gồm 1 câu; bài kiểm tra S0-U01-T passRatio 0.5 gồm 2 câu) và U02 (từ: apple, run; bài S0-U02-G1 MON; kiểm tra S0-U02-T); S1 có U01 (từ: however; bài S1-U01-G1; kiểm tra S1-U01-T). Bài kiểm tra chặng: S0-T, S1-T.

- [ ] **Step 1: Tạo file fixture**

`backend/src/test/resources/fixtures/stage-s0.json`:
```json
{
  "code": "S0", "title": "Xây nền", "targetBand": 4.0, "order": 0,
  "test": {
    "code": "S0-T", "kind": "STAGE", "passRatio": 0.7,
    "exercises": [
      {"code": "S0-T-E1", "type": "MCQ", "prompt": "He ___ a teacher.", "options": ["am", "is", "are"], "answer": "is", "explanationVi": "He đi với is."},
      {"code": "S0-T-E2", "type": "FILL", "prompt": "I ___ (be) happy.", "answer": "am", "explanationVi": "I đi với am."}
    ]
  }
}
```

`backend/src/test/resources/fixtures/stage-s1.json`:
```json
{
  "code": "S1", "title": "Tiền IELTS", "targetBand": 5.0, "order": 1,
  "test": {
    "code": "S1-T", "kind": "STAGE", "passRatio": 0.7,
    "exercises": [
      {"code": "S1-T-E1", "type": "MCQ", "prompt": "The letter ___ yesterday.", "options": ["was sent", "sent"], "answer": "was sent", "explanationVi": "Câu bị động quá khứ."}
    ]
  }
}
```

`backend/src/test/resources/fixtures/unit-s0-u01.json`:
```json
{
  "code": "S0-U01", "stage": "S0", "title": "Chào hỏi & Thì hiện tại đơn", "order": 1,
  "words": [
    {"headword": "hello", "pos": "exclamation", "ipaUs": "/həˈloʊ/", "ipaUk": "/həˈləʊ/", "meaningVi": "xin chào", "exampleEn": "Hello, I'm Lan.", "exampleVi": "Xin chào, tôi là Lan.", "cefr": "A1"},
    {"headword": "book", "pos": "noun", "ipaUs": "/bʊk/", "ipaUk": "/bʊk/", "meaningVi": "quyển sách", "exampleEn": "This is my book.", "exampleVi": "Đây là quyển sách của tôi.", "cefr": "A1"},
    {"headword": "go", "pos": "verb", "ipaUs": "/ɡoʊ/", "ipaUk": "/ɡəʊ/", "meaningVi": "đi", "exampleEn": "I go to school.", "exampleVi": "Tôi đi học.", "cefr": "A1"}
  ],
  "lessons": [
    {
      "code": "S0-U01-G1", "type": "GRAMMAR", "day": "MON", "title": "Thì hiện tại đơn",
      "bodyMd": "## Thì hiện tại đơn\n\nDùng để nói về thói quen.",
      "exercises": [
        {"code": "S0-U01-G1-E1", "type": "MCQ", "prompt": "She ___ to school every day.", "options": ["go", "goes", "going"], "answer": "goes", "explanationVi": "Chủ ngữ ngôi thứ 3 số ít nên thêm -es."},
        {"code": "S0-U01-G1-E2", "type": "FILL", "prompt": "They ___ (play) football on Sundays.", "answer": "play", "explanationVi": "Chủ ngữ số nhiều giữ nguyên động từ."}
      ]
    },
    {
      "code": "S0-U01-P1", "type": "PRONUNCIATION", "day": "TUE", "title": "Âm /ɪ/ và /iː/",
      "bodyMd": "## /ɪ/ và /iː/",
      "exercises": [
        {"code": "S0-U01-P1-E1", "type": "MINIMAL_PAIR", "prompt": "ship", "options": ["ship", "sheep"], "answer": "ship", "explanationVi": "ship có âm /ɪ/ ngắn."}
      ]
    }
  ],
  "test": {
    "code": "S0-U01-T", "kind": "UNIT", "passRatio": 0.5,
    "exercises": [
      {"code": "S0-U01-T-E1", "type": "MCQ", "prompt": "He ___ a book.", "options": ["have", "has"], "answer": "has", "explanationVi": "He đi với has."},
      {"code": "S0-U01-T-E2", "type": "FILL", "prompt": "I ___ (go) to work by bus.", "answer": "go", "explanationVi": "I giữ nguyên động từ."}
    ]
  }
}
```

`backend/src/test/resources/fixtures/unit-s0-u02.json`:
```json
{
  "code": "S0-U02", "stage": "S0", "title": "Mạo từ a/an", "order": 2,
  "words": [
    {"headword": "apple", "pos": "noun", "ipaUs": "/ˈæp.əl/", "meaningVi": "quả táo", "exampleEn": "I eat an apple.", "cefr": "A1"},
    {"headword": "run", "pos": "verb", "ipaUs": "/rʌn/", "meaningVi": "chạy", "exampleEn": "I run every morning.", "cefr": "A1"}
  ],
  "lessons": [
    {
      "code": "S0-U02-G1", "type": "GRAMMAR", "day": "MON", "title": "Mạo từ a/an", "bodyMd": "## a/an",
      "exercises": [
        {"code": "S0-U02-G1-E1", "type": "MCQ", "prompt": "___ apple", "options": ["a", "an"], "answer": "an", "explanationVi": "apple bắt đầu bằng nguyên âm."}
      ]
    }
  ],
  "test": {
    "code": "S0-U02-T", "kind": "UNIT", "passRatio": 0.6,
    "exercises": [
      {"code": "S0-U02-T-E1", "type": "MCQ", "prompt": "I eat ___ apple.", "options": ["a", "an"], "answer": "an", "explanationVi": "apple bắt đầu bằng nguyên âm."}
    ]
  }
}
```

`backend/src/test/resources/fixtures/unit-s1-u01.json`:
```json
{
  "code": "S1-U01", "stage": "S1", "title": "Câu bị động", "order": 1,
  "words": [
    {"headword": "however", "pos": "adverb", "ipaUs": "/haʊˈev.ɚ/", "meaningVi": "tuy nhiên", "exampleEn": "However, it was late.", "cefr": "B1"}
  ],
  "lessons": [
    {
      "code": "S1-U01-G1", "type": "GRAMMAR", "day": "MON", "title": "Câu bị động", "bodyMd": "## Bị động",
      "exercises": [
        {"code": "S1-U01-G1-E1", "type": "FILL", "prompt": "The book ___ (write) in 1990.", "answer": "was written", "explanationVi": "Bị động quá khứ: was + V3."}
      ]
    }
  ],
  "test": {
    "code": "S1-U01-T", "kind": "UNIT", "passRatio": 0.6,
    "exercises": [
      {"code": "S1-U01-T-E1", "type": "FILL", "prompt": "The house ___ (build) last year.", "answer": "was built", "explanationVi": "Bị động quá khứ."}
    ]
  }
}
```

- [ ] **Step 2: Thêm helper vào `IntegrationTest`**

Thêm import:
```java
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import vn.ieltsapp.content.ContentService;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;
```
Thêm field và phương thức:
```java
    @Autowired protected ContentService contentService;

    protected static final List<String> FIXTURES = List.of(
            "stage-s0.json", "stage-s1.json", "unit-s0-u01.json", "unit-s0-u02.json", "unit-s1-u01.json");

    protected void importFixtures() throws Exception {
        List<NamedContent> files = new ArrayList<>();
        for (String name : FIXTURES) {
            files.add(new NamedContent(name, new ClassPathResource("fixtures/" + name).getContentAsByteArray()));
        }
        List<ImportResult> results = contentService.importFiles(files);
        assertThat(results).allMatch(ImportResult::ok, "fixtures import ok: " + results);
    }

    protected long wordId(String headword) {
        return jdbc.sql("SELECT id FROM word WHERE headword = ? AND profile_id IS NULL")
                .param(headword).query(Long.class).single();
    }
```

- [ ] **Step 3: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/content/ContentImportApiTest.java`:
```java
package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockMultipartFile;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;
import vn.ieltsapp.support.IntegrationTest;

class ContentImportApiTest extends IntegrationTest {

    private int count(String table) {
        return jdbc.sql("SELECT COUNT(*) FROM " + table).query(Integer.class).single();
    }

    private MockMultipartFile fixture(String name) throws Exception {
        return new MockMultipartFile("files", name, "application/json",
                new ClassPathResource("fixtures/" + name).getContentAsByteArray());
    }

    @Test
    void importsAllFixturesThroughApi() throws Exception {
        var request = multipart("/api/content/import");
        for (String name : FIXTURES) request.file(fixture(name));
        mvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[*].ok").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is(true))));

        assertThat(count("stage")).isEqualTo(2);
        assertThat(count("unit")).isEqualTo(3);
        assertThat(count("word")).isEqualTo(6);
        assertThat(count("lesson")).isEqualTo(4);
        assertThat(count("test")).isEqualTo(5);
        assertThat(count("exercise")).isEqualTo(12);
        String options = jdbc.sql("SELECT options_json FROM exercise WHERE code = 'S0-U01-G1-E1'")
                .query(String.class).single();
        assertThat(options).isEqualTo("[\"go\",\"goes\",\"going\"]");
    }

    @Test
    void reimportUpdatesContentAndKeepsLearnerProgress() throws Exception {
        importFixtures();
        newProfileSession("Thành");
        long profileId = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
        long hello = wordId("hello");
        jdbc.sql("INSERT INTO card VALUES (?, ?, 2.5, 6, 2, 0, '2026-10-11', '2026-10-05T09:00')")
                .params(profileId, hello).update();
        jdbc.sql("INSERT INTO lesson_progress VALUES (?, 'S0-U01-G1', 1.0, '2026-10-05T09:00')").param(profileId).update();
        // Từ Task 8 trở đi, tạo hồ sơ đã tự sinh dòng này, nên dùng OR REPLACE.
        jdbc.sql("INSERT OR REPLACE INTO unit_progress VALUES (?, 'S0-U01', 'ACTIVE', '2026-10-05T09:00', NULL)").param(profileId).update();

        String edited = new String(new ClassPathResource("fixtures/unit-s0-u01.json").getContentAsByteArray(),
                StandardCharsets.UTF_8).replace("\"xin chào\"", "\"chào bạn\"").replace("\"MON\"", "\"WED\"");
        List<ImportResult> results = contentService.importFiles(
                List.of(new NamedContent("unit-s0-u01.json", edited.getBytes(StandardCharsets.UTF_8))));

        assertThat(results.get(0).ok()).isTrue();
        assertThat(count("word")).isEqualTo(6);
        assertThat(jdbc.sql("SELECT meaning_vi FROM word WHERE id = ?").param(hello).query(String.class).single())
                .isEqualTo("chào bạn");
        assertThat(jdbc.sql("SELECT day FROM lesson WHERE code = 'S0-U01-G1'").query(String.class).single())
                .isEqualTo("WED");
        assertThat(count("card")).isEqualTo(1);
        assertThat(count("lesson_progress")).isEqualTo(1);
        assertThat(count("unit_progress")).isEqualTo(1);
    }

    @Test
    void invalidUnitIsRejectedAndNothingIsWritten() throws Exception {
        importFixtures();
        String bad = """
                {"code":"S0-U09","stage":"S0","title":"Lỗi","order":9,"words":[],
                 "lessons":[{"code":"S0-U09-G1","type":"GRAMMAR","day":"MON","title":"t","bodyMd":"b",
                   "exercises":[{"code":"S0-U09-E1","type":"MCQ","prompt":"p","options":["a","b"],"answer":"c"}]}],
                 "test":{"code":"S0-U09-T","kind":"UNIT","exercises":[{"code":"S0-U09-T1","type":"FILL","prompt":"p","answer":"a"}]}}
                """;
        List<ImportResult> results = contentService.importFiles(
                List.of(new NamedContent("bad.json", bad.getBytes(StandardCharsets.UTF_8))));

        assertThat(results.get(0).ok()).isFalse();
        assertThat(results.get(0).errors()).contains("lessons[0].exercises[0].answer: không nằm trong options");
        assertThat(jdbc.sql("SELECT COUNT(*) FROM unit WHERE code = 'S0-U09'").query(Integer.class).single()).isZero();
    }

    @Test
    void brokenJsonAndUnknownStageAreReported() {
        List<ImportResult> results = contentService.importFiles(List.of(
                new NamedContent("broken.json", "{ không phải json".getBytes(StandardCharsets.UTF_8)),
                new NamedContent("orphan.json", """
                        {"code":"S9-U01","stage":"S9","title":"x","order":1,"words":[],"lessons":[],
                         "test":{"code":"S9-U01-T","kind":"UNIT","exercises":[{"code":"S9-T1","type":"FILL","prompt":"p","answer":"a"}]}}
                        """.getBytes(StandardCharsets.UTF_8))));

        assertThat(results).hasSize(2);
        ImportResult broken = results.stream().filter(r -> r.file().equals("broken.json")).findFirst().orElseThrow();
        ImportResult orphan = results.stream().filter(r -> r.file().equals("orphan.json")).findFirst().orElseThrow();
        assertThat(broken.ok()).isFalse();
        assertThat(broken.errors().get(0)).startsWith("JSON không hợp lệ");
        assertThat(orphan.errors()).contains("stage: chặng 'S9' không tồn tại");
    }
}
```

- [ ] **Step 4: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=ContentImportApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 5: Viết code**

`content/ContentValidationException.java`:
```java
package vn.ieltsapp.content;

import java.util.List;
import org.springframework.http.HttpStatus;
import vn.ieltsapp.common.ApiException;

public class ContentValidationException extends ApiException {
    public ContentValidationException(List<String> errors) {
        super(HttpStatus.BAD_REQUEST, "CONTENT_INVALID", "Nội dung không hợp lệ", errors);
    }
}
```

`content/ContentRepository.java`:
```java
package vn.ieltsapp.content;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.ieltsapp.common.WordCode;
import vn.ieltsapp.content.ContentModel.*;

@Repository
public class ContentRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;

    public ContentRepository(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public Set<String> stageCodes() {
        return new HashSet<>(jdbc.sql("SELECT code FROM stage").query(String.class).list());
    }

    public void upsertStage(StageFile f) {
        jdbc.sql("""
                        INSERT INTO stage (code, title, target_band, sort_order) VALUES (?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET title = excluded.title,
                            target_band = excluded.target_band, sort_order = excluded.sort_order""")
                .params(f.code(), f.title(), f.targetBand(), f.order()).update();
    }

    public void upsertUnit(UnitFile f) {
        jdbc.sql("""
                        INSERT INTO unit (code, stage_code, title, sort_order) VALUES (?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET stage_code = excluded.stage_code,
                            title = excluded.title, sort_order = excluded.sort_order""")
                .params(f.code(), f.stage(), f.title(), f.order()).update();
    }

    public long upsertGlobalWord(WordDef w) {
        String code = WordCode.of(w.headword(), w.pos());
        String source = w.source() == null ? "OXFORD" : w.source();
        Optional<Long> existing = jdbc.sql("SELECT id FROM word WHERE code = ? AND profile_id IS NULL")
                .param(code).query(Long.class).optional();
        if (existing.isPresent()) {
            jdbc.sql("""
                            UPDATE word SET headword = ?, pos = ?, ipa_us = ?, ipa_uk = ?, meaning_vi = ?,
                                example_en = ?, example_vi = ?, cefr = ?, source = ?
                            WHERE id = ?""")
                    .params(w.headword().trim(), w.pos().trim(), w.ipaUs(), w.ipaUk(), w.meaningVi(),
                            w.exampleEn(), w.exampleVi(), w.cefr(), source, existing.get())
                    .update();
            return existing.get();
        }
        return jdbc.sql("""
                        INSERT INTO word (code, headword, pos, ipa_us, ipa_uk, meaning_vi, example_en, example_vi, cefr, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id""")
                .params(code, w.headword().trim(), w.pos().trim(), w.ipaUs(), w.ipaUk(), w.meaningVi(),
                        w.exampleEn(), w.exampleVi(), w.cefr(), source)
                .query(Long.class).single();
    }

    public void replaceUnitWords(String unitCode, List<Long> wordIds) {
        jdbc.sql("DELETE FROM unit_word WHERE unit_code = ?").param(unitCode).update();
        for (int i = 0; i < wordIds.size(); i++) {
            jdbc.sql("INSERT INTO unit_word (unit_code, word_id, sort_order) VALUES (?, ?, ?)")
                    .params(unitCode, wordIds.get(i), i + 1).update();
        }
    }

    public void upsertLesson(String unitCode, LessonDef l, int sortOrder) {
        jdbc.sql("""
                        INSERT INTO lesson (code, unit_code, type, day, title, body_md, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET unit_code = excluded.unit_code, type = excluded.type,
                            day = excluded.day, title = excluded.title, body_md = excluded.body_md,
                            sort_order = excluded.sort_order""")
                .params(l.code(), unitCode, l.type(), l.day(), l.title(), l.bodyMd(), sortOrder).update();
    }

    public void upsertTest(TestDef t, String unitCode, String stageCode) {
        double passRatio = t.passRatio() != null ? t.passRatio() : ("UNIT".equals(t.kind()) ? 0.6 : 0.7);
        jdbc.sql("""
                        INSERT INTO test (code, kind, unit_code, stage_code, pass_ratio) VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET kind = excluded.kind, unit_code = excluded.unit_code,
                            stage_code = excluded.stage_code, pass_ratio = excluded.pass_ratio""")
                .params(t.code(), t.kind(), unitCode, stageCode, passRatio).update();
    }

    public void upsertExercise(ExerciseDef x, String lessonCode, String testCode, int sortOrder) {
        jdbc.sql("""
                        INSERT INTO exercise (code, lesson_code, test_code, type, prompt, options_json, answer, explanation_vi, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET lesson_code = excluded.lesson_code,
                            test_code = excluded.test_code, type = excluded.type, prompt = excluded.prompt,
                            options_json = excluded.options_json, answer = excluded.answer,
                            explanation_vi = excluded.explanation_vi, sort_order = excluded.sort_order""")
                .params(x.code(), lessonCode, testCode, x.type(), x.prompt(), toJson(x.options()), x.answer(),
                        x.explanationVi(), sortOrder)
                .update();
    }

    private String toJson(List<String> options) {
        if (options == null) return null;
        try {
            return mapper.writeValueAsString(options);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
```

`content/ContentImporter.java`:
```java
package vn.ieltsapp.content;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.content.ContentModel.*;

@Service
public class ContentImporter {
    private final ContentRepository repo;

    public ContentImporter(ContentRepository repo) { this.repo = repo; }

    @Transactional
    public void importStage(StageFile f) {
        List<String> errors = ContentValidator.validateStage(f);
        if (!errors.isEmpty()) throw new ContentValidationException(errors);
        repo.upsertStage(f);
        if (f.test() != null) importTest(f.test(), null, f.code());
    }

    @Transactional
    public void importUnit(UnitFile f) {
        List<String> errors = ContentValidator.validateUnit(f, repo.stageCodes());
        if (!errors.isEmpty()) throw new ContentValidationException(errors);
        repo.upsertUnit(f);
        repo.replaceUnitWords(f.code(), f.words().stream().map(repo::upsertGlobalWord).toList());
        for (int i = 0; i < f.lessons().size(); i++) {
            LessonDef lesson = f.lessons().get(i);
            repo.upsertLesson(f.code(), lesson, i + 1);
            List<ExerciseDef> exercises = lesson.exercises() == null ? List.of() : lesson.exercises();
            for (int j = 0; j < exercises.size(); j++) {
                repo.upsertExercise(exercises.get(j), lesson.code(), null, j + 1);
            }
        }
        importTest(f.test(), f.code(), null);
    }

    private void importTest(TestDef t, String unitCode, String stageCode) {
        repo.upsertTest(t, unitCode, stageCode);
        for (int j = 0; j < t.exercises().size(); j++) {
            repo.upsertExercise(t.exercises().get(j), null, t.code(), j + 1);
        }
    }
}
```

`content/ContentService.java`:
```java
package vn.ieltsapp.content;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.content.ContentModel.StageFile;
import vn.ieltsapp.content.ContentModel.UnitFile;

@Service
public class ContentService {
    public record NamedContent(String name, byte[] bytes) {}

    public record ImportResult(String file, boolean ok, List<String> errors) {}

    private record Parsed(NamedContent source, JsonNode node, String error) {
        boolean isStage() { return node != null && node.has("targetBand"); }
    }

    private final ContentImporter importer;
    private final ObjectMapper mapper;

    public ContentService(ContentImporter importer, ObjectMapper mapper) {
        this.importer = importer;
        this.mapper = mapper;
    }

    /** Mỗi file một transaction; file chặng được nạp trước file unit. */
    public List<ImportResult> importFiles(List<NamedContent> files) {
        List<Parsed> parsed = new ArrayList<>(files.stream().map(this::parse).toList());
        parsed.sort(Comparator.comparing((Parsed p) -> !p.isStage()).thenComparing(p -> p.source().name()));

        List<ImportResult> results = new ArrayList<>();
        for (Parsed p : parsed) {
            String name = p.source().name();
            if (p.error() != null) {
                results.add(new ImportResult(name, false, List.of(p.error())));
                continue;
            }
            try {
                if (p.isStage()) {
                    importer.importStage(mapper.treeToValue(p.node(), StageFile.class));
                } else {
                    importer.importUnit(mapper.treeToValue(p.node(), UnitFile.class));
                }
                results.add(new ImportResult(name, true, List.of()));
            } catch (ApiException e) {
                results.add(new ImportResult(name, false,
                        e.getDetails().isEmpty() ? List.of(e.getMessage()) : e.getDetails()));
            } catch (JsonProcessingException e) {
                results.add(new ImportResult(name, false, List.of("Sai cấu trúc: " + e.getOriginalMessage())));
            }
        }
        return results;
    }

    private Parsed parse(NamedContent file) {
        try {
            JsonNode node = mapper.readTree(file.bytes());
            if (node == null || !node.isObject()) {
                return new Parsed(file, null, "JSON không hợp lệ: không phải một đối tượng JSON");
            }
            return new Parsed(file, node, null);
        } catch (IOException e) {
            return new Parsed(file, null, "JSON không hợp lệ: " + e.getMessage());
        }
    }
}
```

`content/ContentController.java`:
```java
package vn.ieltsapp.content;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;

@RestController
public class ContentController {
    private final ContentService service;

    public ContentController(ContentService service) { this.service = service; }

    @PostMapping(path = "/api/content/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<ImportResult> importFiles(@RequestParam("files") List<MultipartFile> files) throws IOException {
        List<NamedContent> contents = new ArrayList<>();
        for (MultipartFile f : files) {
            contents.add(new NamedContent(f.getOriginalFilename(), f.getBytes()));
        }
        return service.importFiles(contents);
    }
}
```

`content/ContentBootstrap.java`:
```java
package vn.ieltsapp.content;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;

/** Nạp lại nội dung đóng gói kèm app mỗi lần khởi động (ghi đè theo code nên không trùng). */
@Component
@Order(1)
@ConditionalOnProperty(name = "app.content.bootstrap", havingValue = "true")
public class ContentBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ContentBootstrap.class);

    private final ContentService service;

    public ContentBootstrap(ContentService service) { this.service = service; }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        Resource[] resources = new PathMatchingResourcePatternResolver().getResources("classpath*:content/**/*.json");
        List<NamedContent> files = new ArrayList<>();
        for (Resource r : resources) {
            try (InputStream in = r.getInputStream()) {
                files.add(new NamedContent(r.getURI().toString(), in.readAllBytes()));
            }
        }
        for (ImportResult result : service.importFiles(files)) {
            if (!result.ok()) {
                log.warn("Nội dung lỗi {}: {}", result.file(), result.errors());
            }
        }
        log.info("Đã nạp {} file nội dung", files.size());
    }
}
```

- [ ] **Step 6: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=ContentImportApiTest+ContentValidatorTest`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend
git commit -m "feat(content): import nội dung JSON, API import, nạp khi khởi động"
```

---

### Task 7: Từ vựng, thẻ, kho từ

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/vocab/WordDto.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/WordBankItem.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/WordStatus.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/AddWordRequest.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/ReviewRequest.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/VocabRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/VocabService.java`
- Create: `backend/src/main/java/vn/ieltsapp/vocab/VocabController.java`
- Test: `backend/src/test/java/vn/ieltsapp/vocab/VocabApiTest.java`

**Interfaces:**
- Consumes: `Sm2`, `CardState`, `Grade`, `WordCode.of`, `@CurrentProfileId`, `Clock`.
- Produces: `record WordDto(long id, String headword, String pos, String ipaUs, String ipaUk, String meaningVi, String exampleEn, String exampleVi, String cefr, String source)`.
- Produces (`VocabService`): `CardState review(long profileId, long wordId, Grade grade)`, `WordDto findWord(long profileId, long wordId)`, `List<WordDto> words(List<Long> ids)` (giữ thứ tự), `List<Long> dueWordIds(long profileId, LocalDate day, int limit)`, `int countDue(long profileId, LocalDate day)`, `List<Long> unlearnedWordIds(long profileId, String unitCode, int limit)`.
- Produces: `record ReviewRequest(@NotNull Grade grade)`.
- API: `POST /api/cards/{wordId}/review`, `GET /api/cards/due?limit=`, `GET /api/words?q=&status=`, `POST /api/words` (201, trùng → 409 `WORD_EXISTS`).

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/vocab/VocabApiTest.java`:
```java
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
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=VocabApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`vocab/WordDto.java`:
```java
package vn.ieltsapp.vocab;

public record WordDto(long id, String headword, String pos, String ipaUs, String ipaUk, String meaningVi,
                      String exampleEn, String exampleVi, String cefr, String source) {}
```

`vocab/WordBankItem.java`:
```java
package vn.ieltsapp.vocab;

public record WordBankItem(WordDto word, String status, String dueDate) {}
```

`vocab/WordStatus.java`:
```java
package vn.ieltsapp.vocab;

public enum WordStatus { NEW, LEARNING, KNOWN }
```

`vocab/AddWordRequest.java`:
```java
package vn.ieltsapp.vocab;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddWordRequest(
        @NotBlank @Size(max = 60) String headword,
        @NotBlank @Size(max = 30) String pos,
        @Size(max = 60) String ipaUs,
        @NotBlank @Size(max = 200) String meaningVi,
        @Size(max = 300) String exampleEn,
        @Size(max = 300) String exampleVi) {}
```

`vocab/ReviewRequest.java`:
```java
package vn.ieltsapp.vocab;

import jakarta.validation.constraints.NotNull;

public record ReviewRequest(@NotNull Grade grade) {}
```

`vocab/VocabRepository.java`:
```java
package vn.ieltsapp.vocab;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class VocabRepository {
    static final RowMapper<WordDto> WORD = (rs, n) -> new WordDto(rs.getLong("id"), rs.getString("headword"),
            rs.getString("pos"), rs.getString("ipa_us"), rs.getString("ipa_uk"), rs.getString("meaning_vi"),
            rs.getString("example_en"), rs.getString("example_vi"), rs.getString("cefr"), rs.getString("source"));

    private final JdbcClient jdbc;

    public VocabRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<WordDto> findWord(long profileId, long wordId) {
        return jdbc.sql("SELECT * FROM word WHERE id = ? AND (profile_id IS NULL OR profile_id = ?)")
                .params(wordId, profileId).query(WORD).optional();
    }

    public List<WordDto> findWords(List<Long> ids) {
        if (ids.isEmpty()) return List.of();
        Map<Long, WordDto> byId = jdbc.sql("SELECT * FROM word WHERE id IN (:ids)").param("ids", ids)
                .query(WORD).list().stream().collect(Collectors.toMap(WordDto::id, Function.identity()));
        return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
    }

    public Optional<CardState> findCard(long profileId, long wordId) {
        return jdbc.sql("SELECT * FROM card WHERE profile_id = ? AND word_id = ?").params(profileId, wordId)
                .query((rs, n) -> new CardState(rs.getDouble("ease"), rs.getInt("interval_days"),
                        rs.getInt("repetitions"), rs.getInt("lapses"), LocalDate.parse(rs.getString("due_date"))))
                .optional();
    }

    public void saveCard(long profileId, long wordId, CardState s, String now) {
        jdbc.sql("""
                        INSERT INTO card (profile_id, word_id, ease, interval_days, repetitions, lapses, due_date, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (profile_id, word_id) DO UPDATE SET ease = excluded.ease,
                            interval_days = excluded.interval_days, repetitions = excluded.repetitions,
                            lapses = excluded.lapses, due_date = excluded.due_date""")
                .params(profileId, wordId, s.ease(), s.intervalDays(), s.repetitions(), s.lapses(),
                        s.dueDate().toString(), now)
                .update();
    }

    public void logReview(long profileId, long wordId, Grade grade, int prevInterval, int newInterval, String now) {
        jdbc.sql("""
                        INSERT INTO review_log (profile_id, word_id, grade, prev_interval, new_interval, reviewed_at)
                        VALUES (?, ?, ?, ?, ?, ?)""")
                .params(profileId, wordId, grade.name(), prevInterval, newInterval, now).update();
    }

    public List<Long> dueWordIds(long profileId, LocalDate day, int limit) {
        return jdbc.sql("""
                        SELECT word_id FROM card WHERE profile_id = ? AND due_date <= ?
                        ORDER BY due_date, word_id LIMIT ?""")
                .params(profileId, day.toString(), limit).query(Long.class).list();
    }

    public int countDue(long profileId, LocalDate day) {
        return jdbc.sql("SELECT COUNT(*) FROM card WHERE profile_id = ? AND due_date <= ?")
                .params(profileId, day.toString()).query(Integer.class).single();
    }

    public List<Long> unlearnedWordIds(long profileId, String unitCode, int limit) {
        return jdbc.sql("""
                        SELECT uw.word_id FROM unit_word uw
                        WHERE uw.unit_code = ?
                          AND NOT EXISTS (SELECT 1 FROM card c WHERE c.profile_id = ? AND c.word_id = uw.word_id)
                        ORDER BY uw.sort_order LIMIT ?""")
                .params(unitCode, profileId, limit).query(Long.class).list();
    }

    public List<WordBankItem> search(long profileId, String like, String status) {
        return jdbc.sql("""
                        SELECT * FROM (
                            SELECT w.*, c.due_date,
                                   CASE WHEN c.word_id IS NULL THEN 'NEW'
                                        WHEN c.interval_days >= 21 THEN 'KNOWN'
                                        ELSE 'LEARNING' END AS status
                            FROM word w
                            LEFT JOIN card c ON c.word_id = w.id AND c.profile_id = :pid
                            WHERE (w.profile_id IS NULL OR w.profile_id = :pid)
                              AND (:like IS NULL OR w.headword LIKE :like OR w.meaning_vi LIKE :like)
                        )
                        WHERE (:status IS NULL OR status = :status)
                        ORDER BY headword LIMIT 200""")
                .param("pid", profileId).param("like", like).param("status", status)
                .query((rs, n) -> new WordBankItem(WORD.mapRow(rs, n), rs.getString("status"), rs.getString("due_date")))
                .list();
    }

    public boolean wordCodeVisible(long profileId, String code) {
        return jdbc.sql("SELECT COUNT(*) FROM word WHERE code = ? AND (profile_id IS NULL OR profile_id = ?)")
                .params(code, profileId).query(Integer.class).single() > 0;
    }

    public long insertUserWord(long profileId, String code, AddWordRequest r) {
        return jdbc.sql("""
                        INSERT INTO word (code, headword, pos, ipa_us, meaning_vi, example_en, example_vi, source, profile_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'USER', ?) RETURNING id""")
                .params(code, r.headword().trim(), r.pos().trim(), r.ipaUs(), r.meaningVi(), r.exampleEn(),
                        r.exampleVi(), profileId)
                .query(Long.class).single();
    }
}
```

`vocab/VocabService.java`:
```java
package vn.ieltsapp.vocab;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.common.WordCode;

@Service
public class VocabService {
    private final VocabRepository repo;
    private final Clock clock;

    public VocabService(VocabRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    @Transactional
    public CardState review(long profileId, long wordId, Grade grade) {
        findWord(profileId, wordId);
        LocalDate today = LocalDate.now(clock);
        CardState previous = repo.findCard(profileId, wordId).orElse(CardState.fresh(today));
        CardState next = Sm2.schedule(previous, grade, today);
        String now = LocalDateTime.now(clock).toString();
        repo.saveCard(profileId, wordId, next, now);
        repo.logReview(profileId, wordId, grade, previous.intervalDays(), next.intervalDays(), now);
        return next;
    }

    public WordDto findWord(long profileId, long wordId) {
        return repo.findWord(profileId, wordId).orElseThrow(() -> ApiException.notFound("từ"));
    }

    public List<WordDto> words(List<Long> ids) { return repo.findWords(ids); }

    public List<Long> dueWordIds(long profileId, LocalDate day, int limit) {
        return repo.dueWordIds(profileId, day, limit);
    }

    public int countDue(long profileId, LocalDate day) { return repo.countDue(profileId, day); }

    public List<Long> unlearnedWordIds(long profileId, String unitCode, int limit) {
        return repo.unlearnedWordIds(profileId, unitCode, limit);
    }

    public List<WordDto> dueCards(long profileId, int limit) {
        return words(dueWordIds(profileId, LocalDate.now(clock), limit));
    }

    public List<WordBankItem> search(long profileId, String q, WordStatus status) {
        String like = q == null || q.isBlank() ? null : "%" + q.trim() + "%";
        return repo.search(profileId, like, status == null ? null : status.name());
    }

    @Transactional
    public WordDto addUserWord(long profileId, AddWordRequest r) {
        String code = WordCode.of(r.headword(), r.pos());
        if (repo.wordCodeVisible(profileId, code)) {
            throw new ApiException(HttpStatus.CONFLICT, "WORD_EXISTS", "Từ này đã có trong kho");
        }
        return findWord(profileId, repo.insertUserWord(profileId, code, r));
    }
}
```

`vocab/VocabController.java`:
```java
package vn.ieltsapp.vocab;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
@RequestMapping("/api")
public class VocabController {
    private final VocabService service;

    public VocabController(VocabService service) { this.service = service; }

    @PostMapping("/cards/{wordId}/review")
    public CardState review(@CurrentProfileId long profileId, @PathVariable long wordId,
                            @Valid @RequestBody ReviewRequest request) {
        return service.review(profileId, wordId, request.grade());
    }

    @GetMapping("/cards/due")
    public List<WordDto> due(@CurrentProfileId long profileId, @RequestParam(defaultValue = "60") int limit) {
        return service.dueCards(profileId, Math.max(1, Math.min(limit, 200)));
    }

    @GetMapping("/words")
    public List<WordBankItem> search(@CurrentProfileId long profileId, @RequestParam(required = false) String q,
                                     @RequestParam(required = false) WordStatus status) {
        return service.search(profileId, q, status);
    }

    @PostMapping("/words")
    @ResponseStatus(HttpStatus.CREATED)
    public WordDto add(@CurrentProfileId long profileId, @Valid @RequestBody AddWordRequest request) {
        return service.addUserWord(profileId, request);
    }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=VocabApiTest`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(vocab): thẻ SM-2, thẻ đến hạn, kho từ, từ tự thêm"
```

---

### Task 8: Lộ trình (chặng/unit, mở khóa)

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/roadmap/StageRow.java`
- Create: `backend/src/main/java/vn/ieltsapp/roadmap/UnitRow.java`
- Create: `backend/src/main/java/vn/ieltsapp/roadmap/RoadmapView.java`
- Create: `backend/src/main/java/vn/ieltsapp/roadmap/RoadmapRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/roadmap/RoadmapService.java`
- Create: `backend/src/main/java/vn/ieltsapp/roadmap/RoadmapController.java`
- Test: `backend/src/test/java/vn/ieltsapp/roadmap/RoadmapTest.java`

**Interfaces:**
- Consumes: `ProfileCreatedEvent`, `ApiException`, `Clock`.
- Produces: `record StageRow(String code, String title, double targetBand, int sortOrder)`, `record UnitRow(String code, String stageCode, String title, int sortOrder)`.
- Produces (`RoadmapService`): `Optional<UnitRow> currentUnit(long profileId)`, `void requireUnitOpen(long profileId, String unitCode)` (403 `UNIT_LOCKED`), `boolean stageUnitsDone(long profileId, String stageCode)`, `void onUnitTestPassed(long profileId, String unitCode)`, `void onStageTestPassed(long profileId, String stageCode)`, `RoadmapView view(long profileId)`.
- Produces: `record RoadmapView(List<StageView> stages)`, gồm `StageView(code, title, targetBand, status, boolean testAvailable, List<UnitView> units)` và `UnitView(code, title, status)`. Trạng thái: `LOCKED | ACTIVE | DONE`.
- API: `GET /api/roadmap`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/roadmap/RoadmapTest.java`:
```java
package vn.ieltsapp.roadmap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.support.IntegrationTest;

class RoadmapTest extends IntegrationTest {
    @Autowired RoadmapService roadmap;
    MockHttpSession session;
    long pid;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
        pid = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
    }

    private String status(String unit) {
        return roadmap.view(pid).stages().stream().flatMap(s -> s.units().stream())
                .filter(u -> u.code().equals(unit)).findFirst().orElseThrow().status();
    }

    @Test
    void newProfileStartsAtFirstUnit() throws Exception {
        assertThat(roadmap.currentUnit(pid)).map(UnitRow::code).contains("S0-U01");
        assertThat(status("S0-U02")).isEqualTo("LOCKED");
        getAs("/api/roadmap", session)
                .andExpect(jsonPath("$.stages[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.stages[0].units[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.stages[1].status").value("LOCKED"));
    }

    @Test
    void lockedUnitIsRejected() {
        assertThatThrownBy(() -> roadmap.requireUnitOpen(pid, "S0-U02"))
                .isInstanceOf(ApiException.class)
                .extracting("code").isEqualTo("UNIT_LOCKED");
    }

    @Test
    void passingUnitTestsUnlocksNextUnitThenStageTest() {
        roadmap.onUnitTestPassed(pid, "S0-U01");
        assertThat(status("S0-U01")).isEqualTo("DONE");
        assertThat(status("S0-U02")).isEqualTo("ACTIVE");
        assertThat(roadmap.stageUnitsDone(pid, "S0")).isFalse();

        roadmap.onUnitTestPassed(pid, "S0-U02");
        assertThat(roadmap.stageUnitsDone(pid, "S0")).isTrue();
        assertThat(roadmap.view(pid).stages().get(0).testAvailable()).isTrue();
        assertThat(status("S1-U01")).isEqualTo("LOCKED");
        assertThat(roadmap.currentUnit(pid)).isEmpty();

        roadmap.onStageTestPassed(pid, "S0");
        assertThat(status("S1-U01")).isEqualTo("ACTIVE");
    }

    @Test
    void repassingDoneUnitKeepsItDone() {
        roadmap.onUnitTestPassed(pid, "S0-U01");
        roadmap.onUnitTestPassed(pid, "S0-U01");
        assertThat(status("S0-U01")).isEqualTo("DONE");
        assertThat(status("S0-U02")).isEqualTo("ACTIVE");
    }

    @Test
    void profileCreatedBeforeContentStartsLazily() throws Exception {
        jdbc.sql("DELETE FROM unit_progress").update();
        assertThat(roadmap.currentUnit(pid)).map(UnitRow::code).contains("S0-U01");
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=RoadmapTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`roadmap/StageRow.java`:
```java
package vn.ieltsapp.roadmap;

public record StageRow(String code, String title, double targetBand, int sortOrder) {}
```

`roadmap/UnitRow.java`:
```java
package vn.ieltsapp.roadmap;

public record UnitRow(String code, String stageCode, String title, int sortOrder) {}
```

`roadmap/RoadmapView.java`:
```java
package vn.ieltsapp.roadmap;

import java.util.List;

public record RoadmapView(List<StageView> stages) {
    public record StageView(String code, String title, double targetBand, String status,
                            boolean testAvailable, List<UnitView> units) {}

    public record UnitView(String code, String title, String status) {}
}
```

`roadmap/RoadmapRepository.java`:
```java
package vn.ieltsapp.roadmap;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class RoadmapRepository {
    private final JdbcClient jdbc;

    public RoadmapRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<StageRow> stages() {
        return jdbc.sql("SELECT * FROM stage ORDER BY sort_order")
                .query((rs, n) -> new StageRow(rs.getString("code"), rs.getString("title"),
                        rs.getDouble("target_band"), rs.getInt("sort_order")))
                .list();
    }

    public List<UnitRow> units() {
        return jdbc.sql("""
                        SELECT u.* FROM unit u JOIN stage s ON s.code = u.stage_code
                        ORDER BY s.sort_order, u.sort_order""")
                .query((rs, n) -> new UnitRow(rs.getString("code"), rs.getString("stage_code"),
                        rs.getString("title"), rs.getInt("sort_order")))
                .list();
    }

    public Map<String, String> unitStatuses(long profileId) {
        Map<String, String> result = new HashMap<>();
        jdbc.sql("SELECT unit_code, status FROM unit_progress WHERE profile_id = ?").param(profileId)
                .query(rs -> { result.put(rs.getString("unit_code"), rs.getString("status")); });
        return result;
    }

    public void setUnitStatus(long profileId, String unitCode, String status, String now) {
        jdbc.sql("""
                        INSERT INTO unit_progress (profile_id, unit_code, status, started_at, completed_at)
                        VALUES (:pid, :unit, :status, :now, CASE WHEN :status = 'DONE' THEN :now END)
                        ON CONFLICT (profile_id, unit_code) DO UPDATE SET
                            status = excluded.status,
                            completed_at = COALESCE(excluded.completed_at, unit_progress.completed_at)""")
                .param("pid", profileId).param("unit", unitCode).param("status", status).param("now", now)
                .update();
    }

    public Set<String> passedStageTests(long profileId) {
        return new HashSet<>(jdbc.sql("""
                        SELECT DISTINCT t.stage_code FROM test_result r JOIN test t ON t.code = r.test_code
                        WHERE r.profile_id = ? AND r.passed = 1 AND t.kind = 'STAGE'""")
                .param(profileId).query(String.class).list());
    }
}
```

`roadmap/RoadmapService.java`:
```java
package vn.ieltsapp.roadmap;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.profile.ProfileCreatedEvent;
import vn.ieltsapp.roadmap.RoadmapView.StageView;
import vn.ieltsapp.roadmap.RoadmapView.UnitView;

@Service
public class RoadmapService {
    static final String LOCKED = "LOCKED", ACTIVE = "ACTIVE", DONE = "DONE";

    private final RoadmapRepository repo;
    private final Clock clock;

    public RoadmapService(RoadmapRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    @EventListener
    public void onProfileCreated(ProfileCreatedEvent event) {
        statuses(event.profileId());
    }

    /** Trạng thái các unit; tự mở unit đầu tiên nếu hồ sơ chưa có tiến độ nào. */
    public Map<String, String> statuses(long profileId) {
        Map<String, String> statuses = repo.unitStatuses(profileId);
        if (statuses.isEmpty()) {
            Optional<UnitRow> first = repo.units().stream().findFirst();
            if (first.isPresent()) {
                repo.setUnitStatus(profileId, first.get().code(), ACTIVE, now());
                statuses = repo.unitStatuses(profileId);
            }
        }
        return statuses;
    }

    public Optional<UnitRow> currentUnit(long profileId) {
        Map<String, String> s = statuses(profileId);
        return repo.units().stream().filter(u -> ACTIVE.equals(s.get(u.code()))).findFirst();
    }

    public void requireUnitOpen(long profileId, String unitCode) {
        if (LOCKED.equals(statuses(profileId).getOrDefault(unitCode, LOCKED))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNIT_LOCKED", "Unit này chưa được mở khóa");
        }
    }

    public boolean stageUnitsDone(long profileId, String stageCode) {
        Map<String, String> s = statuses(profileId);
        List<UnitRow> units = repo.units().stream().filter(u -> u.stageCode().equals(stageCode)).toList();
        return !units.isEmpty() && units.stream().allMatch(u -> DONE.equals(s.get(u.code())));
    }

    @Transactional
    public void onUnitTestPassed(long profileId, String unitCode) {
        Map<String, String> s = statuses(profileId);
        repo.setUnitStatus(profileId, unitCode, DONE, now());
        List<UnitRow> all = repo.units();
        UnitRow unit = all.stream().filter(u -> u.code().equals(unitCode)).findFirst()
                .orElseThrow(() -> ApiException.notFound("unit"));
        List<UnitRow> sameStage = all.stream().filter(u -> u.stageCode().equals(unit.stageCode())).toList();
        int index = sameStage.indexOf(unit);
        if (index + 1 < sameStage.size()) {
            activateIfLocked(profileId, sameStage.get(index + 1).code(), s);
        }
    }

    @Transactional
    public void onStageTestPassed(long profileId, String stageCode) {
        Map<String, String> s = statuses(profileId);
        List<StageRow> stages = repo.stages();
        for (int i = 0; i < stages.size() - 1; i++) {
            if (stages.get(i).code().equals(stageCode)) {
                String nextStage = stages.get(i + 1).code();
                repo.units().stream().filter(u -> u.stageCode().equals(nextStage)).findFirst()
                        .ifPresent(u -> activateIfLocked(profileId, u.code(), s));
                return;
            }
        }
    }

    public RoadmapView view(long profileId) {
        Map<String, String> s = statuses(profileId);
        Set<String> passed = repo.passedStageTests(profileId);
        List<UnitRow> units = repo.units();
        List<StageView> stages = repo.stages().stream().map(stage -> {
            List<UnitView> unitViews = units.stream().filter(u -> u.stageCode().equals(stage.code()))
                    .map(u -> new UnitView(u.code(), u.title(), s.getOrDefault(u.code(), LOCKED))).toList();
            String status = passed.contains(stage.code()) ? DONE
                    : unitViews.stream().anyMatch(u -> !LOCKED.equals(u.status())) ? ACTIVE : LOCKED;
            boolean testAvailable = !unitViews.isEmpty()
                    && unitViews.stream().allMatch(u -> DONE.equals(u.status()));
            return new StageView(stage.code(), stage.title(), stage.targetBand(), status, testAvailable, unitViews);
        }).toList();
        return new RoadmapView(stages);
    }

    private void activateIfLocked(long profileId, String unitCode, Map<String, String> statuses) {
        if (LOCKED.equals(statuses.getOrDefault(unitCode, LOCKED))) {
            repo.setUnitStatus(profileId, unitCode, ACTIVE, now());
        }
    }

    private String now() { return LocalDateTime.now(clock).toString(); }
}
```

`roadmap/RoadmapController.java`:
```java
package vn.ieltsapp.roadmap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
public class RoadmapController {
    private final RoadmapService service;

    public RoadmapController(RoadmapService service) { this.service = service; }

    @GetMapping("/api/roadmap")
    public RoadmapView roadmap(@CurrentProfileId long profileId) { return service.view(profileId); }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=RoadmapTest`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(roadmap): lộ trình chặng/unit và mở khóa"
```

---

### Task 9: Bài học và chấm bài tập

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/lesson/ExerciseRow.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/ExerciseView.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/ExerciseResult.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/GradedAnswers.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/ExerciseGrader.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/ExerciseRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonRow.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonDto.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonSummary.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonSubmitResult.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/SubmitAnswersRequest.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonCompletedEvent.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonService.java`
- Create: `backend/src/main/java/vn/ieltsapp/lesson/LessonController.java`
- Test: `backend/src/test/java/vn/ieltsapp/lesson/ExerciseGraderTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/lesson/LessonApiTest.java`

**Interfaces:**
- Consumes: `RoadmapService.requireUnitOpen`, `Clock`, `ApplicationEventPublisher`.
- Produces: `record ExerciseRow(String code, String type, String prompt, List<String> options, String answer, String explanationVi)`, `record ExerciseView(String code, String type, String prompt, List<String> options)` với `static ExerciseView from(ExerciseRow)`, `record ExerciseResult(String code, String given, boolean correct, String answer, String explanationVi)`, `record GradedAnswers(List<ExerciseResult> results, double score)`.
- Produces: `ExerciseGrader.isCorrect(String type, String answer, String given)`, `ExerciseGrader.gradeAll(List<ExerciseRow>, Map<String,String>) → GradedAnswers`. Câu FILL: so khớp không phân biệt hoa thường/khoảng trắng; đáp án có thể có nhiều phương án, ngăn bằng `|`.
- Produces: `ExerciseRepository.byLesson(String)`, `byTest(String)`, `saveAttempt(long profileId, String code, String given, boolean correct, String now)`.
- Produces: `LessonService.unitLessons(long profileId, String unitCode) → List<LessonSummary>`; `record LessonSummary(String code, String type, String day, String title, int sortOrder, boolean completed)`.
- Produces: `record LessonCompletedEvent(long profileId, String lessonCode)`; `record SubmitAnswersRequest(@NotNull Map<String,String> answers)`.
- API: `GET /api/lessons/{code}`, `POST /api/lessons/{code}/submit`, `GET /api/units/{unitCode}/lessons`.

- [ ] **Step 1: Viết test cho bộ chấm (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/lesson/ExerciseGraderTest.java`:
```java
package vn.ieltsapp.lesson;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ExerciseGraderTest {

    @Test
    void fillIgnoresCaseSpacesAndAcceptsAlternatives() {
        assertThat(ExerciseGrader.isCorrect("FILL", "was written", "  Was   Written ")).isTrue();
        assertThat(ExerciseGrader.isCorrect("FILL", "don't|do not", "do not")).isTrue();
        assertThat(ExerciseGrader.isCorrect("FILL", "don't|do not", "don’t")).isTrue();
        assertThat(ExerciseGrader.isCorrect("FILL", "play", "plays")).isFalse();
        assertThat(ExerciseGrader.isCorrect("FILL", "play", null)).isFalse();
    }

    @Test
    void mcqRequiresExactOption() {
        assertThat(ExerciseGrader.isCorrect("MCQ", "goes", "goes")).isTrue();
        assertThat(ExerciseGrader.isCorrect("MCQ", "goes", "Goes")).isFalse();
    }

    @Test
    void gradeAllScoresAndShowsFirstAlternative() {
        List<ExerciseRow> rows = List.of(
                new ExerciseRow("E1", "MCQ", "p", List.of("a", "b"), "a", "giải thích 1"),
                new ExerciseRow("E2", "FILL", "p", List.of(), "do not|don't", "giải thích 2"));
        GradedAnswers graded = ExerciseGrader.gradeAll(rows, Map.of("E1", "a", "E2", "dont"));
        assertThat(graded.score()).isEqualTo(0.5);
        assertThat(graded.results().get(1).correct()).isFalse();
        assertThat(graded.results().get(1).answer()).isEqualTo("do not");
    }

    @Test
    void emptyExerciseListScoresFull() {
        assertThat(ExerciseGrader.gradeAll(List.of(), Map.of()).score()).isEqualTo(1.0);
    }
}
```

- [ ] **Step 2: Viết test API (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/lesson/LessonApiTest.java`:
```java
package vn.ieltsapp.lesson;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class LessonApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    @Test
    void lessonHidesAnswers() throws Exception {
        getAs("/api/lessons/S0-U01-G1", session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Thì hiện tại đơn"))
                .andExpect(jsonPath("$.exercises.length()").value(2))
                .andExpect(jsonPath("$.exercises[0].options[1]").value("goes"))
                .andExpect(jsonPath("$.exercises[0].answer").doesNotExist());
    }

    @Test
    void lockedLessonIsForbidden() throws Exception {
        getAs("/api/lessons/S0-U02-G1", session)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("UNIT_LOCKED"));
        getAs("/api/lessons/KHONG-CO", session).andExpect(status().isNotFound());
    }

    @Test
    void submitGradesSavesAttemptsAndKeepsBestScore() throws Exception {
        postJson("/api/lessons/S0-U01-G1/submit",
                Map.of("answers", Map.of("S0-U01-G1-E1", "goes", "S0-U01-G1-E2", "plays")), session)
                .andExpect(jsonPath("$.score").value(0.5))
                .andExpect(jsonPath("$.results[1].correct").value(false))
                .andExpect(jsonPath("$.results[1].answer").value("play"))
                .andExpect(jsonPath("$.results[1].explanationVi").value("Chủ ngữ số nhiều giữ nguyên động từ."));
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session)
                .andExpect(jsonPath("$.score").value(0.0));

        assertThat(jdbc.sql("SELECT COUNT(*) FROM exercise_attempt").query(Integer.class).single()).isEqualTo(4);
        getAs("/api/units/S0-U01/lessons", session)
                .andExpect(jsonPath("$[0].code").value("S0-U01-G1"))
                .andExpect(jsonPath("$[0].completed").value(true))
                .andExpect(jsonPath("$[1].completed").value(false));
        getAs("/api/lessons/S0-U01-G1", session).andExpect(jsonPath("$.bestScore").value(0.5));
    }

    @Test
    void submitWithoutAnswersFieldIs400() throws Exception {
        postJson("/api/lessons/S0-U01-G1/submit", Map.of(), session).andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 3: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=ExerciseGraderTest+LessonApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 4: Viết code**

`lesson/ExerciseRow.java`:
```java
package vn.ieltsapp.lesson;

import java.util.List;

public record ExerciseRow(String code, String type, String prompt, List<String> options, String answer,
                          String explanationVi) {}
```

`lesson/ExerciseView.java`:
```java
package vn.ieltsapp.lesson;

import java.util.List;

public record ExerciseView(String code, String type, String prompt, List<String> options) {
    public static ExerciseView from(ExerciseRow row) {
        return new ExerciseView(row.code(), row.type(), row.prompt(), row.options());
    }
}
```

`lesson/ExerciseResult.java`:
```java
package vn.ieltsapp.lesson;

public record ExerciseResult(String code, String given, boolean correct, String answer, String explanationVi) {}
```

`lesson/GradedAnswers.java`:
```java
package vn.ieltsapp.lesson;

import java.util.List;

public record GradedAnswers(List<ExerciseResult> results, double score) {}
```

`lesson/ExerciseGrader.java`:
```java
package vn.ieltsapp.lesson;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class ExerciseGrader {
    private ExerciseGrader() {}

    public static boolean isCorrect(String type, String answer, String given) {
        if (given == null) return false;
        if ("FILL".equals(type)) {
            String g = normalize(given);
            return Arrays.stream(answer.split("\\|")).map(ExerciseGrader::normalize).anyMatch(g::equals);
        }
        return answer.equals(given.trim());
    }

    public static GradedAnswers gradeAll(List<ExerciseRow> rows, Map<String, String> answers) {
        List<ExerciseResult> results = new ArrayList<>();
        int correct = 0;
        for (ExerciseRow row : rows) {
            String given = answers.get(row.code());
            boolean ok = isCorrect(row.type(), row.answer(), given);
            if (ok) correct++;
            results.add(new ExerciseResult(row.code(), given, ok, row.answer().split("\\|")[0], row.explanationVi()));
        }
        double score = rows.isEmpty() ? 1.0 : (double) correct / rows.size();
        return new GradedAnswers(results, score);
    }

    static String normalize(String s) {
        return s.trim().toLowerCase(Locale.ROOT).replace('’', '\'').replaceAll("\\s+", " ");
    }
}
```

`lesson/ExerciseRepository.java`:
```java
package vn.ieltsapp.lesson;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ExerciseRepository {
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final RowMapper<ExerciseRow> rowMapper;

    public ExerciseRepository(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.rowMapper = (rs, n) -> new ExerciseRow(rs.getString("code"), rs.getString("type"),
                rs.getString("prompt"), parseOptions(rs.getString("options_json")), rs.getString("answer"),
                rs.getString("explanation_vi"));
    }

    public List<ExerciseRow> byLesson(String lessonCode) {
        return jdbc.sql("SELECT * FROM exercise WHERE lesson_code = ? ORDER BY sort_order")
                .param(lessonCode).query(rowMapper).list();
    }

    public List<ExerciseRow> byTest(String testCode) {
        return jdbc.sql("SELECT * FROM exercise WHERE test_code = ? ORDER BY sort_order")
                .param(testCode).query(rowMapper).list();
    }

    public void saveAttempt(long profileId, String exerciseCode, String given, boolean correct, String now) {
        jdbc.sql("""
                        INSERT INTO exercise_attempt (profile_id, exercise_code, answer, correct, attempted_at)
                        VALUES (?, ?, ?, ?, ?)""")
                .params(profileId, exerciseCode, given, correct ? 1 : 0, now).update();
    }

    private List<String> parseOptions(String json) {
        if (json == null) return List.of();
        try {
            return mapper.readValue(json, STRING_LIST);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("options_json hỏng: " + json, e);
        }
    }
}
```

`lesson/LessonRow.java`:
```java
package vn.ieltsapp.lesson;

public record LessonRow(String code, String unitCode, String type, String day, String title, String bodyMd,
                        int sortOrder) {}
```

`lesson/LessonDto.java`:
```java
package vn.ieltsapp.lesson;

import java.util.List;

public record LessonDto(String code, String unitCode, String type, String day, String title, String bodyMd,
                        List<ExerciseView> exercises, Double bestScore) {}
```

`lesson/LessonSummary.java`:
```java
package vn.ieltsapp.lesson;

public record LessonSummary(String code, String type, String day, String title, int sortOrder, boolean completed) {}
```

`lesson/LessonSubmitResult.java`:
```java
package vn.ieltsapp.lesson;

import java.util.List;

public record LessonSubmitResult(double score, List<ExerciseResult> results) {}
```

`lesson/SubmitAnswersRequest.java`:
```java
package vn.ieltsapp.lesson;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record SubmitAnswersRequest(@NotNull Map<String, String> answers) {}
```

`lesson/LessonCompletedEvent.java`:
```java
package vn.ieltsapp.lesson;

public record LessonCompletedEvent(long profileId, String lessonCode) {}
```

`lesson/LessonRepository.java`:
```java
package vn.ieltsapp.lesson;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class LessonRepository {
    private static final RowMapper<LessonRow> MAPPER = (rs, n) -> new LessonRow(rs.getString("code"),
            rs.getString("unit_code"), rs.getString("type"), rs.getString("day"), rs.getString("title"),
            rs.getString("body_md"), rs.getInt("sort_order"));

    private final JdbcClient jdbc;

    public LessonRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<LessonRow> find(String code) {
        return jdbc.sql("SELECT * FROM lesson WHERE code = ?").param(code).query(MAPPER).optional();
    }

    public List<LessonRow> byUnit(String unitCode) {
        return jdbc.sql("SELECT * FROM lesson WHERE unit_code = ? ORDER BY sort_order")
                .param(unitCode).query(MAPPER).list();
    }

    /** lesson_code → điểm cao nhất, chỉ các bài đã làm trong unit. */
    public Map<String, Double> bestScores(long profileId, String unitCode) {
        Map<String, Double> result = new HashMap<>();
        jdbc.sql("""
                        SELECT lp.lesson_code, lp.score FROM lesson_progress lp
                        JOIN lesson l ON l.code = lp.lesson_code
                        WHERE lp.profile_id = ? AND l.unit_code = ?""")
                .params(profileId, unitCode)
                .query(rs -> { result.put(rs.getString("lesson_code"), rs.getDouble("score")); });
        return result;
    }

    public void saveProgress(long profileId, String lessonCode, double score, String now) {
        jdbc.sql("""
                        INSERT INTO lesson_progress (profile_id, lesson_code, score, completed_at) VALUES (?, ?, ?, ?)
                        ON CONFLICT (profile_id, lesson_code) DO UPDATE SET
                            score = MAX(lesson_progress.score, excluded.score),
                            completed_at = excluded.completed_at""")
                .params(profileId, lessonCode, score, now).update();
    }
}
```

`lesson/LessonService.java`:
```java
package vn.ieltsapp.lesson;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.roadmap.RoadmapService;

@Service
public class LessonService {
    private final LessonRepository lessons;
    private final ExerciseRepository exercises;
    private final RoadmapService roadmap;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public LessonService(LessonRepository lessons, ExerciseRepository exercises, RoadmapService roadmap,
                         ApplicationEventPublisher events, Clock clock) {
        this.lessons = lessons;
        this.exercises = exercises;
        this.roadmap = roadmap;
        this.events = events;
        this.clock = clock;
    }

    public LessonDto get(long profileId, String code) {
        LessonRow lesson = openLesson(profileId, code);
        Double best = lessons.bestScores(profileId, lesson.unitCode()).get(code);
        List<ExerciseView> views = exercises.byLesson(code).stream().map(ExerciseView::from).toList();
        return new LessonDto(lesson.code(), lesson.unitCode(), lesson.type(), lesson.day(), lesson.title(),
                lesson.bodyMd(), views, best);
    }

    @Transactional
    public LessonSubmitResult submit(long profileId, String code, Map<String, String> answers) {
        openLesson(profileId, code);
        GradedAnswers graded = ExerciseGrader.gradeAll(exercises.byLesson(code), answers);
        String now = LocalDateTime.now(clock).toString();
        for (ExerciseResult r : graded.results()) {
            exercises.saveAttempt(profileId, r.code(), r.given(), r.correct(), now);
        }
        lessons.saveProgress(profileId, code, graded.score(), now);
        events.publishEvent(new LessonCompletedEvent(profileId, code));
        return new LessonSubmitResult(graded.score(), graded.results());
    }

    public List<LessonSummary> unitLessons(long profileId, String unitCode) {
        Map<String, Double> done = lessons.bestScores(profileId, unitCode);
        return lessons.byUnit(unitCode).stream()
                .map(l -> new LessonSummary(l.code(), l.type(), l.day(), l.title(), l.sortOrder(),
                        done.containsKey(l.code())))
                .toList();
    }

    private LessonRow openLesson(long profileId, String code) {
        LessonRow lesson = lessons.find(code).orElseThrow(() -> ApiException.notFound("bài học"));
        roadmap.requireUnitOpen(profileId, lesson.unitCode());
        return lesson;
    }
}
```

`lesson/LessonController.java`:
```java
package vn.ieltsapp.lesson;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
@RequestMapping("/api")
public class LessonController {
    private final LessonService service;

    public LessonController(LessonService service) { this.service = service; }

    @GetMapping("/lessons/{code}")
    public LessonDto get(@CurrentProfileId long profileId, @PathVariable String code) {
        return service.get(profileId, code);
    }

    @PostMapping("/lessons/{code}/submit")
    public LessonSubmitResult submit(@CurrentProfileId long profileId, @PathVariable String code,
                                     @Valid @RequestBody SubmitAnswersRequest request) {
        return service.submit(profileId, code, request.answers());
    }

    @GetMapping("/units/{unitCode}/lessons")
    public List<LessonSummary> unitLessons(@CurrentProfileId long profileId, @PathVariable String unitCode) {
        return service.unitLessons(profileId, unitCode);
    }
}
```

- [ ] **Step 5: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=ExerciseGraderTest+LessonApiTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(lesson): bài học, chấm bài tập, tiến độ bài"
```

---

### Task 10: Bài kiểm tra cuối unit và chuyển chặng

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/assessment/TestRow.java`
- Create: `backend/src/main/java/vn/ieltsapp/assessment/TestDto.java`
- Create: `backend/src/main/java/vn/ieltsapp/assessment/TestResultDto.java`
- Create: `backend/src/main/java/vn/ieltsapp/assessment/AssessmentRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/assessment/AssessmentService.java`
- Create: `backend/src/main/java/vn/ieltsapp/assessment/AssessmentController.java`
- Test: `backend/src/test/java/vn/ieltsapp/assessment/AssessmentApiTest.java`

**Interfaces:**
- Consumes: `RoadmapService` (`requireUnitOpen`, `stageUnitsDone`, `onUnitTestPassed`, `onStageTestPassed`), `LessonService.unitLessons`, `ExerciseRepository`, `ExerciseGrader`, `ExerciseView`, `SubmitAnswersRequest`.
- Produces: `record TestDto(String code, String kind, double passRatio, List<ExerciseView> exercises)`, `record TestResultDto(double score, boolean passed, List<ExerciseResult> results, List<String> weakUnits)`.
- API: `GET /api/units/{unitCode}/test`, `GET /api/stages/{stageCode}/test`, `POST /api/tests/{code}/submit`. Chưa đủ điều kiện → 409 `TEST_NOT_READY`.
- Quy tắc: qua khi `score >= pass_ratio`. Bài chặng chưa qua thì `weakUnits` = các unit của chặng có điểm kiểm tra unit cao nhất < 0.8, điểm thấp xếp trước.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/assessment/AssessmentApiTest.java`:
```java
package vn.ieltsapp.assessment;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class AssessmentApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    private void completeU01Lessons() throws Exception {
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session);
        postJson("/api/lessons/S0-U01-P1/submit", Map.of("answers", Map.of()), session);
    }

    private void passUnit(String testCode, Map<String, String> answers) throws Exception {
        postJson("/api/tests/" + testCode + "/submit", Map.of("answers", answers), session)
                .andExpect(jsonPath("$.passed").value(true));
    }

    @Test
    void unitTestRequiresAllLessonsDone() throws Exception {
        getAs("/api/units/S0-U01/test", session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TEST_NOT_READY"));
        completeU01Lessons();
        getAs("/api/units/S0-U01/test", session)
                .andExpect(jsonPath("$.code").value("S0-U01-T"))
                .andExpect(jsonPath("$.exercises.length()").value(2))
                .andExpect(jsonPath("$.exercises[0].answer").doesNotExist());
    }

    @Test
    void failingUnitTestKeepsNextUnitLocked() throws Exception {
        completeU01Lessons();
        postJson("/api/tests/S0-U01-T/submit", Map.of("answers", Map.of()), session)
                .andExpect(jsonPath("$.score").value(0.0))
                .andExpect(jsonPath("$.passed").value(false));
        getAs("/api/roadmap", session).andExpect(jsonPath("$.stages[0].units[1].status").value("LOCKED"));
    }

    @Test
    void passingUnitTestUnlocksNextUnit() throws Exception {
        completeU01Lessons();
        passUnit("S0-U01-T", Map.of("S0-U01-T-E1", "has", "S0-U01-T-E2", "go"));
        getAs("/api/roadmap", session)
                .andExpect(jsonPath("$.stages[0].units[0].status").value("DONE"))
                .andExpect(jsonPath("$.stages[0].units[1].status").value("ACTIVE"));
    }

    @Test
    void stageTestFlowWithWeakUnitsThenPass() throws Exception {
        getAs("/api/stages/S0/test", session).andExpect(status().isConflict());

        completeU01Lessons();
        passUnit("S0-U01-T", Map.of("S0-U01-T-E1", "has"));
        postJson("/api/lessons/S0-U02-G1/submit", Map.of("answers", Map.of()), session);
        passUnit("S0-U02-T", Map.of("S0-U02-T-E1", "an"));

        getAs("/api/stages/S0/test", session).andExpect(jsonPath("$.kind").value("STAGE"));
        postJson("/api/tests/S0-T/submit", Map.of("answers", Map.of("S0-T-E1", "is")), session)
                .andExpect(jsonPath("$.passed").value(false))
                .andExpect(jsonPath("$.weakUnits.length()").value(1))
                .andExpect(jsonPath("$.weakUnits[0]").value("S0-U01"));

        postJson("/api/tests/S0-T/submit", Map.of("answers", Map.of("S0-T-E1", "is", "S0-T-E2", "am")), session)
                .andExpect(jsonPath("$.passed").value(true));
        getAs("/api/roadmap", session)
                .andExpect(jsonPath("$.stages[0].status").value("DONE"))
                .andExpect(jsonPath("$.stages[1].units[0].status").value("ACTIVE"));
    }

    @Test
    void submittingLockedUnitTestIsForbidden() throws Exception {
        postJson("/api/tests/S0-U02-T/submit", Map.of("answers", Map.of()), session)
                .andExpect(status().isForbidden());
        postJson("/api/tests/KHONG-CO/submit", Map.of("answers", Map.of()), session)
                .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=AssessmentApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`assessment/TestRow.java`:
```java
package vn.ieltsapp.assessment;

public record TestRow(String code, String kind, String unitCode, String stageCode, double passRatio) {}
```

`assessment/TestDto.java`:
```java
package vn.ieltsapp.assessment;

import java.util.List;
import vn.ieltsapp.lesson.ExerciseView;

public record TestDto(String code, String kind, double passRatio, List<ExerciseView> exercises) {}
```

`assessment/TestResultDto.java`:
```java
package vn.ieltsapp.assessment;

import java.util.List;
import vn.ieltsapp.lesson.ExerciseResult;

public record TestResultDto(double score, boolean passed, List<ExerciseResult> results, List<String> weakUnits) {}
```

`assessment/AssessmentRepository.java`:
```java
package vn.ieltsapp.assessment;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AssessmentRepository {
    private static final RowMapper<TestRow> MAPPER = (rs, n) -> new TestRow(rs.getString("code"),
            rs.getString("kind"), rs.getString("unit_code"), rs.getString("stage_code"), rs.getDouble("pass_ratio"));

    private final JdbcClient jdbc;

    public AssessmentRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<TestRow> find(String code) {
        return jdbc.sql("SELECT * FROM test WHERE code = ?").param(code).query(MAPPER).optional();
    }

    public Optional<TestRow> forUnit(String unitCode) {
        return jdbc.sql("SELECT * FROM test WHERE kind = 'UNIT' AND unit_code = ?").param(unitCode)
                .query(MAPPER).optional();
    }

    public Optional<TestRow> forStage(String stageCode) {
        return jdbc.sql("SELECT * FROM test WHERE kind = 'STAGE' AND stage_code = ?").param(stageCode)
                .query(MAPPER).optional();
    }

    public void saveResult(long profileId, String testCode, double score, boolean passed, String now) {
        jdbc.sql("INSERT INTO test_result (profile_id, test_code, score, passed, taken_at) VALUES (?, ?, ?, ?, ?)")
                .params(profileId, testCode, score, passed ? 1 : 0, now).update();
    }

    /** unit_code → điểm kiểm tra unit cao nhất của hồ sơ, trong một chặng, điểm thấp trước. */
    public Map<String, Double> bestUnitScores(long profileId, String stageCode) {
        Map<String, Double> result = new LinkedHashMap<>();
        jdbc.sql("""
                        SELECT t.unit_code, MAX(r.score) AS best FROM test_result r
                        JOIN test t ON t.code = r.test_code
                        JOIN unit u ON u.code = t.unit_code
                        WHERE r.profile_id = ? AND t.kind = 'UNIT' AND u.stage_code = ?
                        GROUP BY t.unit_code ORDER BY best, t.unit_code""")
                .params(profileId, stageCode)
                .query(rs -> { result.put(rs.getString("unit_code"), rs.getDouble("best")); });
        return result;
    }
}
```

`assessment/AssessmentService.java`:
```java
package vn.ieltsapp.assessment;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.lesson.*;
import vn.ieltsapp.roadmap.RoadmapService;

@Service
public class AssessmentService {
    static final double WEAK_THRESHOLD = 0.8;

    private final AssessmentRepository repo;
    private final ExerciseRepository exercises;
    private final LessonService lessons;
    private final RoadmapService roadmap;
    private final Clock clock;

    public AssessmentService(AssessmentRepository repo, ExerciseRepository exercises, LessonService lessons,
                             RoadmapService roadmap, Clock clock) {
        this.repo = repo;
        this.exercises = exercises;
        this.lessons = lessons;
        this.roadmap = roadmap;
        this.clock = clock;
    }

    public TestDto unitTest(long profileId, String unitCode) {
        requireUnitReady(profileId, unitCode);
        return toDto(repo.forUnit(unitCode).orElseThrow(() -> ApiException.notFound("bài kiểm tra")));
    }

    public TestDto stageTest(long profileId, String stageCode) {
        requireStageReady(profileId, stageCode);
        return toDto(repo.forStage(stageCode).orElseThrow(() -> ApiException.notFound("bài kiểm tra")));
    }

    @Transactional
    public TestResultDto submit(long profileId, String code, Map<String, String> answers) {
        TestRow test = repo.find(code).orElseThrow(() -> ApiException.notFound("bài kiểm tra"));
        boolean unitTest = "UNIT".equals(test.kind());
        if (unitTest) {
            requireUnitReady(profileId, test.unitCode());
        } else {
            requireStageReady(profileId, test.stageCode());
        }

        GradedAnswers graded = ExerciseGrader.gradeAll(exercises.byTest(code), answers);
        String now = LocalDateTime.now(clock).toString();
        for (ExerciseResult r : graded.results()) {
            exercises.saveAttempt(profileId, r.code(), r.given(), r.correct(), now);
        }
        boolean passed = graded.score() >= test.passRatio() - 1e-9;
        repo.saveResult(profileId, code, graded.score(), passed, now);

        List<String> weakUnits = List.of();
        if (passed && unitTest) {
            roadmap.onUnitTestPassed(profileId, test.unitCode());
        } else if (passed) {
            roadmap.onStageTestPassed(profileId, test.stageCode());
        } else if (!unitTest) {
            weakUnits = repo.bestUnitScores(profileId, test.stageCode()).entrySet().stream()
                    .filter(e -> e.getValue() < WEAK_THRESHOLD).map(Map.Entry::getKey).toList();
        }
        return new TestResultDto(graded.score(), passed, graded.results(), weakUnits);
    }

    private void requireUnitReady(long profileId, String unitCode) {
        roadmap.requireUnitOpen(profileId, unitCode);
        if (lessons.unitLessons(profileId, unitCode).stream().anyMatch(l -> !l.completed())) {
            throw new ApiException(HttpStatus.CONFLICT, "TEST_NOT_READY", "Cần hoàn thành tất cả bài học của unit trước");
        }
    }

    private void requireStageReady(long profileId, String stageCode) {
        if (!roadmap.stageUnitsDone(profileId, stageCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "TEST_NOT_READY", "Cần hoàn thành tất cả unit của chặng trước");
        }
    }

    private TestDto toDto(TestRow t) {
        return new TestDto(t.code(), t.kind(), t.passRatio(),
                exercises.byTest(t.code()).stream().map(ExerciseView::from).toList());
    }
}
```

`assessment/AssessmentController.java`:
```java
package vn.ieltsapp.assessment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.lesson.SubmitAnswersRequest;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
@RequestMapping("/api")
public class AssessmentController {
    private final AssessmentService service;

    public AssessmentController(AssessmentService service) { this.service = service; }

    @GetMapping("/units/{unitCode}/test")
    public TestDto unitTest(@CurrentProfileId long profileId, @PathVariable String unitCode) {
        return service.unitTest(profileId, unitCode);
    }

    @GetMapping("/stages/{stageCode}/test")
    public TestDto stageTest(@CurrentProfileId long profileId, @PathVariable String stageCode) {
        return service.stageTest(profileId, stageCode);
    }

    @PostMapping("/tests/{code}/submit")
    public TestResultDto submit(@CurrentProfileId long profileId, @PathVariable String code,
                                @Valid @RequestBody SubmitAnswersRequest request) {
        return service.submit(profileId, code, request.answers());
    }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=AssessmentApiTest`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(assessment): kiểm tra cuối unit, chuyển chặng, unit yếu"
```

---

### Task 11: Bộ ghép buổi học (logic thuần)

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/session/PlannerSettings.java`
- Create: `backend/src/main/java/vn/ieltsapp/session/SessionPlanner.java`
- Test: `backend/src/test/java/vn/ieltsapp/session/SessionPlannerTest.java`

**Interfaces:**
- Produces: `@ConfigurationProperties("app.session") record PlannerSettings(int maxReviews, int newWords, int skipNewWhenDueOver)`.
- Produces: `SessionPlanner.plan(SessionPlanner.PlanInput, PlannerSettings) → SessionPlanner.SessionPlan`; `record PlanInput(LocalDate today, List<Long> dueWordIds, int dueTotal, List<Long> newWordIds, List<LessonRef> lessons)`; `record LessonRef(String code, String day, int sortOrder, boolean completed)`; `record SessionPlan(List<Long> reviewWordIds, List<Long> newWordIds, String lessonCode)` (`lessonCode` có thể null).

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/session/SessionPlannerTest.java`:
```java
package vn.ieltsapp.session;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.LongStream;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.session.SessionPlanner.*;

class SessionPlannerTest {
    static final PlannerSettings SETTINGS = new PlannerSettings(60, 10, 100);
    static final LocalDate MONDAY = LocalDate.of(2026, 10, 5);
    static final LocalDate WEDNESDAY = LocalDate.of(2026, 10, 7);
    static final LocalDate SUNDAY = LocalDate.of(2026, 10, 11);

    static List<Long> ids(int n) { return LongStream.rangeClosed(1, n).boxed().toList(); }

    static final List<LessonRef> WEEK = List.of(
            new LessonRef("G1", "MON", 1, false),
            new LessonRef("P1", "TUE", 2, false),
            new LessonRef("G2", "WED", 3, false));

    @Test
    void reviewsAreCappedAndNewWordsLimited() {
        SessionPlan plan = SessionPlanner.plan(new PlanInput(MONDAY, ids(75), 75, ids(15), WEEK), SETTINGS);
        assertThat(plan.reviewWordIds()).hasSize(60).startsWith(1L, 2L);
        assertThat(plan.newWordIds()).hasSize(10);
    }

    @Test
    void newWordsSkippedWhenBacklogTooLarge() {
        assertThat(SessionPlanner.plan(new PlanInput(MONDAY, ids(60), 101, ids(5), WEEK), SETTINGS).newWordIds()).isEmpty();
        assertThat(SessionPlanner.plan(new PlanInput(MONDAY, ids(60), 100, ids(5), WEEK), SETTINGS).newWordIds()).hasSize(5);
    }

    @Test
    void picksLessonForTodayWhenOpen() {
        assertThat(SessionPlanner.plan(new PlanInput(WEDNESDAY, List.of(), 0, List.of(), WEEK), SETTINGS).lessonCode())
                .isEqualTo("G2");
    }

    @Test
    void fallsBackToEarliestOpenLesson() {
        List<LessonRef> wedDone = List.of(
                new LessonRef("G1", "MON", 1, true),
                new LessonRef("P1", "TUE", 2, false),
                new LessonRef("G2", "WED", 3, true));
        assertThat(SessionPlanner.plan(new PlanInput(WEDNESDAY, List.of(), 0, List.of(), wedDone), SETTINGS).lessonCode())
                .isEqualTo("P1");
        assertThat(SessionPlanner.plan(new PlanInput(SUNDAY, List.of(), 0, List.of(), WEEK), SETTINGS).lessonCode())
                .isEqualTo("G1");
    }

    @Test
    void noLessonWhenAllCompleted() {
        List<LessonRef> allDone = List.of(new LessonRef("G1", "MON", 1, true));
        assertThat(SessionPlanner.plan(new PlanInput(MONDAY, List.of(), 0, List.of(), allDone), SETTINGS).lessonCode())
                .isNull();
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=SessionPlannerTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`session/PlannerSettings.java`:
```java
package vn.ieltsapp.session;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.session")
public record PlannerSettings(int maxReviews, int newWords, int skipNewWhenDueOver) {}
```

`session/SessionPlanner.java`:
```java
package vn.ieltsapp.session;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public final class SessionPlanner {
    public record LessonRef(String code, String day, int sortOrder, boolean completed) {}

    public record PlanInput(LocalDate today, List<Long> dueWordIds, int dueTotal, List<Long> newWordIds,
                            List<LessonRef> lessons) {}

    public record SessionPlan(List<Long> reviewWordIds, List<Long> newWordIds, String lessonCode) {}

    private SessionPlanner() {}

    public static SessionPlan plan(PlanInput in, PlannerSettings s) {
        List<Long> reviews = in.dueWordIds().stream().limit(s.maxReviews()).toList();
        List<Long> fresh = in.dueTotal() > s.skipNewWhenDueOver()
                ? List.of()
                : in.newWordIds().stream().limit(s.newWords()).toList();
        return new SessionPlan(reviews, fresh, pickLesson(in.lessons(), in.today()));
    }

    /** Bài của thứ hôm nay nếu chưa làm; không thì bài sớm nhất chưa làm; hết bài thì null. */
    static String pickLesson(List<LessonRef> lessons, LocalDate today) {
        String day = today.getDayOfWeek().name().substring(0, 3);
        List<LessonRef> open = lessons.stream().filter(l -> !l.completed())
                .sorted(Comparator.comparingInt(LessonRef::sortOrder)).toList();
        return open.stream().filter(l -> l.day().equals(day)).findFirst()
                .or(() -> open.stream().findFirst())
                .map(LessonRef::code)
                .orElse(null);
    }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=SessionPlannerTest`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(session): bộ ghép buổi học 30 phút"
```

---

### Task 12: Buổi học trong ngày (lưu trạng thái, học tiếp, API)

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/session/SessionState.java`
- Create: `backend/src/main/java/vn/ieltsapp/session/SessionView.java`
- Create: `backend/src/main/java/vn/ieltsapp/session/SessionRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/session/SessionService.java`
- Create: `backend/src/main/java/vn/ieltsapp/session/SessionController.java`
- Modify: `backend/src/main/java/vn/ieltsapp/IeltsApplication.java` (thêm `@ConfigurationPropertiesScan`)
- Test: `backend/src/test/java/vn/ieltsapp/session/SessionApiTest.java`

**Interfaces:**
- Consumes: `SessionPlanner`, `PlannerSettings`, `VocabService` (`review`, `findWord`, `dueWordIds`, `countDue`, `unlearnedWordIds`), `RoadmapService.currentUnit`, `LessonService.unitLessons`, `LessonCompletedEvent`, `ReviewRequest`, `Grade`.
- Produces: `record SessionView(String studyDate, String step, WordDto currentCard, int reviewsLeft, int newLeft, String lessonCode, int cardsDone, boolean finished)`. `step` là một trong `REVIEW | NEW | LESSON | DONE`.
- API: `GET /api/session/today`, `POST /api/session/today/cards/{wordId}` (body `{"grade": ...}`). Lỗi: 409 `NO_SESSION`, `WRONG_STEP`, `CARD_MISMATCH`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/session/SessionApiTest.java`:
```java
package vn.ieltsapp.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class SessionApiTest extends IntegrationTest {
    MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
    }

    private void answer(String headword, String grade) throws Exception {
        postJson("/api/session/today/cards/" + wordId(headword), Map.of("grade", grade), session)
                .andExpect(status().isOk());
    }

    @Test
    void firstDayStartsWithNewWordsThenMondayLesson() throws Exception {
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.studyDate").value("2026-10-05"))
                .andExpect(jsonPath("$.step").value("NEW"))
                .andExpect(jsonPath("$.currentCard.headword").value("hello"))
                .andExpect(jsonPath("$.newLeft").value(3))
                .andExpect(jsonPath("$.lessonCode").value("S0-U01-G1"))
                .andExpect(jsonPath("$.finished").value(false));
    }

    @Test
    void fullSessionFlowFinishesAfterLesson() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");
        getAs("/api/session/today", session).andExpect(jsonPath("$.step").value("LESSON"));

        clock.plusMinutes(25);
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session);

        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.step").value("DONE"))
                .andExpect(jsonPath("$.finished").value(true))
                .andExpect(jsonPath("$.cardsDone").value(3));
        assertThat(jdbc.sql("SELECT minutes FROM study_session").query(Integer.class).single()).isEqualTo(25);
    }

    @Test
    void againRequeuesCardAtEnd() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "AGAIN");
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.currentCard.headword").value("book"))
                .andExpect(jsonPath("$.newLeft").value(3));
    }

    @Test
    void outOfOrderOrDuplicateAnswerIsRejected() throws Exception {
        getAs("/api/session/today", session);
        postJson("/api/session/today/cards/" + wordId("go"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CARD_MISMATCH"));
        answer("hello", "GOOD");
        postJson("/api/session/today/cards/" + wordId("hello"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CARD_MISMATCH"));
        assertThat(jdbc.sql("SELECT COUNT(*) FROM review_log").query(Integer.class).single()).isEqualTo(1);
    }

    @Test
    void nextDayReviewsDueCardsAndPicksTuesdayLesson() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");

        clock.plusDays(1);
        getAs("/api/session/today", session)
                .andExpect(jsonPath("$.studyDate").value("2026-10-06"))
                .andExpect(jsonPath("$.step").value("REVIEW"))
                .andExpect(jsonPath("$.reviewsLeft").value(3))
                .andExpect(jsonPath("$.newLeft").value(0))
                .andExpect(jsonPath("$.lessonCode").value("S0-U01-P1"));
    }

    @Test
    void midnightRolloverKeepsAnsweredCardsAndStartsNewDay() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");

        clock.plusDays(1);
        postJson("/api/session/today/cards/" + wordId("book"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NO_SESSION"));
        assertThat(jdbc.sql("SELECT COUNT(*) FROM card").query(Integer.class).single()).isEqualTo(1);
        getAs("/api/session/today", session).andExpect(jsonPath("$.studyDate").value("2026-10-06"));
    }

    @Test
    void cardAnswerDuringLessonStepIsRejected() throws Exception {
        getAs("/api/session/today", session);
        answer("hello", "GOOD");
        answer("book", "GOOD");
        answer("go", "GOOD");
        postJson("/api/session/today/cards/" + wordId("hello"), Map.of("grade", "GOOD"), session)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("WRONG_STEP"));
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=SessionApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

Thêm vào `IeltsApplication`:
```java
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
```
và annotation `@ConfigurationPropertiesScan` ngay dưới `@SpringBootApplication`.

`session/SessionState.java`:
```java
package vn.ieltsapp.session;

import java.util.List;

public record SessionState(String step, List<Long> reviewQueue, List<Long> newQueue, String lessonCode,
                           int cardsDone) {
    public SessionState withStep(String s) { return new SessionState(s, reviewQueue, newQueue, lessonCode, cardsDone); }
    public SessionState withReviewQueue(List<Long> q) { return new SessionState(step, q, newQueue, lessonCode, cardsDone); }
    public SessionState withNewQueue(List<Long> q) { return new SessionState(step, reviewQueue, q, lessonCode, cardsDone); }
    public SessionState withCardsDone(int n) { return new SessionState(step, reviewQueue, newQueue, lessonCode, n); }

    /** Bỏ qua các bước rỗng: REVIEW → NEW → LESSON → DONE. */
    public SessionState advance() {
        SessionState s = this;
        if ("REVIEW".equals(s.step()) && s.reviewQueue().isEmpty()) s = s.withStep("NEW");
        if ("NEW".equals(s.step()) && s.newQueue().isEmpty()) s = s.withStep("LESSON");
        if ("LESSON".equals(s.step()) && s.lessonCode() == null) s = s.withStep("DONE");
        return s;
    }
}
```

`session/SessionView.java`:
```java
package vn.ieltsapp.session;

import vn.ieltsapp.vocab.WordDto;

public record SessionView(String studyDate, String step, WordDto currentCard, int reviewsLeft, int newLeft,
                          String lessonCode, int cardsDone, boolean finished) {}
```

`session/SessionRepository.java`:
```java
package vn.ieltsapp.session;

import java.time.LocalDate;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class SessionRepository {
    public record SessionRow(long id, String studyDate, String stateJson, String startedAt, String finishedAt,
                             int minutes) {}

    private final JdbcClient jdbc;

    public SessionRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<SessionRow> find(long profileId, LocalDate date) {
        return jdbc.sql("SELECT * FROM study_session WHERE profile_id = ? AND study_date = ?")
                .params(profileId, date.toString())
                .query((rs, n) -> new SessionRow(rs.getLong("id"), rs.getString("study_date"),
                        rs.getString("state_json"), rs.getString("started_at"), rs.getString("finished_at"),
                        rs.getInt("minutes")))
                .optional();
    }

    public void insert(long profileId, LocalDate date, String stateJson, String startedAt) {
        jdbc.sql("""
                        INSERT INTO study_session (profile_id, study_date, state_json, started_at)
                        VALUES (?, ?, ?, ?)""")
                .params(profileId, date.toString(), stateJson, startedAt).update();
    }

    public void updateState(long id, String stateJson) {
        jdbc.sql("UPDATE study_session SET state_json = ? WHERE id = ?").params(stateJson, id).update();
    }

    public void finish(long id, String stateJson, String finishedAt, int minutes) {
        jdbc.sql("UPDATE study_session SET state_json = ?, finished_at = ?, minutes = ? WHERE id = ?")
                .params(stateJson, finishedAt, minutes, id).update();
    }
}
```

`session/SessionService.java`:
```java
package vn.ieltsapp.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.lesson.LessonCompletedEvent;
import vn.ieltsapp.lesson.LessonService;
import vn.ieltsapp.roadmap.RoadmapService;
import vn.ieltsapp.roadmap.UnitRow;
import vn.ieltsapp.session.SessionPlanner.*;
import vn.ieltsapp.session.SessionRepository.SessionRow;
import vn.ieltsapp.vocab.Grade;
import vn.ieltsapp.vocab.VocabService;
import vn.ieltsapp.vocab.WordDto;

@Service
public class SessionService {
    private final SessionRepository repo;
    private final VocabService vocab;
    private final RoadmapService roadmap;
    private final LessonService lessons;
    private final PlannerSettings settings;
    private final ObjectMapper mapper;
    private final Clock clock;

    public SessionService(SessionRepository repo, VocabService vocab, RoadmapService roadmap, LessonService lessons,
                          PlannerSettings settings, ObjectMapper mapper, Clock clock) {
        this.repo = repo;
        this.vocab = vocab;
        this.roadmap = roadmap;
        this.lessons = lessons;
        this.settings = settings;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public SessionView today(long profileId) {
        LocalDate today = LocalDate.now(clock);
        SessionRow row = repo.find(profileId, today).orElseGet(() -> {
            create(profileId, today);
            return repo.find(profileId, today).orElseThrow();
        });
        return view(profileId, row);
    }

    @Transactional
    public SessionView answerCard(long profileId, long wordId, Grade grade) {
        LocalDate today = LocalDate.now(clock);
        SessionRow row = repo.find(profileId, today).orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                "NO_SESSION", "Chưa có buổi học hôm nay, hãy tải lại trang"));
        SessionState state = read(row);
        boolean review = "REVIEW".equals(state.step());
        if (!review && !"NEW".equals(state.step())) {
            throw new ApiException(HttpStatus.CONFLICT, "WRONG_STEP", "Bước hiện tại không phải flashcard");
        }
        List<Long> queue = review ? state.reviewQueue() : state.newQueue();
        if (queue.isEmpty() || queue.get(0) != wordId) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_MISMATCH", "Thẻ không đúng thứ tự, hãy tải lại trang");
        }

        vocab.review(profileId, wordId, grade);
        List<Long> rest = new ArrayList<>(queue.subList(1, queue.size()));
        if (grade == Grade.AGAIN) rest.add(wordId);
        SessionState next = (review ? state.withReviewQueue(rest) : state.withNewQueue(rest))
                .withCardsDone(state.cardsDone() + 1)
                .advance();
        save(row, next);
        return view(profileId, repo.find(profileId, today).orElseThrow());
    }

    @EventListener
    public void onLessonCompleted(LessonCompletedEvent event) {
        repo.find(event.profileId(), LocalDate.now(clock)).ifPresent(row -> {
            SessionState state = read(row);
            if ("LESSON".equals(state.step()) && event.lessonCode().equals(state.lessonCode())) {
                save(row, state.withStep("DONE"));
            }
        });
    }

    private void create(long profileId, LocalDate today) {
        Optional<UnitRow> unit = roadmap.currentUnit(profileId);
        List<Long> due = vocab.dueWordIds(profileId, today, settings.maxReviews());
        int dueTotal = vocab.countDue(profileId, today);
        List<Long> fresh = unit.map(u -> vocab.unlearnedWordIds(profileId, u.code(), settings.newWords()))
                .orElse(List.of());
        List<LessonRef> unitLessons = unit.map(u -> lessons.unitLessons(profileId, u.code()).stream()
                        .map(l -> new LessonRef(l.code(), l.day(), l.sortOrder(), l.completed())).toList())
                .orElse(List.of());
        SessionPlan plan = SessionPlanner.plan(new PlanInput(today, due, dueTotal, fresh, unitLessons), settings);
        SessionState state = new SessionState("REVIEW", plan.reviewWordIds(), plan.newWordIds(),
                plan.lessonCode(), 0).advance();
        repo.insert(profileId, today, write(state), LocalDateTime.now(clock).toString());
        if ("DONE".equals(state.step())) {
            repo.find(profileId, today).ifPresent(row -> save(row, state));
        }
    }

    private void save(SessionRow row, SessionState state) {
        if ("DONE".equals(state.step()) && row.finishedAt() == null) {
            LocalDateTime now = LocalDateTime.now(clock);
            long minutes = Duration.between(LocalDateTime.parse(row.startedAt()), now).toMinutes();
            repo.finish(row.id(), write(state), now.toString(), (int) Math.max(1, Math.min(120, minutes)));
        } else {
            repo.updateState(row.id(), write(state));
        }
    }

    private SessionView view(long profileId, SessionRow row) {
        SessionState s = read(row);
        Long cardId = switch (s.step()) {
            case "REVIEW" -> s.reviewQueue().get(0);
            case "NEW" -> s.newQueue().get(0);
            default -> null;
        };
        WordDto card = cardId == null ? null : vocab.findWord(profileId, cardId);
        return new SessionView(row.studyDate(), s.step(), card, s.reviewQueue().size(), s.newQueue().size(),
                s.lessonCode(), s.cardsDone(), row.finishedAt() != null);
    }

    private SessionState read(SessionRow row) {
        try {
            return mapper.readValue(row.stateJson(), SessionState.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("state_json hỏng ở buổi học " + row.id(), e);
        }
    }

    private String write(SessionState state) {
        try {
            return mapper.writeValueAsString(state);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
```

`session/SessionController.java`:
```java
package vn.ieltsapp.session;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.CurrentProfileId;
import vn.ieltsapp.vocab.ReviewRequest;

@RestController
@RequestMapping("/api/session/today")
public class SessionController {
    private final SessionService service;

    public SessionController(SessionService service) { this.service = service; }

    @GetMapping
    public SessionView today(@CurrentProfileId long profileId) { return service.today(profileId); }

    @PostMapping("/cards/{wordId}")
    public SessionView answer(@CurrentProfileId long profileId, @PathVariable long wordId,
                              @Valid @RequestBody ReviewRequest request) {
        return service.answerCard(profileId, wordId, request.grade());
    }
}
```

Lưu ý: `queue.get(0) != wordId` so sánh `Long` với `long`, Java tự unbox nên so sánh theo giá trị. Đừng đổi `wordId` sang `Long`.

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=SessionApiTest+SessionPlannerTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(session): buổi học trong ngày, học tiếp chỗ dở"
```

---

### Task 13: Tiến độ: chuỗi ngày học, tổng quan, thống kê

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/progress/StreakCalculator.java`
- Create: `backend/src/main/java/vn/ieltsapp/progress/ProgressDtos.java`
- Create: `backend/src/main/java/vn/ieltsapp/progress/ProgressRepository.java`
- Create: `backend/src/main/java/vn/ieltsapp/progress/ProgressService.java`
- Create: `backend/src/main/java/vn/ieltsapp/progress/ProgressController.java`
- Test: `backend/src/test/java/vn/ieltsapp/progress/StreakCalculatorTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/progress/ProgressApiTest.java`

**Interfaces:**
- Consumes: `VocabService.countDue`, `RoadmapService.currentUnit`, `LessonService.unitLessons`, `Clock`.
- Produces: `StreakCalculator.currentStreak(Set<LocalDate> studyDays, LocalDate today) → int` (Chủ nhật không học thì không làm đứt chuỗi; hôm nay chưa học thì tính từ hôm qua).
- Produces: các record lồng trong `ProgressDtos`: `Summary(int streak, int dueCount, CurrentUnit currentUnit, boolean finishedToday)`, `CurrentUnit(String code, String title, int lessonsDone, int lessonsTotal, boolean testReady)`, `Stats(int streak, int knownWords, int learningWords, List<DayMinutes> heatmap, List<WeekCount> knownByWeek, List<TestResultItem> tests)`, `DayMinutes(String date, int minutes)`, `WeekCount(String weekStart, int total)`, `TestResultItem(String testCode, String kind, double score, boolean passed, String takenAt)`.
- API: `GET /api/progress/summary`, `GET /api/progress/stats`.

- [ ] **Step 1: Viết test cho chuỗi ngày học (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/progress/StreakCalculatorTest.java`:
```java
package vn.ieltsapp.progress;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {
    // 2026-09-28 là thứ Hai; 2026-10-04 là Chủ nhật.
    static Set<LocalDate> days(String... isoDates) {
        Set<LocalDate> set = new HashSet<>();
        for (String d : isoDates) set.add(LocalDate.parse(d));
        return set;
    }

    static final Set<LocalDate> FULL_WEEK = days("2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01",
            "2026-10-02", "2026-10-03", "2026-10-05");

    @Test
    void sundayOffDoesNotBreakStreak() {
        assertThat(StreakCalculator.currentStreak(FULL_WEEK, LocalDate.parse("2026-10-05"))).isEqualTo(7);
    }

    @Test
    void todayNotYetStudiedCountsFromYesterday() {
        assertThat(StreakCalculator.currentStreak(FULL_WEEK, LocalDate.parse("2026-10-06"))).isEqualTo(7);
    }

    @Test
    void missingAWeekdayBreaksStreak() {
        assertThat(StreakCalculator.currentStreak(FULL_WEEK, LocalDate.parse("2026-10-07"))).isZero();
        Set<LocalDate> gap = days("2026-09-30", "2026-10-02", "2026-10-03", "2026-10-05");
        assertThat(StreakCalculator.currentStreak(gap, LocalDate.parse("2026-10-05"))).isEqualTo(3);
    }

    @Test
    void sundayTodayWithoutStudyKeepsWeekStreak() {
        Set<LocalDate> week = days("2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03");
        assertThat(StreakCalculator.currentStreak(week, LocalDate.parse("2026-10-04"))).isEqualTo(6);
    }

    @Test
    void emptyHistoryIsZero() {
        assertThat(StreakCalculator.currentStreak(Set.of(), LocalDate.parse("2026-10-05"))).isZero();
    }
}
```

- [ ] **Step 2: Viết test API (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/progress/ProgressApiTest.java`:
```java
package vn.ieltsapp.progress;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class ProgressApiTest extends IntegrationTest {
    MockHttpSession session;
    long pid;

    @BeforeEach
    void setUp() throws Exception {
        importFixtures();
        session = newProfileSession("Thành");
        pid = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
    }

    @Test
    void summaryBeforeAndAfterFinishingSession() throws Exception {
        getAs("/api/progress/summary", session)
                .andExpect(jsonPath("$.streak").value(0))
                .andExpect(jsonPath("$.finishedToday").value(false))
                .andExpect(jsonPath("$.currentUnit.code").value("S0-U01"))
                .andExpect(jsonPath("$.currentUnit.lessonsTotal").value(2));

        getAs("/api/session/today", session);
        for (String w : new String[] {"hello", "book", "go"}) {
            postJson("/api/session/today/cards/" + wordId(w), Map.of("grade", "GOOD"), session);
        }
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of()), session);

        getAs("/api/progress/summary", session)
                .andExpect(jsonPath("$.streak").value(1))
                .andExpect(jsonPath("$.finishedToday").value(true))
                .andExpect(jsonPath("$.currentUnit.lessonsDone").value(1))
                .andExpect(jsonPath("$.currentUnit.testReady").value(false));

        clock.plusDays(1);
        getAs("/api/progress/summary", session)
                .andExpect(jsonPath("$.dueCount").value(3))
                .andExpect(jsonPath("$.streak").value(1));
    }

    @Test
    void statsCountKnownWordsAndHeatmap() throws Exception {
        long hello = wordId("hello");
        jdbc.sql("INSERT INTO card VALUES (?, ?, 2.5, 21, 4, 0, '2026-10-26', '2026-09-01T09:00')").params(pid, hello).update();
        jdbc.sql("INSERT INTO card VALUES (?, ?, 2.5, 6, 2, 0, '2026-10-08', '2026-09-01T09:00')").params(pid, wordId("book")).update();
        jdbc.sql("INSERT INTO review_log (profile_id, word_id, grade, prev_interval, new_interval, reviewed_at) VALUES (?, ?, 'GOOD', 15, 21, '2026-10-01T20:00')")
                .params(pid, hello).update();
        jdbc.sql("INSERT INTO study_session (profile_id, study_date, state_json, started_at, finished_at, minutes) VALUES (?, '2026-10-03', '{}', '2026-10-03T20:00', '2026-10-03T20:31', 31)")
                .param(pid).update();

        getAs("/api/progress/stats", session)
                .andExpect(jsonPath("$.knownWords").value(1))
                .andExpect(jsonPath("$.learningWords").value(1))
                .andExpect(jsonPath("$.heatmap[0].date").value("2026-10-03"))
                .andExpect(jsonPath("$.heatmap[0].minutes").value(31))
                .andExpect(jsonPath("$.knownByWeek[0].weekStart").value("2026-09-28"))
                .andExpect(jsonPath("$.knownByWeek[0].total").value(1))
                .andExpect(jsonPath("$.tests.length()").value(0));
    }
}
```

- [ ] **Step 3: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=StreakCalculatorTest+ProgressApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 4: Viết code**

`progress/StreakCalculator.java`:
```java
package vn.ieltsapp.progress;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Set;

public final class StreakCalculator {
    private StreakCalculator() {}

    public static int currentStreak(Set<LocalDate> studyDays, LocalDate today) {
        if (studyDays.isEmpty()) return 0;
        LocalDate earliest = Collections.min(studyDays);
        LocalDate day = studyDays.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (!day.isBefore(earliest)) {
            if (studyDays.contains(day)) {
                streak++;
            } else if (day.getDayOfWeek() != DayOfWeek.SUNDAY) {
                break;
            }
            day = day.minusDays(1);
        }
        return streak;
    }
}
```

`progress/ProgressDtos.java`:
```java
package vn.ieltsapp.progress;

import java.util.List;

public final class ProgressDtos {
    private ProgressDtos() {}

    public record Summary(int streak, int dueCount, CurrentUnit currentUnit, boolean finishedToday) {}

    public record CurrentUnit(String code, String title, int lessonsDone, int lessonsTotal, boolean testReady) {}

    public record Stats(int streak, int knownWords, int learningWords, List<DayMinutes> heatmap,
                        List<WeekCount> knownByWeek, List<TestResultItem> tests) {}

    public record DayMinutes(String date, int minutes) {}

    public record WeekCount(String weekStart, int total) {}

    public record TestResultItem(String testCode, String kind, double score, boolean passed, String takenAt) {}
}
```

`progress/ProgressRepository.java`:
```java
package vn.ieltsapp.progress;

import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.ieltsapp.progress.ProgressDtos.DayMinutes;
import vn.ieltsapp.progress.ProgressDtos.TestResultItem;

@Repository
public class ProgressRepository {
    private final JdbcClient jdbc;

    public ProgressRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public List<DayMinutes> finishedDays(long profileId) {
        return jdbc.sql("""
                        SELECT study_date, minutes FROM study_session
                        WHERE profile_id = ? AND finished_at IS NOT NULL ORDER BY study_date""")
                .param(profileId)
                .query((rs, n) -> new DayMinutes(rs.getString("study_date"), rs.getInt("minutes"))).list();
    }

    public int countCards(long profileId, boolean known) {
        String condition = known ? "interval_days >= 21" : "interval_days < 21";
        return jdbc.sql("SELECT COUNT(*) FROM card WHERE profile_id = ? AND " + condition)
                .param(profileId).query(Integer.class).single();
    }

    /** Ngày đầu tiên mỗi từ đạt mốc "đã thuộc". */
    public List<LocalDate> knownSince(long profileId) {
        return jdbc.sql("""
                        SELECT MIN(substr(reviewed_at, 1, 10)) AS d FROM review_log
                        WHERE profile_id = ? AND new_interval >= 21 GROUP BY word_id""")
                .param(profileId).query(String.class).list().stream().map(LocalDate::parse).toList();
    }

    public List<TestResultItem> testResults(long profileId) {
        return jdbc.sql("""
                        SELECT r.test_code, t.kind, r.score, r.passed, r.taken_at FROM test_result r
                        JOIN test t ON t.code = r.test_code
                        WHERE r.profile_id = ? ORDER BY r.taken_at DESC LIMIT 100""")
                .param(profileId)
                .query((rs, n) -> new TestResultItem(rs.getString("test_code"), rs.getString("kind"),
                        rs.getDouble("score"), rs.getInt("passed") == 1, rs.getString("taken_at")))
                .list();
    }
}
```

`progress/ProgressService.java`:
```java
package vn.ieltsapp.progress;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import vn.ieltsapp.lesson.LessonService;
import vn.ieltsapp.lesson.LessonSummary;
import vn.ieltsapp.progress.ProgressDtos.*;
import vn.ieltsapp.roadmap.RoadmapService;
import vn.ieltsapp.vocab.VocabService;

@Service
public class ProgressService {
    private final ProgressRepository repo;
    private final VocabService vocab;
    private final RoadmapService roadmap;
    private final LessonService lessons;
    private final Clock clock;

    public ProgressService(ProgressRepository repo, VocabService vocab, RoadmapService roadmap,
                           LessonService lessons, Clock clock) {
        this.repo = repo;
        this.vocab = vocab;
        this.roadmap = roadmap;
        this.lessons = lessons;
        this.clock = clock;
    }

    public Summary summary(long profileId) {
        LocalDate today = LocalDate.now(clock);
        Set<LocalDate> days = studyDays(profileId);
        CurrentUnit unit = roadmap.currentUnit(profileId).map(u -> {
            List<LessonSummary> ls = lessons.unitLessons(profileId, u.code());
            int done = (int) ls.stream().filter(LessonSummary::completed).count();
            return new CurrentUnit(u.code(), u.title(), done, ls.size(), done == ls.size());
        }).orElse(null);
        return new Summary(StreakCalculator.currentStreak(days, today), vocab.countDue(profileId, today), unit,
                days.contains(today));
    }

    public Stats stats(long profileId) {
        LocalDate today = LocalDate.now(clock);
        String since = today.minusDays(365).toString();
        List<DayMinutes> heatmap = repo.finishedDays(profileId).stream()
                .filter(d -> d.date().compareTo(since) >= 0).toList();

        TreeMap<LocalDate, Long> perWeek = repo.knownSince(profileId).stream().collect(Collectors.groupingBy(
                d -> d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), TreeMap::new, Collectors.counting()));
        List<WeekCount> knownByWeek = new ArrayList<>();
        int total = 0;
        for (Map.Entry<LocalDate, Long> e : perWeek.entrySet()) {
            total += e.getValue().intValue();
            knownByWeek.add(new WeekCount(e.getKey().toString(), total));
        }

        return new Stats(StreakCalculator.currentStreak(studyDays(profileId), today),
                repo.countCards(profileId, true), repo.countCards(profileId, false), heatmap, knownByWeek,
                repo.testResults(profileId));
    }

    private Set<LocalDate> studyDays(long profileId) {
        return repo.finishedDays(profileId).stream().map(d -> LocalDate.parse(d.date())).collect(Collectors.toSet());
    }
}
```

`progress/ProgressController.java`:
```java
package vn.ieltsapp.progress;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ieltsapp.profile.CurrentProfileId;
import vn.ieltsapp.progress.ProgressDtos.Stats;
import vn.ieltsapp.progress.ProgressDtos.Summary;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
    private final ProgressService service;

    public ProgressController(ProgressService service) { this.service = service; }

    @GetMapping("/summary")
    public Summary summary(@CurrentProfileId long profileId) { return service.summary(profileId); }

    @GetMapping("/stats")
    public Stats stats(@CurrentProfileId long profileId) { return service.stats(profileId); }
}
```

- [ ] **Step 5: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=StreakCalculatorTest+ProgressApiTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat(progress): chuỗi ngày học, tổng quan, thống kê"
```

---

### Task 14: Sao lưu, khôi phục, cài đặt

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/common/AppConfigFile.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/BackupFiles.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/BackupInfo.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/BackupService.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/BackupController.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/DailyBackupRunner.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/FlywayBackupConfig.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/StartupRestore.java`
- Create: `backend/src/main/java/vn/ieltsapp/backup/SettingsController.java`
- Create: `backend/src/test/resources/db/test-migration/V2__noop.sql`
- Test: `backend/src/test/java/vn/ieltsapp/backup/BackupApiTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/backup/StartupRestoreTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/backup/PreMigrationBackupTest.java`

**Interfaces:**
- Produces: `AppConfigFile.load(Path home)`, `port() → Optional<Integer>`, `setPort(int)`, `backupDir() → Optional<String>`, `setBackupDir(String)` (null/rỗng = về mặc định), `save()`. File: `${app.home}/config.yml`.
- Produces: `BackupFiles.TS` (`yyyyMMdd-HHmmss`), `BackupFiles.vacuumInto(Connection, Path dir, String reason, LocalDateTime now) → Path`, `BackupFiles.list(Path dir) → List<Path>` (mới nhất trước), `BackupFiles.prune(Path dir, int keep)`, `BackupFiles.backupDir(Path home) → Path`. Tên file: `ielts-<yyyyMMdd-HHmmss>-<reason>[-n].db`.
- Produces: `StartupRestore.MARKER = "restore-pending.txt"`, `StartupRestore.applyPending(Path home) → Optional<String>`.
- Produces: `FlywayBackupConfig.backupBeforeMigrate(String home) → FlywayMigrationStrategy`.
- API: `GET /api/backups`, `POST /api/backups` (201), `POST /api/backups/{name}/restore`, `GET /api/backups/export`, `GET /api/settings`, `PUT /api/settings`, `POST /api/settings/open-logs`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/resources/db/test-migration/V2__noop.sql`:
```sql
CREATE TABLE noop_marker (x INTEGER);
```

`backend/src/test/java/vn/ieltsapp/backup/StartupRestoreTest.java`:
```java
package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class StartupRestoreTest {
    @TempDir Path home;

    @Test
    void noMarkerDoesNothing() throws Exception {
        assertThat(StartupRestore.applyPending(home)).isEmpty();
    }

    @Test
    void appliesPendingRestoreAndKeepsPreviousCopy() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "cũ");
        Files.writeString(home.resolve("ielts.db-wal"), "wal");
        Path backup = Files.createDirectories(home.resolve("sao lưu")).resolve("ielts-20261005-090000-manual.db");
        Files.writeString(backup, "bản sao");
        Files.writeString(home.resolve(StartupRestore.MARKER), backup.toAbsolutePath().toString());

        assertThat(StartupRestore.applyPending(home)).contains("ielts-20261005-090000-manual.db");
        assertThat(Files.readString(home.resolve("ielts.db"))).isEqualTo("bản sao");
        assertThat(Files.readString(home.resolve("ielts-before-restore.db"))).isEqualTo("cũ");
        assertThat(home.resolve("ielts.db-wal")).doesNotExist();
        assertThat(home.resolve(StartupRestore.MARKER)).doesNotExist();
    }

    @Test
    void missingBackupFileIsIgnored() throws Exception {
        Files.writeString(home.resolve(StartupRestore.MARKER), home.resolve("khong-co.db").toString());
        assertThat(StartupRestore.applyPending(home)).isEmpty();
        assertThat(home.resolve(StartupRestore.MARKER)).doesNotExist();
    }
}
```

`backend/src/test/java/vn/ieltsapp/backup/PreMigrationBackupTest.java`:
```java
package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class PreMigrationBackupTest {
    @TempDir Path home;

    @Test
    void backsUpOnlyWhenUpgradingExistingDb() throws Exception {
        String url = "jdbc:sqlite:" + home.resolve("ielts.db");
        var strategy = new FlywayBackupConfig().backupBeforeMigrate(home.toString());

        strategy.migrate(Flyway.configure().dataSource(url, null, null).locations("classpath:db/migration").load());
        assertThat(BackupFiles.list(home.resolve("backups"))).isEmpty();

        strategy.migrate(Flyway.configure().dataSource(url, null, null)
                .locations("classpath:db/migration", "classpath:db/test-migration").load());
        assertThat(BackupFiles.list(home.resolve("backups")))
                .singleElement().satisfies(p -> assertThat(p.getFileName().toString()).endsWith("-premigrate.db"));
    }
}
```

`backend/src/test/java/vn/ieltsapp/backup/BackupApiTest.java`:
```java
package vn.ieltsapp.backup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class BackupApiTest extends IntegrationTest {

    @BeforeEach
    void setUp() throws Exception {
        newProfileSession("Thành");
    }

    @AfterEach
    void cleanUp() throws Exception {
        Files.deleteIfExists(HOME.resolve("config.yml"));
        Files.deleteIfExists(HOME.resolve(StartupRestore.MARKER));
        for (Path dir : new Path[] {HOME.resolve("backups"), HOME.resolve("sao lưu dữ liệu")}) {
            if (Files.exists(dir)) {
                try (Stream<Path> files = Files.walk(dir)) {
                    files.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
                }
            }
        }
    }

    static int profilesIn(Path dbFile) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + dbFile);
             ResultSet rs = c.createStatement().executeQuery("SELECT COUNT(*) FROM profile")) {
            rs.next();
            return rs.getInt(1);
        }
    }

    @Test
    void manualBackupProducesValidDatabase() throws Exception {
        String name = body(mvc.perform(post("/api/backups")).andExpect(status().isCreated())).get("name").asText();
        assertThat(name).matches("ielts-20261005-090000-manual\\.db");
        assertThat(profilesIn(HOME.resolve("backups").resolve(name))).isEqualTo(1);
        mvc.perform(get("/api/backups")).andExpect(jsonPath("$[0].name").value(name));
    }

    @Test
    void keepsOnlySevenNewestBackups() throws Exception {
        for (int i = 0; i < 9; i++) {
            mvc.perform(post("/api/backups")).andExpect(status().isCreated());
            clock.plusSeconds(1);
        }
        mvc.perform(get("/api/backups"))
                .andExpect(jsonPath("$.length()").value(7))
                .andExpect(jsonPath("$[0].name").value("ielts-20261005-090008-manual.db"));
    }

    @Test
    void backupDirWithSpacesAndVietnameseWorks() throws Exception {
        Path dir = HOME.resolve("sao lưu dữ liệu");
        mvc.perform(put("/api/settings").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("backupDir", dir.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backupDir").value(dir.toString()));
        String name = body(mvc.perform(post("/api/backups"))).get("name").asText();
        assertThat(profilesIn(dir.resolve(name))).isEqualTo(1);
    }

    @Test
    void relativeBackupDirIsRejected() throws Exception {
        mvc.perform(put("/api/settings").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"backupDir\":\"tuong-doi\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void restoreWritesMarkerAndRejectsBadNames() throws Exception {
        String name = body(mvc.perform(post("/api/backups"))).get("name").asText();
        mvc.perform(post("/api/backups/" + name + "/restore")).andExpect(status().isOk());
        assertThat(Files.readString(HOME.resolve(StartupRestore.MARKER))).endsWith(name);

        mvc.perform(post("/api/backups/..%2Fielts.db/restore")).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/backups/ielts-20990101-000000-manual.db/restore")).andExpect(status().isNotFound());
    }

    @Test
    void exportDownloadsDatabaseFile() throws Exception {
        mvc.perform(get("/api/backups/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("ielts-export-")));
    }

    @Test
    void openLogsInHeadlessTestIsNotSupported() throws Exception {
        mvc.perform(post("/api/settings/open-logs"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NOT_SUPPORTED"));
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=StartupRestoreTest+PreMigrationBackupTest+BackupApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`common/AppConfigFile.java`:
```java
package vn.ieltsapp.common;

import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

/** ${app.home}/config.yml: cổng đang dùng và thư mục sao lưu. */
public final class AppConfigFile {
    private final Path file;
    private final Map<String, Object> values;

    private AppConfigFile(Path file, Map<String, Object> values) {
        this.file = file;
        this.values = values;
    }

    public static AppConfigFile load(Path home) {
        Path file = home.resolve("config.yml");
        Map<String, Object> values = new LinkedHashMap<>();
        if (Files.exists(file)) {
            try (Reader reader = Files.newBufferedReader(file)) {
                Object loaded = new Yaml().load(reader);
                if (loaded instanceof Map<?, ?> map) {
                    map.forEach((k, v) -> values.put(String.valueOf(k), v));
                }
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            } catch (RuntimeException e) {
                values.clear(); // file hỏng: dùng mặc định
            }
        }
        return new AppConfigFile(file, values);
    }

    public Optional<Integer> port() {
        return values.get("port") instanceof Number n ? Optional.of(n.intValue()) : Optional.empty();
    }

    public void setPort(int port) { values.put("port", port); }

    public Optional<String> backupDir() {
        return values.get("backupDir") instanceof String s && !s.isBlank() ? Optional.of(s) : Optional.empty();
    }

    public void setBackupDir(String dir) {
        if (dir == null || dir.isBlank()) {
            values.remove("backupDir");
        } else {
            values.put("backupDir", dir);
        }
    }

    public void save() {
        DumperOptions options = new DumperOptions();
        options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        try {
            Files.createDirectories(file.getParent());
            Files.writeString(file, new Yaml(options).dump(values));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
```

`backup/BackupFiles.java`:
```java
package vn.ieltsapp.backup;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import vn.ieltsapp.common.AppConfigFile;

public final class BackupFiles {
    public static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    public static final Pattern NAME = Pattern.compile("ielts-\\d{8}-\\d{6}-[a-z]+(-\\d+)?\\.db");

    private BackupFiles() {}

    public static Path backupDir(Path home) {
        return AppConfigFile.load(home).backupDir().map(Path::of).orElse(home.resolve("backups"));
    }

    /** VACUUM INTO tạo bản sao nhất quán kể cả khi DB đang ở chế độ WAL. Không được gọi trong transaction. */
    public static Path vacuumInto(Connection connection, Path dir, String reason, LocalDateTime now)
            throws SQLException, IOException {
        Files.createDirectories(dir);
        String base = "ielts-" + now.format(TS) + "-" + reason;
        Path target = dir.resolve(base + ".db");
        for (int i = 2; Files.exists(target); i++) {
            target = dir.resolve(base + "-" + i + ".db");
        }
        try (PreparedStatement ps = connection.prepareStatement("VACUUM INTO ?")) {
            ps.setString(1, target.toString());
            ps.execute();
        }
        return target;
    }

    public static List<Path> list(Path dir) throws IOException {
        if (!Files.isDirectory(dir)) return List.of();
        try (Stream<Path> files = Files.list(dir)) {
            return files.filter(p -> NAME.matcher(p.getFileName().toString()).matches())
                    .sorted(Comparator.comparing((Path p) -> p.getFileName().toString()).reversed())
                    .toList();
        }
    }

    public static void prune(Path dir, int keep) throws IOException {
        List<Path> all = list(dir);
        for (Path old : all.subList(Math.min(keep, all.size()), all.size())) {
            Files.deleteIfExists(old);
        }
    }
}
```

`backup/BackupInfo.java`:
```java
package vn.ieltsapp.backup;

public record BackupInfo(String name, long sizeBytes, String createdAt) {}
```

`backup/BackupService.java`:
```java
package vn.ieltsapp.backup;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.ieltsapp.common.ApiException;

@Service
public class BackupService {
    private final DataSource dataSource;
    private final Clock clock;
    private final Path home;
    private final int keep;

    public BackupService(DataSource dataSource, Clock clock, @Value("${app.home}") String home,
                         @Value("${app.backup.keep:7}") int keep) {
        this.dataSource = dataSource;
        this.clock = clock;
        this.home = Path.of(home);
        this.keep = keep;
    }

    public Path dir() { return BackupFiles.backupDir(home); }

    public synchronized BackupInfo backupNow(String reason) {
        try (Connection c = dataSource.getConnection()) {
            Path file = BackupFiles.vacuumInto(c, dir(), reason, LocalDateTime.now(clock));
            BackupFiles.prune(dir(), keep);
            return info(file);
        } catch (SQLException | IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Sao lưu thất bại: " + e.getMessage());
        }
    }

    public List<BackupInfo> list() {
        try {
            List<BackupInfo> result = new ArrayList<>();
            for (Path p : BackupFiles.list(dir())) result.add(info(p));
            return result;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Không đọc được thư mục sao lưu");
        }
    }

    public boolean hasBackupOn(LocalDate day) {
        String prefix = "ielts-" + day.format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        return list().stream().anyMatch(b -> b.name().startsWith(prefix));
    }

    public void scheduleRestore(String name) {
        if (!BackupFiles.NAME.matcher(name).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "BACKUP_NAME_INVALID", "Tên bản sao lưu không hợp lệ");
        }
        Path file = dir().resolve(name);
        if (!Files.exists(file)) throw ApiException.notFound("bản sao lưu");
        try {
            Files.writeString(home.resolve(StartupRestore.MARKER), file.toAbsolutePath().toString());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Không ghi được yêu cầu khôi phục");
        }
    }

    public Path exportToTempFile() {
        try (Connection c = dataSource.getConnection()) {
            Path tmpDir = Files.createTempDirectory("ielts-export");
            Path file = BackupFiles.vacuumInto(c, tmpDir, "export", LocalDateTime.now(clock));
            file.toFile().deleteOnExit();
            tmpDir.toFile().deleteOnExit();
            return file;
        } catch (SQLException | IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "BACKUP_FAILED", "Xuất dữ liệu thất bại: " + e.getMessage());
        }
    }

    private BackupInfo info(Path p) throws IOException {
        LocalDateTime created = LocalDateTime.ofInstant(Files.getLastModifiedTime(p).toInstant(), clock.getZone());
        return new BackupInfo(p.getFileName().toString(), Files.size(p), created.toString());
    }
}
```

`backup/StartupRestore.java`:
```java
package vn.ieltsapp.backup;

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

/** Chạy trong main() TRƯỚC khi Spring mở DB: thay ielts.db bằng bản sao lưu đã chọn. */
public final class StartupRestore {
    public static final String MARKER = "restore-pending.txt";

    private StartupRestore() {}

    public static Optional<String> applyPending(Path home) throws IOException {
        Path marker = home.resolve(MARKER);
        if (!Files.exists(marker)) return Optional.empty();
        Path source = Path.of(Files.readString(marker).trim());
        Files.delete(marker);
        if (!Files.exists(source)) return Optional.empty();

        Path db = home.resolve("ielts.db");
        if (Files.exists(db)) {
            Files.copy(db, home.resolve("ielts-before-restore.db"), REPLACE_EXISTING);
        }
        Files.deleteIfExists(home.resolve("ielts.db-wal"));
        Files.deleteIfExists(home.resolve("ielts.db-shm"));
        Files.copy(source, db, REPLACE_EXISTING);
        return Optional.of(source.getFileName().toString());
    }
}
```

`backup/FlywayBackupConfig.java`:
```java
package vn.ieltsapp.backup;

import java.io.IOException;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import org.flywaydb.core.api.MigrationInfoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayBackupConfig {

    /** Sao lưu trước khi nâng cấp DB đã có dữ liệu (đã có migration áp dụng và còn migration mới). */
    @Bean
    public FlywayMigrationStrategy backupBeforeMigrate(@Value("${app.home}") String home) {
        return flyway -> {
            MigrationInfoService info = flyway.info();
            if (info.applied().length > 0 && info.pending().length > 0) {
                try (Connection c = flyway.getConfiguration().getDataSource().getConnection()) {
                    Path h = Path.of(home);
                    BackupFiles.vacuumInto(c, BackupFiles.backupDir(h), "premigrate", LocalDateTime.now());
                } catch (SQLException | IOException e) {
                    throw new IllegalStateException("Không sao lưu được trước khi nâng cấp DB", e);
                }
            }
            flyway.migrate();
        };
    }
}
```

`backup/DailyBackupRunner.java`:
```java
package vn.ieltsapp.backup;

import java.time.Clock;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class DailyBackupRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DailyBackupRunner.class);

    private final BackupService backups;
    private final JdbcClient jdbc;
    private final Clock clock;

    public DailyBackupRunner(BackupService backups, JdbcClient jdbc, Clock clock) {
        this.backups = backups;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Override
    public void run(ApplicationArguments args) {
        int profiles = jdbc.sql("SELECT COUNT(*) FROM profile").query(Integer.class).single();
        if (profiles > 0 && !backups.hasBackupOn(LocalDate.now(clock))) {
            log.info("Sao lưu tự động: {}", backups.backupNow("auto").name());
        }
    }
}
```

`backup/BackupController.java`:
```java
package vn.ieltsapp.backup;

import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/backups")
public class BackupController {
    private final BackupService service;
    private final Clock clock;

    public BackupController(BackupService service, Clock clock) {
        this.service = service;
        this.clock = clock;
    }

    @GetMapping
    public List<BackupInfo> list() { return service.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BackupInfo create() { return service.backupNow("manual"); }

    @PostMapping("/{name}/restore")
    public Map<String, String> restore(@PathVariable String name) {
        service.scheduleRestore(name);
        return Map.of("message", "Đã lên lịch khôi phục. Hãy đóng và mở lại app để hoàn tất.");
    }

    @GetMapping("/export")
    public ResponseEntity<Resource> export() {
        Path file = service.exportToTempFile();
        String filename = "ielts-export-" + LocalDate.now(clock) + ".db";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(new FileSystemResource(file));
    }
}
```

`backup/SettingsController.java`:
```java
package vn.ieltsapp.backup;

import java.awt.Desktop;
import java.awt.GraphicsEnvironment;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.common.AppConfigFile;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    public record SettingsDto(String appHome, String backupDir, String logDir) {}

    public record SettingsUpdate(String backupDir) {}

    private final Path home;

    public SettingsController(@Value("${app.home}") String home) { this.home = Path.of(home); }

    @GetMapping
    public SettingsDto get() {
        return new SettingsDto(home.toString(), BackupFiles.backupDir(home).toString(), home.resolve("logs").toString());
    }

    @PutMapping
    public SettingsDto update(@RequestBody SettingsUpdate request) {
        AppConfigFile config = AppConfigFile.load(home);
        String dir = request.backupDir();
        if (dir == null || dir.isBlank()) {
            config.setBackupDir(null);
        } else {
            Path path;
            try {
                path = Path.of(dir.trim());
            } catch (InvalidPathException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Đường dẫn không hợp lệ");
            }
            if (!path.isAbsolute()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Thư mục phải là đường dẫn tuyệt đối");
            }
            try {
                Files.createDirectories(path);
            } catch (IOException e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION", "Không tạo được thư mục: " + path);
            }
            config.setBackupDir(path.toString());
        }
        config.save();
        return get();
    }

    @PostMapping("/open-logs")
    public ResponseEntity<Void> openLogs() throws IOException {
        if (GraphicsEnvironment.isHeadless() || !Desktop.isDesktopSupported()) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_SUPPORTED", "Không mở được thư mục trên máy này");
        }
        Path logs = Files.createDirectories(home.resolve("logs"));
        Desktop.getDesktop().open(logs.toFile());
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=StartupRestoreTest+PreMigrationBackupTest+BackupApiTest`
Expected: PASS. Nếu `VACUUM INTO ?` báo lỗi cú pháp với tham số bind, đổi sang nối chuỗi có escape (`"VACUUM INTO '" + target.toString().replace("'", "''") + "'"` dùng `Statement`) rồi chạy lại.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(backup): sao lưu tự động/thủ công, khôi phục, cài đặt"
```

---

### Task 15: Xuất/nhập một hồ sơ (JSON)

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileExport.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileTransferService.java`
- Create: `backend/src/main/java/vn/ieltsapp/profile/ProfileTransferController.java`
- Test: `backend/src/test/java/vn/ieltsapp/profile/ProfileTransferApiTest.java`

**Interfaces:**
- Consumes: `ProfileRepository.insert`, `ProfileService.get`, `ProfileDto`.
- Produces: `record ProfileExport(int version, ProfileData profile, List<Map<String,Object>> userWords, cards, reviews, unitProgress, lessonProgress, exerciseAttempts, testResults, studySessions)` và `ProfileExport.ProfileData(name, avatar, pinHash, dailyMinutes, voice, speechRate, createdAt)`. Thẻ và lịch sử ôn tham chiếu từ bằng `word_code` + `user_word` (0/1), không dùng id.
- API: `GET /api/profiles/current/export` (JSON, có `Content-Disposition`), `POST /api/profiles/import` (201 → `{"profile": ProfileDto, "skippedRows": n}`).

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/profile/ProfileTransferApiTest.java`:
```java
package vn.ieltsapp.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import vn.ieltsapp.support.IntegrationTest;

class ProfileTransferApiTest extends IntegrationTest {

    @Test
    void exportThenImportCreatesEquivalentProfile() throws Exception {
        importFixtures();
        MockHttpSession session = newProfileSession("Thành");
        postJson("/api/cards/" + wordId("hello") + "/review", Map.of("grade", "GOOD"), session);
        postJson("/api/words", Map.of("headword", "serendipity", "pos", "noun", "meaningVi", "tình cờ"), session);
        long userWord = jdbc.sql("SELECT id FROM word WHERE headword = 'serendipity'").query(Long.class).single();
        postJson("/api/cards/" + userWord + "/review", Map.of("grade", "EASY"), session);
        postJson("/api/lessons/S0-U01-G1/submit", Map.of("answers", Map.of("S0-U01-G1-E1", "goes")), session);

        String exported = getAs("/api/profiles/current/export", session)
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString(".json")))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        long newId = body(mvc.perform(post("/api/profiles/import").contentType(MediaType.APPLICATION_JSON).content(exported))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.profile.name").value("Thành"))
                .andExpect(jsonPath("$.skippedRows").value(0)))
                .get("profile").get("id").asLong();

        long oldId = jdbc.sql("SELECT MIN(id) FROM profile").query(Long.class).single();
        assertThat(newId).isNotEqualTo(oldId);
        for (String table : new String[] {"card", "review_log", "unit_progress", "lesson_progress", "exercise_attempt"}) {
            int before = jdbc.sql("SELECT COUNT(*) FROM " + table + " WHERE profile_id = ?").param(oldId).query(Integer.class).single();
            int after = jdbc.sql("SELECT COUNT(*) FROM " + table + " WHERE profile_id = ?").param(newId).query(Integer.class).single();
            assertThat(after).as(table).isEqualTo(before).isPositive();
        }
        assertThat(jdbc.sql("SELECT COUNT(*) FROM word WHERE source = 'USER' AND profile_id = ?").param(newId)
                .query(Integer.class).single()).isEqualTo(1);

        MockHttpSession imported = new MockHttpSession();
        postJson("/api/profiles/" + newId + "/select", Map.of(), imported).andExpect(status().isNoContent());
        getAs("/api/words?q=serendipity", imported).andExpect(jsonPath("$[0].status").value("LEARNING"));
    }

    @Test
    void unknownContentRowsAreSkipped() throws Exception {
        String payload = """
                {"version":1,"profile":{"name":"Khách","dailyMinutes":30,"speechRate":1.0,"createdAt":"2026-10-01T09:00"},
                 "userWords":[],"cards":[{"word_code":"khong#co","user_word":0,"ease":2.5,"interval_days":1,
                   "repetitions":1,"lapses":0,"due_date":"2026-10-02","created_at":"2026-10-01T09:00"}],
                 "reviews":[],"unitProgress":[{"unit_code":"S9-U01","status":"ACTIVE","started_at":"2026-10-01T09:00"}],
                 "lessonProgress":[],"exerciseAttempts":[],"testResults":[],"studySessions":[]}
                """;
        mvc.perform(post("/api/profiles/import").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.skippedRows").value(2));
    }

    @Test
    void unsupportedVersionIsRejected() throws Exception {
        mvc.perform(post("/api/profiles/import").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"version\":99,\"profile\":{\"name\":\"X\"}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EXPORT_VERSION"));
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=ProfileTransferApiTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`profile/ProfileExport.java`:
```java
package vn.ieltsapp.profile;

import java.util.List;
import java.util.Map;

public record ProfileExport(int version, ProfileData profile,
                            List<Map<String, Object>> userWords, List<Map<String, Object>> cards,
                            List<Map<String, Object>> reviews, List<Map<String, Object>> unitProgress,
                            List<Map<String, Object>> lessonProgress, List<Map<String, Object>> exerciseAttempts,
                            List<Map<String, Object>> testResults, List<Map<String, Object>> studySessions) {
    public static final int CURRENT_VERSION = 1;

    public record ProfileData(String name, String avatar, String pinHash, Integer dailyMinutes, String voice,
                              Double speechRate, String createdAt) {}
}
```

`profile/ProfileTransferService.java`:
```java
package vn.ieltsapp.profile;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.profile.ProfileExport.ProfileData;

@Service
public class ProfileTransferService {
    public record ImportResult(ProfileDto profile, int skippedRows) {}

    private static final Pattern NAMED_PARAM = Pattern.compile(":([a-z_]+)");

    private final JdbcClient jdbc;
    private final ProfileRepository profiles;
    private final ProfileService profileService;
    private final Clock clock;

    public ProfileTransferService(JdbcClient jdbc, ProfileRepository profiles, ProfileService profileService, Clock clock) {
        this.jdbc = jdbc;
        this.profiles = profiles;
        this.profileService = profileService;
        this.clock = clock;
    }

    public ProfileExport export(long profileId) {
        Profile p = profileService.get(profileId);
        return new ProfileExport(ProfileExport.CURRENT_VERSION,
                new ProfileData(p.name(), p.avatar(), p.pinHash(), p.dailyMinutes(), p.voice(), p.speechRate(), p.createdAt()),
                rows("SELECT code, headword, pos, ipa_us, ipa_uk, meaning_vi, example_en, example_vi, cefr FROM word WHERE profile_id = ?", profileId),
                rows("""
                        SELECT w.code AS word_code, w.profile_id IS NOT NULL AS user_word, c.ease, c.interval_days,
                               c.repetitions, c.lapses, c.due_date, c.created_at
                        FROM card c JOIN word w ON w.id = c.word_id WHERE c.profile_id = ?""", profileId),
                rows("""
                        SELECT w.code AS word_code, w.profile_id IS NOT NULL AS user_word, r.grade, r.prev_interval,
                               r.new_interval, r.reviewed_at
                        FROM review_log r JOIN word w ON w.id = r.word_id WHERE r.profile_id = ?""", profileId),
                rows("SELECT unit_code, status, started_at, completed_at FROM unit_progress WHERE profile_id = ?", profileId),
                rows("SELECT lesson_code, score, completed_at FROM lesson_progress WHERE profile_id = ?", profileId),
                rows("SELECT exercise_code, answer, correct, attempted_at FROM exercise_attempt WHERE profile_id = ?", profileId),
                rows("SELECT test_code, score, passed, taken_at FROM test_result WHERE profile_id = ?", profileId),
                rows("SELECT study_date, state_json, started_at, finished_at, minutes FROM study_session WHERE profile_id = ?", profileId));
    }

    @Transactional
    public ImportResult importProfile(ProfileExport e) {
        if (e.version() != ProfileExport.CURRENT_VERSION || e.profile() == null || e.profile().name() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EXPORT_VERSION", "File hồ sơ không đúng định dạng hoặc phiên bản");
        }
        ProfileData d = e.profile();
        long pid = profiles.insert(d.name(), d.avatar(), d.pinHash(),
                d.dailyMinutes() == null ? 30 : d.dailyMinutes(), d.voice(),
                d.speechRate() == null ? 1.0 : d.speechRate(),
                d.createdAt() == null ? LocalDateTime.now(clock).toString() : d.createdAt());

        Map<String, Long> userWordIds = new HashMap<>();
        for (Map<String, Object> w : nz(e.userWords())) {
            long id = jdbc.sql("""
                            INSERT INTO word (code, headword, pos, ipa_us, ipa_uk, meaning_vi, example_en, example_vi, cefr, source, profile_id)
                            VALUES (:code, :headword, :pos, :ipa_us, :ipa_uk, :meaning_vi, :example_en, :example_vi, :cefr, 'USER', :pid)
                            RETURNING id""")
                    .params(w).param("pid", pid).query(Long.class).single();
            userWordIds.put((String) w.get("code"), id);
        }

        int skipped = 0;
        String cardSql = """
                INSERT INTO card (profile_id, word_id, ease, interval_days, repetitions, lapses, due_date, created_at)
                VALUES (:pid, :wid, :ease, :interval_days, :repetitions, :lapses, :due_date, :created_at)""";
        for (Map<String, Object> c : nz(e.cards())) {
            Long wordId = resolveWord(c, userWordIds);
            if (wordId == null) { skipped++; continue; }
            jdbc.sql(cardSql).params(withNulls(c, cardSql)).param("pid", pid).param("wid", wordId).update();
        }
        String reviewSql = """
                INSERT INTO review_log (profile_id, word_id, grade, prev_interval, new_interval, reviewed_at)
                VALUES (:pid, :wid, :grade, :prev_interval, :new_interval, :reviewed_at)""";
        for (Map<String, Object> r : nz(e.reviews())) {
            Long wordId = resolveWord(r, userWordIds);
            if (wordId == null) { skipped++; continue; }
            jdbc.sql(reviewSql).params(withNulls(r, reviewSql)).param("pid", pid).param("wid", wordId).update();
        }
        skipped += insertIfExists(e.unitProgress(), pid, """
                INSERT INTO unit_progress (profile_id, unit_code, status, started_at, completed_at)
                SELECT :pid, :unit_code, :status, :started_at, :completed_at
                WHERE EXISTS (SELECT 1 FROM unit WHERE code = :unit_code)""");
        skipped += insertIfExists(e.lessonProgress(), pid, """
                INSERT INTO lesson_progress (profile_id, lesson_code, score, completed_at)
                SELECT :pid, :lesson_code, :score, :completed_at
                WHERE EXISTS (SELECT 1 FROM lesson WHERE code = :lesson_code)""");
        skipped += insertIfExists(e.testResults(), pid, """
                INSERT INTO test_result (profile_id, test_code, score, passed, taken_at)
                SELECT :pid, :test_code, :score, :passed, :taken_at
                WHERE EXISTS (SELECT 1 FROM test WHERE code = :test_code)""");
        insertIfExists(e.exerciseAttempts(), pid, """
                INSERT INTO exercise_attempt (profile_id, exercise_code, answer, correct, attempted_at)
                VALUES (:pid, :exercise_code, :answer, :correct, :attempted_at)""");
        insertIfExists(e.studySessions(), pid, """
                INSERT INTO study_session (profile_id, study_date, state_json, started_at, finished_at, minutes)
                VALUES (:pid, :study_date, :state_json, :started_at, :finished_at, :minutes)""");

        return new ImportResult(ProfileDto.from(profileService.get(pid)), skipped);
    }

    private Long resolveWord(Map<String, Object> row, Map<String, Long> userWordIds) {
        String code = (String) row.get("word_code");
        boolean userWord = row.get("user_word") instanceof Number n && n.intValue() == 1;
        if (userWord) return userWordIds.get(code);
        return jdbc.sql("SELECT id FROM word WHERE code = ? AND profile_id IS NULL").param(code)
                .query(Long.class).optional().orElse(null);
    }

    /** Trả về số dòng bị bỏ qua (nội dung không tồn tại trong DB này). */
    private int insertIfExists(List<Map<String, Object>> rows, long pid, String sql) {
        int skipped = 0;
        for (Map<String, Object> row : nz(rows)) {
            if (jdbc.sql(sql).params(withNulls(row, sql)).param("pid", pid).update() == 0) skipped++;
        }
        return skipped;
    }

    /** File cũ có thể thiếu cột cho phép null: điền null cho mọi tham số :ten mà SQL cần nhưng dòng không có. */
    private static Map<String, Object> withNulls(Map<String, Object> row, String sql) {
        Map<String, Object> filled = new HashMap<>(row);
        Matcher m = NAMED_PARAM.matcher(sql);
        while (m.find()) filled.putIfAbsent(m.group(1), null);
        return filled;
    }

    private List<Map<String, Object>> rows(String sql, long profileId) {
        return jdbc.sql(sql).param(profileId).query().listOfRows();
    }

    private static List<Map<String, Object>> nz(List<Map<String, Object>> list) {
        return list == null ? List.of() : list;
    }
}
```

`profile/ProfileTransferController.java`:
```java
package vn.ieltsapp.profile;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.ProfileTransferService.ImportResult;

@RestController
@RequestMapping("/api/profiles")
public class ProfileTransferController {
    private final ProfileTransferService service;

    public ProfileTransferController(ProfileTransferService service) { this.service = service; }

    @GetMapping("/current/export")
    public ResponseEntity<ProfileExport> export(@CurrentProfileId long profileId) {
        String filename = "ielts-hoso-" + profileId + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(service.export(profileId));
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public ImportResult importProfile(@RequestBody ProfileExport export) {
        return service.importProfile(export);
    }
}
```

Lưu ý: `params(Map)` của `JdbcClient` truyền tham số theo tên; key thừa trong map (như `word_code`) sẽ bị bỏ qua. Key bị thiếu được `withNulls` điền null. Nếu cột đó là NOT NULL thì SQLite sẽ báo lỗi, và lúc đó file nhập vào đúng là hỏng.

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=ProfileTransferApiTest`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat(profile): xuất/nhập hồ sơ JSON"
```

---

### Task 16: Trình khởi động (cổng, khôi phục, kiểm tra DB, mở trình duyệt) + nội dung mẫu + chạy thử

**Files:**
- Create: `backend/src/main/java/vn/ieltsapp/launcher/PortProbe.java`
- Create: `backend/src/main/java/vn/ieltsapp/launcher/DbCheck.java`
- Create: `backend/src/main/java/vn/ieltsapp/launcher/BrowserOpener.java`
- Modify: `backend/src/main/java/vn/ieltsapp/IeltsApplication.java` (viết lại `main`)
- Create: `content/stage-0/stage.json`
- Create: `content/stage-0/unit-01.json`
- Test: `backend/src/test/java/vn/ieltsapp/launcher/PortProbeTest.java`
- Test: `backend/src/test/java/vn/ieltsapp/launcher/DbCheckTest.java`

**Interfaces:**
- Consumes: `AppHome`, `AppConfigFile`, `StartupRestore`, `BackupFiles`.
- Produces: `PortProbe.isOurApp(int)`, `PortProbe.isFree(int)`, `PortProbe.choosePort(int preferred)` (thử `preferred..preferred+10`).
- Produces: `DbCheck.ensureUsable(Path home) → Optional<String>` (rỗng = DB ổn hoặc chưa có; tên bản sao lưu đã dùng để khôi phục; `"NONE"` = DB hỏng và không có bản sao lưu nào dùng được).
- Produces: `BrowserOpener.open(String url)`; tự mở trình duyệt khi có `ApplicationReadyEvent` nếu `app.open-browser=true`.

- [ ] **Step 1: Viết test (sẽ fail)**

`backend/src/test/java/vn/ieltsapp/launcher/PortProbeTest.java`:
```java
package vn.ieltsapp.launcher;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetAddress;
import java.net.ServerSocket;
import org.junit.jupiter.api.Test;

class PortProbeTest {

    @Test
    void skipsBusyPortAndStaysInRange() throws Exception {
        try (ServerSocket busy = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            int port = busy.getLocalPort();
            assertThat(PortProbe.isFree(port)).isFalse();
            int chosen = PortProbe.choosePort(port);
            assertThat(chosen).isBetween(port + 1, port + 10);
        }
    }

    @Test
    void busyPortThatIsNotOurAppIsNotRecognised() throws Exception {
        try (ServerSocket busy = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            assertThat(PortProbe.isOurApp(busy.getLocalPort())).isFalse();
        }
    }
}
```

`backend/src/test/java/vn/ieltsapp/launcher/DbCheckTest.java`:
```java
package vn.ieltsapp.launcher;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class DbCheckTest {
    @TempDir Path home;

    static void createDb(Path file) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file)) {
            c.createStatement().execute("CREATE TABLE t (x INTEGER)");
        }
    }

    @Test
    void healthyOrMissingDbNeedsNothing() throws Exception {
        assertThat(DbCheck.ensureUsable(home)).isEmpty();
        createDb(home.resolve("ielts.db"));
        assertThat(DbCheck.ensureUsable(home)).isEmpty();
    }

    @Test
    void corruptDbIsReplacedByNewestHealthyBackup() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "đây không phải SQLite");
        Path backups = Files.createDirectories(home.resolve("backups"));
        createDb(backups.resolve("ielts-20261004-090000-auto.db"));
        Files.writeString(backups.resolve("ielts-20261005-090000-auto.db"), "bản sao cũng hỏng");

        assertThat(DbCheck.ensureUsable(home)).contains("ielts-20261004-090000-auto.db");
        assertThat(DbCheck.isHealthy(home.resolve("ielts.db"))).isTrue();
        try (var files = Files.list(home)) {
            assertThat(files.map(p -> p.getFileName().toString())).anyMatch(n -> n.startsWith("ielts-corrupt-"));
        }
    }

    @Test
    void corruptDbWithoutBackupReportsNone() throws Exception {
        Files.writeString(home.resolve("ielts.db"), "hỏng");
        assertThat(DbCheck.ensureUsable(home)).contains("NONE");
        assertThat(home.resolve("ielts.db")).doesNotExist();
    }
}
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `cd backend && ./mvnw -q test -Dtest=PortProbeTest+DbCheckTest`
Expected: FAIL (lỗi biên dịch).

- [ ] **Step 3: Viết code**

`launcher/PortProbe.java`:
```java
package vn.ieltsapp.launcher;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public final class PortProbe {
    private PortProbe() {}

    public static boolean isOurApp(int port) {
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(500)).build();
            HttpRequest request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/health"))
                    .timeout(Duration.ofSeconds(1)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body().contains("\"app\":\"ielts-app\"");
        } catch (IOException e) {
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    public static boolean isFree(int port) {
        try (ServerSocket ignored = new ServerSocket(port, 1, InetAddress.getLoopbackAddress())) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public static int choosePort(int preferred) {
        for (int port = preferred; port <= preferred + 10; port++) {
            if (isFree(port)) return port;
        }
        throw new IllegalStateException("Không tìm được cổng trống trong khoảng " + preferred + "–" + (preferred + 10));
    }
}
```

`launcher/DbCheck.java`:
```java
package vn.ieltsapp.launcher;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.Optional;
import vn.ieltsapp.backup.BackupFiles;

/** Chạy trong main() trước Spring: DB hỏng thì cất sang bên và lấy bản sao lưu lành gần nhất. */
public final class DbCheck {
    private DbCheck() {}

    public static Optional<String> ensureUsable(Path home) throws IOException {
        Path db = home.resolve("ielts.db");
        if (!Files.exists(db) || isHealthy(db)) return Optional.empty();

        Files.move(db, home.resolve("ielts-corrupt-" + LocalDateTime.now().format(BackupFiles.TS) + ".db"));
        Files.deleteIfExists(home.resolve("ielts.db-wal"));
        Files.deleteIfExists(home.resolve("ielts.db-shm"));
        for (Path backup : BackupFiles.list(BackupFiles.backupDir(home))) {
            if (isHealthy(backup)) {
                Files.copy(backup, db);
                return Optional.of(backup.getFileName().toString());
            }
        }
        return Optional.of("NONE");
    }

    static boolean isHealthy(Path file) {
        try (Connection c = DriverManager.getConnection("jdbc:sqlite:" + file);
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("PRAGMA quick_check")) {
            return rs.next() && "ok".equalsIgnoreCase(rs.getString(1));
        } catch (SQLException e) {
            return false;
        }
    }
}
```

`launcher/BrowserOpener.java`:
```java
package vn.ieltsapp.launcher;

import java.awt.Desktop;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class BrowserOpener {
    private static final Logger log = LoggerFactory.getLogger(BrowserOpener.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onReady(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        if (!env.getProperty("app.open-browser", Boolean.class, true)) return;
        open("http://127.0.0.1:" + env.getProperty("local.server.port", "8765") + "/");
    }

    public static void open(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create(url));
            } else {
                new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
            }
        } catch (Exception e) {
            log.warn("Không mở được trình duyệt, hãy mở {} thủ công", url, e);
        }
    }
}
```

Viết lại `IeltsApplication.java`:
```java
package vn.ieltsapp;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import vn.ieltsapp.backup.StartupRestore;
import vn.ieltsapp.common.AppConfigFile;
import vn.ieltsapp.common.AppHome;
import vn.ieltsapp.launcher.BrowserOpener;
import vn.ieltsapp.launcher.DbCheck;
import vn.ieltsapp.launcher.PortProbe;

@SpringBootApplication
@ConfigurationPropertiesScan
public class IeltsApplication {
    static final int DEFAULT_PORT = 8765;

    public static void main(String[] args) throws IOException {
        Path home = AppHome.resolve();
        Files.createDirectories(home.resolve("logs"));

        Optional<String> restored = StartupRestore.applyPending(home);
        Optional<String> recovered = DbCheck.ensureUsable(home);

        AppConfigFile config = AppConfigFile.load(home);
        int preferred = config.port().orElse(DEFAULT_PORT);
        if (PortProbe.isOurApp(preferred)) {
            BrowserOpener.open("http://127.0.0.1:" + preferred + "/");
            return;
        }
        int port = PortProbe.choosePort(preferred);
        if (config.port().orElse(-1) != port) {
            config.setPort(port);
            config.save();
        }

        List<String> all = new ArrayList<>(List.of(args));
        all.add("--app.home=" + home);
        all.add("--server.port=" + port);
        recovered.ifPresent(r -> all.add("--app.recovered-from=" + r));
        restored.ifPresent(r -> all.add("--app.restored-from=" + r));

        SpringApplication app = new SpringApplication(IeltsApplication.class);
        app.setHeadless(false);
        app.run(all.toArray(String[]::new));
    }
}
```

`content/stage-0/stage.json`:
```json
{
  "code": "S0", "title": "Xây nền", "targetBand": 4.0, "order": 0,
  "test": {
    "code": "S0-T", "kind": "STAGE", "passRatio": 0.7,
    "exercises": [
      {"code": "S0-T-E1", "type": "MCQ", "prompt": "My sister ___ in Hanoi.", "options": ["live", "lives", "living"], "answer": "lives", "explanationVi": "Chủ ngữ ngôi thứ 3 số ít, động từ thêm -s."},
      {"code": "S0-T-E2", "type": "FILL", "prompt": "We ___ (not/like) coffee.", "answer": "don't like|do not like", "explanationVi": "Phủ định hiện tại đơn với we: don't + V."}
    ]
  }
}
```

`content/stage-0/unit-01.json`:
```json
{
  "code": "S0-U01", "stage": "S0", "title": "Chào hỏi & Thì hiện tại đơn", "order": 1,
  "words": [
    {"headword": "hello", "pos": "exclamation", "ipaUs": "/həˈloʊ/", "ipaUk": "/həˈləʊ/", "meaningVi": "xin chào", "exampleEn": "Hello, my name is Lan.", "exampleVi": "Xin chào, tên tôi là Lan.", "cefr": "A1"},
    {"headword": "name", "pos": "noun", "ipaUs": "/neɪm/", "ipaUk": "/neɪm/", "meaningVi": "tên", "exampleEn": "What is your name?", "exampleVi": "Bạn tên là gì?", "cefr": "A1"},
    {"headword": "live", "pos": "verb", "ipaUs": "/lɪv/", "ipaUk": "/lɪv/", "meaningVi": "sống", "exampleEn": "I live in Da Nang.", "exampleVi": "Tôi sống ở Đà Nẵng.", "cefr": "A1"},
    {"headword": "work", "pos": "verb", "ipaUs": "/wɝːk/", "ipaUk": "/wɜːk/", "meaningVi": "làm việc", "exampleEn": "She works in a bank.", "exampleVi": "Cô ấy làm việc ở ngân hàng.", "cefr": "A1"},
    {"headword": "family", "pos": "noun", "ipaUs": "/ˈfæm.əl.i/", "ipaUk": "/ˈfæm.əl.i/", "meaningVi": "gia đình", "exampleEn": "My family is small.", "exampleVi": "Gia đình tôi nhỏ.", "cefr": "A1"}
  ],
  "lessons": [
    {
      "code": "S0-U01-G1", "type": "GRAMMAR", "day": "MON", "title": "Thì hiện tại đơn: khẳng định",
      "bodyMd": "## Thì hiện tại đơn\n\nDùng để nói về **thói quen** và **sự thật**.\n\n- I/You/We/They + V: *I live in Hanoi.*\n- He/She/It + V-s/es: *She lives in Hanoi.*",
      "exercises": [
        {"code": "S0-U01-G1-E1", "type": "MCQ", "prompt": "He ___ in a hospital.", "options": ["work", "works", "working"], "answer": "works", "explanationVi": "He là ngôi thứ 3 số ít nên thêm -s."},
        {"code": "S0-U01-G1-E2", "type": "FILL", "prompt": "They ___ (live) near the sea.", "answer": "live", "explanationVi": "They giữ nguyên động từ."}
      ]
    },
    {
      "code": "S0-U01-P1", "type": "PRONUNCIATION", "day": "TUE", "title": "Âm /ɪ/ và /iː/",
      "bodyMd": "## /ɪ/ ngắn và /iː/ dài\n\n- /ɪ/: *ship, live, sit*\n- /iː/: *sheep, leave, seat*",
      "exercises": [
        {"code": "S0-U01-P1-E1", "type": "MINIMAL_PAIR", "prompt": "live", "options": ["live", "leave"], "answer": "live", "explanationVi": "live có âm /ɪ/ ngắn."}
      ]
    }
  ],
  "test": {
    "code": "S0-U01-T", "kind": "UNIT", "passRatio": 0.6,
    "exercises": [
      {"code": "S0-U01-T-E1", "type": "MCQ", "prompt": "My father ___ in an office.", "options": ["work", "works"], "answer": "works", "explanationVi": "My father = he, thêm -s."},
      {"code": "S0-U01-T-E2", "type": "FILL", "prompt": "I ___ (live) with my family.", "answer": "live", "explanationVi": "I giữ nguyên động từ."}
    ]
  }
}
```

- [ ] **Step 4: Chạy test để thấy pass**

Run: `cd backend && ./mvnw -q test -Dtest=PortProbeTest+DbCheckTest`
Expected: PASS.

- [ ] **Step 5: Chạy toàn bộ test**

Run: `cd backend && ./mvnw -q test`
Expected: PASS toàn bộ, không có test nào bị skip.

- [ ] **Step 6: Chạy thử app thật**

```bash
cd backend && ./mvnw -q package -DskipTests
SMOKE_HOME="$(mktemp -d)"
java -Dapp.home="$SMOKE_HOME" -jar target/ielts-app-0.1.0.jar --app.open-browser=false &
APP_PID=$!
for i in $(seq 1 30); do curl -s http://127.0.0.1:8765/api/health && break; sleep 1; done
curl -s -c /tmp/ielts-cookie -H 'Content-Type: application/json' -d '{"name":"Thử"}' http://127.0.0.1:8765/api/profiles
curl -s -b /tmp/ielts-cookie -c /tmp/ielts-cookie -X POST -H 'Content-Type: application/json' -d '{}' http://127.0.0.1:8765/api/profiles/1/select
curl -s -b /tmp/ielts-cookie http://127.0.0.1:8765/api/session/today
kill $APP_PID
ls "$SMOKE_HOME"
```
Expected:
- `/api/health` trả `{"app":"ielts-app","status":"UP",...}`.
- `/api/session/today` trả `"step":"NEW"`, `currentCard.headword` = `"hello"`, `lessonCode` là `"S0-U01-G1"` hoặc bài khác tùy thứ trong tuần.
- Thư mục `$SMOKE_HOME` có `ielts.db`, `config.yml` (chứa `port: 8765`), `logs/`.

Nếu cổng 8765 đang bận trên máy, đọc cổng thực tế trong `$SMOKE_HOME/config.yml` rồi dùng cổng đó.

- [ ] **Step 7: Commit**

```bash
git add backend content
git commit -m "feat(launcher): chọn cổng, khôi phục khi khởi động, kiểm tra DB, mở trình duyệt; nội dung mẫu S0-U01"
```
