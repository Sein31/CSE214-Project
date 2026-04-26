package com.example.service;

import com.example.entity.Order;
import com.example.entity.Shipment;
import com.example.entity.User;
import com.example.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderService orderService;

    @Transactional
    public Shipment createShipmentForOrder(Long orderId, User actor, String carrier, Shipment.ModeOfShipment mode, Shipment.ShipServiceLevel level) {
        Order order = orderService.getOrderForActor(orderId, actor);
        
        if (shipmentRepository.findByOrderId(orderId).isPresent()) {
            throw new RuntimeException("Bu sipariş için zaten kargo var");
        }

        Shipment shipment = Shipment.builder()
                .order(order)
                .trackingNumber(UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .carrier(carrier)
                .modeOfShipment(mode)
                .shipServiceLevel(level)
                .status(Shipment.ShipmentStatus.PENDING)
                .estimatedDelivery(LocalDate.now().plusDays(3))
                .costOfProduct(order.getGrandTotal())
                .warehouseBlock("A")
                .discountOffered(BigDecimal.ZERO)
                .build();
                
        return shipmentRepository.save(shipment);
    }
    
    @Transactional
    public Shipment updateShipmentStatus(Long shipmentId, User actor, Shipment.ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Kargo bulunamadı"));
        orderService.getOrderForActor(shipment.getOrder().getId(), actor);
        
        shipment.setStatus(status);
        if (status == Shipment.ShipmentStatus.DELIVERED) {
            shipment.setActualDelivery(LocalDate.now());
        }
        return shipmentRepository.save(shipment);
    }
    
    @Transactional(readOnly = true)
    public Shipment getShipmentByOrderId(Long orderId, User actor) {
        orderService.getOrderForActor(orderId, actor);
        return shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Kargo bulunamadı"));
    }
}
