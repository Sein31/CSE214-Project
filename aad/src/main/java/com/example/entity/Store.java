package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
        name = "stores",
        indexes = {
                @Index(name = "idx_stores_owner_id", columnList = "owner_id"),
                @Index(name = "idx_stores_status", columnList = "status"),
                @Index(name = "idx_stores_city", columnList = "city")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Store {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @JsonIgnore@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id", nullable = false) private User owner;
    @Column(nullable = false, length = 150) private String name;
    @Column(columnDefinition = "TEXT")      private String description;
    @Enumerated(EnumType.STRING)            private StoreStatus status;
    private String country;
    private String city;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private LocalDateTime updatedAt;
    @JsonIgnore
    @OneToMany(mappedBy = "store", fetch = FetchType.LAZY) private List<Product> products;
    @JsonIgnore
    @OneToMany(mappedBy = "store", fetch = FetchType.LAZY) private List<Order>   orders;
    public enum StoreStatus { OPEN, CLOSED, PENDING, SUSPENDED }
}
