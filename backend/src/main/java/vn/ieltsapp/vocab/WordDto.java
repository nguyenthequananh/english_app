package vn.ieltsapp.vocab;

public record WordDto(long id, String headword, String pos, String ipaUs, String ipaUk, String meaningVi,
                      String exampleEn, String exampleVi, String cefr, String source) {}
