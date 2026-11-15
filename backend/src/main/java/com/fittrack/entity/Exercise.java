package com.fittrack.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "exercises")
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "primary_muscle_id")
    private MuscleGroup primaryMuscle;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "exercise_secondary_muscles",
            joinColumns = @JoinColumn(name = "exercise_id"),
            inverseJoinColumns = @JoinColumn(name = "muscle_group_id"))
    private Set<MuscleGroup> secondaryMuscles = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Equipment equipment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    /** Chave do padrao de movimento usada pelo frontend para renderizar a animacao. */
    @Column(nullable = false)
    private String movement;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String instructions;

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public MuscleGroup getPrimaryMuscle() { return primaryMuscle; }
    public Set<MuscleGroup> getSecondaryMuscles() { return secondaryMuscles; }
    public Equipment getEquipment() { return equipment; }
    public Difficulty getDifficulty() { return difficulty; }
    public String getMovement() { return movement; }
    public String getDescription() { return description; }
    public String getInstructions() { return instructions; }
}
