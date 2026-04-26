package com.example.controller;

import com.example.entity.Shipment;
import com.example.entity.User;
import com.example.service.AuditLogService;
import com.example.service.ShipmentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final AuditLogService auditLogService;

    @PostMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CORPORATE', 'ADMIN')")
    public ResponseEntity<?> createShipment(@PathVariable Long orderId,
                                            @AuthenticationPrincipal User user,
                                            HttpServletRequest request,
                                            @RequestBody Map<String, Object> body) {
        try {
            String carrier = body.getOrDefault("carrier", "MNG Kargo").toString();
            Shipment.ModeOfShipment mode = Shipment.ModeOfShipment.valueOf(body.getOrDefault("mode", "ROAD").toString());
            Shipment.ShipServiceLevel level = Shipment.ShipServiceLevel.valueOf(body.getOrDefault("level", "STANDARD").toString());

            Shipment s = shipmentService.createShipmentForOrder(orderId, user, carrier, mode, level);
            auditLogService.log(user, "SHIPMENT_CREATE", "ORDER", orderId, request);
            return ResponseEntity.ok(s);
        } catch (Exception e) {
            if (isAccessDenied(e)) {
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CORPORATE', 'ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @AuthenticationPrincipal User user,
                                          HttpServletRequest request,
                                          @RequestBody Map<String, String> body) {
        try {
            Shipment.ShipmentStatus status = Shipment.ShipmentStatus.valueOf(body.get("status"));
            Shipment updated = shipmentService.updateShipmentStatus(id, user, status);
            auditLogService.log(user, "SHIPMENT_STATUS_UPDATE", "SHIPMENT", id, request);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            if (isAccessDenied(e)) {
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getByOrderId(@PathVariable Long orderId,
                                          @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(shipmentService.getShipmentByOrderId(orderId, user));
        } catch (Exception e) {
            if (isAccessDenied(e)) {
                return ResponseEntity.status(403).body(Map.of("error", "Erisim yasaklandi"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isAccessDenied(Exception e) {
        String message = e.getMessage();
        return message != null && message.toLowerCase().contains("erisim yasaklandi");
    }
}
