package vn.ieltsapp.profile;

public record Profile(long id, String name, String avatar, String pinHash, int dailyMinutes,
                      String voice, double speechRate, String createdAt) {}
