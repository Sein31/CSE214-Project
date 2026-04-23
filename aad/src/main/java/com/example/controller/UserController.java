package com.example.controller;

import com.example.entity.User;
import com.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;

    // Kendi profilini getir
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of(
            "id",        user.getId(),
            "email",     user.getEmail(),
            "firstName", user.getFirstName(),
            "lastName",  user.getLastName(),
            "roleType",  user.getRoleType(),
            "isActive",  user.getIsActive()
        ));
    }

    // Admin: tüm kullanıcıları listele
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> allUsers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<User> users = userRepo.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(users.map(u -> Map.of(
            "id",        u.getId(),
            "email",     u.getEmail(),
            "firstName", u.getFirstName() != null ? u.getFirstName() : "",
            "lastName",  u.getLastName()  != null ? u.getLastName()  : "",
            "roleType",  u.getRoleType(),
            "isActive",  u.getIsActive(),
            "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        )));
    }

    // Admin: kullanıcı ID ile getir
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(u -> ResponseEntity.ok((Object) Map.of(
                "id",       u.getId(),
                "email",    u.getEmail(),
                "firstName",u.getFirstName() != null ? u.getFirstName() : "",
                "lastName", u.getLastName()  != null ? u.getLastName()  : "",
                "roleType", u.getRoleType(),
                "isActive", u.getIsActive()
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    // Admin: kullanıcı aktif/pasif yap (AV-05 uyumlu)
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        return userRepo.findById(id).map(u -> {
            Boolean isActive = (Boolean) body.get("isActive");
            u.setIsActive(isActive);
            userRepo.save(u);
            return ResponseEntity.ok(Map.of(
                "id",       u.getId(),
                "isActive", u.getIsActive(),
                "message",  isActive ? "Kullanıcı aktifleştirildi" : "Kullanıcı askıya alındı"
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
}
