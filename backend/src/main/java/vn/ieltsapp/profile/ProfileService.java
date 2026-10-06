package vn.ieltsapp.profile;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;

@Service
public class ProfileService {
    private final ProfileRepository repo;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public ProfileService(ProfileRepository repo, ApplicationEventPublisher events, Clock clock) {
        this.repo = repo;
        this.events = events;
        this.clock = clock;
    }

    public List<ProfileDto> list() {
        return repo.findAll().stream().map(ProfileDto::from).toList();
    }

    public Profile get(long id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("hồ sơ"));
    }

    @Transactional
    public ProfileDto create(CreateProfileRequest r) {
        long id = repo.insert(r.name().trim(), r.avatar(), hashPin(r.pin()),
                r.dailyMinutes() == null ? 30 : r.dailyMinutes(), r.voice(), 1.0,
                LocalDateTime.now(clock).toString());
        events.publishEvent(new ProfileCreatedEvent(id));
        return ProfileDto.from(get(id));
    }

    public void verifyPin(long id, String pin) {
        Profile p = get(id);
        if (p.pinHash() != null && (pin == null || !encoder.matches(pin, p.pinHash()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "PIN_INVALID", "Mã PIN không đúng");
        }
    }

    @Transactional
    public ProfileDto update(long id, UpdateProfileRequest r) {
        Profile p = get(id);
        String pinHash = p.pinHash();
        if (Boolean.TRUE.equals(r.removePin())) {
            pinHash = null;
        } else if (r.pin() != null) {
            pinHash = hashPin(r.pin());
        }
        Profile updated = new Profile(p.id(),
                r.name() != null ? r.name().trim() : p.name(),
                r.avatar() != null ? r.avatar() : p.avatar(),
                pinHash,
                r.dailyMinutes() != null ? r.dailyMinutes() : p.dailyMinutes(),
                r.voice() != null ? r.voice() : p.voice(),
                r.speechRate() != null ? r.speechRate() : p.speechRate(),
                p.createdAt());
        repo.update(updated);
        return ProfileDto.from(updated);
    }

    @Transactional
    public void delete(long id) {
        repo.delete(id);
    }

    private String hashPin(String pin) {
        return pin == null || pin.isBlank() ? null : encoder.encode(pin);
    }
}
