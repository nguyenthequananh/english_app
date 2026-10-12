package vn.ieltsapp.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;
import vn.ieltsapp.support.IntegrationTest;

/** Import toàn bộ ../content thật qua ContentService: mọi file phải nạp được. */
class ContentFolderImportTest extends IntegrationTest {
    @Test
    void wholeContentFolderImports() throws Exception {
        List<NamedContent> files = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(Path.of("..", "content"))) {
            for (Path p : paths.filter(f -> f.toString().endsWith(".json")).toList()) {
                files.add(new NamedContent(p.toString(), Files.readAllBytes(p)));
            }
        }
        assertThat(files).isNotEmpty();
        List<ImportResult> results = contentService.importFiles(files);
        assertThat(results).allSatisfy(r -> assertThat(r.errors()).as(r.file()).isEmpty());
        assertThat(results).allMatch(ImportResult::ok);
    }
}
