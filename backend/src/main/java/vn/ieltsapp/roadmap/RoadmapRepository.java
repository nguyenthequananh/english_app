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
