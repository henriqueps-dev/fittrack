package com.fittrack.controller;

import com.fittrack.dto.UserDtos.*;
import com.fittrack.security.CurrentUser;
import com.fittrack.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService users;
    private final CurrentUser current;

    public UserController(UserService users, CurrentUser current) {
        this.users = users;
        this.current = current;
    }

    @GetMapping
    public UserDto me() {
        return users.me(current.id());
    }

    @PutMapping
    public UserDto update(@Valid @RequestBody UpdateProfileRequest req) {
        return users.update(current.id(), req);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        users.changePassword(current.id(), req);
    }

    @PutMapping("/avatar")
    public UserDto avatar(@Valid @RequestBody AvatarRequest req) {
        return users.updateAvatar(current.id(), req);
    }

    @DeleteMapping("/avatar")
    public UserDto removeAvatar() {
        return users.removeAvatar(current.id());
    }
}
