package com.example.service;

import com.example.entity.Order;
import com.example.entity.User;
import com.example.repository.OrderRepository;
import com.example.repository.ProductRepository;
import com.example.repository.StoreRepository;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceAuthorizationTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private ProductRepository productRepository;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, userRepository, storeRepository, productRepository);
    }

    @Test
    void getOrderForActor_individualUsesUserScopedQuery() {
        User actor = User.builder().id(9L).roleType(User.RoleType.INDIVIDUAL).build();
        Order expected = Order.builder().id(22L).build();
        when(orderRepository.findByIdAndUserId(22L, 9L)).thenReturn(Optional.of(expected));

        Order result = orderService.getOrderForActor(22L, actor);

        assertEquals(22L, result.getId());
        verify(orderRepository).findByIdAndUserId(22L, 9L);
    }

    @Test
    void getOrderForActor_corporateDeniedForAnotherStoreOwner() {
        User actor = User.builder().id(3L).roleType(User.RoleType.CORPORATE).build();
        when(orderRepository.findByIdAndStoreOwnerId(44L, 3L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> orderService.getOrderForActor(44L, actor));

        assertEquals("Erisim yasaklandi", ex.getMessage());
    }
}
