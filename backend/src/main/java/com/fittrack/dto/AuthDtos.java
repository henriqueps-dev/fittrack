package com.fittrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() { }

    public record RegisterRequest(
            @NotBlank(message = "Informe seu nome") @Size(max = 80) String name,
            @NotBlank(message = "Informe seu e-mail") @Email(message = "E-mail inválido") @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String password) { }

    public record LoginRequest(
            @NotBlank(message = "Informe seu e-mail") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Informe sua senha") String password) { }

    public record AuthResponse(String token, long expiresIn, UserDtos.UserDto user) { }

    public record ForgotPasswordRequest(@NotBlank @Email(message = "E-mail inválido") String email) { }

    /** resetToken so e preenchido quando app.auth.expose-reset-token=true (ambiente de desenvolvimento). */
    public record ForgotPasswordResponse(String message, String resetToken) { }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres") String newPassword) { }
}
