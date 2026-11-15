package com.fittrack.service;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import com.fittrack.dto.WorkoutDtos.*;
import com.fittrack.entity.Exercise;
import com.fittrack.entity.User;
import com.fittrack.entity.Workout;
import com.fittrack.entity.WorkoutExercise;
import com.fittrack.exception.BusinessException;
import com.fittrack.exception.NotFoundException;
import com.fittrack.repository.ExerciseRepository;
import com.fittrack.repository.UserRepository;
import com.fittrack.repository.WorkoutRepository;
import com.fittrack.service.LastPerformanceService.LastPerformance;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkoutService {

    private static final int MAX_WORKOUTS = 30;
    /** Tempo medio estimado de execucao de uma serie, em segundos. */
    private static final int SECONDS_PER_SET = 45;

    private final WorkoutRepository workouts;
    private final ExerciseRepository exercises;
    private final UserRepository users;
    private final LastPerformanceService lastPerformance;

    public WorkoutService(WorkoutRepository workouts, ExerciseRepository exercises, UserRepository users,
                          LastPerformanceService lastPerformance) {
        this.workouts = workouts;
        this.exercises = exercises;
        this.users = users;
        this.lastPerformance = lastPerformance;
    }

    @Transactional(readOnly = true)
    public List<WorkoutDto> list(Long userId) {
        List<Workout> list = workouts.findByUser(userId);
        Set<Long> exerciseIds = list.stream().flatMap(w -> w.getExercises().stream())
                .map(we -> we.getExercise().getId()).collect(Collectors.toSet());
        Map<Long, LastPerformance> last = lastPerformance.lastFor(userId, exerciseIds);
        return list.stream().map(w -> toDto(w, last)).toList();
    }

    @Transactional(readOnly = true)
    public WorkoutDto get(Long userId, Long id) {
        Workout w = owned(userId, id);
        Set<Long> ids = w.getExercises().stream().map(we -> we.getExercise().getId()).collect(Collectors.toSet());
        return toDto(w, lastPerformance.lastFor(userId, ids));
    }

    @Transactional
    public WorkoutDto create(Long userId, WorkoutRequest req) {
        User user = users.getReferenceById(userId);
        if (workouts.findByUser(userId).size() >= MAX_WORKOUTS) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Limite de " + MAX_WORKOUTS + " treinos atingido");
        }
        Workout w = new Workout(user);
        w.setPosition(workouts.maxPosition(userId) + 1);
        apply(w, req);
        workouts.save(w);
        return get(userId, w.getId());
    }

    @Transactional
    public WorkoutDto update(Long userId, Long id, WorkoutRequest req) {
        Workout w = owned(userId, id);
        apply(w, req);
        w.touch();
        workouts.flush();
        return get(userId, id);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        workouts.delete(owned(userId, id));
    }

    @Transactional
    public WorkoutDto duplicate(Long userId, Long id) {
        Workout source = owned(userId, id);
        List<WorkoutExerciseRequest> items = source.getExercises().stream()
                .map(we -> new WorkoutExerciseRequest(we.getExercise().getId(), we.getSets(), we.getReps(), we.getRestSeconds(), we.getNotes()))
                .toList();
        String name = truncate(source.getName() + " (cópia)", 100);
        return create(userId, new WorkoutRequest(name, source.getDescription(), null, items));
    }

    @Transactional
    public List<WorkoutDto> reorder(Long userId, ReorderRequest req) {
        Map<Long, Workout> byId = workouts.findByUser(userId).stream().collect(Collectors.toMap(Workout::getId, Function.identity()));
        int pos = 0;
        for (Long id : req.workoutIds()) {
            Workout w = byId.remove(id);
            if (w == null) {
                throw new NotFoundException("Treino não encontrado");
            }
            w.setPosition(pos++);
        }
        for (Workout rest : byId.values()) {
            rest.setPosition(pos++);
        }
        workouts.flush();
        return list(userId);
    }

    /** Cria uma divisao completa (ABC, ABCD ou ABCDE) com exercicios sugeridos que o usuario pode editar. */
    @Transactional
    public List<WorkoutDto> createSplit(Long userId, SplitRequest req) {
        List<SplitTemplates.Day> days = SplitTemplates.forType(req.type());
        if (workouts.findByUser(userId).size() + days.size() > MAX_WORKOUTS) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Limite de " + MAX_WORKOUTS + " treinos atingido");
        }
        Set<String> slugs = days.stream().flatMap(d -> d.exerciseSlugs().stream()).collect(Collectors.toSet());
        Map<String, Exercise> bySlug = exercises.findBySlugIn(slugs).stream().collect(Collectors.toMap(Exercise::getSlug, Function.identity()));
        User user = users.getReferenceById(userId);
        int pos = workouts.maxPosition(userId) + 1;
        for (SplitTemplates.Day day : days) {
            Workout w = new Workout(user);
            w.setName("Treino " + day.letter() + " — " + day.name());
            w.setLetter(day.letter());
            w.setDescription("Divisão " + req.type());
            w.setPosition(pos++);
            int i = 0;
            for (String slug : day.exerciseSlugs()) {
                Exercise e = bySlug.get(slug);
                if (e != null) {
                    w.getExercises().add(new WorkoutExercise(w, e, i++, day.sets(), day.reps(), day.rest(), null));
                }
            }
            workouts.save(w);
        }
        workouts.flush();
        return list(userId);
    }

    public Workout owned(Long userId, Long id) {
        return workouts.findOwned(id, userId).orElseThrow(() -> new NotFoundException("Treino não encontrado"));
    }

    private void apply(Workout w, WorkoutRequest req) {
        w.setName(req.name().trim());
        w.setDescription(req.description() == null || req.description().isBlank() ? null : req.description().trim());
        w.setLetter(req.letter() == null || req.letter().isBlank() ? null : req.letter().toUpperCase(Locale.ROOT));
        Set<Long> ids = req.exercises().stream().map(WorkoutExerciseRequest::exerciseId).collect(Collectors.toSet());
        Map<Long, Exercise> byId = exercises.findByIdIn(ids).stream().collect(Collectors.toMap(Exercise::getId, Function.identity()));
        if (byId.size() != ids.size()) {
            throw new NotFoundException("Exercício não encontrado");
        }
        w.getExercises().clear();
        // Garante que as remocoes (orphanRemoval) sejam executadas antes das novas insercoes.
        workouts.flush();
        int position = 0;
        for (WorkoutExerciseRequest item : req.exercises()) {
            String notes = item.notes() == null || item.notes().isBlank() ? null : item.notes().trim();
            w.getExercises().add(new WorkoutExercise(w, byId.get(item.exerciseId()), position++, item.sets(), item.reps(), item.restSeconds(), notes));
        }
    }

    WorkoutDto toDto(Workout w, Map<Long, LastPerformance> last) {
        List<WorkoutExerciseDto> items = w.getExercises().stream().map(we -> {
            LastPerformance lp = last.get(we.getExercise().getId());
            return new WorkoutExerciseDto(we.getId(), ExerciseSummary.from(we.getExercise()), we.getPosition(), we.getSets(),
                    we.getReps(), we.getRestSeconds(), we.getNotes(), lp == null ? List.of() : lp.sets(), lp == null ? null : lp.date());
        }).toList();
        Instant lastPerformed = items.stream().map(WorkoutExerciseDto::lastPerformedAt).filter(Objects::nonNull)
                .max(Comparator.naturalOrder()).orElse(null);
        return new WorkoutDto(w.getId(), w.getName(), w.getDescription(), w.getLetter(), w.getPosition(),
                muscleGroups(w), estimatedMinutes(w), items, w.getUpdatedAt(), lastPerformed);
    }

    static List<String> muscleGroups(Workout w) {
        return w.getExercises().stream().map(we -> we.getExercise().getPrimaryMuscle().getName()).distinct().toList();
    }

    static int estimatedMinutes(Workout w) {
        int seconds = w.getExercises().stream().mapToInt(we -> we.getSets() * (SECONDS_PER_SET + we.getRestSeconds())).sum();
        return Math.max(1, Math.round(seconds / 60f));
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
