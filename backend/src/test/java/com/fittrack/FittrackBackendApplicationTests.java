package com.fittrack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fittrack.dto.AuthDtos.AuthResponse;
import com.fittrack.dto.AuthDtos.LoginRequest;
import com.fittrack.dto.AuthDtos.RegisterRequest;
import com.fittrack.dto.ExerciseDtos.ExerciseDto;
import com.fittrack.dto.SessionDtos.*;
import com.fittrack.dto.StatsDtos.DashboardDto;
import com.fittrack.dto.WorkoutDtos.WorkoutDto;
import com.fittrack.dto.WorkoutDtos.WorkoutExerciseRequest;
import com.fittrack.dto.WorkoutDtos.WorkoutRequest;
import com.fittrack.entity.RecordType;
import com.fittrack.exception.BusinessException;
import com.fittrack.exception.NotFoundException;
import com.fittrack.service.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FittrackBackendApplicationTests {

    @Autowired AuthService auth;
    @Autowired ExerciseService exercises;
    @Autowired WorkoutService workouts;
    @Autowired SessionService sessions;
    @Autowired StatsService stats;
    @Autowired RecordService records;

    private Long newUser() {
        String email = "user-" + UUID.randomUUID() + "@fittrack.dev";
        AuthResponse res = auth.register(new RegisterRequest("Atleta Teste", email, "senha-segura-123"));
        assertThat(res.token()).isNotBlank();
        assertThat(auth.login(new LoginRequest(email, "senha-segura-123")).user().id()).isEqualTo(res.user().id());
        return res.user().id();
    }

    @Test
    void libraryIsSeededByMuscleGroup() {
        Long user = newUser();
        assertThat(exercises.muscleGroups()).hasSize(11).allMatch(m -> m.exerciseCount() > 0);
        List<ExerciseDto> chest = exercises.search(user, "chest", null, null, false);
        assertThat(chest).extracting(ExerciseDto::name).contains("Supino reto com barra", "Crossover", "Peck deck");
        assertThat(exercises.search(user, null, null, "supino", false)).hasSizeGreaterThan(4);
    }

    @Test
    void fullWorkoutFlowPersistsLoadsAndRecords() {
        Long user = newUser();
        Long bench = exercises.search(user, "chest", null, "supino reto com barra", false).get(0).id();
        Long fly = exercises.search(user, "chest", null, "crossover", false).get(0).id();

        WorkoutDto w = workouts.create(user, new WorkoutRequest("Treino A — Peito", null, "A", List.of(
                new WorkoutExerciseRequest(bench, 3, 10, 90, null),
                new WorkoutExerciseRequest(fly, 2, 12, 60, null))));
        assertThat(w.exercises()).hasSize(2);

        // Primeira sessao
        SessionDto s1 = sessions.start(user, new StartSessionRequest(w.id(), UUID.randomUUID().toString()));
        assertThat(s1.exercises().get(0).sets()).hasSize(3);
        FinishResponse f1 = sessions.finish(user, payload(s1, List.of(20, 25, 25), List.of(12, 10, 8)));
        assertThat(f1.session().totalVolume()).isEqualByComparingTo("690"); // 240 + 250 + 200 (+ crossover 0 kg)
        assertThat(f1.newRecords()).isEmpty();

        // Segunda sessao: deve sugerir as cargas da ultima vez e detectar recorde
        SessionDto s2 = sessions.start(user, new StartSessionRequest(w.id(), UUID.randomUUID().toString()));
        assertThat(s2.exercises().get(0).previous()).extracting(p -> p.weightKg().intValue()).containsExactly(20, 25, 25);
        assertThat(s2.exercises().get(0).sets().get(1).weightKg()).isEqualByComparingTo("25");

        // Autosave idempotente
        SessionPayload progress = payload(s2, List.of(25, 27.5, 30), List.of(10, 8, 6));
        sessions.saveProgress(user, progress);
        sessions.saveProgress(user, progress);
        assertThat(sessions.active(user)).isPresent();

        FinishResponse f2 = sessions.finish(user, progress);
        assertThat(f2.newRecords()).anyMatch(r -> r.type() == RecordType.MAX_WEIGHT && r.value().compareTo(new BigDecimal("30")) == 0);
        assertThat(f2.session().comparison()).isNotNull();
        assertThat(sessions.active(user)).isEmpty();
        // Finalizar de novo (ex.: reenvio da sincronizacao offline) nao duplica
        assertThat(sessions.finish(user, progress).newRecords()).isEmpty();

        DashboardDto dash = stats.dashboard(user);
        assertThat(dash.totalSessions()).isEqualTo(2);
        assertThat(dash.weekSessions()).isEqualTo(2);
        assertThat(stats.exerciseProgress(user, bench, "30d").points()).hasSize(2);
        assertThat(sessions.history(user, 0, 10).getTotalElements()).isEqualTo(2);

        // Excluir a sessao do recorde recalcula a marca
        sessions.delete(user, f2.session().id());
        assertThat(records.list(user)).anyMatch(r -> r.type() == RecordType.MAX_WEIGHT && r.value().compareTo(new BigDecimal("25")) == 0);
    }

    @Test
    void usersCannotAccessOtherUsersData() {
        Long owner = newUser();
        Long intruder = newUser();
        Long ex = exercises.search(owner, "biceps", null, null, false).get(0).id();
        WorkoutDto w = workouts.create(owner, new WorkoutRequest("Braços", null, null, List.of(new WorkoutExerciseRequest(ex, 3, 10, 60, null))));
        assertThatThrownBy(() -> workouts.get(intruder, w.id())).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> sessions.start(intruder, new StartSessionRequest(w.id(), UUID.randomUUID().toString())))
                .isInstanceOf(NotFoundException.class);
        assertThat(workouts.list(intruder)).isEmpty();
    }

    @Test
    void cannotFinishWithoutCompletedSets() {
        Long user = newUser();
        Long ex = exercises.search(user, "abs", null, null, false).get(0).id();
        WorkoutDto w = workouts.create(user, new WorkoutRequest("Core", null, null, List.of(new WorkoutExerciseRequest(ex, 2, 15, 45, null))));
        SessionDto s = sessions.start(user, new StartSessionRequest(w.id(), UUID.randomUUID().toString()));
        List<SessionExercisePayload> exs = s.exercises().stream().map(e -> new SessionExercisePayload(e.exercise().id(), e.order(),
                e.plannedReps(), e.restSeconds(), false,
                e.sets().stream().map(x -> new SetPayload(x.setNumber(), x.weightKg(), x.reps(), false, null)).toList())).toList();
        SessionPayload p = new SessionPayload(s.clientId(), w.id(), s.workoutName(), s.startedAt(), null, null, exs);
        assertThatThrownBy(() -> sessions.finish(user, p)).isInstanceOf(BusinessException.class);
    }

    /** Monta o payload marcando todas as series do primeiro exercicio como concluidas com as cargas informadas. */
    private static SessionPayload payload(SessionDto s, List<? extends Number> weights, List<Integer> reps) {
        List<SessionExercisePayload> exs = new ArrayList<>();
        for (SessionExerciseDto e : s.exercises()) {
            List<SetPayload> sets = new ArrayList<>();
            for (int i = 0; i < e.sets().size(); i++) {
                SetDto set = e.sets().get(i);
                boolean first = e.order() == 0;
                BigDecimal weight = first ? new BigDecimal(weights.get(i).toString()) : BigDecimal.ZERO;
                int r = first ? reps.get(i) : set.reps();
                sets.add(new SetPayload(set.setNumber(), weight, r, true, Instant.now()));
            }
            exs.add(new SessionExercisePayload(e.exercise().id(), e.order(), e.plannedReps(), e.restSeconds(), false, sets));
        }
        return new SessionPayload(s.clientId(), s.workoutId(), s.workoutName(), s.startedAt(), Instant.now(), null, exs);
    }
}
