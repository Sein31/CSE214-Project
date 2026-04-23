package com.example.controller;

import com.example.entity.Category;
import com.example.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepo;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(categoryRepo.findAll());
    }

    @GetMapping("/root")
    public ResponseEntity<?> getRoots() {
        return ResponseEntity.ok(categoryRepo.findByParentIsNull());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Category cat = new Category();
            cat.setName(body.get("name").toString());
            if (body.get("parentId") != null) {
                Long parentId = Long.valueOf(body.get("parentId").toString());
                categoryRepo.findById(parentId).ifPresent(cat::setParent);
            }
            return ResponseEntity.ok(categoryRepo.save(cat));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        categoryRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Kategori silindi"));
    }
}
