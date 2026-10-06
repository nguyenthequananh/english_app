package vn.ieltsapp.roadmap;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.ieltsapp.profile.CurrentProfileId;

@RestController
public class RoadmapController {
    private final RoadmapService service;

    public RoadmapController(RoadmapService service) { this.service = service; }

    @GetMapping("/api/roadmap")
    public RoadmapView roadmap(@CurrentProfileId long profileId) { return service.view(profileId); }
}
