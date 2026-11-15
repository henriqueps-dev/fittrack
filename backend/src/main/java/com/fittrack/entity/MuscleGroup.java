package com.fittrack.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "muscle_groups")
public class MuscleGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BodyRegion region;

    @Column(nullable = false)
    private int position;

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public BodyRegion getRegion() { return region; }
    public int getPosition() { return position; }
}
