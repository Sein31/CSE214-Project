package com.example.service;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    public Map<String, Object> createPaymentIntent(Long amountInKurus, String currency) throws Exception {
        Stripe.apiKey = stripeSecretKey;

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInKurus)           // kuruş cinsinden (100 = 1 TL)
                .setCurrency(currency)              // "try" veya "usd"
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, Object> result = new HashMap<>();
        result.put("clientSecret", intent.getClientSecret());
        result.put("paymentIntentId", intent.getId());
        result.put("amount", amountInKurus);
        result.put("currency", currency);
        return result;
    }

    public Map<String, Object> confirmPayment(String paymentIntentId) throws Exception {
        Stripe.apiKey = stripeSecretKey;
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        Map<String, Object> result = new HashMap<>();
        result.put("status", intent.getStatus());
        result.put("paymentIntentId", intent.getId());
        result.put("amount", intent.getAmount());
        return result;
    }
}
