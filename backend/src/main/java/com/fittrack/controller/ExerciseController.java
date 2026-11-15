package com.fittrack.controller;

import com.fittrack.dto.ExerciseDtos.ExerciseDto;
import com.fittrack.dto.ExerciseDtos.MuscleGroupDto;
import com.fittrack.entity.Equipment;
import com.fittrack.security.CurrentUser;
import com.fittrack.service.ExerciseService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ExerciseController {

    private final ExerciseService exercises;
    private final CurrentUser current;

    public ExerciseController(ExerciseService exercises, CurrentUser current) {
        this.exercises = exercises;
        this.current = current;
    }

    @GetMapping("/muscle-groups")
    public List<MuscleGroupDto> muscleGroups() {
        return exercises.muscleGroups();
    }

    @GetMapping("/exercises")
    public List<ExerciseDto> search(@RequestParam(required = false) String muscle,
                                    @RequestParam(required = false) Equipment equipment,
                                    @RequestParam(required = false) String q,
                                    @RequestParam(defaultValue = "false") boolean favorites) {
        return exercises.search(current.id(), muscle, equipment, q, favorites);
    }

    @GetMapping("/exercises/{id}")
    public ExerciseDto get(@PathVariable Long id) {
        return exercises.get(current.id(), id);
    }

    @PutMapping("/exercises/{id}/favorite")
    public Map<String, Boolean> favorite(@PathVariable Long id) {
        return Map.of("favorite", exercises.setFavorite(current.id(), id, true));
    }

    @DeleteMapping("/exercises/{id}/favorite")
    public Map<String, Boolean> unfavorite(@PathVariable Long id) {
        return Map.of("favorite", exercises.setFavorite(current.id(), id, false));
    }
}
