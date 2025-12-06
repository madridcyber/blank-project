package com.smartuniversity.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

/**
 * Service for validating JWT tokens at the API Gateway.
 */
@Component
public class JwtService {

    private final Key signingKey;

    public JwtService(@Value("${security.jwt.secret}") String secret) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public JwtUserDetails parseToken(String token) throws JwtException {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String userId = claims.getSubject();
        String role = claims.get("role", String.class);
        String tenant = claims.get("tenant", String.class);
        return new JwtUserDetails(userId, role, tenant);
    }
}