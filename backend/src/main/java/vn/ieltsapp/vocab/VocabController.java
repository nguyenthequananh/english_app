package vn.ieltsapp.vocab;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
@RequestMapping("/api")
public class VocabController {
    private final VocabService service;

    public VocabController(VocabService service) { this.service = service; }

    @PostMapping("/cards/{wordId}/review")
    public CardState review(@CurrentProfileId long profileId, @PathVariable long wordId,
                            @Valid @RequestBody ReviewRequest request) {
        return service.review(profileId, wordId, request.grade());
    }

    @GetMapping("/cards/due")
    public List<WordDto> due(@CurrentProfileId long profileId, @RequestParam(defaultValue = "60") int limit) {
        return service.dueCards(profileId, Math.max(1, Math.min(limit, 200)));
    }

    @GetMapping("/words")
    public List<WordBankItem> search(@CurrentProfileId long profileId, @RequestParam(required = false) String q,
                                     @RequestParam(required = false) WordStatus status) {
        return service.search(profileId, q, status);
    }

    @PostMapping("/words")
    @ResponseStatus(HttpStatus.CREATED)
    public WordDto add(@CurrentProfileId long profileId, @Valid @RequestBody AddWordRequest request) {
        return service.addUserWord(profileId, request);
    }
}
