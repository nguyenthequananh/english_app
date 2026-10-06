package vn.ieltsapp.vocab;

import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class VocabRepository {
    static final RowMapper<WordDto> WORD = (rs, n) -> new WordDto(rs.getLong("id"), rs.getString("headword"),
            rs.getString("pos"), rs.getString("ipa_us"), rs.getString("ipa_uk"), rs.getString("meaning_vi"),
            rs.getString("example_en"), rs.getString("example_vi"), rs.getString("cefr"), rs.getString("source"));

    private final JdbcClient jdbc;

    public VocabRepository(JdbcClient jdbc) { this.jdbc = jdbc; }

    public Optional<WordDto> findWord(long profileId, long wordId) {
        return jdbc.sql("SELECT * FROM word WHERE id = ? AND (profile_id IS NULL OR profile_id = ?)")
                .params(wordId, profileId).query(WORD).optional();
    }

    public List<WordDto> findWords(List<Long> ids) {
        if (ids.isEmpty()) return List.of();
        Map<Long, WordDto> byId = jdbc.sql("SELECT * FROM word WHERE id IN (:ids)").param("ids", ids)
                .query(WORD).list().stream().collect(Collectors.toMap(WordDto::id, Function.identity()));
        return ids.stream().map(byId::get).filter(Objects::nonNull).toList();
    }

    public Optional<CardState> findCard(long profileId, long wordId) {
        return jdbc.sql("SELECT * FROM card WHERE profile_id = ? AND word_id = ?").params(profileId, wordId)
                .query((rs, n) -> new CardState(rs.getDouble("ease"), rs.getInt("interval_days"),
                        rs.getInt("repetitions"), rs.getInt("lapses"), LocalDate.parse(rs.getString("due_date"))))
                .optional();
    }

    public void saveCard(long profileId, long wordId, CardState s, String now) {
        jdbc.sql("""
                        INSERT INTO card (profile_id, word_id, ease, interval_days, repetitions, lapses, due_date, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (profile_id, word_id) DO UPDATE SET ease = excluded.ease,
                            interval_days = excluded.interval_days, repetitions = excluded.repetitions,
                            lapses = excluded.lapses, due_date = excluded.due_date""")
                .params(profileId, wordId, s.ease(), s.intervalDays(), s.repetitions(), s.lapses(),
                        s.dueDate().toString(), now)
                .update();
    }

    public void logReview(long profileId, long wordId, Grade grade, int prevInterval, int newInterval, String now) {
        jdbc.sql("""
                        INSERT INTO review_log (profile_id, word_id, grade, prev_interval, new_interval, reviewed_at)
                        VALUES (?, ?, ?, ?, ?, ?)""")
                .params(profileId, wordId, grade.name(), prevInterval, newInterval, now).update();
    }

    public List<Long> dueWordIds(long profileId, LocalDate day, int limit) {
        return jdbc.sql("""
                        SELECT word_id FROM card WHERE profile_id = ? AND due_date <= ?
                        ORDER BY due_date, word_id LIMIT ?""")
                .params(profileId, day.toString(), limit).query(Long.class).list();
    }

    public int countDue(long profileId, LocalDate day) {
        return jdbc.sql("SELECT COUNT(*) FROM card WHERE profile_id = ? AND due_date <= ?")
                .params(profileId, day.toString()).query(Integer.class).single();
    }

    public List<Long> unlearnedWordIds(long profileId, String unitCode, int limit) {
        return jdbc.sql("""
                        SELECT uw.word_id FROM unit_word uw
                        WHERE uw.unit_code = ?
                          AND NOT EXISTS (SELECT 1 FROM card c WHERE c.profile_id = ? AND c.word_id = uw.word_id)
                        ORDER BY uw.sort_order LIMIT ?""")
                .params(unitCode, profileId, limit).query(Long.class).list();
    }

    public List<WordBankItem> search(long profileId, String like, String status) {
        return jdbc.sql("""
                        SELECT * FROM (
                            SELECT w.*, c.due_date,
                                   CASE WHEN c.word_id IS NULL THEN 'NEW'
                                        WHEN c.interval_days >= 21 THEN 'KNOWN'
                                        ELSE 'LEARNING' END AS status
                            FROM word w
                            LEFT JOIN card c ON c.word_id = w.id AND c.profile_id = :pid
                            WHERE (w.profile_id IS NULL OR w.profile_id = :pid)
                              AND (:like IS NULL OR w.headword LIKE :like OR w.meaning_vi LIKE :like)
                        )
                        WHERE (:status IS NULL OR status = :status)
                        ORDER BY headword LIMIT 200""")
                .param("pid", profileId).param("like", like).param("status", status)
                .query((rs, n) -> new WordBankItem(WORD.mapRow(rs, n), rs.getString("status"), rs.getString("due_date")))
                .list();
    }

    public boolean wordCodeVisible(long profileId, String code) {
        return jdbc.sql("SELECT COUNT(*) FROM word WHERE code = ? AND (profile_id IS NULL OR profile_id = ?)")
                .params(code, profileId).query(Integer.class).single() > 0;
    }

    public long insertUserWord(long profileId, String code, AddWordRequest r) {
        return jdbc.sql("""
                        INSERT INTO word (code, headword, pos, ipa_us, meaning_vi, example_en, example_vi, source, profile_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'USER', ?) RETURNING id""")
                .params(code, r.headword().trim(), r.pos().trim(), r.ipaUs(), r.meaningVi(), r.exampleEn(),
                        r.exampleVi(), profileId)
                .query(Long.class).single();
    }
}
