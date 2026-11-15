package com.fittrack.dto;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import com.fittrack.dto.WorkoutDtos.SetSnapshot;
import com.fittrack.entity.SessionStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class SessionDtos {

    private SessionDtos() { }

    public record StartSessionRequest(@NotNull Long workoutId, @NotBlank @Size(max = 64) String clientId) { }

    public record SetPayload(
            @Min(1) int setNumber,
            @NotNull @DecimalMin(value = "0.0", message = "Peso inválido") @DecimalMax(value = "1000.0", message = "Peso inválido") BigDecimal weightKg,
            @Min(0) @Max(1000) int reps,
            boolean completed,
            Instant completedAt) { }

    public record SessionExercisePayload(
            @NotNull Long exerciseId,
            @Min(0) int order,
            @Min(0) @Max(100) int plannedReps,
            @Min(0) @Max(600) int restSeconds,
            boolean skipped,
            @NotNull @Size(max = 20) List<@Valid SetPayload> sets) { }

    /**
     * Estado completo de uma sessao enviado pelo cliente. Usado tanto no salvamento automatico
     * quanto na finalizacao e na sincronizacao de treinos feitos offline (idempotente via clientId).
     */
    public record SessionPayload(
            @NotBlank @Size(max = 64) String clientId,
            Long workoutId,
            @NotBlank @Size(max = 100) String workoutName,
            @NotNull Instant startedAt,
            Instant finishedAt,
            @Size(max = 500) String notes,
            @NotNull @Size(max = 40) List<@Valid SessionExercisePayload> exercises) { }

    public record SetDto(int setNumber, BigDecimal weightKg, int reps, boolean completed, Instant completedAt) { }

    public record SessionExerciseDto(ExerciseSummary exercise, int order, int plannedReps, int restSeconds, boolean skipped,
                                     List<SetDto> sets, List<SetSnapshot> previous, Instant previousDate) { }

    public record ComparisonDto(Long previousSessionId, Instant previousDate, BigDecimal previousVolume, BigDecimal volumeDelta,
                                Integer previousDurationSeconds, Integer previousCompletedSets) { }

    public record SessionDto(Long id, String clientId, Long workoutId, String workoutName, SessionStatus status,
                             Instant startedAt, Instant finishedAt, int durationSeconds, BigDecimal totalVolume,
                             int totalReps, int completedSets, String notes, List<SessionExerciseDto> exercises,
                             ComparisonDto comparison) { }

    public record SessionSummaryDto(Long id, Long workoutId, String workoutName, Instant startedAt, Instant finishedAt,
                                    int durationSeconds, BigDecimal totalVolume, int totalReps, int completedSets,
                                    List<String> exerciseNames) { }

    public record FinishResponse(SessionDto session, List<StatsDtos.RecordDto> newRecords) { }
}
