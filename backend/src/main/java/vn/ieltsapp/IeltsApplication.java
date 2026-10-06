package vn.ieltsapp;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import vn.ieltsapp.backup.StartupRestore;
import vn.ieltsapp.common.AppHome;

@SpringBootApplication
@ConfigurationPropertiesScan
public class IeltsApplication {

    public static void main(String[] args) throws IOException {
        Path home = AppHome.resolve();
        Files.createDirectories(home.resolve("logs"));
        StartupRestore.applyPending(home);
        List<String> all = new ArrayList<>(List.of(args));
        all.add("--app.home=" + home);
        SpringApplication.run(IeltsApplication.class, all.toArray(String[]::new));
    }
}
