package com.fittrack.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    private LocalDate birthDate;
    private Integer heightCm;
    private BigDecimal weightKg;

    @Enumerated(EnumType.STRING)
    private TrainingGoal goal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty experienceLevel = Difficulty.BEGINNER;

    @Column(nullable = false)
    private int weeklyGoal = 4;

    @Column(nullable = false)
    private int defaultRestSeconds = 90;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @ManyToMany
    @JoinTable(name = "user_favorite_exercises",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "exercise_id"))
    private Set<Exercise> favoriteExercises = new HashSet<>();

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public Integer getHeightCm() { return heightCm; }
    public void setHeightCm(Integer heightCm) { this.heightCm = heightCm; }
    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
    public TrainingGoal getGoal() { return goal; }
    public void setGoal(TrainingGoal goal) { this.goal = goal; }
    public Difficulty getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(Difficulty experienceLevel) { this.experienceLevel = experienceLevel; }
    public int getWeeklyGoal() { return weeklyGoal; }
    public void setWeeklyGoal(int weeklyGoal) { this.weeklyGoal = weeklyGoal; }
    public int getDefaultRestSeconds() { return defaultRestSeconds; }
    public void setDefaultRestSeconds(int defaultRestSeconds) { this.defaultRestSeconds = defaultRestSeconds; }
    public Instant getCreatedAt() { return createdAt; }
    public Set<Exercise> getFavoriteExercises() { return favoriteExercises; }
}
