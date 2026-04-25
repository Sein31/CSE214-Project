package com.example.controller;

import com.example.entity.Store;
import com.example.entity.User;
import com.example.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final StoreRepository storeRepository;

    @Value("${ai.chatbot.url}")
    private String chatbotUrl;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Giriş yapılmamış"));
        }

        String question = (String) body.get("question");
        String role = user.getRoleType().name();
        Long userId = user.getId();
        Long storeId = null;

        if ("CORPORATE".equals(role)) {
            List<Store> stores = storeRepository.findByOwnerId(userId);
            if (!stores.isEmpty()) {
                storeId = stores.get(0).getId();
            }
        }

        Map<String, Object> pythonPayload = new HashMap<>();
        pythonPayload.put("question", question);
        pythonPayload.put("role", role);
        pythonPayload.put("userId", userId);
        pythonPayload.put("storeId", storeId);

        RestTemplate restTemplate = new RestTemplate();
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(chatbotUrl + "/chat", pythonPayload, Map.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "AI Servisi hatası: " + e.getMessage()));
        }
    }
}
