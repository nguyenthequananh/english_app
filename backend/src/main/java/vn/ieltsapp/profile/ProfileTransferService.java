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
        // Chỉ nhập buổi học đã xong: buổi dở dang tham chiếu id từ của DB cũ, không dùng lại được.
        skipped += insertIfExists(e.studySessions(), pid, """
                INSERT INTO study_session (profile_id, study_date, state_json, started_at, finished_at, minutes)
                SELECT :pid, :study_date, :state_json, :started_at, :finished_at, :minutes
                WHERE :finished_at IS NOT NULL""");

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
