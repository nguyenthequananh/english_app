package vn.ieltsapp.profile;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService service) { this.service = service; }

    @GetMapping
    public List<ProfileDto> list() { return service.list(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileDto create(@Valid @RequestBody CreateProfileRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/select")
    public ResponseEntity<Void> select(@PathVariable long id,
                                       @RequestBody(required = false) SelectProfileRequest request,
                                       HttpSession session) {
        service.verifyPin(id, request == null ? null : request.pin());
        session.setAttribute(CurrentProfileIdResolver.SESSION_KEY, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/current")
    public ProfileDto current(@CurrentProfileId long profileId) {
        return ProfileDto.from(service.get(profileId));
    }

    @PutMapping("/current")
    public ProfileDto update(@CurrentProfileId long profileId, @Valid @RequestBody UpdateProfileRequest request) {
        return service.update(profileId, request);
    }

    @DeleteMapping("/current")
    public ResponseEntity<Void> delete(@CurrentProfileId long profileId, HttpSession session) {
        service.delete(profileId);
        session.invalidate();
        return ResponseEntity.noContent().build();
    }
}
