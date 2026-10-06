package vn.ieltsapp.lesson;

import java.util.List;

public record GradedAnswers(List<ExerciseResult> results, double score) {}
