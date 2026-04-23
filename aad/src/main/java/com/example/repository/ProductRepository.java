package com.example.repository;

import com.example.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByStoreIdAndIsActiveTrue(Long storeId, Pageable pageable);
    long countByStoreId(Long storeId);

    @Query("SELECT p FROM Product p WHERE p.isActive=true AND (LOWER(p.name) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(p.category.name) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<Product> searchPublic(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.store.id=:sid AND p.stockQuantity<=:t AND p.isActive=true")
    List<Product> findLowStock(@Param("sid") Long storeId, @Param("t") int threshold);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.store.id=:sid AND p.stockQuantity<=:t AND p.isActive=true")
    long countLowStockByStore(@Param("sid") Long storeId, @Param("t") int threshold);
}
