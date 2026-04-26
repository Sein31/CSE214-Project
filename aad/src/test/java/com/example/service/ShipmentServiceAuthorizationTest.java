package com.example.service;

import com.example.entity.Order;
import com.example.entity.Shipment;
import com.example.entity.User;
import com.example.repository.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceAuthorizationTest {

    @Mock
    private ShipmentRepository shipmentRepository;
    @Mock
    private OrderService orderService;

    private ShipmentService shipmentService;

    @BeforeEach
    void setUp() {
        shipmentService = new ShipmentService(shipmentRepository, orderService);
    }

    @Test
    void getShipmentByOrderId_blocksUnauthorizedOrderAccess() {
        User actor = User.builder().id(15L).roleType(User.RoleType.INDIVIDUAL).build();
        when(orderService.getOrderForActor(99L, actor)).thenThrow(new RuntimeException("Erisim yasaklandi"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> shipmentService.getShipmentByOrderId(99L, actor));

        assertTrue(ex.getMessage().contains("Erisim yasaklandi"));
    }

    @Test
    void updateShipmentStatus_checksOrderOwnershipBeforeUpdate() {
        User actor = User.builder().id(2L).roleType(User.RoleType.CORPORATE).build();
        Shipment shipment = Shipment.builder()
                .id(8L)
                .order(Order.builder().id(45L).build())
                .status(Shipment.ShipmentStatus.PENDING)
                .build();
        when(shipmentRepository.findById(8L)).thenReturn(Optional.of(shipment));

        shipmentService.updateShipmentStatus(8L, actor, Shipment.ShipmentStatus.IN_TRANSIT);

        verify(orderService).getOrderForActor(45L, actor);
    }
}
