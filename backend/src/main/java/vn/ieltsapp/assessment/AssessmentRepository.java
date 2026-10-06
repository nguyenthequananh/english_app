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
