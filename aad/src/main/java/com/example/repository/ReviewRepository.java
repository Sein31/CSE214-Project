package com.example.repository;

import com.example.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    long countByUserId(Long userId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.store.id=:sid")
    long countByStoreId(@Param("sid") Long storeId);

    @Query("SELECT AVG(r.starRating) FROM Review r WHERE r.product.store.id=:sid")
    BigDecimal getAvgRatingByStoreId(@Param("sid") Long storeId);
}
