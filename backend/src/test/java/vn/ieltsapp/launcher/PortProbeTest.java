package vn.ieltsapp.launcher;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetAddress;
import java.net.ServerSocket;
import org.junit.jupiter.api.Test;

class PortProbeTest {

    @Test
    void skipsBusyPortAndStaysInRange() throws Exception {
        try (ServerSocket busy = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            int port = busy.getLocalPort();
            assertThat(PortProbe.isFree(port)).isFalse();
            int chosen = PortProbe.choosePort(port);
            assertThat(chosen).isBetween(port + 1, port + 10);
        }
    }

    @Test
    void busyPortThatIsNotOurAppIsNotRecognised() throws Exception {
        try (ServerSocket busy = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            assertThat(PortProbe.isOurApp(busy.getLocalPort())).isFalse();
        }
    }
}
