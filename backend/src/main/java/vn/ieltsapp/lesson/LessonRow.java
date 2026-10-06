package vn.ieltsapp.lesson;

public record LessonRow(String code, String unitCode, String type, String day, String title, String bodyMd,
                        int sortOrder) {}
