package com.example.service;

import com.example.entity.RefreshToken;
import com.example.entity.User;
import com.example.repository.RefreshTokenRepository;
import com.example.repository.UserRepository;
import com.example.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepo;
    private final RefreshTokenRepository refreshTokenRepo;
    private final JwtUtil                jwtUtil;
    private final PasswordEncoder        passwordEncoder;

    @Transactional
    public Map<String, Object> login(String email, String password) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (!user.getIsActive())
            throw new RuntimeException("Hesabınız askıya alınmış");

        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            throw new RuntimeException("Şifre hatalı");

        String accessToken  = jwtUtil.generateToken(user);
        String refreshToken = UUID.randomUUID().toString();

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepo.save(rt);

        Map<String, Object> result = new HashMap<>();
        result.put("accessToken",  accessToken);
        result.put("refreshToken", refreshToken);
        result.put("userId",       user.getId());
        result.put("email",        user.getEmail());
        result.put("firstName",    user.getFirstName());
        result.put("lastName",     user.getLastName());
        result.put("role",         user.getRoleType().name());

        if (user.getRoleType() == User.RoleType.CORPORATE && user.getStores() != null && !user.getStores().isEmpty()) {
            var store = user.getStores().iterator().next();
            result.put("storeId",   store.getId());
            result.put("storeName", store.getName());
        }
        return result;
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepo.revokeAllByUserId(userId);
    }

    @Transactional
    public Map<String, Object> refreshToken(String token) {
        RefreshToken rt = refreshTokenRepo.findByTokenAndRevokedFalse(token)
                .orElseThrow(() -> new RuntimeException("Geçersiz refresh token"));

        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) {
            rt.setRevoked(true);
            refreshTokenRepo.save(rt);
            throw new RuntimeException("Refresh token süresi dolmuş");
        }

        User user = rt.getUser();
        String newAccess = jwtUtil.generateToken(user);

        Map<String, Object> result = new HashMap<>();
        result.put("accessToken", newAccess);
        result.put("role",        user.getRoleType().name());
        return result;
    }
}
