package com.fittrack.repository;

import com.fittrack.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("select e.id from User u join u.favoriteExercises e where u.id = :userId")
    java.util.Set<Long> findFavoriteIds(@Param("userId") Long userId);
}
