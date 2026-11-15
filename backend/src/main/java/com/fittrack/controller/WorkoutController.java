package com.fittrack.controller;

import com.fittrack.dto.WorkoutDtos.*;
import com.fittrack.security.CurrentUser;
import com.fittrack.service.WorkoutService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutController {

    private final WorkoutService workouts;
    private final CurrentUser current;

    public WorkoutController(WorkoutService workouts, CurrentUser current) {
        this.workouts = workouts;
        this.current = current;
    }

    @GetMapping
    public List<WorkoutDto> list() {
        return workouts.list(current.id());
    }

    @GetMapping("/{id}")
    public WorkoutDto get(@PathVariable Long id) {
        return workouts.get(current.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutDto create(@Valid @RequestBody WorkoutRequest req) {
        return workouts.create(current.id(), req);
    }

    @PutMapping("/{id}")
    public WorkoutDto update(@PathVariable Long id, @Valid @RequestBody WorkoutRequest req) {
        return workouts.update(current.id(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        workouts.delete(current.id(), id);
    }

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutDto duplicate(@PathVariable Long id) {
        return workouts.duplicate(current.id(), id);
    }

    @PutMapping("/order")
    public List<WorkoutDto> reorder(@Valid @RequestBody ReorderRequest req) {
        return workouts.reorder(current.id(), req);
    }

    @PostMapping("/splits")
    @ResponseStatus(HttpStatus.CREATED)
    public List<WorkoutDto> split(@Valid @RequestBody SplitRequest req) {
        return workouts.createSplit(current.id(), req);
    }
}
