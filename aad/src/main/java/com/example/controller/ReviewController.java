package com.example.controller;

import com.example.entity.Review;
import com.example.entity.Store;
import com.example.entity.User;
import com.example.repository.StoreRepository;
import com.example.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService   reviewService;
    private final StoreRepository storeRepo;

    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        try {
            Long productId = Long.valueOf(body.get("productId").toString());
            Long orderId = body.containsKey("orderId") && body.get("orderId") != null ? Long.valueOf(body.get("orderId").toString()) : null;
            Integer starRating = Integer.valueOf(body.get("starRating").toString());
            String title = body.getOrDefault("title", "").toString();
            String reviewBody = body.getOrDefault("body", "").toString();

            Review r = reviewService.addReview(user.getId(), productId, orderId, starRating, title, reviewBody);
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CORPORATE', 'ADMIN')")
    public ResponseEntity<?> getReviews(@AuthenticationPrincipal User user) {
        List<Review> reviews;
        if (user.getRoleType() == User.RoleType.CORPORATE) {
            List<Store> stores = storeRepo.findByOwnerId(user.getId());
            if (stores.isEmpty()) return ResponseEntity.ok(List.of());
            reviews = reviewService.getReviewsByStore(stores.get(0).getId());
        } else {
            reviews = reviewService.getAllReviews();
        }
        return ResponseEntity.ok(reviews.stream().map(this::toDto).collect(Collectors.toList()));
    }

    private Map<String, Object> toDto(Review r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",         r.getId());
        m.put("starRating", r.getStarRating());
        m.put("title",      r.getTitle());
        m.put("body",       r.getBody());
        m.put("sentiment",  r.getSentiment());
        m.put("verified",   r.getVerified());
        m.put("createdAt",  r.getCreatedAt());
        if (r.getProduct() != null) {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("id",   r.getProduct().getId());
            p.put("name", r.getProduct().getName());
            m.put("product", p);
        }
        if (r.getUser() != null) {
            Map<String, Object> u = new LinkedHashMap<>();
            u.put("id",        r.getUser().getId());
            u.put("firstName", r.getUser().getFirstName());
            u.put("lastName",  r.getUser().getLastName());
            m.put("user", u);
        }
        return m;
    }
}
