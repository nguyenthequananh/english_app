package vn.ieltsapp.launcher;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public final class PortProbe {
    private PortProbe() {}

    public static boolean isOurApp(int port) {
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(500)).build();
            HttpRequest request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/health"))
                    .timeout(Duration.ofSeconds(1)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body().contains("\"app\":\"ielts-app\"");
        } catch (IOException e) {
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    public static boolean isFree(int port) {
        try (ServerSocket ignored = new ServerSocket(port, 1, InetAddress.getLoopbackAddress())) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public static int choosePort(int preferred) {
        for (int port = preferred; port <= preferred + 10; port++) {
            if (isFree(port)) return port;
        }
        throw new IllegalStateException("Không tìm được cổng trống trong khoảng " + preferred + "–" + (preferred + 10));
    }
}
