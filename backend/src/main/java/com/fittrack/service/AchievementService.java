package com.fittrack.service;

import com.fittrack.dto.StatsDtos.AchievementDto;
import com.fittrack.dto.StatsDtos.DashboardDto;
import com.fittrack.entity.WorkoutSession;
import com.fittrack.repository.PersonalRecordRepository;
import com.fittrack.repository.WorkoutSessionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Conquistas calculadas a partir do historico real do usuario (sem estado proprio). */
@Service
public class AchievementService {

    private final WorkoutSessionRepository sessions;
    private final PersonalRecordRepository records;
    private final StatsService stats;

    public AchievementService(WorkoutSessionRepository sessions, PersonalRecordRepository records, StatsService stats) {
        this.sessions = sessions;
        this.records = records;
        this.stats = stats;
    }

    @Transactional(readOnly = true)
    public List<AchievementDto> list(Long userId) {
        List<WorkoutSession> all = sessions.findCompletedSince(userId, Instant.EPOCH);
        long count = all.size();
        double tons = all.stream().map(WorkoutSession::getTotalVolume).reduce(BigDecimal.ZERO, BigDecimal::add).doubleValue() / 1000.0;
        long hours = all.stream().mapToLong(WorkoutSession::getDurationSeconds).sum() / 3600;
        int prs = records.findByUser(userId).size();
        DashboardDto dash = stats.dashboard(userId);

        List<AchievementDto> out = new ArrayList<>();
        out.add(counter("first-workout", "Primeiro passo", "Conclua seu primeiro treino", "flag", count, 1, "treino"));
        out.add(counter("workouts-10", "Constância", "Conclua 10 treinos", "repeat", count, 10, "treinos"));
        out.add(counter("workouts-50", "Rotina de ferro", "Conclua 50 treinos", "dumbbell", count, 50, "treinos"));
        out.add(counter("workouts-100", "Centurião", "Conclua 100 treinos", "crown", count, 100, "treinos"));
        out.add(counter("volume-10t", "10 toneladas", "Acumule 10 t de volume levantado", "weight", tons, 10, "t"));
        out.add(counter("volume-100t", "100 toneladas", "Acumule 100 t de volume levantado", "mountain", tons, 100, "t"));
        out.add(counter("hours-24", "Um dia inteiro", "Some 24 horas de treino", "timer", hours, 24, "h"));
        out.add(counter("weekly-goal", "Meta da semana", "Bata sua meta semanal de treinos", "target", dash.weekSessions(), dash.weeklyGoal(), "treinos"));
        out.add(counter("streak-4", "Mês sem falhar", "Bata a meta semanal por 4 semanas seguidas", "flame", dash.streakWeeks(), 4, "semanas"));
        out.add(counter("records-5", "Quebrando barreiras", "Registre 5 recordes pessoais", "trophy", prs, 5, "recordes"));
        out.add(counter("records-25", "Máquina de PRs", "Registre 25 recordes pessoais", "zap", prs, 25, "recordes"));
        return out;
    }

    private static AchievementDto counter(String code, String title, String description, String icon, double value, double target, String unit) {
        double progress = Math.min(1.0, target <= 0 ? 0 : value / target);
        String shown = value == Math.floor(value) ? String.valueOf((long) Math.min(value, target)) : String.format("%.1f", Math.min(value, target));
        String label = shown + " / " + (long) target + " " + unit;
        return new AchievementDto(code, title, description, icon, progress >= 1.0, progress, label);
    }
}
