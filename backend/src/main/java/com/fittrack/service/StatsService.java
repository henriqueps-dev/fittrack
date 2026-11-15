package com.fittrack.service;

import com.fittrack.dto.ExerciseDtos.ExerciseSummary;
import com.fittrack.dto.SessionDtos.SessionSummaryDto;
import com.fittrack.dto.StatsDtos.*;
import com.fittrack.entity.*;
import com.fittrack.exception.BusinessException;
import com.fittrack.repository.ExerciseSetRepository;
import com.fittrack.repository.WorkoutRepository;
import com.fittrack.repository.WorkoutSessionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    private final WorkoutSessionRepository sessions;
    private final ExerciseSetRepository sets;
    private final WorkoutRepository workouts;
    private final UserService users;
    private final SessionService sessionService;
    private final RecordService records;
    private final ExerciseService exercises;
    private final ZoneId zone;

    public StatsService(WorkoutSessionRepository sessions, ExerciseSetRepository sets, WorkoutRepository workouts,
                        UserService users, SessionService sessionService, RecordService records, ExerciseService exercises,
                        @Value("${app.timezone:America/Sao_Paulo}") String zone) {
        this.sessions = sessions;
        this.sets = sets;
        this.workouts = workouts;
        this.users = users;
        this.sessionService = sessionService;
        this.records = records;
        this.exercises = exercises;
        this.zone = ZoneId.of(zone);
    }

    /** Periodos aceitos nos filtros da tela de evolucao. */
    public enum Range {
        D7("7d", 7), D30("30d", 30), M3("3m", 91), M6("6m", 182), ALL("all", -1);

        final String code;
        final int days;

        Range(String code, int days) { this.code = code; this.days = days; }

        public static Range of(String code) {
            return Arrays.stream(values()).filter(r -> r.code.equalsIgnoreCase(code)).findFirst()
                    .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Período inválido"));
        }

        Instant from(ZoneId zone) {
            return days < 0 ? Instant.EPOCH : LocalDate.now(zone).minusDays(days - 1L).atStartOfDay(zone).toInstant();
        }
    }

    @Transactional(readOnly = true)
    public DashboardDto dashboard(Long userId) {
        User user = users.get(userId);
        LocalDate today = LocalDate.now(zone);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        // Busca 26 semanas para calcular a sequencia de semanas com meta batida.
        List<WorkoutSession> recent = sessions.findCompletedSince(userId, weekStart.minusWeeks(26).atStartOfDay(zone).toInstant());

        List<WorkoutSession> thisWeek = recent.stream().filter(s -> !localDate(s).isBefore(weekStart)).toList();
        List<DayPoint> week = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = weekStart.plusDays(i);
            week.add(dayPoint(day, thisWeek.stream().filter(s -> localDate(s).equals(day)).toList()));
        }

        WorkoutSession last = recent.isEmpty() ? null : recent.get(recent.size() - 1);
        if (last == null) {
            last = sessions.findHistory(userId, PageRequest.of(0, 1)).stream().findFirst().orElse(null);
        }
        SessionSummaryDto lastDto = last == null ? null
                : SessionService.summary(last, sessionService.exerciseNames(List.of(last)).getOrDefault(last.getId(), List.of()));

        return new DashboardDto(user.getName(), user.getWeeklyGoal(), thisWeek.size(),
                thisWeek.stream().mapToInt(WorkoutSession::getDurationSeconds).sum(),
                sum(thisWeek), thisWeek.stream().mapToInt(WorkoutSession::getCompletedSets).sum(),
                streakWeeks(recent, weekStart, user.getWeeklyGoal()), sessions.countCompleted(userId),
                lastDto, nextWorkout(userId, last), week,
                !sessions.findByUserAndStatus(userId, SessionStatus.IN_PROGRESS).isEmpty());
    }

    @Transactional(readOnly = true)
    public OverviewDto overview(Long userId, String rangeCode) {
        Range range = Range.of(rangeCode);
        List<WorkoutSession> list = sessions.findCompletedSince(userId, range.from(zone));
        int sessionsCount = list.size();
        int duration = list.stream().mapToInt(WorkoutSession::getDurationSeconds).sum();
        BigDecimal volume = sum(list);
        int reps = list.stream().mapToInt(WorkoutSession::getTotalReps).sum();
        int setsCount = list.stream().mapToInt(WorkoutSession::getCompletedSets).sum();

        LocalDate firstDay = range == Range.ALL
                ? (list.isEmpty() ? LocalDate.now(zone) : localDate(list.get(0)))
                : LocalDate.ofInstant(range.from(zone), zone);
        long days = Math.max(1, ChronoUnit.DAYS.between(firstDay, LocalDate.now(zone)) + 1);
        double perWeek = Math.round(sessionsCount / (days / 7.0) * 10) / 10.0;

        List<WeekPoint> weekly = weekly(list, firstDay);
        List<SessionPoint> series = list.stream()
                .map(s -> new SessionPoint(s.getId(), s.getFinishedAt(), s.getWorkoutName(), s.getTotalVolume(), s.getDurationSeconds(), s.getCompletedSets()))
                .toList();

        Map<String, MuscleShare> share = new LinkedHashMap<>();
        if (!list.isEmpty()) {
            for (ExerciseSet set : sets.findBySessionIds(list.stream().map(WorkoutSession::getId).toList())) {
                if (!set.isCompleted()) {
                    continue;
                }
                MuscleGroup m = set.getExercise().getPrimaryMuscle();
                MuscleShare prev = share.getOrDefault(m.getSlug(), new MuscleShare(m.getSlug(), m.getName(), 0, BigDecimal.ZERO));
                share.put(m.getSlug(), new MuscleShare(m.getSlug(), m.getName(), prev.sets() + 1, prev.volume().add(set.volume())));
            }
        }
        List<MuscleShare> shareList = share.values().stream().sorted(Comparator.comparingInt(MuscleShare::sets).reversed()).toList();

        return new OverviewDto(range.code, sessionsCount, duration, volume, reps, setsCount,
                sessionsCount == 0 ? BigDecimal.ZERO : volume.divide(BigDecimal.valueOf(sessionsCount), 1, RoundingMode.HALF_UP),
                sessionsCount == 0 ? 0 : duration / sessionsCount, perWeek, weekly, series, shareList);
    }

    @Transactional(readOnly = true)
    public ExerciseProgressDto exerciseProgress(Long userId, Long exerciseId, String rangeCode) {
        Range range = Range.of(rangeCode);
        Exercise exercise = exercises.find(exerciseId);
        Map<Long, List<ExerciseSet>> bySession = new LinkedHashMap<>();
        for (ExerciseSet s : sets.findExerciseHistory(userId, exerciseId, range.from(zone))) {
            bySession.computeIfAbsent(s.getSession().getId(), k -> new ArrayList<>()).add(s);
        }
        List<ProgressPoint> points = new ArrayList<>();
        for (List<ExerciseSet> list : bySession.values()) {
            BigDecimal max = list.stream().map(ExerciseSet::getWeightKg).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            BigDecimal oneRm = list.stream().filter(s -> s.getWeightKg().signum() > 0)
                    .map(s -> RecordService.estimate1Rm(s.getWeightKg(), s.getReps())).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            BigDecimal vol = list.stream().map(ExerciseSet::volume).reduce(BigDecimal.ZERO, BigDecimal::add);
            int bestReps = list.stream().mapToInt(ExerciseSet::getReps).max().orElse(0);
            WorkoutSession session = list.get(0).getSession();
            points.add(new ProgressPoint(session.getId(), session.getFinishedAt(), max, oneRm, vol, bestReps, list.size()));
        }
        BigDecimal best = points.stream().map(ProgressPoint::maxWeight).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        BigDecimal best1Rm = points.stream().map(ProgressPoint::estimated1Rm).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
        BigDecimal change = points.size() < 2 ? BigDecimal.ZERO
                : points.get(points.size() - 1).maxWeight().subtract(points.get(0).maxWeight());
        List<RecordDto> exRecords = records.list(userId).stream().filter(r -> r.exercise().id().equals(exerciseId)).toList();
        return new ExerciseProgressDto(ExerciseSummary.from(exercise), range.code, points, best, best1Rm, change, exRecords);
    }

    @Transactional(readOnly = true)
    public List<TrainedExerciseDto> trainedExercises(Long userId) {
        return sets.findTrainedExercises(userId).stream()
                .map(r -> new TrainedExerciseDto((Long) r[0], (String) r[1], (String) r[2], (Long) r[3], (Instant) r[4]))
                .toList();
    }

    @Transactional(readOnly = true)
    public CalendarDto calendar(Long userId, int days) {
        int span = Math.min(Math.max(days, 7), 371);
        LocalDate to = LocalDate.now(zone);
        LocalDate from = to.minusDays(span - 1L);
        Map<LocalDate, List<WorkoutSession>> byDay = sessions.findCompletedSince(userId, from.atStartOfDay(zone).toInstant())
                .stream().collect(Collectors.groupingBy(this::localDate));
        List<DayPoint> points = byDay.entrySet().stream().sorted(Map.Entry.comparingByKey())
                .map(e -> dayPoint(e.getKey(), e.getValue())).toList();
        return new CalendarDto(from, to, points);
    }

    // ----------------------------------------------------------------------------------------

    private NextWorkoutDto nextWorkout(Long userId, WorkoutSession last) {
        List<Workout> list = workouts.findByUser(userId).stream().filter(w -> !w.getExercises().isEmpty()).toList();
        if (list.isEmpty()) {
            return null;
        }
        Workout next = list.get(0);
        if (last != null && last.getWorkout() != null) {
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i).getId().equals(last.getWorkout().getId())) {
                    next = list.get((i + 1) % list.size());
                    break;
                }
            }
        }
        return new NextWorkoutDto(next.getId(), next.getName(), next.getLetter(), next.getExercises().size(),
                WorkoutService.estimatedMinutes(next), WorkoutService.muscleGroups(next));
    }

    private int streakWeeks(List<WorkoutSession> recent, LocalDate currentWeek, int goal) {
        Map<LocalDate, Long> perWeek = recent.stream().collect(Collectors.groupingBy(
                s -> localDate(s).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), Collectors.counting()));
        int streak = perWeek.getOrDefault(currentWeek, 0L) >= goal ? 1 : 0;
        LocalDate week = currentWeek.minusWeeks(1);
        while (perWeek.getOrDefault(week, 0L) >= goal) {
            streak++;
            week = week.minusWeeks(1);
        }
        return streak;
    }

    private List<WeekPoint> weekly(List<WorkoutSession> list, LocalDate firstDay) {
        LocalDate start = firstDay.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate end = LocalDate.now(zone).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Map<LocalDate, List<WorkoutSession>> byWeek = list.stream().collect(Collectors.groupingBy(
                s -> localDate(s).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))));
        List<WeekPoint> out = new ArrayList<>();
        for (LocalDate w = start; !w.isAfter(end); w = w.plusWeeks(1)) {
            List<WorkoutSession> ws = byWeek.getOrDefault(w, List.of());
            out.add(new WeekPoint(w, ws.size(), sum(ws)));
        }
        return out;
    }

    private DayPoint dayPoint(LocalDate day, List<WorkoutSession> list) {
        return new DayPoint(day, sum(list), list.size(), list.stream().mapToInt(WorkoutSession::getDurationSeconds).sum());
    }

    private LocalDate localDate(WorkoutSession s) {
        return LocalDate.ofInstant(s.getFinishedAt(), zone);
    }

    private static BigDecimal sum(List<WorkoutSession> list) {
        return list.stream().map(WorkoutSession::getTotalVolume).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
