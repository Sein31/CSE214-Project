package com.example.service;

import com.example.entity.Category;
import com.example.entity.Product;
import com.example.entity.Store;
import com.example.repository.CategoryRepository;
import com.example.repository.ProductRepository;
import com.example.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository  productRepo;
    private final StoreRepository    storeRepo;
    private final CategoryRepository categoryRepo;

    public Page<Product> searchPublic(String q, int page, int size) {
        return productRepo.searchPublic(q == null ? "" : q,
                PageRequest.of(page, size, Sort.by("importance").descending()));
    }

    public Page<Product> getStoreProducts(Long storeId, int page, int size) {
        return productRepo.findByStoreIdAndIsActiveTrue(storeId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public Product getById(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));
    }

    public List<Product> getLowStock(Long storeId, int threshold) {
        return productRepo.findLowStock(storeId, threshold);
    }

    public Product create(Long storeId, Long categoryId, Product.Importance importance,
                          String sku, String name, String description,
                          BigDecimal unitPrice, Integer stockQuantity) {
        Store store = storeRepo.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Mağaza bulunamadı"));
        Product p = Product.builder()
                .store(store).sku(sku).name(name).description(description)
                .unitPrice(unitPrice).stockQuantity(stockQuantity)
                .importance(importance != null ? importance : Product.Importance.MEDIUM)
                .isActive(true).build();
        if (categoryId != null) {
            categoryRepo.findById(categoryId).ifPresent(p::setCategory);
        }
        return productRepo.save(p);
    }

    public Product update(Long id, String name, String description,
                          BigDecimal unitPrice, Integer stockQuantity, Long categoryId) {
        Product p = getById(id);
        if (name          != null) p.setName(name);
        if (description   != null) p.setDescription(description);
        if (unitPrice     != null) p.setUnitPrice(unitPrice);
        if (stockQuantity != null) p.setStockQuantity(stockQuantity);
        if (categoryId    != null) {
            categoryRepo.findById(categoryId).ifPresent(p::setCategory);
        }
        return productRepo.save(p);
    }

    public void delete(Long id) {
        Product p = getById(id);
        p.setIsActive(false);
        productRepo.save(p); // Soft delete
    }
}
