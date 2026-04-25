package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id",  nullable = false) private User  user;
    @JsonIgnore@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "store_id", nullable = false) private Store store;
    @Enumerated(EnumType.STRING)                    private OrderStatus   status;
    @Enumerated(EnumType.STRING) @Column(name = "payment_method") private PaymentMethod paymentMethod;
    @Enumerated(EnumType.STRING)                    private Fulfilment    fulfilment;
    @Column(name = "sales_channel", length = 80)    private String        salesChannel;
    @Column(name = "grand_total",   nullable = false, precision = 12, scale = 2) private BigDecimal grandTotal;
    @Column(length = 10)                            private String        currency = "TRY";
    @Column(columnDefinition = "TEXT")              private String        notes;
    @Column(name = "ordered_at")                    private LocalDateTime orderedAt;
    @UpdateTimestamp @Column(name = "updated_at")   private LocalDateTime updatedAt;
    @JsonIgnore
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY) private List<OrderItem> orderItems;
    @JsonIgnore
    @OneToOne(mappedBy  = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY) private Shipment        shipment;
    public enum OrderStatus   { PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED }
    public enum PaymentMethod { CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, COD, WALLET }
    public enum Fulfilment    { MERCHANT, AMAZON, SELF }
}
