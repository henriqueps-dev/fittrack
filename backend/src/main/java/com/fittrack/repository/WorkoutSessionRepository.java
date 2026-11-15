package com.fittrack.repository;

import com.fittrack.entity.SessionStatus;
import com.fittrack.entity.WorkoutSession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {

    Optional<WorkoutSession> findByClientId(String clientId);

    @Query("select s from WorkoutSession s where s.id = :id and s.user.id = :userId")
    Optional<WorkoutSession> findOwned(@Param("id") Long id, @Param("userId") Long userId);

    @Query("select s from WorkoutSession s where s.user.id = :userId and s.status = :status order by s.startedAt desc")
    List<WorkoutSession> findByUserAndStatus(@Param("userId") Long userId, @Param("status") SessionStatus status);

    @Query(value = "select s from WorkoutSession s where s.user.id = :userId and s.status = com.fittrack.entity.SessionStatus.COMPLETED order by s.finishedAt desc",
            countQuery = "select count(s) from WorkoutSession s where s.user.id = :userId and s.status = com.fittrack.entity.SessionStatus.COMPLETED")
    Page<WorkoutSession> findHistory(@Param("userId") Long userId, Pageable pageable);

    @Query("select s from WorkoutSession s where s.user.id = :userId and s.status = com.fittrack.entity.SessionStatus.COMPLETED and s.finishedAt >= :from order by s.finishedAt asc")
    List<WorkoutSession> findCompletedSince(@Param("userId") Long userId, @Param("from") Instant from);

    @Query("""
            select s from WorkoutSession s
            where s.user.id = :userId and s.workout.id = :workoutId
              and s.status = com.fittrack.entity.SessionStatus.COMPLETED and s.finishedAt < :before
            order by s.finishedAt desc
            """)
    List<WorkoutSession> findPreviousOfWorkout(@Param("userId") Long userId, @Param("workoutId") Long workoutId,
                                               @Param("before") Instant before, Pageable pageable);

    @Query("select count(s) from WorkoutSession s where s.user.id = :userId and s.status = com.fittrack.entity.SessionStatus.COMPLETED")
    long countCompleted(@Param("userId") Long userId);
}
