package vn.ieltsapp.content;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import vn.ieltsapp.common.WordCode;
import vn.ieltsapp.content.ContentModel.*;

@Repository
public class ContentRepository {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;

    public ContentRepository(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public Set<String> stageCodes() {
        return new HashSet<>(jdbc.sql("SELECT code FROM stage").query(String.class).list());
    }

    public Optional<String> lessonUnit(String code) {
        return jdbc.sql("SELECT unit_code FROM lesson WHERE code = ?").param(code).query(String.class).optional();
    }

    public Optional<String> exerciseLesson(String code) {
        return jdbc.sql("SELECT lesson_code FROM exercise WHERE code = ?").param(code).query(String.class).optional();
    }

    public Optional<String> exerciseTest(String code) {
        return jdbc.sql("SELECT test_code FROM exercise WHERE code = ?").param(code).query(String.class).optional();
    }

    public boolean exerciseExists(String code) {
        return jdbc.sql("SELECT COUNT(*) FROM exercise WHERE code = ?").param(code).query(Integer.class).single() > 0;
    }

    public boolean testExists(String code) {
        return jdbc.sql("SELECT COUNT(*) FROM test WHERE code = ?").param(code).query(Integer.class).single() > 0;
    }

    public Optional<String> testUnit(String code) {
        return jdbc.sql("SELECT unit_code FROM test WHERE code = ?").param(code).query(String.class).optional();
    }

    public Optional<String> testStage(String code) {
        return jdbc.sql("SELECT stage_code FROM test WHERE code = ?").param(code).query(String.class).optional();
    }

    public void upsertStage(StageFile f) {
        jdbc.sql("""
                        INSERT INTO stage (code, title, target_band, sort_order) VALUES (?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET title = excluded.title,
                            target_band = excluded.target_band, sort_order = excluded.sort_order""")
                .params(f.code(), f.title(), f.targetBand(), f.order()).update();
    }

    public void upsertUnit(UnitFile f) {
        jdbc.sql("""
                        INSERT INTO unit (code, stage_code, title, sort_order) VALUES (?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET stage_code = excluded.stage_code,
                            title = excluded.title, sort_order = excluded.sort_order""")
                .params(f.code(), f.stage(), f.title(), f.order()).update();
    }

    public long upsertGlobalWord(WordDef w) {
        String code = WordCode.of(w.headword(), w.pos());
        String source = w.source() == null ? "OXFORD" : w.source();
        Optional<Long> existing = jdbc.sql("SELECT id FROM word WHERE code = ? AND profile_id IS NULL")
                .param(code).query(Long.class).optional();
        if (existing.isPresent()) {
            jdbc.sql("""
                            UPDATE word SET headword = ?, pos = ?, ipa_us = ?, ipa_uk = ?, meaning_vi = ?,
                                example_en = ?, example_vi = ?, cefr = ?, source = ?
                            WHERE id = ?""")
                    .params(w.headword().trim(), w.pos().trim(), w.ipaUs(), w.ipaUk(), w.meaningVi(),
                            w.exampleEn(), w.exampleVi(), w.cefr(), source, existing.get())
                    .update();
            return existing.get();
        }
        return jdbc.sql("""
                        INSERT INTO word (code, headword, pos, ipa_us, ipa_uk, meaning_vi, example_en, example_vi, cefr, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id""")
                .params(code, w.headword().trim(), w.pos().trim(), w.ipaUs(), w.ipaUk(), w.meaningVi(),
                        w.exampleEn(), w.exampleVi(), w.cefr(), source)
                .query(Long.class).single();
    }

    public void replaceUnitWords(String unitCode, List<Long> wordIds) {
        jdbc.sql("DELETE FROM unit_word WHERE unit_code = ?").param(unitCode).update();
        for (int i = 0; i < wordIds.size(); i++) {
            jdbc.sql("INSERT INTO unit_word (unit_code, word_id, sort_order) VALUES (?, ?, ?)")
                    .params(unitCode, wordIds.get(i), i + 1).update();
        }
    }

    public void upsertLesson(String unitCode, LessonDef l, int sortOrder) {
        jdbc.sql("""
                        INSERT INTO lesson (code, unit_code, type, day, title, body_md, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET unit_code = excluded.unit_code, type = excluded.type,
                            day = excluded.day, title = excluded.title, body_md = excluded.body_md,
                            sort_order = excluded.sort_order""")
                .params(l.code(), unitCode, l.type(), l.day(), l.title(), l.bodyMd(), sortOrder).update();
    }

    public void upsertTest(TestDef t, String unitCode, String stageCode) {
        double passRatio = t.passRatio() != null ? t.passRatio() : ("UNIT".equals(t.kind()) ? 0.6 : 0.7);
        jdbc.sql("""
                        INSERT INTO test (code, kind, unit_code, stage_code, pass_ratio) VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET kind = excluded.kind, unit_code = excluded.unit_code,
                            stage_code = excluded.stage_code, pass_ratio = excluded.pass_ratio""")
                .params(t.code(), t.kind(), unitCode, stageCode, passRatio).update();
    }

    public void upsertExercise(ExerciseDef x, String lessonCode, String testCode, int sortOrder) {
        jdbc.sql("""
                        INSERT INTO exercise (code, lesson_code, test_code, type, prompt, options_json, answer, explanation_vi, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (code) DO UPDATE SET lesson_code = excluded.lesson_code,
                            test_code = excluded.test_code, type = excluded.type, prompt = excluded.prompt,
                            options_json = excluded.options_json, answer = excluded.answer,
                            explanation_vi = excluded.explanation_vi, sort_order = excluded.sort_order""")
                .params(x.code(), lessonCode, testCode, x.type(), x.prompt(), toJson(x.options()), x.answer(),
                        x.explanationVi(), sortOrder)
                .update();
    }

    private String toJson(List<String> options) {
        if (options == null) return null;
        try {
            return mapper.writeValueAsString(options);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
