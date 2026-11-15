package com.fittrack.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "personal_records")
public class PersonalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Exercise exercise;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordType type;

    @Column(name = "record_value", nullable = false)
    private BigDecimal value;

    @Column(nullable = false)
    private BigDecimal weightKg;

    @Column(nullable = false)
    private int reps;

    @ManyToOne(fetch = FetchType.LAZY)
    private WorkoutSession session;

    @Column(nullable = false)
    private Instant achievedAt;

    protected PersonalRecord() { }

    public PersonalRecord(User user, Exercise exercise, RecordType type) {
        this.user = user;
        this.exercise = exercise;
        this.type = type;
    }

    public void update(BigDecimal value, BigDecimal weightKg, int reps, WorkoutSession session, Instant achievedAt) {
        this.value = value;
        this.weightKg = weightKg;
        this.reps = reps;
        this.session = session;
        this.achievedAt = achievedAt;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Exercise getExercise() { return exercise; }
    public RecordType getType() { return type; }
    public BigDecimal getValue() { return value; }
    public BigDecimal getWeightKg() { return weightKg; }
    public int getReps() { return reps; }
    public WorkoutSession getSession() { return session; }
    public Instant getAchievedAt() { return achievedAt; }
}
