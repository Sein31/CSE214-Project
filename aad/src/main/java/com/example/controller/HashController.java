package com.example.controller;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
public class HashController {
    @GetMapping("/hash")
    public String hash(@RequestParam String pwd) {
        return new BCryptPasswordEncoder().encode(pwd);
    }
}