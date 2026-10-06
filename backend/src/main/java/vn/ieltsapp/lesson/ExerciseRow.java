package vn.ieltsapp.lesson;

import java.util.List;

public record ExerciseRow(String code, String type, String prompt, List<String> options, String answer,
                          String explanationVi) {}
