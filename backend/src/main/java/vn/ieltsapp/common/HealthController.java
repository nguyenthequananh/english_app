package vn.ieltsapp.common;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final String recoveredFrom;
    private final String restoredFrom;

    public HealthController(@Value("${app.recovered-from:}") String recoveredFrom,
                            @Value("${app.restored-from:}") String restoredFrom) {
        this.recoveredFrom = recoveredFrom;
        this.restoredFrom = restoredFrom;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app", "ielts-app");
        body.put("status", "UP");
        body.put("recoveredFrom", recoveredFrom.isBlank() ? null : recoveredFrom);
        body.put("restoredFrom", restoredFrom.isBlank() ? null : restoredFrom);
        return body;
    }
}
