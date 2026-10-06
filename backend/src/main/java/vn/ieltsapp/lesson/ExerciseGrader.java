package vn.ieltsapp.lesson;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class ExerciseGrader {
    private ExerciseGrader() {}

    public static boolean isCorrect(String type, String answer, String given) {
        if (given == null) return false;
        if ("FILL".equals(type)) {
            String g = normalize(given);
            return Arrays.stream(answer.split("\\|")).map(ExerciseGrader::normalize).anyMatch(g::equals);
        }
        return answer.equals(given.trim());
    }

    public static GradedAnswers gradeAll(List<ExerciseRow> rows, Map<String, String> answers) {
        List<ExerciseResult> results = new ArrayList<>();
        int correct = 0;
        for (ExerciseRow row : rows) {
            String given = answers.get(row.code());
            boolean ok = isCorrect(row.type(), row.answer(), given);
            if (ok) correct++;
            results.add(new ExerciseResult(row.code(), given, ok, row.answer().split("\\|")[0], row.explanationVi()));
        }
        double score = rows.isEmpty() ? 1.0 : (double) correct / rows.size();
        return new GradedAnswers(results, score);
    }

    static String normalize(String s) {
        return s.trim().toLowerCase(Locale.ROOT).replace('’', '\'').replaceAll("\\s+", " ");
    }
}
