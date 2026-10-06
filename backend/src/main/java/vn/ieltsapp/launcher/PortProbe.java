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

    public static final int RANGE_START = 8765;
    public static final int RANGE_END = 8775;

    /** Chỉ quét khoảng 8765..8775: từ preferred (nếu nằm trong khoảng) lên cuối, rồi quay lại đầu khoảng. */
    public static int choosePort(int preferred) {
        int start = preferred >= RANGE_START && preferred <= RANGE_END ? preferred : RANGE_START;
        int size = RANGE_END - RANGE_START + 1;
        for (int i = 0; i < size; i++) {
            int port = RANGE_START + (start - RANGE_START + i) % size;
            if (isFree(port)) return port;
        }
        throw new IllegalStateException("Không tìm được cổng trống trong khoảng " + RANGE_START + "–" + RANGE_END);
    }
}
