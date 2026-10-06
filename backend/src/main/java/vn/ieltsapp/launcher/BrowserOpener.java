package vn.ieltsapp.launcher;

import java.awt.Desktop;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class BrowserOpener {
    private static final Logger log = LoggerFactory.getLogger(BrowserOpener.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onReady(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        if (!env.getProperty("app.open-browser", Boolean.class, true)) return;
        open("http://127.0.0.1:" + env.getProperty("local.server.port", "8765") + "/");
    }

    public static void open(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create(url));
            } else {
                new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
            }
        } catch (Exception e) {
            log.warn("Không mở được trình duyệt, hãy mở {} thủ công", url, e);
        }
    }
}
