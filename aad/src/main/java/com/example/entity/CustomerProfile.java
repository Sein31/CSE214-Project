package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "customer_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    private Integer age;
    private String city;
    private String country;
    @Enumerated(EnumType.STRING) @Column(name = "membership_type")   private MembershipType membershipType;
    @Column(name = "total_spend",      precision = 12, scale = 2)    private BigDecimal totalSpend;
    @Column(name = "items_purchased")                                  private Integer itemsPurchased;
    @Column(name = "avg_rating",       precision = 3,  scale = 2)    private BigDecimal avgRating;
    @Column(name = "discount_applied")                                 private Boolean discountApplied;
    @Enumerated(EnumType.STRING) @Column(name = "satisfaction_level") private SatisfactionLevel satisfactionLevel;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    public enum MembershipType    { BRONZE, SILVER, GOLD, PLATINUM }
    public enum SatisfactionLevel { LOW, MEDIUM, HIGH }
}
