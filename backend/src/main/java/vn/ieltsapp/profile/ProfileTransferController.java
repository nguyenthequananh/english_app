package vn.ieltsapp.profile;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.ieltsapp.profile.ProfileTransferService.ImportResult;

@RestController
@RequestMapping("/api/profiles")
public class ProfileTransferController {
    private final ProfileTransferService service;

    public ProfileTransferController(ProfileTransferService service) { this.service = service; }

    @GetMapping("/current/export")
    public ResponseEntity<ProfileExport> export(@CurrentProfileId long profileId) {
        String filename = "ielts-hoso-" + profileId + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(service.export(profileId));
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public ImportResult importProfile(@RequestBody ProfileExport export) {
        return service.importProfile(export);
    }
}
