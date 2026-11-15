package com.fittrack.service;

import com.fittrack.dto.WorkoutDtos.SetSnapshot;
import com.fittrack.entity.ExerciseSet;
import com.fittrack.repository.ExerciseSetRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Busca as series da ultima sessao concluida de cada exercicio ("Ultima vez: 25 kg x 10"). */
@Service
public class LastPerformanceService {

    public record LastPerformance(Long sessionId, Instant date, List<SetSnapshot> sets) { }

    private static final int LOOKBACK_SETS = 600;

    private final ExerciseSetRepository sets;

    public LastPerformanceService(ExerciseSetRepository sets) {
        this.sets = sets;
    }

    @Transactional(readOnly = true)
    public Map<Long, LastPerformance> lastFor(Long userId, Collection<Long> exerciseIds) {
        return lastFor(userId, exerciseIds, null);
    }

    /** @param excludeSessionId sessao a ignorar (a propria sessao em andamento). */
    @Transactional(readOnly = true)
    public Map<Long, LastPerformance> lastFor(Long userId, Collection<Long> exerciseIds, Long excludeSessionId) {
        Map<Long, LastPerformance> result = new HashMap<>();
        if (exerciseIds.isEmpty()) {
            return result;
        }
        Map<Long, Long> chosenSession = new HashMap<>();
        Map<Long, List<SetSnapshot>> snapshots = new HashMap<>();
        Map<Long, Instant> dates = new HashMap<>();
        for (ExerciseSet s : sets.findRecentCompleted(userId, exerciseIds, PageRequest.of(0, LOOKBACK_SETS))) {
            Long exId = s.getExercise().getId();
            Long sessionId = s.getSession().getId();
            if (sessionId.equals(excludeSessionId)) {
                continue;
            }
            Long chosen = chosenSession.putIfAbsent(exId, sessionId);
            if (chosen == null || chosen.equals(sessionId)) {
                snapshots.computeIfAbsent(exId, k -> new ArrayList<>())
                        .add(new SetSnapshot(s.getSetNumber(), s.getWeightKg(), s.getReps()));
                dates.putIfAbsent(exId, s.getSession().getFinishedAt());
            }
        }
        snapshots.forEach((exId, list) -> result.put(exId, new LastPerformance(chosenSession.get(exId), dates.get(exId), list)));
        return result;
    }
}
