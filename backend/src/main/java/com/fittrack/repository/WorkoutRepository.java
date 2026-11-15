package com.fittrack.repository;

import com.fittrack.entity.Workout;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkoutRepository extends JpaRepository<Workout, Long> {

    @Query("select w from Workout w where w.user.id = :userId order by w.position asc, w.id asc")
    List<Workout> findByUser(@Param("userId") Long userId);

    @Query("select w from Workout w where w.id = :id and w.user.id = :userId")
    Optional<Workout> findOwned(@Param("id") Long id, @Param("userId") Long userId);

    @Query("select coalesce(max(w.position), -1) from Workout w where w.user.id = :userId")
    int maxPosition(@Param("userId") Long userId);
}
