package com.example.controller;

import com.example.entity.Review;
import com.example.entity.User;
import com.example.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

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
    public ResponseEntity<?> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }
}
