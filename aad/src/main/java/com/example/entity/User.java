package com.example.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false)
    private RoleType roleType;
    @Column(name = "first_name", length = 80) private String firstName;
    @Column(name = "last_name",  length = 80) private String lastName;
    @Enumerated(EnumType.STRING) private Gender gender;
    @Column(name = "is_active")  private Boolean isActive = true;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private LocalDateTime updatedAt;
    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private CustomerProfile customerProfile;
    @JsonIgnore
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY) private List<Store> stores;
    @JsonIgnore
    @OneToMany(mappedBy = "user",  fetch = FetchType.LAZY) private List<Order> orders;
    public enum RoleType { ADMIN, CORPORATE, INDIVIDUAL }
    public enum Gender    { MALE, FEMALE, OTHER }
}
