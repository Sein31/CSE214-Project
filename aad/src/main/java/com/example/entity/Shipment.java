package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "shipments",
        indexes = {
                @Index(name = "idx_shipments_order_id", columnList = "order_id"),
                @Index(name = "idx_shipments_status", columnList = "status"),
                @Index(name = "idx_shipments_tracking_number", columnList = "tracking_number")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Shipment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id", nullable = false, unique = true) private Order order;
    @Column(name = "tracking_number",   length = 100)  private String         trackingNumber;
    @Column(name = "warehouse_block",   length = 50)   private String         warehouseBlock;
    @Enumerated(EnumType.STRING) @Column(name = "mode_of_shipment")   private ModeOfShipment  modeOfShipment;
    @Enumerated(EnumType.STRING) @Column(name = "ship_service_level") private ShipServiceLevel shipServiceLevel;
    private String carrier;
    @Column(name = "customer_care_calls") private Integer    customerCareCalls;
    @Column(name = "customer_rating")     private Integer    customerRating;
    @Column(name = "cost_of_product", precision = 10, scale = 2) private BigDecimal costOfProduct;
    @Column(name = "prior_purchases") private Integer    priorPurchases;
    @Column(name = "discount_offered", precision = 5, scale = 2) private BigDecimal discountOffered;
    @Enumerated(EnumType.STRING) private ShipmentStatus status;
    @Column(name = "estimated_delivery") private LocalDate estimatedDelivery;
    @Column(name = "actual_delivery")    private LocalDate actualDelivery;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private LocalDateTime updatedAt;
    public enum ModeOfShipment   { SHIP, FLIGHT, ROAD }
    public enum ShipServiceLevel { STANDARD, EXPEDITED, OVERNIGHT }
    public enum ShipmentStatus   { PENDING, PROCESSING, IN_TRANSIT, DELIVERED, RETURNED, FAILED }
}
