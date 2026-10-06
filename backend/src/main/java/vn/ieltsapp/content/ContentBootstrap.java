package vn.ieltsapp.content;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import vn.ieltsapp.content.ContentService.ImportResult;
import vn.ieltsapp.content.ContentService.NamedContent;

/** Nạp lại nội dung đóng gói kèm app mỗi lần khởi động (ghi đè theo code nên không trùng). */
@Component
@Order(1)
@ConditionalOnProperty(name = "app.content.bootstrap", havingValue = "true")
public class ContentBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ContentBootstrap.class);

    private final ContentService service;

    public ContentBootstrap(ContentService service) { this.service = service; }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        Resource[] resources = new PathMatchingResourcePatternResolver().getResources("classpath*:content/**/*.json");
        List<NamedContent> files = new ArrayList<>();
        for (Resource r : resources) {
            try (InputStream in = r.getInputStream()) {
                files.add(new NamedContent(r.getURI().toString(), in.readAllBytes()));
            }
        }
        for (ImportResult result : service.importFiles(files)) {
            if (!result.ok()) {
                log.warn("Nội dung lỗi {}: {}", result.file(), result.errors());
            }
        }
        log.info("Đã nạp {} file nội dung", files.size());
    }
}
