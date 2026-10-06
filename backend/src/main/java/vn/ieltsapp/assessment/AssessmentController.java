package vn.ieltsapp.assessment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.lesson.SubmitAnswersRequest;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
@RequestMapping("/api")
public class AssessmentController {
    private final AssessmentService service;

    public AssessmentController(AssessmentService service) { this.service = service; }

    @GetMapping("/units/{unitCode}/test")
    public TestDto unitTest(@CurrentProfileId long profileId, @PathVariable String unitCode) {
        return service.unitTest(profileId, unitCode);
    }

    @GetMapping("/stages/{stageCode}/test")
    public TestDto stageTest(@CurrentProfileId long profileId, @PathVariable String stageCode) {
        return service.stageTest(profileId, stageCode);
    }

    @PostMapping("/tests/{code}/submit")
    public TestResultDto submit(@CurrentProfileId long profileId, @PathVariable String code,
                                @Valid @RequestBody SubmitAnswersRequest request) {
        return service.submit(profileId, code, request.answers());
    }
}
