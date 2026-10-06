package vn.ieltsapp.roadmap;

import java.util.List;

public record RoadmapView(List<StageView> stages) {
    public record StageView(String code, String title, double targetBand, String status,
                            boolean testAvailable, List<UnitView> units) {}

    public record UnitView(String code, String title, String status) {}
}
