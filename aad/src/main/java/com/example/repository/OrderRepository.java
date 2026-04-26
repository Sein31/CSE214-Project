package com.example.repository;

import com.example.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserIdOrderByOrderedAtDesc(Long userId, Pageable pageable);
    Page<Order> findByStoreIdOrderByOrderedAtDesc(Long storeId, Pageable pageable);
    Optional<Order> findByIdAndUserId(Long id, Long userId);
    Optional<Order> findByIdAndStoreId(Long id, Long storeId);

    @Query("SELECT o FROM Order o WHERE o.id=:oid AND o.store.owner.id=:ownerId")
    Optional<Order> findByIdAndStoreOwnerId(@Param("oid") Long orderId, @Param("ownerId") Long ownerId);

    long countByUserId(Long userId);
    long countByStoreId(Long storeId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id=:uid AND o.status=:status")
    long countByUserIdAndStatus(@Param("uid") Long userId, @Param("status") Order.OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.store.id=:sid AND o.status=:status")
    long countByStoreIdAndStatus(@Param("sid") Long storeId, @Param("status") Order.OrderStatus status);

    @Query("SELECT SUM(o.grandTotal) FROM Order o WHERE o.user.id=:uid AND o.status='DELIVERED'")
    BigDecimal getTotalSpentByUser(@Param("uid") Long userId);

    @Query("SELECT SUM(o.grandTotal) FROM Order o WHERE o.store.id=:sid")
    BigDecimal getTotalRevenueByStore(@Param("sid") Long storeId);

    @Query(value = "SELECT SUM(grand_total) FROM orders WHERE MONTH(ordered_at)=MONTH(NOW()) AND YEAR(ordered_at)=YEAR(NOW())", nativeQuery = true)
    BigDecimal getTotalRevenueThisMonth();

    @Query(value = "SELECT SUM(grand_total) FROM orders WHERE ordered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)", nativeQuery = true)
    BigDecimal getTotalRevenueThisWeek();

    @Query(value = "SELECT SUM(grand_total) FROM orders WHERE store_id=:sid AND MONTH(ordered_at)=MONTH(NOW()) AND YEAR(ordered_at)=YEAR(NOW())", nativeQuery = true)
    BigDecimal getMonthlyRevenueByStore(@Param("sid") Long storeId);

    @Query(value = "SELECT DATE(ordered_at) as date, SUM(grand_total) as revenue, COUNT(*) as orders FROM orders WHERE store_id=:sid AND ordered_at >= DATE_SUB(NOW(), INTERVAL :days DAY) GROUP BY DATE(ordered_at) ORDER BY date", nativeQuery = true)
    List<Map<String, Object>> getDailySalesByStore(@Param("sid") Long storeId, @Param("days") int days);

    @Query(value = "SELECT c.name as categoryName, SUM(oi.quantity) as totalSales " +
                   "FROM order_items oi " +
                   "JOIN orders o ON oi.order_id = o.id " +
                   "JOIN products p ON oi.product_id = p.id " +
                   "JOIN categories c ON p.category_id = c.id " +
                   "WHERE o.store_id = :sid " +
                   "GROUP BY c.name", nativeQuery = true)
    List<Map<String, Object>> getSalesByCategory(@Param("sid") Long storeId);
}
