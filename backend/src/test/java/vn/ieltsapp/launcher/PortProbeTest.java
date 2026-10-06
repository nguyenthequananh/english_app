package vn.ieltsapp.launcher;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetAddress;
import java.net.ServerSocket;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

class PortProbeTest {

    @Test
    void skipsBusyPortAndStaysInSpecRange() throws Exception {
        ServerSocket busy = null;
        for (int p = 8765; p <= 8775 && busy == null; p++) {
            try {
                busy = new ServerSocket(p, 1, InetAddress.getLoopbackAddress());
            } catch (java.io.IOException ignored) {
            }
        }
        Assumptions.assumeTrue(busy != null, "no free port in 8765..8775");
        ServerSocket held = busy;
        try (held) {
            int port = held.getLocalPort();
            assertThat(PortProbe.isFree(port)).isFalse();
            int chosen = PortProbe.choosePort(port);
            assertThat(chosen).isBetween(8765, 8775).isNotEqualTo(port);
        }
    }

    @Test
    void busyPortThatIsNotOurAppIsNotRecognised() throws Exception {
        try (ServerSocket busy = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            assertThat(PortProbe.isOurApp(busy.getLocalPort())).isFalse();
        }
    }
}
