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
