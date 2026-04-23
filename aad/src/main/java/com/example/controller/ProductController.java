package com.example.controller;

import com.example.dto.ProductDto;
import com.example.entity.Product;
import com.example.entity.User;
import com.example.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAllActive(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(toDto(productService.searchPublic("", page, size)));
    }

    @GetMapping("/store/{storeId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getStoreProducts(
            @PathVariable Long storeId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(toDto(productService.getStoreProducts(storeId, page, size)));
    }

    @GetMapping("/search")
    @Transactional(readOnly = true)
    public ResponseEntity<?> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(toDto(productService.searchPublic(q, page, size)));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ProductDto.from(productService.getById(id)));
    }

    @GetMapping("/store/{storeId}/low-stock")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> getLowStock(@PathVariable Long storeId,
            @RequestParam(defaultValue = "10") int threshold) {
        return ResponseEntity.ok(productService.getLowStock(storeId, threshold)
                .stream().map(ProductDto::from).collect(Collectors.toList()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body,
                                     @AuthenticationPrincipal User user) {
        try {
            Product p = productService.create(
                    Long.valueOf(body.get("storeId").toString()),
                    body.get("categoryId") != null ? Long.valueOf(body.get("categoryId").toString()) : null,
                    Product.Importance.valueOf(body.getOrDefault("importance","MEDIUM").toString()),
                    body.getOrDefault("sku","").toString(),
                    body.get("name").toString(),
                    body.getOrDefault("description","").toString(),
                    new BigDecimal(body.get("unitPrice").toString()),
                    Integer.parseInt(body.getOrDefault("stockQuantity","0").toString()));
            return ResponseEntity.ok(ProductDto.from(p));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Product p = productService.update(id,
                    body.get("name")          != null ? body.get("name").toString()        : null,
                    body.get("description")   != null ? body.get("description").toString() : null,
                    body.get("unitPrice")     != null ? new BigDecimal(body.get("unitPrice").toString()) : null,
                    body.get("stockQuantity") != null ? Integer.parseInt(body.get("stockQuantity").toString()) : null,
                    body.get("categoryId")    != null ? Long.valueOf(body.get("categoryId").toString()) : null);
            return ResponseEntity.ok(ProductDto.from(p));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CORPORATE','ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Ürün silindi"));
    }

    private Page<ProductDto> toDto(Page<Product> page) {
        List<ProductDto> dtos = page.getContent().stream()
                .map(ProductDto::from).collect(Collectors.toList());
        return new PageImpl<>(dtos, page.getPageable(), page.getTotalElements());
    }
}
