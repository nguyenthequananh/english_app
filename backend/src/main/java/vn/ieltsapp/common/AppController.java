package vn.ieltsapp.common;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AppController {
    static final long EXIT_DELAY_MS = 300;
    private static final Logger log = LoggerFactory.getLogger(AppController.class);

    private final AppExiter exiter;

    public AppController(AppExiter exiter) { this.exiter = exiter; }

    /** Trả lời trước, tắt app sau một chút trên luồng riêng để phản hồi kịp về trình duyệt. */
    @PostMapping("/api/app/shutdown")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> shutdown() {
        Thread thread = new Thread(() -> {
            try {
                Thread.sleep(EXIT_DELAY_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            log.info("Tắt app theo yêu cầu người dùng");
            exiter.exit();
        }, "app-shutdown");
        thread.setDaemon(false);
        thread.start();
        return Map.of("message", "Đang tắt app...");
    }
}
