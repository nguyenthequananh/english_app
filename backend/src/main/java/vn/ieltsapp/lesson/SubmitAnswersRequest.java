package vn.ieltsapp.lesson;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record SubmitAnswersRequest(@NotNull Map<String, String> answers) {}
