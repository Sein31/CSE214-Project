package com.example.repository;

import com.example.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRoleType(User.RoleType roleType);

    @Query("SELECT cp FROM CustomerProfile cp WHERE cp.user.id = :uid")
    Object findCustomerProfileByUserId(@Param("uid") Long userId);

    @Query(value = "SELECT membership_type as type, COUNT(*) as count FROM customer_profiles GROUP BY membership_type", nativeQuery = true)
    java.util.List<Map<String, Object>> getMembershipStats();
}
