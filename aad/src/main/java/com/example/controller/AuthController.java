package com.example.controller;

import com.example.entity.User;
import com.example.security.JwtUtil;
import com.example.service.AuditLogService;
import com.example.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil     jwtUtil;
    private final AuditLogService auditLogService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@jakarta.validation.Valid @RequestBody com.example.dto.LoginRequest body,
                                   HttpServletRequest request) {
        try {
            String email    = body.getEmail();
            String password = body.getPassword();
            Map<String, Object> result = authService.login(email, password);
            Long userId = Long.valueOf(result.get("userId").toString());
            User user = User.builder().id(userId).build();
            auditLogService.log(user, "LOGIN", "AUTH", userId, request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal User user, HttpServletRequest request) {
        if (user != null) {
            authService.logout(user.getId());
            auditLogService.log(user, "LOGOUT", "AUTH", user.getId(), request);
        }
        return ResponseEntity.ok(Map.of("message", "Çıkış yapıldı"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Giriş yapılmamış"));
        return ResponseEntity.ok(Map.of(
            "userId",    user.getId(),
            "email",     user.getEmail(),
            "firstName", user.getFirstName() != null ? user.getFirstName() : "",
            "lastName",  user.getLastName()  != null ? user.getLastName()  : "",
            "role",      user.getRoleType().name(),
            "isActive",  user.getIsActive()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        try {
            String token  = body.get("refreshToken");
            Map<String, Object> result = authService.refreshToken(token);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}
