package com.fittrack.dto;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class WorkoutDtos {

    private WorkoutDtos() { }

    /** Peso e repeticoes de uma serie executada anteriormente. */
    public record SetSnapshot(int setNumber, BigDecimal weightKg, int reps) { }

    public record WorkoutExerciseDto(Long id, ExerciseSummary exercise, int position, int sets, int reps, int restSeconds,
                                     String notes, List<SetSnapshot> lastSets, Instant lastPerformedAt) { }

    public record WorkoutDto(Long id, String name, String description, String letter, int position,
                             List<String> muscleGroups, int estimatedMinutes, List<WorkoutExerciseDto> exercises,
                             Instant updatedAt, Instant lastPerformedAt) { }

    public record WorkoutExerciseRequest(
            @NotNull Long exerciseId,
            @Min(value = 1, message = "Mínimo de 1 série") @Max(value = 12, message = "Máximo de 12 séries") int sets,
            @Min(value = 1, message = "Mínimo de 1 repetição") @Max(value = 100, message = "Máximo de 100 repetições") int reps,
            @Min(value = 0) @Max(value = 600, message = "Descanso máximo de 10 minutos") int restSeconds,
            @Size(max = 300) String notes) { }

    public record WorkoutRequest(
            @NotBlank(message = "Dê um nome ao treino") @Size(max = 100) String name,
            @Size(max = 500) String description,
            @Pattern(regexp = "^[A-Za-z]?$", message = "A divisão deve ser uma letra") String letter,
            @NotNull @Size(min = 1, max = 30, message = "Adicione entre 1 e 30 exercícios") List<@Valid WorkoutExerciseRequest> exercises) { }

    public record ReorderRequest(@NotNull List<Long> workoutIds) { }

    public record SplitRequest(@NotBlank @Pattern(regexp = "ABC|ABCD|ABCDE", message = "Divisão inválida") String type) { }
}
