package vn.ieltsapp.session;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.lesson.LessonCompletedEvent;
import vn.ieltsapp.lesson.LessonService;
import vn.ieltsapp.roadmap.RoadmapService;
import vn.ieltsapp.roadmap.UnitRow;
import vn.ieltsapp.session.SessionPlanner.*;
import vn.ieltsapp.session.SessionRepository.SessionRow;
import vn.ieltsapp.vocab.Grade;
import vn.ieltsapp.vocab.VocabService;
import vn.ieltsapp.vocab.WordDto;

@Service
public class SessionService {
    private final SessionRepository repo;
    private final VocabService vocab;
    private final RoadmapService roadmap;
    private final LessonService lessons;
    private final PlannerSettings settings;
    private final ObjectMapper mapper;
    private final Clock clock;

    public SessionService(SessionRepository repo, VocabService vocab, RoadmapService roadmap, LessonService lessons,
                          PlannerSettings settings, ObjectMapper mapper, Clock clock) {
        this.repo = repo;
        this.vocab = vocab;
        this.roadmap = roadmap;
        this.lessons = lessons;
        this.settings = settings;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public SessionView today(long profileId) {
        LocalDate today = LocalDate.now(clock);
        SessionRow row = repo.find(profileId, today).orElseGet(() -> {
            create(profileId, today);
            return repo.find(profileId, today).orElseThrow();
        });
        return view(profileId, row);
    }

    @Transactional
    public SessionView answerCard(long profileId, long wordId, Grade grade) {
        LocalDate today = LocalDate.now(clock);
        SessionRow row = repo.find(profileId, today).orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                "NO_SESSION", "Chưa có buổi học hôm nay, hãy tải lại trang"));
        SessionState state = read(row);
        boolean review = "REVIEW".equals(state.step());
        if (!review && !"NEW".equals(state.step())) {
            throw new ApiException(HttpStatus.CONFLICT, "WRONG_STEP", "Bước hiện tại không phải flashcard");
        }
        List<Long> queue = review ? state.reviewQueue() : state.newQueue();
        if (queue.isEmpty() || queue.get(0) != wordId) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_MISMATCH", "Thẻ không đúng thứ tự, hãy tải lại trang");
        }

        vocab.review(profileId, wordId, grade);
        List<Long> rest = new ArrayList<>(queue.subList(1, queue.size()));
        if (grade == Grade.AGAIN) rest.add(wordId);
        SessionState next = (review ? state.withReviewQueue(rest) : state.withNewQueue(rest))
                .withCardsDone(state.cardsDone() + 1)
                .advance();
        save(row, next);
        return view(profileId, repo.find(profileId, today).orElseThrow());
    }

    @EventListener
    public void onLessonCompleted(LessonCompletedEvent event) {
        repo.find(event.profileId(), LocalDate.now(clock)).ifPresent(row -> {
            SessionState state = read(row);
            if ("LESSON".equals(state.step()) && event.lessonCode().equals(state.lessonCode())) {
                save(row, state.withStep("DONE"));
            }
        });
    }

    private void create(long profileId, LocalDate today) {
        Optional<UnitRow> unit = roadmap.currentUnit(profileId);
        List<Long> due = vocab.dueWordIds(profileId, today, settings.maxReviews());
        int dueTotal = vocab.countDue(profileId, today);
        List<Long> fresh = unit.map(u -> vocab.unlearnedWordIds(profileId, u.code(), settings.newWords()))
                .orElse(List.of());
        List<LessonRef> unitLessons = unit.map(u -> lessons.unitLessons(profileId, u.code()).stream()
                        .map(l -> new LessonRef(l.code(), l.day(), l.sortOrder(), l.completed())).toList())
                .orElse(List.of());
        SessionPlan plan = SessionPlanner.plan(new PlanInput(today, due, dueTotal, fresh, unitLessons), settings);
        SessionState state = new SessionState("REVIEW", plan.reviewWordIds(), plan.newWordIds(),
                plan.lessonCode(), 0).advance();
        repo.insert(profileId, today, write(state), LocalDateTime.now(clock).toString());
        if ("DONE".equals(state.step())) {
            repo.find(profileId, today).ifPresent(row -> save(row, state));
        }
    }

    private void save(SessionRow row, SessionState state) {
        if ("DONE".equals(state.step()) && row.finishedAt() == null) {
            LocalDateTime now = LocalDateTime.now(clock);
            long minutes = Duration.between(LocalDateTime.parse(row.startedAt()), now).toMinutes();
            repo.finish(row.id(), write(state), now.toString(), (int) Math.max(1, Math.min(120, minutes)));
        } else {
            repo.updateState(row.id(), write(state));
        }
    }

    private SessionView view(long profileId, SessionRow row) {
        SessionState s = read(row);
        Long cardId = switch (s.step()) {
            case "REVIEW" -> s.reviewQueue().get(0);
            case "NEW" -> s.newQueue().get(0);
            default -> null;
        };
        WordDto card = cardId == null ? null : vocab.findWord(profileId, cardId);
        return new SessionView(row.studyDate(), s.step(), card, s.reviewQueue().size(), s.newQueue().size(),
                s.lessonCode(), s.cardsDone(), row.finishedAt() != null);
    }

    private SessionState read(SessionRow row) {
        try {
            return mapper.readValue(row.stateJson(), SessionState.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("state_json hỏng ở buổi học " + row.id(), e);
        }
    }

    private String write(SessionState state) {
        try {
            return mapper.writeValueAsString(state);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
