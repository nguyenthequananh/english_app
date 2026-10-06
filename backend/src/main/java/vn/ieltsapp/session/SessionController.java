package vn.ieltsapp.session;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.CurrentProfileId;
import vn.ieltsapp.vocab.ReviewRequest;

@RestController
@RequestMapping("/api/session/today")
public class SessionController {
    private final SessionService service;

    public SessionController(SessionService service) { this.service = service; }

    @GetMapping
    public SessionView today(@CurrentProfileId long profileId) { return service.today(profileId); }

    @PostMapping("/cards/{wordId}")
    public SessionView answer(@CurrentProfileId long profileId, @PathVariable long wordId,
                              @Valid @RequestBody ReviewRequest request) {
        return service.answerCard(profileId, wordId, request.grade());
    }
}
