package com.fittrack.service;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import com.fittrack.dto.SessionDtos.*;
import com.fittrack.dto.StatsDtos.RecordDto;
import com.fittrack.dto.WorkoutDtos.SetSnapshot;
import com.fittrack.entity.*;
import com.fittrack.exception.BusinessException;
import com.fittrack.exception.NotFoundException;
import com.fittrack.repository.ExerciseRepository;
import com.fittrack.repository.ExerciseSetRepository;
import com.fittrack.repository.UserRepository;
import com.fittrack.repository.WorkoutRepository;
import com.fittrack.repository.WorkoutSessionRepository;
import com.fittrack.service.LastPerformanceService.LastPerformance;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

    /** Duracao maxima considerada para uma sessao (protege estatisticas de sessoes esquecidas abertas). */
    private static final Duration MAX_DURATION = Duration.ofHours(5);

    private final WorkoutSessionRepository sessions;
    private final ExerciseSetRepository sets;
    private final WorkoutRepository workouts;
    private final ExerciseRepository exercises;
    private final UserRepository users;
    private final LastPerformanceService lastPerformance;
    private final RecordService records;

    public SessionService(WorkoutSessionRepository sessions, ExerciseSetRepository sets, WorkoutRepository workouts,
                          ExerciseRepository exercises, UserRepository users, LastPerformanceService lastPerformance,
                          RecordService records) {
        this.sessions = sessions;
        this.sets = sets;
        this.workouts = workouts;
        this.exercises = exercises;
        this.users = users;
        this.lastPerformance = lastPerformance;
        this.records = records;
    }

    /** Inicia uma sessao a partir de um treino, pre-preenchendo as cargas com a ultima execucao. */
    @Transactional
    public SessionDto start(Long userId, StartSessionRequest req) {
        Optional<WorkoutSession> existing = sessions.findByClientId(req.clientId());
        if (existing.isPresent()) {
            return toDto(ensureOwner(existing.get(), userId));
        }
        if (!sessions.findByUserAndStatus(userId, SessionStatus.IN_PROGRESS).isEmpty()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Você já tem um treino em andamento. Finalize ou descarte antes de iniciar outro.");
        }
        Workout workout = workouts.findOwned(req.workoutId(), userId)
                .orElseThrow(() -> new NotFoundException("Treino não encontrado"));
        if (workout.getExercises().isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Adicione exercícios ao treino antes de iniciar");
        }
        Set<Long> ids = workout.getExercises().stream().map(we -> we.getExercise().getId()).collect(Collectors.toSet());
        Map<Long, LastPerformance> last = lastPerformance.lastFor(userId, ids);

        WorkoutSession s = new WorkoutSession(users.getReferenceById(userId), req.clientId());
        s.setWorkout(workout);
        s.setWorkoutName(workout.getName());
        s.setStartedAt(Instant.now());
        for (WorkoutExercise we : workout.getExercises()) {
            LastPerformance lp = last.get(we.getExercise().getId());
            for (int n = 1; n <= we.getSets(); n++) {
                ExerciseSet set = new ExerciseSet(s, we.getExercise(), we.getPosition(), n, we.getReps(), we.getRestSeconds());
                set.setWeightKg(suggestedWeight(lp, n));
                set.setReps(we.getReps());
                s.getSets().add(set);
            }
        }
        sessions.save(s);
        return toDto(s);
    }

    @Transactional(readOnly = true)
    public Optional<SessionDto> active(Long userId) {
        return sessions.findByUserAndStatus(userId, SessionStatus.IN_PROGRESS).stream().findFirst().map(this::toDto);
    }

    /** Salvamento automatico do progresso (idempotente por clientId). */
    @Transactional
    public SessionDto saveProgress(Long userId, SessionPayload payload) {
        WorkoutSession s = upsert(userId, payload);
        return toDto(s);
    }

    /** Finaliza a sessao: consolida totais, calcula recordes e devolve o resumo. Tambem usado na sincronizacao offline. */
    @Transactional
    public FinishResponse finish(Long userId, SessionPayload payload) {
        Optional<WorkoutSession> existing = sessions.findByClientId(payload.clientId());
        if (existing.isPresent() && existing.get().getStatus() == SessionStatus.COMPLETED) {
            return new FinishResponse(toDto(ensureOwner(existing.get(), userId)), List.of());
        }
        WorkoutSession s = upsert(userId, payload);
        if (s.getCompletedSets() == 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Conclua pelo menos uma série para finalizar o treino");
        }
        Instant finishedAt = payload.finishedAt() != null ? payload.finishedAt() : Instant.now();
        if (finishedAt.isBefore(s.getStartedAt())) {
            finishedAt = s.getStartedAt();
        }
        long seconds = Math.min(Duration.between(s.getStartedAt(), finishedAt).toSeconds(), MAX_DURATION.toSeconds());
        s.setFinishedAt(finishedAt);
        s.setDurationSeconds((int) seconds);
        s.setStatus(SessionStatus.COMPLETED);
        sessions.flush();
        List<RecordDto> newRecords = records.evaluate(s);
        return new FinishResponse(toDto(s), newRecords);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        WorkoutSession s = sessions.findOwned(id, userId).orElseThrow(() -> new NotFoundException("Sessão não encontrada"));
        boolean completed = s.getStatus() == SessionStatus.COMPLETED;
        Set<Long> exerciseIds = s.getSets().stream().map(x -> x.getExercise().getId()).collect(Collectors.toSet());
        sessions.delete(s);
        sessions.flush();
        if (completed) {
            records.recompute(userId, exerciseIds);
        }
    }

    @Transactional(readOnly = true)
    public SessionDto get(Long userId, Long id) {
        return toDto(sessions.findOwned(id, userId).orElseThrow(() -> new NotFoundException("Sessão não encontrada")));
    }

    @Transactional(readOnly = true)
    public Page<SessionSummaryDto> history(Long userId, int page, int size) {
        Page<WorkoutSession> result = sessions.findHistory(userId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
        Map<Long, List<String>> names = exerciseNames(result.getContent());
        return result.map(s -> summary(s, names.getOrDefault(s.getId(), List.of())));
    }

    // ----------------------------------------------------------------------------------------

    private WorkoutSession upsert(Long userId, SessionPayload p) {
        WorkoutSession s = sessions.findByClientId(p.clientId()).map(x -> ensureOwner(x, userId)).orElse(null);
        if (s != null && s.getStatus() == SessionStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Este treino já foi finalizado");
        }
        if (s == null) {
            s = new WorkoutSession(users.getReferenceById(userId), p.clientId());
            s.setStartedAt(p.startedAt());
            if (p.workoutId() != null) {
                workouts.findOwned(p.workoutId(), userId).ifPresent(s::setWorkout);
            }
        }
        s.setWorkoutName(p.workoutName().trim());
        s.setNotes(p.notes() == null || p.notes().isBlank() ? null : p.notes().trim());

        Set<Long> ids = p.exercises().stream().map(SessionExercisePayload::exerciseId).collect(Collectors.toSet());
        Map<Long, Exercise> byId = exercises.findByIdIn(ids).stream().collect(Collectors.toMap(Exercise::getId, Function.identity()));
        if (byId.size() != ids.size()) {
            throw new NotFoundException("Exercício não encontrado");
        }

        s.getSets().clear();
        if (s.getId() != null) {
            sessions.flush();
        }
        BigDecimal volume = BigDecimal.ZERO;
        int reps = 0;
        int completed = 0;
        for (SessionExercisePayload ex : p.exercises()) {
            for (SetPayload sp : ex.sets()) {
                ExerciseSet set = new ExerciseSet(s, byId.get(ex.exerciseId()), ex.order(), sp.setNumber(), ex.plannedReps(), ex.restSeconds());
                set.setWeightKg(sp.weightKg().setScale(2, RoundingMode.HALF_UP));
                set.setReps(sp.reps());
                set.setSkipped(ex.skipped());
                boolean done = sp.completed() && !ex.skipped();
                set.setCompleted(done);
                set.setCompletedAt(done ? (sp.completedAt() != null ? sp.completedAt() : Instant.now()) : null);
                s.getSets().add(set);
                if (done) {
                    volume = volume.add(set.volume());
                    reps += sp.reps();
                    completed++;
                }
            }
        }
        s.setTotalVolume(volume.setScale(2, RoundingMode.HALF_UP));
        s.setTotalReps(reps);
        s.setCompletedSets(completed);
        return sessions.save(s);
    }

    private WorkoutSession ensureOwner(WorkoutSession s, Long userId) {
        if (!s.getUser().getId().equals(userId)) {
            throw new NotFoundException("Sessão não encontrada");
        }
        return s;
    }

    private static BigDecimal suggestedWeight(LastPerformance lp, int setNumber) {
        if (lp == null || lp.sets().isEmpty()) {
            return BigDecimal.ZERO;
        }
        return lp.sets().stream().filter(x -> x.setNumber() == setNumber).findFirst()
                .orElse(lp.sets().get(lp.sets().size() - 1)).weightKg();
    }

    SessionDto toDto(WorkoutSession s) {
        boolean inProgress = s.getStatus() == SessionStatus.IN_PROGRESS;
        Map<Integer, List<ExerciseSet>> byOrder = s.getSets().stream()
                .collect(Collectors.groupingBy(ExerciseSet::getExerciseOrder, TreeMap::new, Collectors.toList()));
        Map<Long, LastPerformance> previous = Map.of();
        if (inProgress) {
            Set<Long> ids = s.getSets().stream().map(x -> x.getExercise().getId()).collect(Collectors.toSet());
            previous = lastPerformance.lastFor(s.getUser().getId(), ids, s.getId());
        }
        List<SessionExerciseDto> exerciseDtos = new ArrayList<>();
        for (Map.Entry<Integer, List<ExerciseSet>> e : byOrder.entrySet()) {
            List<ExerciseSet> list = e.getValue();
            ExerciseSet first = list.get(0);
            LastPerformance lp = previous.get(first.getExercise().getId());
            List<SetDto> setDtos = list.stream()
                    .sorted(Comparator.comparingInt(ExerciseSet::getSetNumber))
                    .map(x -> new SetDto(x.getSetNumber(), x.getWeightKg(), x.getReps(), x.isCompleted(), x.getCompletedAt()))
                    .toList();
            exerciseDtos.add(new SessionExerciseDto(ExerciseSummary.from(first.getExercise()), e.getKey(), first.getPlannedReps(),
                    first.getRestSeconds(), first.isSkipped(), setDtos,
                    lp == null ? List.<SetSnapshot>of() : lp.sets(), lp == null ? null : lp.date()));
        }
        return new SessionDto(s.getId(), s.getClientId(), s.getWorkout() == null ? null : s.getWorkout().getId(),
                s.getWorkoutName(), s.getStatus(), s.getStartedAt(), s.getFinishedAt(), s.getDurationSeconds(),
                s.getTotalVolume(), s.getTotalReps(), s.getCompletedSets(), s.getNotes(), exerciseDtos,
                inProgress ? null : comparison(s));
    }

    private ComparisonDto comparison(WorkoutSession s) {
        if (s.getWorkout() == null || s.getFinishedAt() == null) {
            return null;
        }
        return sessions.findPreviousOfWorkout(s.getUser().getId(), s.getWorkout().getId(), s.getFinishedAt(), PageRequest.of(0, 1))
                .stream().findFirst()
                .map(prev -> new ComparisonDto(prev.getId(), prev.getFinishedAt(), prev.getTotalVolume(),
                        s.getTotalVolume().subtract(prev.getTotalVolume()), prev.getDurationSeconds(), prev.getCompletedSets()))
                .orElse(null);
    }

    Map<Long, List<String>> exerciseNames(List<WorkoutSession> list) {
        if (list.isEmpty()) {
            return Map.of();
        }
        Map<Long, TreeMap<Integer, String>> ordered = new HashMap<>();
        for (ExerciseSet set : sets.findBySessionIds(list.stream().map(WorkoutSession::getId).toList())) {
            ordered.computeIfAbsent(set.getSession().getId(), k -> new TreeMap<>())
                    .putIfAbsent(set.getExerciseOrder(), set.getExercise().getName());
        }
        Map<Long, List<String>> result = new HashMap<>();
        ordered.forEach((id, map) -> result.put(id, new ArrayList<>(map.values())));
        return result;
    }

    static SessionSummaryDto summary(WorkoutSession s, List<String> names) {
        return new SessionSummaryDto(s.getId(), s.getWorkout() == null ? null : s.getWorkout().getId(), s.getWorkoutName(),
                s.getStartedAt(), s.getFinishedAt(), s.getDurationSeconds(), s.getTotalVolume(), s.getTotalReps(),
                s.getCompletedSets(), names);
    }
}
