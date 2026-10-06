package vn.ieltsapp.content;

import java.util.List;

public final class ContentModel {
    private ContentModel() {}

    public record StageFile(String code, String title, Double targetBand, Integer order, TestDef test) {}

    public record UnitFile(String code, String stage, String title, Integer order,
                           List<WordDef> words, List<LessonDef> lessons, TestDef test) {}

    public record WordDef(String headword, String pos, String ipaUs, String ipaUk, String meaningVi,
                          String exampleEn, String exampleVi, String cefr, String source) {}

    public record LessonDef(String code, String type, String day, String title, String bodyMd,
                            List<ExerciseDef> exercises) {}

    public record ExerciseDef(String code, String type, String prompt, List<String> options,
                              String answer, String explanationVi) {}

    public record TestDef(String code, String kind, Double passRatio, List<ExerciseDef> exercises) {}
}
