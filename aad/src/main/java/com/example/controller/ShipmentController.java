package com.example.controller;

import com.example.entity.Shipment;
import com.example.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @PostMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CORPORATE', 'ADMIN')")
    public ResponseEntity<?> createShipment(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        try {
            String carrier = body.getOrDefault("carrier", "MNG Kargo").toString();
            Shipment.ModeOfShipment mode = Shipment.ModeOfShipment.valueOf(body.getOrDefault("mode", "ROAD").toString());
            Shipment.ShipServiceLevel level = Shipment.ShipServiceLevel.valueOf(body.getOrDefault("level", "STANDARD").toString());

            Shipment s = shipmentService.createShipmentForOrder(orderId, carrier, mode, level);
            return ResponseEntity.ok(s);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('CORPORATE', 'ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Shipment.ShipmentStatus status = Shipment.ShipmentStatus.valueOf(body.get("status"));
            return ResponseEntity.ok(shipmentService.updateShipmentStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getByOrderId(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(shipmentService.getShipmentByOrderId(orderId));
        } catch (Exception e) {
            // Hata fırlatmak yerine (console'da 400/404 görünmemesi için) boş 200 dön
            return ResponseEntity.ok().build();
        }
    }
}
