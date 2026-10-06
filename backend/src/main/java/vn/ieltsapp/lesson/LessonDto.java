package vn.ieltsapp.lesson;

import java.util.List;

public record LessonDto(String code, String unitCode, String type, String day, String title, String bodyMd,
                        List<ExerciseView> exercises, Double bestScore) {}
