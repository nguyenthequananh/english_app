package vn.ieltsapp.lesson;

import java.util.List;

public record ExerciseView(String code, String type, String prompt, List<String> options) {
    public static ExerciseView from(ExerciseRow row) {
        return new ExerciseView(row.code(), row.type(), row.prompt(), row.options());
    }
}
