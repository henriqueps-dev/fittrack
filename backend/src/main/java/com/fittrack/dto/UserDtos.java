package com.fittrack.dto;

import com.fittrack.entity.Difficulty;
import com.fittrack.entity.TrainingGoal;
import com.fittrack.entity.User;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class UserDtos {

    private UserDtos() { }

    public record UserDto(Long id, String name, String email, String avatar, LocalDate birthDate, Integer heightCm,
                          BigDecimal weightKg, TrainingGoal goal, Difficulty experienceLevel, int weeklyGoal,
                          int defaultRestSeconds, Instant createdAt) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getAvatar(), u.getBirthDate(), u.getHeightCm(),
                    u.getWeightKg(), u.getGoal(), u.getExperienceLevel(), u.getWeeklyGoal(), u.getDefaultRestSeconds(),
                    u.getCreatedAt());
        }
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Informe seu nome") @Size(max = 80) String name,
            @Past(message = "Data de nascimento inválida") LocalDate birthDate,
            @Min(100) @Max(250) Integer heightCm,
            @DecimalMin("25.0") @DecimalMax("400.0") BigDecimal weightKg,
            TrainingGoal goal,
            @NotNull Difficulty experienceLevel,
            @Min(value = 1, message = "Meta mínima de 1 treino") @Max(value = 7, message = "Meta máxima de 7 treinos") int weeklyGoal,
            @Min(15) @Max(600) int defaultRestSeconds) { }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String newPassword) { }

    /** Foto de perfil enviada como data URL (image/png, image/jpeg ou image/webp). */
    public record AvatarRequest(@NotBlank String dataUrl) { }
}
