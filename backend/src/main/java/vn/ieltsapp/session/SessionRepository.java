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

    public boolean lessonCompleted(long profileId, String lessonCode) {
        return jdbc.sql("SELECT COUNT(*) FROM lesson_progress WHERE profile_id = ? AND lesson_code = ?")
                .params(profileId, lessonCode).query(Integer.class).single() > 0;
    }
}
