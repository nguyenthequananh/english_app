package vn.ieltsapp.assessment;

import java.util.List;
import vn.ieltsapp.lesson.ExerciseResult;

public record TestResultDto(double score, boolean passed, List<ExerciseResult> results, List<String> weakUnits) {}
