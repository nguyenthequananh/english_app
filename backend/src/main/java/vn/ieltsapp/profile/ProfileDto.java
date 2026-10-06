package vn.ieltsapp.profile;

public record ProfileDto(long id, String name, String avatar, boolean hasPin, int dailyMinutes,
                         String voice, double speechRate) {
    public static ProfileDto from(Profile p) {
        return new ProfileDto(p.id(), p.name(), p.avatar(), p.pinHash() != null, p.dailyMinutes(),
                p.voice(), p.speechRate());
    }
}
