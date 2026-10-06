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
