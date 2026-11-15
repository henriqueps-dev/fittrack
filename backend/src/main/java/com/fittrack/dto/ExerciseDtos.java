package com.fittrack.dto;

import com.fittrack.entity.BodyRegion;
import com.fittrack.entity.Difficulty;
import com.fittrack.entity.Equipment;
import com.fittrack.entity.Exercise;
import com.fittrack.entity.MuscleGroup;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public final class ExerciseDtos {

    private ExerciseDtos() { }

    public record MuscleRef(String slug, String name) {
        public static MuscleRef from(MuscleGroup m) { return new MuscleRef(m.getSlug(), m.getName()); }
    }

    public record MuscleGroupDto(Long id, String slug, String name, BodyRegion region, long exerciseCount) { }

    public record ExerciseSummary(Long id, String slug, String name, String movement, Equipment equipment, MuscleRef primaryMuscle) {
        public static ExerciseSummary from(Exercise e) {
            return new ExerciseSummary(e.getId(), e.getSlug(), e.getName(), e.getMovement(), e.getEquipment(),
                    MuscleRef.from(e.getPrimaryMuscle()));
        }
    }

    public record ExerciseDto(Long id, String slug, String name, MuscleRef primaryMuscle, List<MuscleRef> secondaryMuscles,
                              Equipment equipment, Difficulty difficulty, String movement, String description,
                              List<String> instructions, boolean favorite) {
        public static ExerciseDto from(Exercise e, boolean favorite) {
            List<MuscleRef> secondary = e.getSecondaryMuscles().stream()
                    .sorted(Comparator.comparingInt(MuscleGroup::getPosition))
                    .map(MuscleRef::from).toList();
            List<String> steps = Arrays.stream(e.getInstructions().split("\n")).map(String::trim).filter(s -> !s.isEmpty()).toList();
            return new ExerciseDto(e.getId(), e.getSlug(), e.getName(), MuscleRef.from(e.getPrimaryMuscle()), secondary,
                    e.getEquipment(), e.getDifficulty(), e.getMovement(), e.getDescription(), steps, favorite);
        }
    }
}
