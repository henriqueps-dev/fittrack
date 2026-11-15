package com.fittrack.repository;

import com.fittrack.entity.MuscleGroup;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MuscleGroupRepository extends JpaRepository<MuscleGroup, Long> {

    List<MuscleGroup> findAllByOrderByPositionAsc();

    Optional<MuscleGroup> findBySlug(String slug);
}
