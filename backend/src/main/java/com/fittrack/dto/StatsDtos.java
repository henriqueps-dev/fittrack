package com.fittrack.dto;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import com.fittrack.entity.RecordType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class StatsDtos {

    private StatsDtos() { }

    public record DayPoint(LocalDate date, BigDecimal volume, int sessions, int durationSeconds) { }

    public record WeekPoint(LocalDate weekStart, int sessions, BigDecimal volume) { }

    public record NextWorkoutDto(Long id, String name, String letter, int exerciseCount, int estimatedMinutes, List<String> muscleGroups) { }

    public record DashboardDto(String userName, int weeklyGoal, int weekSessions, int weekDurationSeconds,
                               BigDecimal weekVolume, int weekSets, int streakWeeks, long totalSessions,
                               SessionDtos.SessionSummaryDto lastSession, NextWorkoutDto nextWorkout,
                               List<DayPoint> week, boolean hasActiveSession) { }

    public record OverviewDto(String range, int sessions, int durationSeconds, BigDecimal volume, int reps, int sets,
                              BigDecimal avgVolumePerSession, int avgDurationSeconds, double sessionsPerWeek,
                              List<WeekPoint> weekly, List<SessionPoint> sessionsSeries, List<MuscleShare> muscleShare) { }

    public record SessionPoint(Long sessionId, Instant date, String workoutName, BigDecimal volume, int durationSeconds, int sets) { }

    public record MuscleShare(String slug, String name, int sets, BigDecimal volume) { }

    public record ProgressPoint(Long sessionId, Instant date, BigDecimal maxWeight, BigDecimal estimated1Rm,
                                BigDecimal volume, int bestReps, int sets) { }

    public record ExerciseProgressDto(ExerciseSummary exercise, String range, List<ProgressPoint> points,
                                      BigDecimal bestWeight, BigDecimal bestEstimated1Rm, BigDecimal weightChange,
                                      List<RecordDto> records) { }

    public record RecordDto(Long id, ExerciseSummary exercise, RecordType type, BigDecimal value, BigDecimal weightKg,
                            int reps, Instant achievedAt, Long sessionId) { }

    public record TrainedExerciseDto(Long id, String name, String muscle, long sessions, Instant lastPerformedAt) { }

    public record CalendarDto(LocalDate from, LocalDate to, List<DayPoint> days) { }

    public record AchievementDto(String code, String title, String description, String icon, boolean unlocked,
                                 double progress, String progressLabel) { }
}
