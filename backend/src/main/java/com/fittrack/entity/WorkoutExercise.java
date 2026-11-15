package com.fittrack.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "workout_exercises")
public class WorkoutExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Workout workout;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Exercise exercise;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private int sets;

    @Column(nullable = false)
    private int reps;

    @Column(nullable = false)
    private int restSeconds;

    @Column(length = 300)
    private String notes;

    protected WorkoutExercise() { }

    public WorkoutExercise(Workout workout, Exercise exercise, int position, int sets, int reps, int restSeconds, String notes) {
        this.workout = workout;
        this.exercise = exercise;
        this.position = position;
        this.sets = sets;
        this.reps = reps;
        this.restSeconds = restSeconds;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public Workout getWorkout() { return workout; }
    public Exercise getExercise() { return exercise; }
    public int getPosition() { return position; }
    public int getSets() { return sets; }
    public int getReps() { return reps; }
    public int getRestSeconds() { return restSeconds; }
    public String getNotes() { return notes; }
}
