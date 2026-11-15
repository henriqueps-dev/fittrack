package com.fittrack.service;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import com.fittrack.dto.StatsDtos.RecordDto;
import com.fittrack.entity.*;
import com.fittrack.repository.ExerciseSetRepository;
import com.fittrack.repository.PersonalRecordRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Calculo e manutencao de recordes pessoais. */
@Service
public class RecordService {

    private static final int MAX_REPS_FOR_1RM = 15;

    private final PersonalRecordRepository records;
    private final ExerciseSetRepository sets;

    public RecordService(PersonalRecordRepository records, ExerciseSetRepository sets) {
        this.records = records;
        this.sets = sets;
    }

    private record Candidate(RecordType type, BigDecimal value, ExerciseSet set) { }

    /**
     * Compara as series concluidas da sessao com os recordes atuais.
     * Retorna somente recordes superados (a primeira execucao de um exercicio estabelece a marca sem comemorar).
     */
    @Transactional
    public List<RecordDto> evaluate(WorkoutSession session) {
        Long userId = session.getUser().getId();
        Map<Long, List<ExerciseSet>> byExercise = session.getSets().stream().filter(ExerciseSet::isCompleted)
                .collect(Collectors.groupingBy(s -> s.getExercise().getId()));
        if (byExercise.isEmpty()) {
            return List.of();
        }
        Map<String, PersonalRecord> current = records.findByUserAndExercises(userId, byExercise.keySet()).stream()
                .collect(Collectors.toMap(r -> key(r.getExercise().getId(), r.getType()), r -> r));
        List<RecordDto> improved = new ArrayList<>();
        for (Map.Entry<Long, List<ExerciseSet>> e : byExercise.entrySet()) {
            for (Candidate c : candidates(e.getValue())) {
                PersonalRecord existing = current.get(key(e.getKey(), c.type()));
                if (existing == null) {
                    PersonalRecord r = new PersonalRecord(session.getUser(), c.set().getExercise(), c.type());
                    r.update(c.value(), c.set().getWeightKg(), c.set().getReps(), session, session.getFinishedAt());
                    records.save(r);
                } else if (c.value().compareTo(existing.getValue()) > 0) {
                    existing.update(c.value(), c.set().getWeightKg(), c.set().getReps(), session, session.getFinishedAt());
                    improved.add(toDto(existing));
                }
            }
        }
        return improved;
    }

    /** Recalcula os recordes dos exercicios informados a partir do historico (ex.: apos excluir uma sessao). */
    @Transactional
    public void recompute(Long userId, Collection<Long> exerciseIds) {
        if (exerciseIds.isEmpty()) {
            return;
        }
        List<PersonalRecord> existing = records.findByUserAndExercises(userId, exerciseIds);
        records.deleteAll(existing);
        records.flush();
        for (Long exId : exerciseIds) {
            List<ExerciseSet> history = sets.findExerciseHistory(userId, exId, Instant.EPOCH);
            for (Candidate c : candidates(history)) {
                WorkoutSession s = c.set().getSession();
                PersonalRecord r = new PersonalRecord(s.getUser(), c.set().getExercise(), c.type());
                r.update(c.value(), c.set().getWeightKg(), c.set().getReps(), s, s.getFinishedAt());
                records.save(r);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<RecordDto> list(Long userId) {
        return records.findByUser(userId).stream().map(RecordService::toDto).toList();
    }

    private static List<Candidate> candidates(List<ExerciseSet> list) {
        List<Candidate> out = new ArrayList<>();
        ExerciseSet heaviest = null;
        ExerciseSet best1Rm = null;
        BigDecimal best1RmValue = BigDecimal.ZERO;
        ExerciseSet mostReps = null;
        for (ExerciseSet s : list) {
            if (!s.isCompleted() || s.getReps() <= 0) {
                continue;
            }
            if (s.getWeightKg().signum() > 0) {
                if (heaviest == null || s.getWeightKg().compareTo(heaviest.getWeightKg()) > 0
                        || (s.getWeightKg().compareTo(heaviest.getWeightKg()) == 0 && s.getReps() > heaviest.getReps())) {
                    heaviest = s;
                }
                if (s.getReps() <= MAX_REPS_FOR_1RM) {
                    BigDecimal est = estimate1Rm(s.getWeightKg(), s.getReps());
                    if (est.compareTo(best1RmValue) > 0) {
                        best1RmValue = est;
                        best1Rm = s;
                    }
                }
            } else if (mostReps == null || s.getReps() > mostReps.getReps()) {
                mostReps = s;
            }
        }
        if (heaviest != null) {
            out.add(new Candidate(RecordType.MAX_WEIGHT, heaviest.getWeightKg(), heaviest));
        }
        if (best1Rm != null) {
            out.add(new Candidate(RecordType.EST_1RM, best1RmValue, best1Rm));
        }
        if (mostReps != null && heaviest == null) {
            out.add(new Candidate(RecordType.MAX_REPS, BigDecimal.valueOf(mostReps.getReps()), mostReps));
        }
        return out;
    }

    /** Formula de Epley: 1RM = carga x (1 + reps / 30). */
    public static BigDecimal estimate1Rm(BigDecimal weight, int reps) {
        if (reps == 1) {
            return weight.setScale(2, RoundingMode.HALF_UP);
        }
        return weight.multiply(BigDecimal.ONE.add(BigDecimal.valueOf(reps).divide(BigDecimal.valueOf(30), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
    }

    static RecordDto toDto(PersonalRecord r) {
        return new RecordDto(r.getId(), ExerciseSummary.from(r.getExercise()), r.getType(), r.getValue(), r.getWeightKg(),
                r.getReps(), r.getAchievedAt(), r.getSession() == null ? null : r.getSession().getId());
    }

    private static String key(Long exerciseId, RecordType type) {
        return exerciseId + ":" + type;
    }
}
