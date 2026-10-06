package vn.ieltsapp.profile;

import jakarta.validation.constraints.*;

/** Trường null = giữ nguyên. */
public record UpdateProfileRequest(
        @Pattern(regexp = ".*\\S.*", message = "không được để trống") @Size(max = 30) String name,
        @Size(max = 16) String avatar,
        @Pattern(regexp = "\\d{4,6}", message = "PIN gồm 4–6 chữ số") String pin,
        Boolean removePin,
        @Min(10) @Max(240) Integer dailyMinutes,
        @Size(max = 100) String voice,
        @DecimalMin("0.5") @DecimalMax("2.0") Double speechRate) {}
