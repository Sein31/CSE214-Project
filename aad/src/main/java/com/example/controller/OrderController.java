package com.example.controller;

import com.example.entity.Order;
import com.example.entity.User;
import com.example.service.AuditLogService;
import com.example.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuditLogService auditLogService;

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
        try {
            return ResponseEntity.ok(orderService.getOrderForActor(id, user));
        } catch (RuntimeException e) {
            if (isAccessDenied(e)) {
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
                                          @AuthenticationPrincipal User user,
                                          HttpServletRequest request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
            Order created = orderService.createOrder(user.getId(),
                    Long.valueOf(body.get("storeId").toString()),
                    Order.PaymentMethod.valueOf(body.getOrDefault("paymentMethod","CREDIT_CARD").toString()),
                    items);
            auditLogService.log(user, "ORDER_CREATE", "ORDER", created.getId(), request);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body, @AuthenticationPrincipal User user,
            HttpServletRequest request) {
        try {
            orderService.getOrderForActor(id, user);
            Order updated = orderService.updateStatus(id, Order.OrderStatus.valueOf(body.get("status")));
            auditLogService.log(user, "ORDER_STATUS_UPDATE", "ORDER", id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            if (isAccessDenied(e)) {
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<?> returnOrder(@PathVariable Long id, @AuthenticationPrincipal User user,
                                         HttpServletRequest request) {
        try {
            orderService.getOrderForUser(id, user.getId());
            orderService.processReturn(id);
            auditLogService.log(user, "ORDER_RETURN", "ORDER", id, request);
            return ResponseEntity.ok(Map.of("message", "İade başarıyla işlendi ve stoklara geri eklendi."));
        } catch (Exception e) {
            if (isAccessDenied(e)) {
                return ResponseEntity.status(403).body(Map.of("error", "Bu siparişi iade etme yetkiniz yok"));
            }
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

    private boolean isAccessDenied(Exception e) {
        String message = e.getMessage();
        return message != null && message.toLowerCase().contains("erisim yasaklandi");
    }
}
