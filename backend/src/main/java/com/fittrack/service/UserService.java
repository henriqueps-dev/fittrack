package com.fittrack.service;

import com.fittrack.dto.UserDtos.*;
import com.fittrack.entity.User;
import com.fittrack.exception.BusinessException;
import com.fittrack.exception.NotFoundException;
import com.fittrack.repository.UserRepository;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    /** Tamanho maximo da data URL (~750 KB de imagem). O frontend redimensiona antes de enviar. */
    private static final int MAX_AVATAR_LENGTH = 1_000_000;
    private static final Pattern AVATAR = Pattern.compile("^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$");

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public UserService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public User get(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
    }

    @Transactional(readOnly = true)
    public UserDto me(Long id) {
        return UserDto.from(get(id));
    }

    @Transactional
    public UserDto update(Long id, UpdateProfileRequest req) {
        User u = get(id);
        u.setName(req.name().trim());
        u.setBirthDate(req.birthDate());
        u.setHeightCm(req.heightCm());
        u.setWeightKg(req.weightKg());
        u.setGoal(req.goal());
        u.setExperienceLevel(req.experienceLevel());
        u.setWeeklyGoal(req.weeklyGoal());
        u.setDefaultRestSeconds(req.defaultRestSeconds());
        return UserDto.from(u);
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest req) {
        User u = get(id);
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }
        u.setPasswordHash(encoder.encode(req.newPassword()));
    }

    @Transactional
    public UserDto updateAvatar(Long id, AvatarRequest req) {
        String data = req.dataUrl().trim();
        if (data.length() > MAX_AVATAR_LENGTH || !AVATAR.matcher(data).matches()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Imagem inválida. Use PNG, JPG ou WEBP de até 700 KB.");
        }
        User u = get(id);
        u.setAvatar(data);
        return UserDto.from(u);
    }

    @Transactional
    public UserDto removeAvatar(Long id) {
        User u = get(id);
        u.setAvatar(null);
        return UserDto.from(u);
    }
}
