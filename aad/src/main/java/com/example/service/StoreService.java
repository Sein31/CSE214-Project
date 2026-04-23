package com.example.service;

import com.example.entity.Store;
import com.example.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepo;

    public Page<Store> findAll(int page, int size) {
        return storeRepo.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    public List<Store> findByOwner(Long ownerId) {
        return storeRepo.findByOwnerId(ownerId);
    }

    public Store findById(Long id) {
        return storeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Mağaza bulunamadı: " + id));
    }

    public Store updateStatus(Long id, Store.StoreStatus status) {
        Store store = findById(id);
        store.setStatus(status);
        return storeRepo.save(store);
    }

    public Store update(Long id, Map<String, Object> body) {
        Store store = findById(id);
        if (body.containsKey("name"))        store.setName(body.get("name").toString());
        if (body.containsKey("description")) store.setDescription(body.get("description").toString());
        if (body.containsKey("city"))        store.setCity(body.get("city").toString());
        if (body.containsKey("country"))     store.setCountry(body.get("country").toString());
        return storeRepo.save(store);
    }
}
