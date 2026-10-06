package vn.ieltsapp.profile;

import java.util.List;
import java.util.Map;

public record ProfileExport(int version, ProfileData profile,
                            List<Map<String, Object>> userWords, List<Map<String, Object>> cards,
                            List<Map<String, Object>> reviews, List<Map<String, Object>> unitProgress,
                            List<Map<String, Object>> lessonProgress, List<Map<String, Object>> exerciseAttempts,
                            List<Map<String, Object>> testResults, List<Map<String, Object>> studySessions) {
    public static final int CURRENT_VERSION = 1;

    public record ProfileData(String name, String avatar, String pinHash, Integer dailyMinutes, String voice,
                              Double speechRate, String createdAt) {}
}
