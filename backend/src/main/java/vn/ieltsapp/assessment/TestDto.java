package vn.ieltsapp.assessment;

import java.util.List;
import vn.ieltsapp.lesson.ExerciseView;

public record TestDto(String code, String kind, double passRatio, List<ExerciseView> exercises) {}
