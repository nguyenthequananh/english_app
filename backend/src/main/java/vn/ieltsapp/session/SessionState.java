package vn.ieltsapp.session;

import java.util.List;

public record SessionState(String step, List<Long> reviewQueue, List<Long> newQueue, String lessonCode,
                           int cardsDone) {
    public SessionState withStep(String s) { return new SessionState(s, reviewQueue, newQueue, lessonCode, cardsDone); }
    public SessionState withReviewQueue(List<Long> q) { return new SessionState(step, q, newQueue, lessonCode, cardsDone); }
    public SessionState withNewQueue(List<Long> q) { return new SessionState(step, reviewQueue, q, lessonCode, cardsDone); }
    public SessionState withCardsDone(int n) { return new SessionState(step, reviewQueue, newQueue, lessonCode, n); }

    /** Bỏ qua các bước rỗng: REVIEW → NEW → LESSON → DONE. */
    public SessionState advance() {
        SessionState s = this;
        if ("REVIEW".equals(s.step()) && s.reviewQueue().isEmpty()) s = s.withStep("NEW");
        if ("NEW".equals(s.step()) && s.newQueue().isEmpty()) s = s.withStep("LESSON");
        if ("LESSON".equals(s.step()) && s.lessonCode() == null) s = s.withStep("DONE");
        return s;
    }
}
