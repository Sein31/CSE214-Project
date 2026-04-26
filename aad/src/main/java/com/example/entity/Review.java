package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        indexes = {
                @Index(name = "idx_reviews_user_id", columnList = "user_id"),
                @Index(name = "idx_reviews_product_id", columnList = "product_id"),
                @Index(name = "idx_reviews_order_id", columnList = "order_id"),
                @Index(name = "idx_reviews_star_rating", columnList = "star_rating")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id",    nullable = false) private User    user;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false) private Product product;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id")                     private Order   order;
    @Column(name = "star_rating", nullable = false) private Integer starRating;
    @Column(length = 255)                           private String  title;
    @Column(columnDefinition = "TEXT")              private String  body;
    @Column(name = "helpful_votes") private Integer helpfulVotes;
    @Column(name = "total_votes")   private Integer totalVotes;
    @Enumerated(EnumType.STRING)    private Sentiment sentiment;
    @Column(length = 50)            private String  marketplace;
    private Boolean verified;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    public enum Sentiment { POSITIVE, NEUTRAL, NEGATIVE }
}
