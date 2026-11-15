package com.fittrack.service;

import com.fittrack.dto.ExerciseDtos.ExerciseDto;
import com.fittrack.dto.ExerciseDtos.MuscleGroupDto;
import com.fittrack.entity.Equipment;
import com.fittrack.entity.Exercise;
import com.fittrack.entity.User;
import com.fittrack.exception.NotFoundException;
import com.fittrack.repository.ExerciseRepository;
import com.fittrack.repository.MuscleGroupRepository;
import com.fittrack.repository.UserRepository;
import java.text.Normalizer;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExerciseService {

    private final ExerciseRepository exercises;
    private final MuscleGroupRepository muscles;
    private final UserRepository users;

    public ExerciseService(ExerciseRepository exercises, MuscleGroupRepository muscles, UserRepository users) {
        this.exercises = exercises;
        this.muscles = muscles;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<MuscleGroupDto> muscleGroups() {
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : exercises.countByPrimaryMuscle()) {
            counts.put((String) row[0], (Long) row[1]);
        }
        return muscles.findAllByOrderByPositionAsc().stream()
                .map(m -> new MuscleGroupDto(m.getId(), m.getSlug(), m.getName(), m.getRegion(), counts.getOrDefault(m.getSlug(), 0L)))
                .toList();
    }

    /**
     * Lista exercicios com filtros opcionais. A biblioteca e pequena (dezenas de itens),
     * entao os filtros sao aplicados em memoria sobre uma unica consulta com fetch das relacoes.
     */
    @Transactional(readOnly = true)
    public List<ExerciseDto> search(Long userId, String muscle, Equipment equipment, String query, boolean onlyFavorites) {
        Set<Long> favorites = users.findFavoriteIds(userId);
        String q = query == null || query.isBlank() ? null : fold(query);
        return exercises.findAllWithMuscles().stream()
                .filter(e -> muscle == null || muscle.isBlank() || e.getPrimaryMuscle().getSlug().equals(muscle))
                .filter(e -> equipment == null || e.getEquipment() == equipment)
                .filter(e -> !onlyFavorites || favorites.contains(e.getId()))
                .filter(e -> q == null || fold(e.getName()).contains(q))
                .map(e -> ExerciseDto.from(e, favorites.contains(e.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ExerciseDto get(Long userId, Long id) {
        Exercise e = find(id);
        return ExerciseDto.from(e, users.findFavoriteIds(userId).contains(id));
    }

    @Transactional
    public boolean setFavorite(Long userId, Long exerciseId, boolean favorite) {
        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        Exercise e = find(exerciseId);
        if (favorite) {
            user.getFavoriteExercises().add(e);
        } else {
            user.getFavoriteExercises().remove(e);
        }
        return favorite;
    }

    public Exercise find(Long id) {
        return exercises.findById(id).orElseThrow(() -> new NotFoundException("Exercício não encontrado"));
    }

    static String fold(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }
}
