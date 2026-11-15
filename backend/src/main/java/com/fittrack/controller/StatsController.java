package com.fittrack.controller;

import com.fittrack.dto.StatsDtos.*;
import com.fittrack.security.CurrentUser;
import com.fittrack.service.AchievementService;
import com.fittrack.service.RecordService;
import com.fittrack.service.StatsService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class StatsController {

    private final StatsService stats;
    private final RecordService records;
    private final AchievementService achievements;
    private final CurrentUser current;

    public StatsController(StatsService stats, RecordService records, AchievementService achievements, CurrentUser current) {
        this.stats = stats;
        this.records = records;
        this.achievements = achievements;
        this.current = current;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard() {
        return stats.dashboard(current.id());
    }

    @GetMapping("/stats/overview")
    public OverviewDto overview(@RequestParam(defaultValue = "30d") String range) {
        return stats.overview(current.id(), range);
    }

    @GetMapping("/stats/exercises")
    public List<TrainedExerciseDto> trainedExercises() {
        return stats.trainedExercises(current.id());
    }

    @GetMapping("/stats/exercises/{exerciseId}")
    public ExerciseProgressDto exerciseProgress(@PathVariable Long exerciseId, @RequestParam(defaultValue = "3m") String range) {
        return stats.exerciseProgress(current.id(), exerciseId, range);
    }

    @GetMapping("/stats/records")
    public List<RecordDto> records() {
        return records.list(current.id());
    }

    @GetMapping("/stats/calendar")
    public CalendarDto calendar(@RequestParam(defaultValue = "182") int days) {
        return stats.calendar(current.id(), days);
    }

    @GetMapping("/achievements")
    public List<AchievementDto> achievements() {
        return achievements.list(current.id());
    }
}
