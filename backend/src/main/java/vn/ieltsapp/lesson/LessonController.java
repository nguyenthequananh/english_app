package vn.ieltsapp.lesson;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
@RequestMapping("/api")
public class LessonController {
    private final LessonService service;

    public LessonController(LessonService service) { this.service = service; }

    @GetMapping("/lessons/{code}")
    public LessonDto get(@CurrentProfileId long profileId, @PathVariable String code) {
        return service.get(profileId, code);
    }

    @PostMapping("/lessons/{code}/submit")
    public LessonSubmitResult submit(@CurrentProfileId long profileId, @PathVariable String code,
                                     @Valid @RequestBody SubmitAnswersRequest request) {
        return service.submit(profileId, code, request.answers());
    }

    @GetMapping("/units/{unitCode}/lessons")
    public List<LessonSummary> unitLessons(@CurrentProfileId long profileId, @PathVariable String unitCode) {
        return service.unitLessons(profileId, unitCode);
    }
}
