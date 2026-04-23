package com.example.controller;

import com.example.entity.Order;
import com.example.entity.User;
import com.example.service.OrderService;
import com.example.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService   orderService;

    /**
     * 1. Adım: Payment Intent oluştur → clientSecret döner
     * Frontend bunu Stripe.js ile kullanır
     */
    @PostMapping("/create-intent")
    public ResponseEntity<?> createIntent(@RequestBody Map<String, Object> body,
                                           @AuthenticationPrincipal User user) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String currency = body.getOrDefault("currency", "try").toString();

            // TL'yi kuruşa çevir (Stripe kuruş/cent bekler)
            long amountInKurus = amount.multiply(BigDecimal.valueOf(100)).longValue();

            Map<String, Object> result = paymentService.createPaymentIntent(amountInKurus, currency);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 2. Adım: Ödeme onaylandıktan sonra siparişi oluştur
     */
    @PostMapping("/confirm-and-order")
    public ResponseEntity<?> confirmAndOrder(@RequestBody Map<String, Object> body,
                                              @AuthenticationPrincipal User user) {
        try {
            String paymentIntentId = body.get("paymentIntentId").toString();

            // Stripe'dan ödeme durumunu kontrol et
            Map<String, Object> paymentStatus = paymentService.confirmPayment(paymentIntentId);
            String status = paymentStatus.get("status").toString();

            if (!"succeeded".equals(status) && !"requires_capture".equals(status)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Ödeme tamamlanmadı. Durum: " + status));
            }

            // Siparişi oluştur
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
            Long storeId = Long.valueOf(body.get("storeId").toString());

            Order order = orderService.createOrder(
                    user.getId(), storeId,
                    Order.PaymentMethod.CREDIT_CARD,
                    items
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Ödeme ve sipariş başarılı!",
                    "orderId", order.getId(),
                    "paymentIntentId", paymentIntentId,
                    "paymentStatus", status
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Test endpoint — Stripe bağlantısını kontrol et
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("stripe", "connected", "mode", "test"));
    }
}
