package vn.ieltsapp.roadmap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.core.io.ClassPathResource;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;
import vn.ieltsapp.support.TestDb;
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

    private void importFile(String name, byte[] bytes) {
        List<ImportResult> results = contentService.importFiles(List.of(new NamedContent(name, bytes)));
        assertThat(results).allMatch(ImportResult::ok, results.toString());
    }

    private void passStageTest(String stageCode, String testCode) {
        jdbc.sql("INSERT INTO test_result (profile_id, test_code, score, passed, taken_at) VALUES (?, ?, 1.0, 1, '2026-10-05T09:00')")
                .params(pid, testCode).update();
        roadmap.onStageTestPassed(pid, stageCode);
    }

    private static final String UNIT_S0_U03 = """
            {"code":"S0-U03","stage":"S0","title":"Unit mới","order":3,"words":[],
             "lessons":[{"code":"S0-U03-G1","type":"GRAMMAR","day":"MON","title":"t","bodyMd":"b","exercises":[]}],
             "test":{"code":"S0-U03-T","kind":"UNIT","exercises":[{"code":"S0-U03-T-E1","type":"FILL","prompt":"p","answer":"a"}]}}
            """;

    @Test
    void unitAddedToFinishedStageOpensAndNextStageStaysOpen() {
        roadmap.onUnitTestPassed(pid, "S0-U01");
        roadmap.onUnitTestPassed(pid, "S0-U02");
        passStageTest("S0", "S0-T");
        assertThat(status("S1-U01")).isEqualTo("ACTIVE");

        importFile("unit-s0-u03.json", UNIT_S0_U03.getBytes(StandardCharsets.UTF_8));

        assertThat(status("S0-U03")).isEqualTo("ACTIVE");
        assertThat(roadmap.stageUnitsDone(pid, "S0")).isFalse();
        assertThat(status("S1-U01")).isEqualTo("ACTIVE");
        assertThatCode(() -> roadmap.requireUnitOpen(pid, "S0-U03")).doesNotThrowAnyException();
    }

    @Test
    void nextStageImportedAfterStageTestPassedOpensItsFirstUnit() {
        roadmap.onUnitTestPassed(pid, "S0-U01");
        roadmap.onUnitTestPassed(pid, "S0-U02");
        passStageTest("S0", "S0-T");
        // Giả lập chặng S1 được nạp sau khi đã qua chặng S0: chưa có dòng tiến độ nào cho S1-U01.
        jdbc.sql("DELETE FROM unit_progress WHERE unit_code = 'S1-U01'").update();
        assertThat(status("S1-U01")).isEqualTo("ACTIVE");
    }

    @Test
    void unitAddedAfterLastUnitWasPassedOpens() throws Exception {
        TestDb.clear(jdbc);
        for (String name : List.of("stage-s0.json", "unit-s0-u01.json")) {
            importFile(name, new ClassPathResource("fixtures/" + name).getContentAsByteArray());
        }
        newProfileSession("Lan");
        pid = jdbc.sql("SELECT id FROM profile").query(Long.class).single();
        roadmap.onUnitTestPassed(pid, "S0-U01");
        assertThat(roadmap.currentUnit(pid)).isEmpty();

        importFile("unit-s0-u02.json", new ClassPathResource("fixtures/unit-s0-u02.json").getContentAsByteArray());

        assertThat(status("S0-U02")).isEqualTo("ACTIVE");
        assertThat(roadmap.currentUnit(pid)).map(UnitRow::code).contains("S0-U02");
    }
}
