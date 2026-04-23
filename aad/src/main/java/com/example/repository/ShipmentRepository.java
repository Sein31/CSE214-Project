package com.example.repository;

import com.example.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByOrderId(Long orderId);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    List<Shipment> findByStatus(Shipment.ShipmentStatus status);
    @Query("SELECT s.status, COUNT(s) FROM Shipment s WHERE s.order.store.id = :storeId GROUP BY s.status")
    List<Object[]> shipmentStatusCountByStore(@Param("storeId") Long storeId);
}
