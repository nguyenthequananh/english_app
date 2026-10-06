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
