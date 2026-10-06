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
