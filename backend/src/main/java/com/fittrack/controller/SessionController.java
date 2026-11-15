package com.fittrack.controller;

import com.fittrack.dto.SessionDtos.*;
import com.fittrack.security.CurrentUser;
import com.fittrack.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessions;
    private final CurrentUser current;

    public SessionController(SessionService sessions, CurrentUser current) {
        this.sessions = sessions;
        this.current = current;
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionDto start(@Valid @RequestBody StartSessionRequest req) {
        return sessions.start(current.id(), req);
    }

    @GetMapping("/active")
    public ResponseEntity<SessionDto> active() {
        return sessions.active(current.id()).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Salvamento automatico: substitui o estado da sessao em andamento. */
    @PutMapping("/progress")
    public SessionDto progress(@Valid @RequestBody SessionPayload payload) {
        return sessions.saveProgress(current.id(), payload);
    }

    /** Finaliza (ou sincroniza um treino feito offline). Idempotente por clientId. */
    @PostMapping("/finish")
    public FinishResponse finish(@Valid @RequestBody SessionPayload payload) {
        return sessions.finish(current.id(), payload);
    }

    @GetMapping
    public Page<SessionSummaryDto> history(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return sessions.history(current.id(), page, size);
    }

    @GetMapping("/{id}")
    public SessionDto get(@PathVariable Long id) {
        return sessions.get(current.id(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        sessions.delete(current.id(), id);
    }
}
