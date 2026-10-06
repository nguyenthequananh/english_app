package vn.ieltsapp.common;

import java.nio.file.Path;

public final class AppHome {
    private AppHome() {}

    public static Path resolve() {
        String configured = System.getProperty("app.home");
        if (configured != null && !configured.isBlank()) {
            return Path.of(configured);
        }
        return Path.of(System.getProperty("user.home"), ".ielts-app");
    }
}
