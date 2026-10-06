package vn.ieltsapp.progress;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import vn.ieltsapp.lesson.LessonService;
import vn.ieltsapp.lesson.LessonSummary;
import vn.ieltsapp.progress.ProgressDtos.*;
import vn.ieltsapp.roadmap.RoadmapService;
import vn.ieltsapp.vocab.VocabService;

@Service
public class ProgressService {
    private final ProgressRepository repo;
    private final VocabService vocab;
    private final RoadmapService roadmap;
    private final LessonService lessons;
    private final Clock clock;

    public ProgressService(ProgressRepository repo, VocabService vocab, RoadmapService roadmap,
                           LessonService lessons, Clock clock) {
        this.repo = repo;
        this.vocab = vocab;
        this.roadmap = roadmap;
        this.lessons = lessons;
        this.clock = clock;
    }

    public Summary summary(long profileId) {
        LocalDate today = LocalDate.now(clock);
        Set<LocalDate> days = studyDays(profileId);
        CurrentUnit unit = roadmap.currentUnit(profileId).map(u -> {
            List<LessonSummary> ls = lessons.unitLessons(profileId, u.code());
            int done = (int) ls.stream().filter(LessonSummary::completed).count();
            return new CurrentUnit(u.code(), u.title(), done, ls.size(), done == ls.size());
        }).orElse(null);
        return new Summary(StreakCalculator.currentStreak(days, today), vocab.countDue(profileId, today), unit,
                days.contains(today));
    }

    public Stats stats(long profileId) {
        LocalDate today = LocalDate.now(clock);
        String since = today.minusDays(365).toString();
        List<DayMinutes> heatmap = repo.finishedDays(profileId).stream()
                .filter(d -> d.date().compareTo(since) >= 0).toList();

        TreeMap<LocalDate, Long> perWeek = repo.knownSince(profileId).stream().collect(Collectors.groupingBy(
                d -> d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), TreeMap::new, Collectors.counting()));
        List<WeekCount> knownByWeek = new ArrayList<>();
        int total = 0;
        for (Map.Entry<LocalDate, Long> e : perWeek.entrySet()) {
            total += e.getValue().intValue();
            knownByWeek.add(new WeekCount(e.getKey().toString(), total));
        }

        return new Stats(StreakCalculator.currentStreak(studyDays(profileId), today),
                repo.countCards(profileId, true), repo.countCards(profileId, false), heatmap, knownByWeek,
                repo.testResults(profileId));
    }

    private Set<LocalDate> studyDays(long profileId) {
        return repo.finishedDays(profileId).stream().map(d -> LocalDate.parse(d.date())).collect(Collectors.toSet());
    }
}
