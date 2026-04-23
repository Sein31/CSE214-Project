package com.example.controller;

import com.example.entity.User;
import com.example.service.DashboardService;
import com.example.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final StoreService     storeService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminDashboard() {
        return ResponseEntity.ok(dashboardService.adminDashboard());
    }

    @GetMapping("/corporate/{storeId}")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> corporateDashboard(@PathVariable Long storeId,
                                                 @AuthenticationPrincipal User user) {
        log.info("corporateDashboard called: storeId={}, userId={}, role={}", storeId, user.getId(), user.getRoleType());
        try {
            if (user.getRoleType() == User.RoleType.CORPORATE) {
                var stores = storeService.findByOwner(user.getId());
                log.info("User stores: {}", stores.stream().map(s -> s.getId()).toList());
                boolean owns = stores.stream().anyMatch(s -> s.getId().equals(storeId));
                if (!owns) {
                    log.warn("User {} does not own store {}", user.getId(), storeId);
                    return ResponseEntity.status(403).build();
                }
            }
            var data = dashboardService.corporateDashboard(storeId);
            log.info("Dashboard data retrieved successfully for store {}", storeId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("Error in corporateDashboard for store {}: {}", storeId, e.getMessage(), e);
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/individual")
    public ResponseEntity<?> individualDashboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.individualDashboard(user.getId()));
    }
}
