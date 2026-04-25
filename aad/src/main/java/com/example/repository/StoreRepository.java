package com.example.repository;

import com.example.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByOwnerId(Long ownerId);
    Page<Store> findByStatus(Store.StoreStatus status, Pageable pageable);
    List<Store> findByStatusOrderByCreatedAtDesc(Store.StoreStatus status);
    
    boolean existsByIdAndOwnerId(Long id, Long ownerId);

    @Query("SELECT s FROM Store s WHERE s.owner.id = :ownerId AND s.status = 'OPEN'")
    List<Store> findActiveStoresByOwner(@Param("ownerId") Long ownerId);
}
