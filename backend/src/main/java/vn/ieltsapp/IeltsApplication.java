package vn.ieltsapp;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import vn.ieltsapp.backup.StartupRestore;
import vn.ieltsapp.common.AppConfigFile;
import vn.ieltsapp.common.AppHome;
import vn.ieltsapp.launcher.BrowserOpener;
import vn.ieltsapp.launcher.DbCheck;
import vn.ieltsapp.launcher.PortProbe;

@SpringBootApplication
@ConfigurationPropertiesScan
public class IeltsApplication {
    static final int DEFAULT_PORT = 8765;

    public static void main(String[] args) throws IOException {
        Path home = AppHome.resolve();
        Files.createDirectories(home.resolve("logs"));

        Optional<String> restored = StartupRestore.applyPending(home);
        Optional<String> recovered = DbCheck.ensureUsable(home);

        AppConfigFile config = AppConfigFile.load(home);
        int preferred = config.port().orElse(DEFAULT_PORT);
        if (PortProbe.isOurApp(preferred)) {
            BrowserOpener.open("http://127.0.0.1:" + preferred + "/");
            return;
        }
        int port = PortProbe.choosePort(preferred);
        if (config.port().orElse(-1) != port) {
            config.setPort(port);
            config.save();
        }

        List<String> all = new ArrayList<>(List.of(args));
        all.add("--app.home=" + home);
        all.add("--server.port=" + port);
        recovered.ifPresent(r -> all.add("--app.recovered-from=" + r));
        restored.ifPresent(r -> all.add("--app.restored-from=" + r));

        SpringApplication app = new SpringApplication(IeltsApplication.class);
        app.setHeadless(false);
        app.run(all.toArray(String[]::new));
    }
}
