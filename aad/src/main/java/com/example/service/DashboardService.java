package com.example.service;

import com.example.entity.User;
import com.example.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository        userRepo;
    private final StoreRepository       storeRepo;
    private final OrderRepository       orderRepo;
    private final ProductRepository     productRepo;
    private final ReviewRepository      reviewRepo;

    public Map<String, Object> adminDashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalUsers",      userRepo.count());
        data.put("totalStores",     storeRepo.count());
        data.put("openStores",      storeRepo.findByStatus(com.example.entity.Store.StoreStatus.OPEN, org.springframework.data.domain.Pageable.unpaged()).getTotalElements());
        data.put("totalOrders",     orderRepo.count());
        data.put("totalProducts",   productRepo.count());
        data.put("totalReviews",    reviewRepo.count());
        data.put("adminCount",      userRepo.countByRoleType(User.RoleType.ADMIN));
        data.put("corporateCount",  userRepo.countByRoleType(User.RoleType.CORPORATE));
        data.put("individualCount", userRepo.countByRoleType(User.RoleType.INDIVIDUAL));
        data.put("monthlyRevenue",  orderRepo.getTotalRevenueThisMonth());
        data.put("weeklyRevenue",   orderRepo.getTotalRevenueThisWeek());
        data.put("membershipStats", userRepo.getMembershipStats());
        return data;
    }

    public Map<String, Object> corporateDashboard(Long storeId) {
        Map<String, Object> data = new HashMap<>();
        data.put("totalOrders",    orderRepo.countByStoreId(storeId));
        data.put("totalRevenue",   orderRepo.getTotalRevenueByStore(storeId));
        data.put("totalProducts",  productRepo.countByStoreId(storeId));
        data.put("pendingOrders",  orderRepo.countByStoreIdAndStatus(storeId, com.example.entity.Order.OrderStatus.PENDING));
        data.put("shippedOrders",  orderRepo.countByStoreIdAndStatus(storeId, com.example.entity.Order.OrderStatus.SHIPPED));
        data.put("deliveredOrders",orderRepo.countByStoreIdAndStatus(storeId, com.example.entity.Order.OrderStatus.DELIVERED));
        data.put("avgRating",      reviewRepo.getAvgRatingByStoreId(storeId));
        data.put("totalReviews",   reviewRepo.countByStoreId(storeId));
        data.put("lowStockCount",  productRepo.countLowStockByStore(storeId, 10));
        data.put("monthlyRevenue", orderRepo.getMonthlyRevenueByStore(storeId));
        data.put("dailySales",     orderRepo.getDailySalesByStore(storeId, 30));
        return data;
    }

    public Map<String, Object> individualDashboard(Long userId) {
        Map<String, Object> data = new HashMap<>();
        data.put("totalOrders",    orderRepo.countByUserId(userId));
        data.put("totalSpent",     orderRepo.getTotalSpentByUser(userId));
        data.put("deliveredOrders",orderRepo.countByUserIdAndStatus(userId, com.example.entity.Order.OrderStatus.DELIVERED));
        data.put("pendingOrders",  orderRepo.countByUserIdAndStatus(userId, com.example.entity.Order.OrderStatus.PENDING));
        data.put("totalReviews",   reviewRepo.countByUserId(userId));
        data.put("profile",        userRepo.findCustomerProfileByUserId(userId));
        return data;
    }
}
