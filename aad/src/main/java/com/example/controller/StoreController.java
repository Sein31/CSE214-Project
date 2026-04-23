package com.example.controller;

import com.example.entity.Store;
import com.example.entity.User;
import com.example.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    // Admin: tüm mağazaları listele
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> allStores(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(storeService.findAll(page, size));
    }

    // Corporate: kendi mağazasını getir
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> myStore(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(storeService.findByOwner(user.getId()));
    }

    // Herhangi bir mağazayı ID ile getir
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(storeService.findById(id));
    }

    // Admin: mağaza durumunu güncelle (OPEN/CLOSED/SUSPENDED/PENDING)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        try {
            Store.StoreStatus status = Store.StoreStatus.valueOf(body.get("status"));
            return ResponseEntity.ok(storeService.updateStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Corporate: kendi mağazasını güncelle
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id,
                                     @RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal User user) {
        try {
            // Corporate sadece kendi mağazasını güncelleyebilir
            if (user.getRoleType() == User.RoleType.CORPORATE) {
                boolean owns = user.getStores().stream().anyMatch(s -> s.getId().equals(id));
                if (!owns) return ResponseEntity.status(403)
                        .body(Map.of("error", "Bu mağazayı güncelleme yetkiniz yok"));
            }
            return ResponseEntity.ok(storeService.update(id, body));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
