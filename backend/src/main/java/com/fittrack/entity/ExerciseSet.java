package com.fittrack.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "exercise_sets")
public class ExerciseSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private WorkoutSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Exercise exercise;

    @Column(nullable = false)
    private int exerciseOrder;

    @Column(nullable = false)
    private int setNumber;

    @Column(nullable = false)
    private int plannedReps;

    @Column(nullable = false)
    private int restSeconds;

    @Column(nullable = false)
    private BigDecimal weightKg = BigDecimal.ZERO;

    @Column(nullable = false)
    private int reps;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    private boolean skipped;

    private Instant completedAt;

    protected ExerciseSet() { }

    public ExerciseSet(WorkoutSession session, Exercise exercise, int exerciseOrder, int setNumber, int plannedReps, int restSeconds) {
        this.session = session;
        this.exercise = exercise;
        this.exerciseOrder = exerciseOrder;
        this.setNumber = setNumber;
        this.plannedReps = plannedReps;
        this.restSeconds = restSeconds;
    }

    public Long getId() { return id; }
    public WorkoutSession getSession() { return session; }
    public Exercise getExercise() { return exercise; }
    public int getExerciseOrder() { return exerciseOrder; }
    public int getSetNumber() { return setNumber; }
    public int getPlannedReps() { return plannedReps; }
    public int getRestSeconds() { return restSeconds; }
    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    public int getReps() { return reps; }
    public void setReps(int reps) { this.reps = reps; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public boolean isSkipped() { return skipped; }
    public void setSkipped(boolean skipped) { this.skipped = skipped; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    /** Volume da serie (carga x repeticoes) considerando apenas series concluidas. */
    public BigDecimal volume() {
        return completed ? weightKg.multiply(BigDecimal.valueOf(reps)) : BigDecimal.ZERO;
    }
}
