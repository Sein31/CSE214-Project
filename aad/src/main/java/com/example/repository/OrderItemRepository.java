package com.example.repository;

import com.example.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity) as totalQty FROM OrderItem oi WHERE oi.order.store.id = :storeId GROUP BY oi.product.id, oi.product.name ORDER BY totalQty DESC")
    List<Object[]> topProductsByStore(@Param("storeId") Long storeId, Pageable pageable);
}
