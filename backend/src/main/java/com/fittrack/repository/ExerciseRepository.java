package com.fittrack.repository;

import com.fittrack.entity.Exercise;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    @EntityGraph(attributePaths = {"primaryMuscle", "secondaryMuscles"})
    @Query("select e from Exercise e order by e.primaryMuscle.position, e.name")
    List<Exercise> findAllWithMuscles();

    @EntityGraph(attributePaths = {"primaryMuscle"})
    List<Exercise> findBySlugIn(java.util.Collection<String> slugs);

    @EntityGraph(attributePaths = {"primaryMuscle"})
    List<Exercise> findByIdIn(java.util.Collection<Long> ids);

    @Query("select e.primaryMuscle.slug, count(e) from Exercise e group by e.primaryMuscle.slug")
    List<Object[]> countByPrimaryMuscle();
}
