package com.fittrack.repository;

import com.fittrack.entity.PersonalRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PersonalRecordRepository extends JpaRepository<PersonalRecord, Long> {

    @Query("select r from PersonalRecord r join fetch r.exercise e join fetch e.primaryMuscle where r.user.id = :userId order by r.achievedAt desc")
    List<PersonalRecord> findByUser(@Param("userId") Long userId);

    @Query("select r from PersonalRecord r where r.user.id = :userId and r.exercise.id in :exerciseIds")
    List<PersonalRecord> findByUserAndExercises(@Param("userId") Long userId,
                                                @Param("exerciseIds") java.util.Collection<Long> exerciseIds);
}
