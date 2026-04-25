package com.example.controller;

import com.example.entity.Order;
import com.example.entity.User;
import com.example.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/my")
    @Transactional(readOnly = true)
    public ResponseEntity<?> myOrders(@AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(orderService.getUserOrders(user.getId(), page, size));
    }

    // AV-05: Ownership kontrolü
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getById(@PathVariable Long id,
                                      @AuthenticationPrincipal User user) {
        Order order = orderService.getById(id);
        if (user.getRoleType() == User.RoleType.INDIVIDUAL) {
            if (!order.getUser().getId().equals(user.getId()))
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
        }
        if (user.getRoleType() == User.RoleType.CORPORATE) {
            if (!orderService.isStoreOwner(order.getStore().getId(), user.getId())) 
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
        }
        return ResponseEntity.ok(order);
    }

    // AV-02: Corporate sadece kendi magazasini gorebilir
    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> storeOrders(@PathVariable Long storeId,
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (user.getRoleType() == User.RoleType.CORPORATE) {
            if (!orderService.isStoreOwner(storeId, user.getId())) 
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
        }
        return ResponseEntity.ok(orderService.getStoreOrders(storeId, page, size));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body,
                                          @AuthenticationPrincipal User user) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
            return ResponseEntity.ok(orderService.createOrder(user.getId(),
                    Long.valueOf(body.get("storeId").toString()),
                    Order.PaymentMethod.valueOf(body.getOrDefault("paymentMethod","CREDIT_CARD").toString()),
                    items));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body, @AuthenticationPrincipal User user) {
        try {
            Order order = orderService.getById(id);
            if (user.getRoleType() == User.RoleType.CORPORATE) {
                if (!orderService.isStoreOwner(order.getStore().getId(), user.getId())) 
                    return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
            }
            return ResponseEntity.ok(orderService.updateStatus(id, Order.OrderStatus.valueOf(body.get("status"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/store/{storeId}/analytics/daily")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> dailyRevenue(@PathVariable Long storeId,
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "30") int days) {
        if (user.getRoleType() == User.RoleType.CORPORATE) {
            if (!orderService.isStoreOwner(storeId, user.getId())) 
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
        }
        return ResponseEntity.ok(orderService.dailyRevenue(storeId, days));
    }

    @GetMapping("/store/{storeId}/analytics/categories")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> salesByCategory(@PathVariable Long storeId,
            @AuthenticationPrincipal User user) {
        if (user.getRoleType() == User.RoleType.CORPORATE) {
            if (!orderService.isStoreOwner(storeId, user.getId())) 
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
        }
        return ResponseEntity.ok(orderService.salesByCategory(storeId));
    }
}
