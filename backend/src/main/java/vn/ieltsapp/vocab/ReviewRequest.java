package vn.ieltsapp.vocab;

import jakarta.validation.constraints.NotNull;

public record ReviewRequest(@NotNull Grade grade) {}
