package com.fittrack.repository;

import com.fittrack.entity.ExerciseSet;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExerciseSetRepository extends JpaRepository<ExerciseSet, Long> {

    /** Series concluidas mais recentes dos exercicios informados (usado para "Ultima vez"). */
    @Query("""
            select s from ExerciseSet s join fetch s.session ss
            where ss.user.id = :userId and s.exercise.id in :exerciseIds and s.completed = true
              and ss.status = com.fittrack.entity.SessionStatus.COMPLETED
            order by ss.finishedAt desc, s.setNumber asc
            """)
    List<ExerciseSet> findRecentCompleted(@Param("userId") Long userId,
                                          @Param("exerciseIds") Collection<Long> exerciseIds,
                                          Pageable pageable);

    /** Historico completo de um exercicio dentro do periodo (grafico de evolucao de carga). */
    @Query("""
            select s from ExerciseSet s join fetch s.session ss
            where ss.user.id = :userId and s.exercise.id = :exerciseId and s.completed = true
              and ss.status = com.fittrack.entity.SessionStatus.COMPLETED and ss.finishedAt >= :from
            order by ss.finishedAt asc
            """)
    List<ExerciseSet> findExerciseHistory(@Param("userId") Long userId, @Param("exerciseId") Long exerciseId,
                                          @Param("from") Instant from);

    /** Exercicios ja executados pelo usuario, com a quantidade de sessoes. */
    @Query("""
            select s.exercise.id, s.exercise.name, s.exercise.primaryMuscle.name, count(distinct ss.id), max(ss.finishedAt)
            from ExerciseSet s join s.session ss
            where ss.user.id = :userId and s.completed = true and ss.status = com.fittrack.entity.SessionStatus.COMPLETED
            group by s.exercise.id, s.exercise.name, s.exercise.primaryMuscle.name
            order by max(ss.finishedAt) desc
            """)
    List<Object[]> findTrainedExercises(@Param("userId") Long userId);

    @Query("""
            select s from ExerciseSet s join fetch s.exercise e join fetch e.primaryMuscle
            where s.session.id in :sessionIds
            """)
    List<ExerciseSet> findBySessionIds(@Param("sessionIds") Collection<Long> sessionIds);
}
