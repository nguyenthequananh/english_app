package vn.ieltsapp.roadmap;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.ieltsapp.common.ApiException;
import vn.ieltsapp.profile.ProfileCreatedEvent;
import vn.ieltsapp.roadmap.RoadmapView.StageView;
import vn.ieltsapp.roadmap.RoadmapView.UnitView;

@Service
public class RoadmapService {
    static final String LOCKED = "LOCKED", ACTIVE = "ACTIVE", DONE = "DONE";

    private final RoadmapRepository repo;
    private final Clock clock;

    public RoadmapService(RoadmapRepository repo, Clock clock) {
        this.repo = repo;
        this.clock = clock;
    }

    @EventListener
    public void onProfileCreated(ProfileCreatedEvent event) {
        statuses(event.profileId());
    }

    /**
     * Trạng thái các unit, suy ra mỗi lần đọc để unit nạp thêm sau vẫn được mở đúng lúc.
     * Unit mở (ACTIVE nếu chưa DONE) khi: là unit đầu tiên, hoặc unit liền trước trong chặng đã DONE,
     * hoặc là unit đầu của chặng mà bài kiểm tra chặng liền trước đã qua. Không bao giờ khoá lại unit đã mở.
     * Unit mới mở được ghi ACTIVE vào unit_progress.
     */
    public Map<String, String> statuses(long profileId) {
        Map<String, String> stored = repo.unitStatuses(profileId);
        Map<String, String> result = new HashMap<>(stored);
        Set<String> passedStages = repo.passedStageTests(profileId);
        List<StageRow> stages = repo.stages();
        List<UnitRow> units = repo.units();
        boolean firstOverall = true;
        for (int i = 0; i < stages.size(); i++) {
            String stageCode = stages.get(i).code();
            boolean previousStagePassed = i > 0 && passedStages.contains(stages.get(i - 1).code());
            String previousUnitStatus = null;
            boolean firstInStage = true;
            for (UnitRow u : units) {
                if (!u.stageCode().equals(stageCode)) continue;
                String status = result.getOrDefault(u.code(), LOCKED);
                boolean open = firstOverall
                        || DONE.equals(previousUnitStatus)
                        || (firstInStage && previousStagePassed);
                if (LOCKED.equals(status) && open) {
                    repo.setUnitStatus(profileId, u.code(), ACTIVE, now());
                    status = ACTIVE;
                    result.put(u.code(), ACTIVE);
                }
                previousUnitStatus = status;
                firstInStage = false;
                firstOverall = false;
            }
        }
        return result;
    }

    public Optional<UnitRow> currentUnit(long profileId) {
        Map<String, String> s = statuses(profileId);
        return repo.units().stream().filter(u -> ACTIVE.equals(s.get(u.code()))).findFirst();
    }

    public void requireUnitOpen(long profileId, String unitCode) {
        if (LOCKED.equals(statuses(profileId).getOrDefault(unitCode, LOCKED))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "UNIT_LOCKED", "Unit này chưa được mở khóa");
        }
    }

    public boolean stageUnitsDone(long profileId, String stageCode) {
        Map<String, String> s = statuses(profileId);
        List<UnitRow> units = repo.units().stream().filter(u -> u.stageCode().equals(stageCode)).toList();
        return !units.isEmpty() && units.stream().allMatch(u -> DONE.equals(s.get(u.code())));
    }

    @Transactional
    public void onUnitTestPassed(long profileId, String unitCode) {
        if (repo.units().stream().noneMatch(u -> u.code().equals(unitCode))) throw ApiException.notFound("unit");
        repo.setUnitStatus(profileId, unitCode, DONE, now());
        statuses(profileId); // mở unit kế tiếp trong chặng
    }

    @Transactional
    public void onStageTestPassed(long profileId, String stageCode) {
        Map<String, String> s = statuses(profileId);
        List<StageRow> stages = repo.stages();
        for (int i = 0; i < stages.size() - 1; i++) {
            if (stages.get(i).code().equals(stageCode)) {
                String nextStage = stages.get(i + 1).code();
                repo.units().stream().filter(u -> u.stageCode().equals(nextStage)).findFirst()
                        .ifPresent(u -> activateIfLocked(profileId, u.code(), s));
                return;
            }
        }
    }

    public RoadmapView view(long profileId) {
        Map<String, String> s = statuses(profileId);
        Set<String> passed = repo.passedStageTests(profileId);
        List<UnitRow> units = repo.units();
        List<StageView> stages = repo.stages().stream().map(stage -> {
            List<UnitView> unitViews = units.stream().filter(u -> u.stageCode().equals(stage.code()))
                    .map(u -> new UnitView(u.code(), u.title(), s.getOrDefault(u.code(), LOCKED))).toList();
            String status = passed.contains(stage.code()) ? DONE
                    : unitViews.stream().anyMatch(u -> !LOCKED.equals(u.status())) ? ACTIVE : LOCKED;
            boolean testAvailable = !unitViews.isEmpty()
                    && unitViews.stream().allMatch(u -> DONE.equals(u.status()));
            return new StageView(stage.code(), stage.title(), stage.targetBand(), status, testAvailable, unitViews);
        }).toList();
        return new RoadmapView(stages);
    }

    private void activateIfLocked(long profileId, String unitCode, Map<String, String> statuses) {
        if (LOCKED.equals(statuses.getOrDefault(unitCode, LOCKED))) {
            repo.setUnitStatus(profileId, unitCode, ACTIVE, now());
        }
    }

    private String now() { return LocalDateTime.now(clock).toString(); }
}
