package vn.ieltsapp.support;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import vn.ieltsapp.common.AppExiter;

/** Thay cho AppExiter thật trong test: chỉ ghi nhận, không bao giờ tắt JVM. */
public class RecordingAppExiter implements AppExiter {
    private volatile CountDownLatch latch = new CountDownLatch(1);

    @Override
    public void exit() { latch.countDown(); }

    public void reset() { latch = new CountDownLatch(1); }

    public boolean awaitExit(long millis) throws InterruptedException {
        return latch.await(millis, TimeUnit.MILLISECONDS);
    }
}
