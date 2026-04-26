package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "products",
        indexes = {
                @Index(name = "idx_products_store_id", columnList = "store_id"),
                @Index(name = "idx_products_category_id", columnList = "category_id"),
                @Index(name = "idx_products_sku", columnList = "sku"),
                @Index(name = "idx_products_name", columnList = "name")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "store_id",    nullable = false) private Store    store;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "category_id")                  private Category category;
    @Column(unique = true, length = 100) private String sku;
    @Column(nullable = false)            private String name;
    @Column(columnDefinition = "TEXT")   private String description;
    @Column(name = "unit_price",    nullable = false, precision = 10, scale = 2) private BigDecimal unitPrice;
    @Column(name = "stock_quantity")                                              private Integer    stockQuantity;
    @Enumerated(EnumType.STRING) private Importance importance;
    @Column(name = "is_active")  private Boolean isActive = true;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private LocalDateTime updatedAt;
    @JsonIgnore
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY) private List<OrderItem> orderItems;
    @JsonIgnore
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY) private List<Review>    reviews;
    public enum Importance { LOW, MEDIUM, HIGH }
}
