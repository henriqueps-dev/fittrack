package com.fittrack.service;

import com.fittrack.config.AppProperties;
import com.fittrack.dto.AuthDtos.*;
import com.fittrack.dto.UserDtos.UserDto;
import com.fittrack.entity.PasswordResetToken;
import com.fittrack.entity.User;
import com.fittrack.exception.BusinessException;
import com.fittrack.repository.PasswordResetTokenRepository;
import com.fittrack.repository.UserRepository;
import com.fittrack.security.TokenService;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Duration RESET_TTL = Duration.ofMinutes(30);
    private static final String FORGOT_MESSAGE = "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.";

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder;
    private final TokenService tokens;
    private final AppProperties props;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository users, PasswordResetTokenRepository resetTokens, PasswordEncoder encoder,
                       TokenService tokens, AppProperties props) {
        this.users = users;
        this.resetTokens = resetTokens;
        this.encoder = encoder;
        this.tokens = tokens;
        this.props = props;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado");
        }
        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        users.save(user);
        return response(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(normalize(req.email()))
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("invalid"));
        return response(user);
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        return users.findByEmailIgnoreCase(normalize(req.email()))
                .map(user -> {
                    byte[] raw = new byte[24];
                    random.nextBytes(raw);
                    String token = HexFormat.of().formatHex(raw);
                    resetTokens.save(new PasswordResetToken(user, token, Instant.now().plus(RESET_TTL)));
                    String link = props.auth().frontendUrl() + "/redefinir-senha?token=" + token;
                    // Sem servidor SMTP configurado: o link e registrado no log do servidor.
                    log.info("Link de redefinicao de senha para usuario {}: {}", user.getId(), link);
                    return new ForgotPasswordResponse(FORGOT_MESSAGE, props.auth().exposeResetToken() ? token : null);
                })
                .orElseGet(() -> new ForgotPasswordResponse(FORGOT_MESSAGE, null));
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken token = resetTokens.findByToken(req.token())
                .filter(t -> !t.isUsed() && t.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Link de redefinição inválido ou expirado"));
        token.getUser().setPasswordHash(encoder.encode(req.newPassword()));
        token.markUsed();
    }

    private AuthResponse response(User user) {
        return new AuthResponse(tokens.issue(user), tokens.ttlSeconds(), UserDto.from(user));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
