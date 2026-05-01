package com.example.service;

import com.example.entity.Order;
import com.example.entity.Product;
import com.example.entity.Review;
import com.example.entity.User;
import com.example.repository.OrderRepository;
import com.example.repository.ProductRepository;
import com.example.repository.ReviewRepository;
import com.example.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public Review addReview(Long userId, Long productId, Long orderId, Integer starRating, String title, String body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı"));
        
        Order order = null;
        if (orderId != null) {
            order = orderRepository.findById(orderId).orElse(null);
        }

        Review.Sentiment sentiment = Review.Sentiment.NEUTRAL;
        if (starRating >= 4) sentiment = Review.Sentiment.POSITIVE;
        else if (starRating <= 2) sentiment = Review.Sentiment.NEGATIVE;

        Review review = Review.builder()
                .user(user)
                .product(product)
                .order(order)
                .starRating(starRating)
                .title(title)
                .body(body)
                .helpfulVotes(0)
                .totalVotes(0)
                .sentiment(sentiment)
                .verified(order != null)
                .marketplace("DataPulse")
                .build();
                
        return reviewRepository.save(review);
    }
    
    @Transactional(readOnly = true)
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Review> getReviewsByStore(Long storeId) {
        return reviewRepository.findByProductStoreId(storeId);
    }
}
