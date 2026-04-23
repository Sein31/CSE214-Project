package com.example.dto;

import com.example.entity.Product;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductDto {
    private Long id;
    private String sku;
    private String name;
    private String description;
    private BigDecimal unitPrice;
    private Integer stockQuantity;
    private String importance;
    private Boolean isActive;
    private Long storeId;
    private String storeName;
    private Long categoryId;
    private String categoryName;

    public static ProductDto from(Product p) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        dto.setSku(p.getSku());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setUnitPrice(p.getUnitPrice());
        dto.setStockQuantity(p.getStockQuantity());
        dto.setImportance(p.getImportance() != null ? p.getImportance().name() : "MEDIUM");
        dto.setIsActive(p.getIsActive());
        if (p.getStore() != null) {
            dto.setStoreId(p.getStore().getId());
            dto.setStoreName(p.getStore().getName());
        }
        if (p.getCategory() != null) {
            dto.setCategoryId(p.getCategory().getId());
            dto.setCategoryName(p.getCategory().getName());
        }
        return dto;
    }
}
