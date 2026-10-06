package vn.ieltsapp.progress;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ieltsapp.profile.CurrentProfileId;
import vn.ieltsapp.progress.ProgressDtos.Stats;
import vn.ieltsapp.progress.ProgressDtos.Summary;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
    private final ProgressService service;

    public ProgressController(ProgressService service) { this.service = service; }

    @GetMapping("/summary")
    public Summary summary(@CurrentProfileId long profileId) { return service.summary(profileId); }

    @GetMapping("/stats")
    public Stats stats(@CurrentProfileId long profileId) { return service.stats(profileId); }
}
