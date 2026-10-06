package vn.ieltsapp.lesson;

import java.util.List;

public record LessonSubmitResult(double score, List<ExerciseResult> results) {}
