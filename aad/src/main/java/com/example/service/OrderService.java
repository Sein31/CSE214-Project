package com.example.service;

import com.example.entity.*;
import com.example.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository   orderRepo;
    private final UserRepository    userRepo;
    private final StoreRepository   storeRepo;
    private final ProductRepository productRepo;

    @Transactional(readOnly = true)
    public Page<Order> getUserOrders(Long userId, int page, int size) {
        return orderRepo.findByUserIdOrderByOrderedAtDesc(userId,
                PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Page<Order> getStoreOrders(Long storeId, int page, int size) {
        return orderRepo.findByStoreIdOrderByOrderedAtDesc(storeId,
                PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public boolean isStoreOwner(Long storeId, Long userId) {
        return storeRepo.existsByIdAndOwnerId(storeId, userId);
    }

    @Transactional(readOnly = true)
    public Order getById(Long id) {
        return orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + id));
    }

    @Transactional(readOnly = true)
    public Order getOrderForUser(Long orderId, Long userId) {
        return orderRepo.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new RuntimeException("Erisim yasaklandi"));
    }

    @Transactional(readOnly = true)
    public Order getOrderForStoreOwner(Long orderId, Long ownerUserId) {
        return orderRepo.findByIdAndStoreOwnerId(orderId, ownerUserId)
                .orElseThrow(() -> new RuntimeException("Erisim yasaklandi"));
    }

    @Transactional(readOnly = true)
    public Order getOrderForActor(Long orderId, User actor) {
        if (actor.getRoleType() == User.RoleType.ADMIN) {
            return getById(orderId);
        }
        if (actor.getRoleType() == User.RoleType.CORPORATE) {
            return getOrderForStoreOwner(orderId, actor.getId());
        }
        return getOrderForUser(orderId, actor.getId());
    }

    @Transactional
    public Order createOrder(Long userId, Long storeId,
                             Order.PaymentMethod paymentMethod,
                             List<Map<String, Object>> items) {
        User  user  = userRepo.findById(userId) .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        Store store = storeRepo.findById(storeId).orElseThrow(() -> new RuntimeException("Mağaza bulunamadı"));

        BigDecimal total = BigDecimal.ZERO;
        Order order = Order.builder()
                .user(user).store(store)
                .status(Order.OrderStatus.CONFIRMED)
                .paymentMethod(paymentMethod)
                .currency("TRY")
                .orderedAt(LocalDateTime.now())
                .grandTotal(BigDecimal.ZERO)
                .build();
        order = orderRepo.save(order);

        for (Map<String, Object> item : items) {
            Long   productId = Long.valueOf(item.get("productId").toString());
            int    qty       = Integer.parseInt(item.getOrDefault("quantity", 1).toString());
            Product product  = productRepo.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + productId));

            OrderItem oi = OrderItem.builder()
                    .order(order).product(product)
                    .quantity(qty)
                    .unitPrice(product.getUnitPrice())
                    .build();

            total = total.add(product.getUnitPrice().multiply(BigDecimal.valueOf(qty)));
            // Stock güncelle
            product.setStockQuantity(product.getStockQuantity() - qty);
            productRepo.save(product);
        }

        order.setGrandTotal(total);
        return orderRepo.save(order);
    }

    public Order updateStatus(Long id, Order.OrderStatus status) {
        Order order = getById(id);
        order.setStatus(status);
        return orderRepo.save(order);
    }

    @Transactional
    public Order processReturn(Long orderId) {
        Order order = getById(orderId);
        if (order.getStatus() == Order.OrderStatus.RETURNED) {
            throw new RuntimeException("Sipariş zaten iade edilmiş");
        }
        order.setStatus(Order.OrderStatus.RETURNED);
        
        // Stokları geri ekle
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepo.save(product);
            }
        }
        return orderRepo.save(order);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> dailyRevenue(Long storeId, int days) {
        return orderRepo.getDailySalesByStore(storeId, days);
    }

    @Transactional(readOnly = true)
    public Object salesByCategory(Long storeId) {
        return orderRepo.getSalesByCategory(storeId);
    }
}
