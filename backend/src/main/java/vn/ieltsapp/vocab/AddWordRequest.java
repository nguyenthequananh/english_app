package vn.ieltsapp.vocab;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddWordRequest(
        @NotBlank @Size(max = 60) String headword,
        @NotBlank @Size(max = 30) String pos,
        @Size(max = 60) String ipaUs,
        @NotBlank @Size(max = 200) String meaningVi,
        @Size(max = 300) String exampleEn,
        @Size(max = 300) String exampleVi) {}
