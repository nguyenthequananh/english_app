package vn.ieltsapp.content;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;

@RestController
public class ContentController {
    private final ContentService service;

    public ContentController(ContentService service) { this.service = service; }

    @PostMapping(path = "/api/content/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<ImportResult> importFiles(@RequestParam("files") List<MultipartFile> files) throws IOException {
        List<NamedContent> contents = new ArrayList<>();
        for (MultipartFile f : files) {
            contents.add(new NamedContent(f.getOriginalFilename(), f.getBytes()));
        }
        return service.importFiles(contents);
    }
}
