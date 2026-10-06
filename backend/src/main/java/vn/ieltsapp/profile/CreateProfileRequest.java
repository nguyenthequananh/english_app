package vn.ieltsapp.profile;

import jakarta.validation.constraints.*;

public record CreateProfileRequest(
        @NotBlank @Size(max = 30) String name,
        @Size(max = 16) String avatar,
        @Pattern(regexp = "\\d{4,6}", message = "PIN gồm 4–6 chữ số") String pin,
        @Min(10) @Max(240) Integer dailyMinutes,
        @Size(max = 100) String voice) {}
