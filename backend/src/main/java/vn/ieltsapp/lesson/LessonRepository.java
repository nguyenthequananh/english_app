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
