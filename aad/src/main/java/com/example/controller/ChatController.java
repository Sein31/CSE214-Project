package com.example.controller;

import com.example.entity.Store;
import com.example.entity.User;
import com.example.repository.StoreRepository;
import com.example.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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
    private final AuditLogService auditLogService;

    @Value("${ai.chatbot.url}")
    private String chatbotUrl;
    @Value("${ai.chatbot.api-key}")
    private String chatbotApiKey;

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body,
                                  @AuthenticationPrincipal User user,
                                  HttpServletRequest request) {
        return handleChat(body, user, request);
    }

    @PostMapping("/ask")
    public ResponseEntity<?> ask(@RequestBody Map<String, Object> body,
                                 @AuthenticationPrincipal User user,
                                 HttpServletRequest request) {
        return handleChat(body, user, request);
    }

    private ResponseEntity<?> handleChat(Map<String, Object> body, User user, HttpServletRequest request) {
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
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Token", chatbotApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(pythonPayload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(chatbotUrl + "/chat", HttpMethod.POST, entity, Map.class);
            auditLogService.log(user, "CHAT_QUERY", "CHAT", user.getId(), request);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "AI Servisi hatası: " + e.getMessage()));
        }
    }
}
